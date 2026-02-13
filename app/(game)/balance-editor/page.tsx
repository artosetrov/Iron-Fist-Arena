"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";

/** Redirect legacy /balance-editor → /admin?tab=balance */
const BalanceEditorRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=balance");
  }, [router]);

  return <PageLoader icon={<GameIcon name="balance" size={32} />} text="Redirecting to Admin Panel..." />;
};

export default BalanceEditorRedirect;
