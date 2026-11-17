"use client";

import { CloudServerIcon, Database01Icon, TestTube01Icon } from "@hugeicons/core-free-icons";

import { Hint } from "@/components/ui/hint";
import { Icon } from "@/components/ui/icon";
import { API_URL } from "@/configs/env";
import { useFixtureMode } from "@/hooks/use-fixture-mode";
import { liveModeBlocker } from "@/lib/api";
import { switchMode } from "@/lib/session";
import { cn } from "@/utils/cn";

const host = API_URL.replace(/^https?:\/\//, "");

function Segment({
  active,
  disabled,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  icon: typeof Database01Icon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={() => !active && onClick()}
      className={cn(
        "inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12.5px] font-medium transition-colors",
        active
          ? "border border-line-strong bg-panel text-foreground shadow-sm"
          : "text-t3 hover:text-foreground disabled:hover:text-t3",
      )}
    >
      <Icon icon={icon} className="size-3.5" />
      {label}
    </button>
  );
}

/** Sample data or the live API, always visible in the sidebar. Switching reloads the page. */
export function ModeSwitch({ collapsed }: { collapsed: boolean }) {
  const fixtures = useFixtureMode();
  const blocker = liveModeBlocker();

  // Server render: the mode lives in a cookie, so hold the space until hydration.
  if (fixtures === null) return <div aria-hidden="true" className={collapsed ? "h-9" : "h-[86px]"} />;

  if (collapsed) {
    const next = fixtures ? "live API" : "sample data";
    const label = fixtures
      ? blocker
        ? `Sample data. ${blocker}`
        : "Using sample data. Click to switch to the live API."
      : "Using the live API. Click to switch to sample data.";
    return (
      <Hint label={label} side="right">
        <button
          type="button"
          aria-label={fixtures && blocker ? "Using sample data" : `Switch to ${next}`}
          aria-disabled={fixtures && Boolean(blocker)}
          onClick={() => (fixtures ? !blocker && switchMode(false) : switchMode(true))}
          className="mx-auto inline-flex size-9 items-center justify-center rounded-lg border border-line text-t3 hover:text-foreground"
        >
          <Icon icon={fixtures ? TestTube01Icon : CloudServerIcon} className={cn("size-4", !fixtures && "text-positive")} />
        </button>
      </Hint>
    );
  }

  return (
    <div className="px-1">
      <div
        role="group"
        aria-labelledby="mode-switch-label"
        aria-describedby="mode-switch-note"
        className="flex gap-1 rounded-full border border-line bg-panel-raised/60 p-1"
      >
        <Segment active={fixtures} icon={TestTube01Icon} label="Sample" onClick={() => switchMode(true)} />
        <Segment
          active={!fixtures}
          disabled={fixtures && Boolean(blocker)}
          icon={CloudServerIcon}
          label="Live API"
          onClick={() => switchMode(false)}
        />
      </div>
    </div>
  );
}
