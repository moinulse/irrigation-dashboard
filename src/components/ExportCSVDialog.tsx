import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ExportCSVDialog() {
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    if (!start || !end) {
      setErr("Choose start & end.");
      return;
    }
    setBusy(true);
    setErr(null);

    const { data, error } = await supabase
      .from("readings")
      .select(
        `
        created_at, device_id,
        devices ( esp_id, name ),
        soil_1, soil_2, soil_3, soil_4,
        temp_1, hum_1, temp_2, hum_2
      `
      )
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: true });

    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }

    const rows = (data as any[]).map((r) => ({
      timestamp: r.created_at,
      esp_id: r.devices.esp_id,
      name: r.devices.name,
      soil_1: r.soil_1,
      soil_2: r.soil_2,
      soil_3: r.soil_3,
      soil_4: r.soil_4,
      temp_1: r.temp_1,
      hum_1: r.hum_1,
      temp_2: r.temp_2,
      hum_2: r.hum_2,
    }));

    const header = Object.keys(
      rows[0] || { timestamp: "", esp_id: "", name: "" }
    );
    const csv = [
      header.join(","),
      ...rows.map((r) => header.map((k) => r[k] ?? "").join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `readings_${new Date()
      .toISOString()
      .replace(/[:]/g, "-")}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Export CSV</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export readings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start">Start (UTC)</Label>
              <Input
                id="start"
                type="datetime-local"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">End (UTC)</Label>
              <Input
                id="end"
                type="datetime-local"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={run} disabled={busy}>
              {busy ? "Exporting…" : "Download CSV"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
