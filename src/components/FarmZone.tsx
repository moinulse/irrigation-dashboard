import type { DeviceLatest } from "@/lib/types";
import React from "react";

export type FarmZonesOverlayProps = {
  /** Background image (field layout). Required for correct rendering */
  backgroundUrl: string;
  devices: DeviceLatest[];
  /** Fine-tune how the overlay sits inside the background (percent of width/height). */
  inset?: { top?: number; right?: number; bottom?: number; left?: number };
  /** Gap between red boxes in the image (as a percentage of width). */
  gapPercent?: number;
  /** Optional font scale multiplier (1 = default). */
  fontScale?: number;
  /** Optional per-zone x/y nudges (percent of zone width/height) to align precisely to the red grid. */
  nudge?: { x?: number; y?: number }[];
};

const ZoneBox: React.FC<{ device: DeviceLatest; fontScale?: number }> = ({
  device,
  fontScale = 1,
}) => {
  const z = device.latest;
  const fmt = (val: number | null | undefined) => (val != null ? val : "—");
  const base = `text-[calc(12px*${fontScale})] lg:text-[calc(16px*${fontScale})]`;
  return (
    <div
      className={`mx-auto w-fit px-1 sm:px-2 ${base} leading-tight tracking-tight text-green-400 select-none`}
    >
      {/* keep values in two compact columns, centered in the zone */}
      <div className="grid grid-cols-2 gap-1 gap-x-4 justify-items-center text-center">
        <table className="mx-auto text-center">
          <tbody>
            <tr>
              <td className="pr-1">S 1:</td>
              <td className="pl-1 font-bold">{fmt(z?.soil_1)}%</td>
            </tr>
            <tr>
              <td className="pr-1">S 2:</td>
              <td className="pl-1 font-bold">{fmt(z?.soil_2)}%</td>
            </tr>
            <tr>
              <td className="pr-1">S 3:</td>
              <td className="pl-1 font-bold">{fmt(z?.soil_3)}%</td>
            </tr>
            <tr>
              <td className="pr-1">S 4:</td>
              <td className="pl-1 font-bold">{fmt(z?.soil_4)}%</td>
            </tr>
          </tbody>
        </table>
        <table className="mx-auto text-left">
          <tbody>
            <tr>
              <td className="pr-1">T1:</td>
              <td className="pl-1 font-bold">{fmt(z?.temp_1)}°</td>
            </tr>
            <tr>
              <td className="pr-1">T2:</td>
              <td className="pl-1 font-bold">{fmt(z?.temp_2)}°</td>
            </tr>
            <tr>
              <td className="pr-1">H1:</td>
              <td className="pl-1 font-bold">{fmt(z?.hum_1)}%</td>
            </tr>
            <tr>
              <td className="pr-1">H2:</td>
              <td className="pl-1 font-bold">{fmt(z?.hum_2)}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FarmZonesOverlay: React.FC<FarmZonesOverlayProps> = ({
  backgroundUrl,
  devices,
  inset = { top: 4, right: 3, bottom: 4, left: 3 },
  fontScale = 1,
  nudge = [],
}) => {
  // Convert percent insets to CSS values
  const pad = {
    paddingTop: `${inset.top ?? 0}%`,
    paddingRight: `${inset.right ?? 0}%`,
    paddingBottom: `${inset.bottom ?? 0}%`,
    paddingLeft: `${inset.left ?? 0}%`,
    marginRight: `33px`,
    marginTop: `16px`,
  } as React.CSSProperties;

  const displayDevices = devices.slice(0, 8);

  return (
    <section className="hidden lg:block">
      <div className="relative mx-auto w-full aspect-[1.65/1] rounded-3xl overflow-hidden border border-neutral-200 shadow-lg bg-neutral-900">
        <img
          src={backgroundUrl}
          alt="Field layout"
          className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
        />

        {/* Adjustable inset so our overlay aligns with the red grid inside the image */}
        <div className="absolute inset-0 rotate-2" style={pad}>
          <div
            className="h-full w-full grid"
            style={{
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gridTemplateRows: "repeat(4, minmax(0, 1fr))",
            }}
          >
            {displayDevices.map((device, idx) => {
              const nx = nudge[idx]?.x ?? 0;
              const ny = nudge[idx]?.y ?? 0;
              return (
                <div
                  key={device.esp_id ?? idx}
                  className="relative flex items-center justify-center"
                >
                  <div
                    className="relative"
                    style={{ transform: `translate(${nx}%, ${ny}%)` }}
                  >
                    <ZoneBox device={device} fontScale={fontScale} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FarmZonesOverlay;
