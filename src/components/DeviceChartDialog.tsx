import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Reading, Device } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

interface DeviceChartDialogProps {
  device: Device;
  children: React.ReactNode;
}

interface ChartDataPoint {
  timestamp: string;
  datetime: Date;
  avgSoilMoisture?: number;
  avgTemperature?: number;
  avgHumidity?: number;
}

async function fetchDeviceHistory(deviceId: string): Promise<Reading[]> {
  // Calculate date 7 days ago
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const { data, error } = await supabase
    .from("readings")
    .select("*")
    .eq("device_id", deviceId)
    .gte("created_at", oneWeekAgo.toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: ChartDataPoint;
  }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium mb-2">
          {format(data.datetime, "MMM d, yyyy 'at' h:mm a")}
        </p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.dataKey.includes('Soil') || entry.dataKey.includes('Humidity') ? '%' : '°C'}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function DeviceChartDialog({ device, children }: DeviceChartDialogProps) {
  const { data: readings = [], isLoading, error, refetch } = useQuery({
    queryKey: ['device-history', device.id],
    queryFn: () => fetchDeviceHistory(device.id),
    enabled: false, // Only fetch when dialog is opened
  });

  const handleOpenChange = (open: boolean) => {
    if (open) {
      refetch(); // Fetch data when dialog opens
    }
  };

  // Transform data for charts - calculate 3-hour averages
  const chartData: ChartDataPoint[] = (() => {
    // Group readings by 3-hour periods
    const groupedData = new Map<string, Reading[]>();
    
    readings.forEach(reading => {
      const date = new Date(reading.created_at);
      // Round down to nearest 3-hour period
      const hours = Math.floor(date.getHours() / 3) * 3;
      date.setHours(hours, 0, 0, 0);
      const key = date.toISOString();
      
      if (!groupedData.has(key)) {
        groupedData.set(key, []);
      }
      groupedData.get(key)!.push(reading);
    });
    
    // Calculate averages for each 3-hour period
    const result: ChartDataPoint[] = [];
    
    groupedData.forEach((readings, timestamp) => {
      const date = new Date(timestamp);
      
      // Calculate soil moisture average (from soil_1, soil_2, soil_3, soil_4)
      const soilValues = readings.flatMap(r => [r.soil_1, r.soil_2, r.soil_3, r.soil_4])
        .filter((val): val is number => val !== null && val !== undefined);
      const avgSoilMoisture = soilValues.length > 0 
        ? Math.round((soilValues.reduce((sum, val) => sum + val, 0) / soilValues.length) * 10) / 10
        : undefined;
      
      // Calculate temperature average (from temp_1, temp_2)
      const tempValues = readings.flatMap(r => [r.temp_1, r.temp_2])
        .filter((val): val is number => val !== null && val !== undefined);
      const avgTemperature = tempValues.length > 0 
        ? Math.round((tempValues.reduce((sum, val) => sum + val, 0) / tempValues.length) * 10) / 10
        : undefined;
      
      // Calculate humidity average (from hum_1, hum_2)
      const humValues = readings.flatMap(r => [r.hum_1, r.hum_2])
        .filter((val): val is number => val !== null && val !== undefined);
      const avgHumidity = humValues.length > 0 
        ? Math.round((humValues.reduce((sum, val) => sum + val, 0) / humValues.length) * 10) / 10
        : undefined;
      
      result.push({
        timestamp: format(date, "MM/dd HH:mm"),
        datetime: date,
        avgSoilMoisture,
        avgTemperature,
        avgHumidity,
      });
    });
    
    // Sort by datetime (oldest to newest)
    return result.sort((a, b) => a.datetime.getTime() - b.datetime.getTime());
  })();

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {device.name} - 3-Hour Averages (Last 7 Days)
            </DialogTitle>
            <Badge variant="outline">{device.esp_id}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Failed to load chart data</p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error ? error.message : 'Unknown error'}
              </p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No historical data available</p>
            </div>
          ) : (
            <>
              {/* Soil Moisture Chart */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-700">Average Soil Moisture</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Moisture (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {chartData.some(d => d.avgSoilMoisture !== undefined) && (
                        <Line 
                          type="monotone" 
                          dataKey="avgSoilMoisture" 
                          stroke="#16a34a" 
                          name="Avg Soil Moisture"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Temperature Chart */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-700">Average Temperature</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {chartData.some(d => d.avgTemperature !== undefined) && (
                        <Line 
                          type="monotone" 
                          dataKey="avgTemperature" 
                          stroke="#dc2626" 
                          name="Avg Temperature"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Humidity Chart */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-blue-700">Average Humidity</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="timestamp" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      {chartData.some(d => d.avgHumidity !== undefined) && (
                        <Line 
                          type="monotone" 
                          dataKey="avgHumidity" 
                          stroke="#2563eb" 
                          name="Avg Humidity"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="text-sm text-muted-foreground text-center">
                Showing {chartData.length} data points (3-hour averages from the last 7 days)
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
