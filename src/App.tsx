import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import DeviceCard from "@/components/DeviceCard";
import ExportCSVDialog from "@/components/ExportCSVDialog";
import { useRealtimeDevices } from "@/hooks/useRealtimeDevices";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const { devices, isLoading, error } = useRealtimeDevices(authed);

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

  if (!sessionChecked) return null;
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  // Show error state if there's an error
  if (error) {
    console.error('Error loading devices:', error);
  }

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
            <h1 className="text-lg font-semibold">Batang Kali Farm</h1>
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
        {isLoading && devices.length === 0 ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Showing {devices.length} zones
            </p>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3">
              {devices.map((d) => (
                <DeviceCard key={d.id} device={d} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
