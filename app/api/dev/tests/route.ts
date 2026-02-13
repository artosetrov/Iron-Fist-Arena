import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { exec } from "child_process";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type VitestFileResult = {
  name: string;
  assertionResults: {
    fullName: string;
    status: string;
    duration: number;
  }[];
  startTime: number;
  endTime: number;
  status: string;
};

type VitestJsonOutput = {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  success: boolean;
  startTime: number;
  testResults: VitestFileResult[];
};

const runCommand = (cmd: string, cwd: string): Promise<{ stdout: string; stderr: string }> =>
  new Promise((resolve, reject) => {
    exec(cmd, { cwd, timeout: 55_000, maxBuffer: 5 * 1024 * 1024 }, (error, stdout, stderr) => {
      // vitest exits with code 1 on test failures — still valid output
      if (error && !stdout) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });

export async function POST() {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Test runner disabled in production" }, { status: 403 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prisma } = await import("@/lib/db");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const startMs = Date.now();
    const cwd = process.cwd();

    try {
      const { stdout } = await runCommand("npx vitest run --reporter=json 2>/dev/null", cwd);

      // Extract JSON from stdout (vitest may output other text before JSON)
      const jsonStart = stdout.indexOf("{");
      const jsonEnd = stdout.lastIndexOf("}");
      if (jsonStart === -1 || jsonEnd === -1) {
        return NextResponse.json({
          success: false,
          error: "Could not parse test output",
          raw: stdout.slice(0, 2000),
          durationMs: Date.now() - startMs,
        });
      }

      const parsed: VitestJsonOutput = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));

      const testFiles = parsed.testResults.map((f) => ({
        name: f.name.replace(cwd + "/", ""),
        status: f.status,
        numTests: f.assertionResults.length,
        numPassed: f.assertionResults.filter((a) => a.status === "passed").length,
        numFailed: f.assertionResults.filter((a) => a.status === "failed").length,
        durationMs: f.endTime - f.startTime,
        failures: f.assertionResults
          .filter((a) => a.status === "failed")
          .map((a) => a.fullName),
      }));

      return NextResponse.json({
        success: parsed.success,
        numTotalTests: parsed.numTotalTests,
        numPassed: parsed.numPassedTests,
        numFailed: parsed.numFailedTests,
        numPending: parsed.numPendingTests,
        numFiles: parsed.testResults.length,
        testFiles,
        durationMs: Date.now() - startMs,
      });
    } catch (execErr) {
      return NextResponse.json({
        success: false,
        error: execErr instanceof Error ? execErr.message : "Test execution failed",
        durationMs: Date.now() - startMs,
      });
    }
  } catch (error) {
    console.error("[api/dev/tests POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
