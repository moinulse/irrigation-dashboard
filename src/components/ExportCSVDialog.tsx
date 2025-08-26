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
import { formatKLDateTimeParts } from "@/lib/utils";

type ReadingExportRow = {
  created_at: string;
  device_id: string;
  devices: { esp_id: string; name: string } | null;
  soil_1: number | null;
  soil_2: number | null;
  soil_3: number | null;
  soil_4: number | null;
  temp_1: number | null;
  hum_1: number | null;
  temp_2: number | null;
  hum_2: number | null;
};

type CsvRow = {
  date: string; // e.g., "2025-08-26" (KL)
  time: string; // e.g., "14:23"     (KL)
  esp_id: string;
  name: string;
  soil_1: number | null;
  soil_2: number | null;
  soil_3: number | null;
  soil_4: number | null;
  temp_1: number | null;
  hum_1: number | null;
  temp_2: number | null;
  hum_2: number | null;
};

const CSV_COLUMNS: (keyof CsvRow)[] = [
  "date",
  "time",
  "esp_id",
  "name",
  "soil_1",
  "soil_2",
  "soil_3",
  "soil_4",
  "temp_1",
  "hum_1",
  "temp_2",
  "hum_2",
];

const toUtcIso = (s: string, inclusiveEnd = false) => {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  // make the end inclusive so you don't miss the final minute
  return inclusiveEnd
    ? new Date(d.getTime() + 59_999).toISOString()
    : d.toISOString();
};

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

    const startIso = toUtcIso(start);
    const endIso = toUtcIso(end, true);
    if (!startIso || !endIso) {
      setBusy(false);
      setErr("Invalid date(s).");
      return;
    }
    const { data, error } = await supabase
      .from("readings")
      .select(
        `created_at, device_id,
        soil_1, soil_2, soil_3, soil_4,
        temp_1, hum_1, temp_2, hum_2,
        devices!inner ( esp_id, name )
        `
      )
      .gte("created_at", startIso)
      .lte("created_at", endIso)
      .order("created_at", { ascending: true })
      .overrideTypes<ReadingExportRow[], { merge: false }>();

    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }

    const rows: CsvRow[] = (data ?? []).map((r) => {
      const { date, time } = formatKLDateTimeParts(r.created_at);
      return {
        date,
        time, // <-- KL date & time (no seconds)
        esp_id: r.devices?.esp_id ?? "",
        name: r.devices?.name ?? "",
        soil_1: r.soil_1,
        soil_2: r.soil_2,
        soil_3: r.soil_3,
        soil_4: r.soil_4,
        temp_1: r.temp_1,
        hum_1: r.hum_1,
        temp_2: r.temp_2,
        hum_2: r.hum_2,
      };
    });

    const csv = [
      CSV_COLUMNS.join(","),
      ...rows.map((r) => CSV_COLUMNS.map((k) => r[k] ?? "").join(",")),
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
