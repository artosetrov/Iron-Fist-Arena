"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageLoader from "@/app/components/PageLoader";
import GameIcon from "@/app/components/ui/GameIcon";

/** Redirect legacy /dev-dashboard → /admin?tab=dev */
const DevDashboardRedirect = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin?tab=dev");
  }, [router]);

  return <PageLoader icon={<GameIcon name="admin" size={32} />} text="Redirecting to Admin Panel..." />;
};

export default DevDashboardRedirect;
