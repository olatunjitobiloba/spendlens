import { cn } from "@/utils/cn";

export function SectionHeading({
  id,
  title,
  description,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <h2
        id={id}
        className="text-[30px] font-[400] leading-[1.08] tracking-[-0.04em] text-balance sm:text-[42px]"
      >
        {title}
      </h2>
      {description && (
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-t3 text-balance">
          {description}
        </p>
      )}
    </div>
  );
}
