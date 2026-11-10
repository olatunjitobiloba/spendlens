import { cn } from "@/utils/cn";

/** A titled panel. The heading labels the region for screen readers. */
export function Section({
  title,
  description,
  aside,
  children,
  className,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={cn("rounded-[1.25rem] border border-line bg-panel p-4 sm:p-5", className)}
    >
      {(title || aside) && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            {title && (
              <h2 id={headingId} className="text-[15px] font-[600] tracking-[-0.01em]">
                {title}
              </h2>
            )}
            {description && <p className="mt-0.5 text-[13px] text-t3">{description}</p>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
