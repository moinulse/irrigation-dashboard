import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "./components/Login";
import DeviceCard from "./components/DeviceCard";
import ExportCSVDialog from "./components/ExportCSVDialog";
import type { Device, Reading, DeviceLatest } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

async function fetchLatest(): Promise<DeviceLatest[]> {
  const { data: devices } = await supabase
    .from("devices")
    .select("id, esp_id, name")
    .order("name", { ascending: true });

  if (!devices) return [];

  const ids = devices.map((d) => d.id);
  const { data: readings } = await supabase
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

  const latestById = new Map<string, Reading>();
  (readings || []).forEach((r) => {
    if (!latestById.has(r.device_id)) latestById.set(r.device_id, r);
  });

  return (devices as Device[]).map((d) => ({
    ...d,
    latest: latestById.get(d.id) || null,
  }));
}

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [list, setList] = useState<DeviceLatest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setSessionChecked(true);
    });
    const sub = supabase.auth.onAuthStateChange((_e, sess) =>
      setAuthed(!!sess)
    );
    return () => sub.data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authed) return;
    let timer: number;
    const load = async () => {
      setLoading(true);
      const rows = await fetchLatest();
      setList(rows);
      setLoading(false);
      timer = window.setTimeout(load, 10_000);
    };
    load();
    return () => clearTimeout(timer);
  }, [authed]);

  if (!sessionChecked) return null;
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary" />
            <h1 className="text-lg font-semibold">Irrigation Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <ExportCSVDialog />
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl p-4">
        {loading && list.length === 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Showing {list.length} zones
            </p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {list.map((d) => (
                <DeviceCard key={d.id} device={d} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
