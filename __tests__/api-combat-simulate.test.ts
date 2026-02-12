import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/combat/simulate/route";

const makeRequest = (body: object): Request => {
  return new Request("http://localhost/api/combat/simulate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

describe("POST /api/combat/simulate", () => {
  it("returns 400 if player data is missing", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns 400 if player.id is missing", async () => {
    const res = await POST(
      makeRequest({
        player: { name: "Test", class: "warrior", level: 10 },
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns combat result for valid request", async () => {
    const res = await POST(
      makeRequest({
        player: {
          id: "p1",
          name: "TestPlayer",
          class: "warrior",
          level: 10,
          strength: 50,
          agility: 30,
          vitality: 40,
          endurance: 25,
          intelligence: 10,
          wisdom: 15,
          luck: 10,
          charisma: 10,
          armor: 20,
        },
        opponentPreset: "warrior",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("winnerId");
    expect(data).toHaveProperty("log");
    expect(data).toHaveProperty("turns");
    expect(data).toHaveProperty("playerSnapshot");
    expect(data).toHaveProperty("enemySnapshot");
    expect(data.log.length).toBeGreaterThan(0);
  });

  it("uses default stats when not provided", async () => {
    const res = await POST(
      makeRequest({
        player: {
          id: "p1",
          name: "TestPlayer",
          class: "mage",
          level: 5,
        },
        opponentPreset: "rogue",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.turns).toBeGreaterThan(0);
  });

  it("defaults to warrior opponent if preset is invalid", async () => {
    const res = await POST(
      makeRequest({
        player: {
          id: "p1",
          name: "TestPlayer",
          class: "warrior",
          level: 10,
        },
        opponentPreset: "nonexistent",
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.enemySnapshot.name).toBe("Test Warrior");
  });

  it("supports player choices", async () => {
    const res = await POST(
      makeRequest({
        player: {
          id: "p1",
          name: "TestPlayer",
          class: "warrior",
          level: 20,
          strength: 80,
          agility: 40,
          vitality: 50,
          endurance: 30,
          intelligence: 10,
          wisdom: 10,
          luck: 10,
          charisma: 10,
        },
        opponentPreset: "tank",
        playerChoices: ["heavy_strike", "basic", "whirlwind"],
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.log.length).toBeGreaterThan(0);
  });

  it("handles all preset opponents", async () => {
    for (const preset of ["warrior", "rogue", "mage", "tank"]) {
      const res = await POST(
        makeRequest({
          player: {
            id: "p1",
            name: "Test",
            class: "warrior",
            level: 10,
          },
          opponentPreset: preset,
        })
      );
      expect(res.status).toBe(200);
    }
  });

  it("handles malformed JSON gracefully", async () => {
    const req = new Request("http://localhost/api/combat/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
