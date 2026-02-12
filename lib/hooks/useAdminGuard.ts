"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AdminGuardState = {
  isAdmin: boolean;
  loading: boolean;
};

export const useAdminGuard = (): AdminGuardState => {
  const router = useRouter();
  const [state, setState] = useState<AdminGuardState>({
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    const controller = new AbortController();

    // #region agent log
    fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminGuard.ts:effect',message:'useAdminGuard effect started',data:{},timestamp:Date.now(),hypothesisId:'H1-H4'})}).catch(()=>{});
    // #endregion

    fetch("/api/me", { signal: controller.signal })
      .then((res) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminGuard.ts:response',message:'api/me response received',data:{status:res.status,ok:res.ok},timestamp:Date.now(),hypothesisId:'H1-H2'})}).catch(()=>{});
        // #endregion
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminGuard.ts:data',message:'api/me data parsed',data:{hasData:!!data,role:data?.role,id:data?.id},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        if (!data || data.role !== "admin") {
          // #region agent log
          fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminGuard.ts:redirect',message:'NOT admin - redirecting to /hub',data:{data},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
          // #endregion
          router.replace("/hub");
          return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminGuard.ts:admin-ok',message:'Admin access granted',data:{role:data.role},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setState({ isAdmin: true, loading: false });
      })
      .catch((err) => {
        // #region agent log
        fetch('http://127.0.0.1:7244/ingest/7c8db375-0ae9-4264-956f-949ed59bd0c2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useAdminGuard.ts:catch',message:'fetch /api/me FAILED',data:{error:String(err),name:err?.name},timestamp:Date.now(),hypothesisId:'H2-H4'})}).catch(()=>{});
        // #endregion
        router.replace("/hub");
      });

    return () => controller.abort();
  }, [router]);

  return state;
};
