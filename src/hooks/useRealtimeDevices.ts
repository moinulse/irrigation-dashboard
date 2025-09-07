import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Device, Reading, DeviceLatest } from "@/lib/types";

export function useRealtimeDevices(enabled: boolean = true) {
  const queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionRef = useRef<any>(null);

  const devicesQuery = useQuery({
    queryKey: ["devices"],
    queryFn: async (): Promise<Device[]> => {
      const { data, error } = await supabase
        .from("devices")
        .select("id, esp_id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: Infinity, // Devices don't change, so never refetch automatically
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const readingsQuery = useQuery({
    queryKey: ["readings", devicesQuery.data?.map((d) => d.id)],
    queryFn: async (): Promise<Map<string, Reading>> => {
      if (!devicesQuery.data || devicesQuery.data.length === 0)
        return new Map();
      const ids = devicesQuery.data.map((d) => d.id);
       const promises = ids.map((id) =>
         supabase
           .from("readings")
           .select(
             `
          id, device_id, created_at,
          soil_1, soil_2, soil_3, soil_4,
          temp_1, hum_1, temp_2, hum_2
        `
           )
           .eq("device_id", id)
           .order("created_at", { ascending: false })
           .limit(1)
       );

      const results = await Promise.all(promises);

      const latestById = new Map<string, Reading>();
      results.forEach(({ data, error }) => {
        if (error) throw error;
        if (data && data.length > 0) {
          const r = data[0];
          latestById.set(r.device_id, r);
        }
      });
      return latestById;
    },
    enabled: enabled && !!devicesQuery.data,
    refetchInterval: enabled ? 2 * 60 * 1000 : false,
    staleTime: 2000,
  });

  const devices: DeviceLatest[] =
    devicesQuery.data?.map((d) => ({
      ...d,
      latest: readingsQuery.data?.get(d.id) || null,
    })) || [];

  // Integrate realtime subscription with query lifecycle
  useEffect(() => {
    if (!enabled) {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
      return;
    }

    if (subscriptionRef.current) return; // Already subscribed

    subscriptionRef.current = supabase
      .channel("readings-changes")
      .on("postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "readings",
        },
        (payload) => {
          console.log(
            "Readings change detected:",
            payload.eventType,
            payload.new || payload.old
          );

          // Optimistically update only the relevant device_id in the readings cache
          queryClient.setQueryData<Map<string, Reading>>(
            ["readings", devicesQuery.data?.map((d) => d.id)],
            (oldReadings) => {
              if (!oldReadings) return oldReadings;
              const newMap = new Map(oldReadings); // Shallow copy to trigger re-render

              if (
                payload.eventType === "INSERT" ||
                payload.eventType === "UPDATE"
              ) {
                const newReading = payload.new as Reading;
                // Only update if it's the latest for this device
                const existing = newMap.get(newReading.device_id);
                if (
                  !existing ||
                  new Date(newReading.created_at) >
                    new Date(existing.created_at)
                ) {
                  newMap.set(newReading.device_id, newReading);
                }
              }
              return newMap;
            }
          );
        }
      )
      .subscribe();

    // Cleanup on unmount or enabled change
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enabled, queryClient, devicesQuery.data]);

  return {
    devices,
    isLoading: devicesQuery.isLoading || readingsQuery.isLoading,
    error: devicesQuery.error || readingsQuery.error,
    refetch: () => {
      readingsQuery.refetch();
    },
  };
}
