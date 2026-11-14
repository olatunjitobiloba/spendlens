import { cn } from "@/utils/cn";

export type Device = "samsung" | "iphone";

export const DEVICES: { id: Device; label: string }[] = [
  { id: "samsung", label: "Samsung S26" },
  { id: "iphone", label: "iPhone 18" },
];

function StatusIcons({ color }: { color: string }) {
  return (
    <span aria-hidden="true" className="flex items-center gap-1" style={{ color }}>
      {/* Signal */}
      <svg viewBox="0 0 17 11" className="h-2.5 w-auto" fill="currentColor">
        <rect x="0" y="7" width="3" height="4" rx="0.8" />
        <rect x="4.5" y="5" width="3" height="6" rx="0.8" />
        <rect x="9" y="2.5" width="3" height="8.5" rx="0.8" />
        <rect x="13.5" y="0" width="3" height="11" rx="0.8" />
      </svg>
      {/* Wi-Fi */}
      <svg viewBox="0 0 15 11" className="h-2.5 w-auto" fill="currentColor">
        <path d="M7.5 2.2c2.1 0 4 .8 5.5 2.1l1.1-1.2A9.6 9.6 0 0 0 7.5.5 9.6 9.6 0 0 0 .9 3.1L2 4.3a8 8 0 0 1 5.5-2.1Zm0 3.3c1.2 0 2.3.4 3.2 1.2l1.1-1.2a6.4 6.4 0 0 0-8.6 0l1.1 1.2c.9-.8 2-1.2 3.2-1.2Zm0 3.2c.4 0 .8.1 1.1.4L7.5 10.5 6.4 9.1c.3-.3.7-.4 1.1-.4Z" />
      </svg>
      {/* Battery */}
      <svg viewBox="0 0 25 12" className="h-2.5 w-auto" fill="none">
        <rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke="currentColor" opacity="0.4" />
        <rect x="2" y="2" width="15" height="8" rx="1.8" fill="currentColor" />
        <path d="M23 4v4c.8-.3 1.3-1.1 1.3-2S23.8 4.3 23 4Z" fill="currentColor" opacity="0.5" />
      </svg>
    </span>
  );
}

/**
 * A phone drawn in CSS. The screen is a fixed 300px-wide canvas so the
 * simulator can measure cursor targets in plain pixels.
 */
export function PhoneFrame({
  device,
  statusColor,
  indicatorColor,
  children,
}: {
  device: Device;
  /** Colour of the status bar text, so it reads on the app's top area. */
  statusColor: string;
  /** Colour of the home indicator, so it reads on the app's bottom bar. */
  indicatorColor: string;
  children: React.ReactNode;
}) {
  const iphone = device === "iphone";

  return (
    <div
      className={cn(
        "relative mx-auto w-fit shrink-0 p-[9px] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.45)]",
        iphone
          ? "rounded-[56px] bg-[linear-gradient(145deg,#d8d8dc,#9c9ca3_45%,#c8c8cd)] dark:bg-[linear-gradient(145deg,#4a4a50,#26262a_45%,#3d3d42)]"
          : "rounded-[44px] bg-[#1b1c1f] dark:bg-[#2a2b2f]",
      )}
    >
      {/* Side buttons */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-[118px] -left-[3px] h-8 w-[3px] rounded-l-sm",
          iphone ? "bg-[#a9a9af] dark:bg-[#38383d]" : "hidden",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -left-[3px] h-14 w-[3px] rounded-l-sm bg-[#a9a9af] dark:bg-[#38383d]",
          iphone ? "top-[168px]" : "hidden",
        )}
      />
      <span
        aria-hidden="true"
        className={cn(
          "absolute -right-[3px] w-[3px] rounded-r-sm",
          iphone ? "top-[190px] h-20 bg-[#a9a9af] dark:bg-[#38383d]" : "top-[150px] h-24 bg-[#2a2b2f] dark:bg-[#3a3b40]",
        )}
      />
      {!iphone && (
        <span aria-hidden="true" className="absolute top-[268px] -right-[3px] h-12 w-[3px] rounded-r-sm bg-[#2a2b2f] dark:bg-[#3a3b40]" />
      )}

      <div
        className={cn(
          "relative isolate w-[300px] overflow-hidden bg-black [contain:layout_paint]",
          iphone ? "h-[650px] rounded-[47px]" : "h-[660px] rounded-[36px]",
        )}
      >
        {/* Status bar */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-between font-sans font-semibold",
            iphone ? "h-11 px-7 pt-1 text-[13px]" : "h-8 px-5 pt-0.5 text-[11px]",
          )}
          style={{ color: statusColor }}
        >
          <span>{iphone ? "9:41" : "12:45"}</span>
          <StatusIcons color={statusColor} />
        </div>

        {/* Dynamic Island or punch-hole camera */}
        {iphone ? (
          <span aria-hidden="true" className="absolute top-[10px] left-1/2 z-30 h-[27px] w-[86px] -translate-x-1/2 rounded-full bg-black" />
        ) : (
          <span aria-hidden="true" className="absolute top-[9px] left-1/2 z-30 size-[13px] -translate-x-1/2 rounded-full bg-black ring-2 ring-[#151515]" />
        )}

        {children}

        {/* Home indicator / gesture bar */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute bottom-[7px] left-1/2 z-30 h-[4px] -translate-x-1/2 rounded-full opacity-80",
            iphone ? "w-[112px]" : "w-[86px]",
          )}
          style={{ background: indicatorColor }}
        />
      </div>
    </div>
  );
}
