import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
// Removed direct Mastra imports - now using API routes
import type { Incident, Alert, Officer } from "@/lib/types/database";

interface RealtimeData {
  incidents: Incident[];
  alerts: Alert[];
  officers: Officer[];
  insights: any[];
  recommendations: any[];
}

interface UseRealtimeDataReturn {
  data: RealtimeData;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useRealtimeData(): UseRealtimeDataReturn {
  const [data, setData] = useState<RealtimeData>({
    incidents: [],
    alerts: [],
    officers: [],
    insights: [],
    recommendations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Fetch all data in parallel
      const [incidentsResult, alertsResult, officersResult] = await Promise.all(
        [
          supabase
            .from("incidents")
            .select(
              `
            *,
            officer:officers(*)
          `
            )
            .order("created_at", { ascending: false }),
          supabase
            .from("alerts")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase
            .from("officers")
            .select("*")
            .order("created_at", { ascending: false }),
        ]
      );

      if (incidentsResult.error) throw incidentsResult.error;
      if (alertsResult.error) throw alertsResult.error;
      if (officersResult.error) throw officersResult.error;

      const newData = {
        incidents: incidentsResult.data || [],
        alerts: alertsResult.data || [],
        officers: officersResult.data || [],
        insights: [],
        recommendations: [],
      };

      setData(newData);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Removed analyzeNewData function - now handled by individual components

  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up real-time subscriptions
    const incidentsSubscription = supabase
      .channel("incidents")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        async (payload) => {
          console.log("Incident change received:", payload);

          // Refetch incidents data
          const { data: incidents, error } = await supabase
            .from("incidents")
            .select(
              `
              *,
              officer:officers(*)
            `
            )
            .order("created_at", { ascending: false });

          if (!error && incidents) {
            setData((prev) => ({ ...prev, incidents }));
          }
        }
      )
      .subscribe();

    const alertsSubscription = supabase
      .channel("alerts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        async (payload) => {
          console.log("Alert change received:", payload);

          // Refetch alerts data
          const { data: alerts, error } = await supabase
            .from("alerts")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && alerts) {
            setData((prev) => ({ ...prev, alerts }));
          }
        }
      )
      .subscribe();

    const officersSubscription = supabase
      .channel("officers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "officers",
        },
        async (payload) => {
          console.log("Officer change received:", payload);

          // Refetch officers data
          const { data: officers, error } = await supabase
            .from("officers")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && officers) {
            setData((prev) => ({ ...prev, officers }));
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions
    return () => {
      incidentsSubscription.unsubscribe();
      alertsSubscription.unsubscribe();
      officersSubscription.unsubscribe();
    };
  }, [fetchData, supabase]);

  return {
    data,
    loading,
    error,
    refreshData: fetchData,
  };
}
