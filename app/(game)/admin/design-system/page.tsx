"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";

/** Redirect legacy /admin/design-system → /admin?tab=design */
const DesignSystemRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=design");
  }, [router]);

  return <PageLoader icon={<GameIcon name="design-system" size={32} />} text="Redirecting to Admin Panel..." />;
};

export default DesignSystemRedirect;
