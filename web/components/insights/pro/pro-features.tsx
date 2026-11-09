import { Tick02Icon } from "@hugeicons/core-free-icons";

import { Icon } from "@/components/ui/icon";

const features = [
  { title: "Saved scenarios", detail: "Keep the plans you test and come back to them." },
  { title: "Month comparison", detail: "See which categories went up or down, line by line." },
  { title: "Spending forecast", detail: "A range per category for next month, or an honest “not enough data”." },
];

export function ProFeatures() {
  return (
    <ul className="space-y-3">
      {features.map((f) => (
        <li key={f.title} className="flex gap-2.5 text-[13.5px]">
          <Icon icon={Tick02Icon} className="mt-0.5 text-positive" />
          <span>
            <span className="font-medium">{f.title}</span>
            <span className="block text-t3">{f.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
