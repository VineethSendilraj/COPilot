"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Smartphone, Monitor, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function Navigation() {
  const pathname = usePathname();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">
              Police Safety System
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <Link href="/dashboard">
              <Button
                variant={pathname === "/dashboard" ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Monitor className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>

            <Link href="/mobile">
              <Button
                variant={pathname === "/mobile" ? "default" : "outline"}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Smartphone className="h-4 w-4" />
                <span>Mobile</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
