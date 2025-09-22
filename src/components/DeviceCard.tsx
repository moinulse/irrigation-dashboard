import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DeviceChartDialog from "./DeviceChartDialog";
import type { DeviceLatest } from "@/lib/types";

export default function DeviceCard({ device }: { device: DeviceLatest }) {
  const r = device.latest;
  const ts = r ? new Date(r.created_at) : null;
  const stale = ts ? Date.now() - ts.getTime() > 2.1 * 60 * 1000 : true;

  return (
    <DeviceChartDialog device={device}>
      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Badge
              variant={stale ? "destructive" : "default"}
              className={
                stale
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              }
            >
              {stale ? "Stale" : "Fresh"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {r ? (
            <>
              <div className="overflow-x-auto">
                <div className="flex min-w-max items-stretch justify-center gap-2">
                  <Info type="soil" label="Soil 1" value={fmtPct(r.soil_1)} />
                  <Info type="soil" label="Soil 2" value={fmtPct(r.soil_2)} />
                  <Info type="soil" label="Soil 3" value={fmtPct(r.soil_3)} />
                  <Info type="soil" label="Soil 4" value={fmtPct(r.soil_4)} />
                  <Info
                    label="Temperature"
                    type="temp"
                    value={fmtC(r.temp_1)}
                  />
                  <Info
                    label="Temperature 2"
                    type="temp"
                    value={fmtC(r.temp_2)}
                  />
                  <Info
                    label="Humidity 1"
                    type="humidity"
                    value={fmtPct(r.hum_1)}
                  />
                  <Info
                    label="Humidity 2"
                    type="humidity"
                    value={fmtPct(r.hum_2)}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No data yet.</p>
          )}
        </CardContent>

        <CardFooter className="text-sm text-muted-foreground">
          {ts ? (
            <>Updated {formatDistanceToNow(ts, { addSuffix: true })}</>
          ) : (
            "Waiting for first reading…"
          )}
        </CardFooter>
      </Card>
    </DeviceChartDialog>
  );
}

function Info({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: "soil" | "temp" | "humidity";
}) {
  let colorClass = "";
  switch (type) {
    case "soil":
      colorClass = "bg-green-50 border-green-200 text-green-800";
      break;
    case "temp":
      colorClass = "bg-red-50 border-red-200 text-red-800";
      break;
    case "humidity":
      colorClass = "bg-blue-50 border-blue-200 text-blue-800";
      break;
  }

  return (
    <div className={`w-36 rounded-md border px-4 py-3 ${colorClass}`}>
      <div className="text-[11px] opacity-70 mb-1">{label}</div>
      <div className="text-2xl font-semibold leading-tight">{value}</div>
    </div>
  );
}
const fmtPct = (n: number | null) => (n == null ? "—" : `${n}%`);
const fmtC = (n: number | null) => (n == null ? "—" : `${n}°C`);
