"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);

        if (session) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User is not authenticated, redirect to login
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        router.push("/auth/login");
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading COPilot...</p>
        </div>
      </div>
    );
  }

  return null;
}
