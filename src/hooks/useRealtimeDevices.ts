import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { Device, Reading, DeviceLatest } from "@/lib/types";

async function fetchLatestDevicesData(): Promise<DeviceLatest[]> {
  const { data: devices, error: devicesError } = await supabase
    .from("devices")
    .select("id, esp_id, name")
    .order("name", { ascending: true });

  if (devicesError) throw devicesError;
  if (!devices) return [];

  const ids = devices.map((d) => d.id);

  if (ids.length === 0) return [];

  const { data: readings, error: readingsError } = await supabase
    .from("readings")
    .select(
      `
      id, device_id, created_at,
      soil_1, soil_2, soil_3, soil_4,
      temp_1, hum_1, temp_2, hum_2
    `
    )
    .in("device_id", ids)
    .order("created_at", { ascending: false });

  if (readingsError) throw readingsError;

  const latestById = new Map<string, Reading>();
  (readings || []).forEach((r) => {
    if (!latestById.has(r.device_id)) latestById.set(r.device_id, r);
  });

  return (devices as Device[]).map((d) => ({
    ...d,
    latest: latestById.get(d.id) || null,
  }));
}

export function useRealtimeDevices(enabled: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["devices"],
    queryFn: fetchLatestDevicesData,
    enabled,
    refetchInterval: enabled ? 2 * 60 * 1000 : false,
    staleTime: 2000,
  });

  // Integrate realtime subscription with query lifecycle
  useEffect(() => {
    if (!enabled || !query.data) return;

    // Subscribe to changes in readings table only
    const readingsChannel = supabase
      .channel("readings-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "readings",
        },
        (payload) => {
          console.log("New reading inserted:", payload.new);

          // Optimistically update the cache with new reading
          queryClient.setQueryData<DeviceLatest[]>(["devices"], (oldData) => {
            if (!oldData) return oldData;

            const newReading = payload.new as Reading;
            return oldData.map((device) => {
              if (device.id === newReading.device_id) {
                if (
                  !device.latest ||
                  new Date(newReading.created_at) >
                    new Date(device.latest.created_at)
                ) {
                  return {
                    ...device,
                    latest: newReading,
                  };
                }
              }
              return device;
            });
          });
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      supabase.removeChannel(readingsChannel);
    };
  }, [queryClient, enabled, query.data]);

  return {
    devices: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
