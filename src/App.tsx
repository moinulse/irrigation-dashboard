import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Login from "@/components/Login";
import DeviceCard from "@/components/DeviceCard";
import ExportCSVDialog from "@/components/ExportCSVDialog";
import { useRealtimeDevices } from "@/hooks/useRealtimeDevices";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FarmZonesOverlay from "./components/FarmZone";
import { ChevronRight, Pause, Play } from "lucide-react";

export default function App() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [currentView, setCurrentView] = useState<"devices" | "overlay">(
    "devices"
  );
  const [isAutoPlay, setIsAutoPlay] = useState(true);
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

  // Auto-switch views every 10 seconds
  useEffect(() => {
    if (!authed || !isAutoPlay) return;

    const interval = setInterval(() => {
      setCurrentView((prev) => (prev === "devices" ? "overlay" : "devices"));
    }, 10000);

    return () => clearInterval(interval);
  }, [authed, isAutoPlay]);

  if (!sessionChecked) return null;
  if (!authed) return <Login onAuthed={() => setAuthed(true)} />;

  // Show error state if there's an error
  if (error) {
    console.error("Error loading devices:", error);
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const toggleView = () => {
    setCurrentView((prev) => (prev === "devices" ? "overlay" : "devices"));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary" />
            <h1 className="text-lg font-semibold">Tuaran Sabah Farm</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                title={isAutoPlay ? "Pause auto-play" : "Start auto-play"}
              >
                {isAutoPlay ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleView}
                disabled={isAutoPlay}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <ExportCSVDialog />
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-[1400px] p-4 relative overflow-hidden">
        {/* Device Grid View */}
        <div
          className={`transition-all duration-700 ease-in-out ${
            currentView === "devices"
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 absolute inset-0"
          }`}
        >
          {isLoading && devices.length === 0 ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : (
            <>
              <p className="mb-3 text-sm text-muted-foreground">
                Showing {devices.length} zones
              </p>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {devices.map((d) => (
                  <DeviceCard key={d.id} device={d} />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Farm Zones Overlay View */}
        <div
          className={`transition-all duration-700 ease-in-out ${
            currentView === "overlay"
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 absolute inset-0"
          }`}
        >
          <FarmZonesOverlay
            backgroundUrl={"/farm_bg_2560x1600.png"}
            devices={devices}
            inset={{ top: 4.9, right: 30, bottom: 4.9, left: 30 }}
          />
        </div>
      </main>
    </div>
  );
}
