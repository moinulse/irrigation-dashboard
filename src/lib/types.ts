export type Device = {
  id: string;
  esp_id: string;
  name: string;
};

export type Reading = {
  id: number;
  device_id: string;
  created_at: string;
  soil_1: number | null;
  soil_2: number | null;
  soil_3: number | null;
  soil_4: number | null;
  temp_1: number | null;
  hum_1: number | null;
  temp_2: number | null;
  hum_2: number | null;
};

export type DeviceLatest = Device & { latest?: Reading | null };
