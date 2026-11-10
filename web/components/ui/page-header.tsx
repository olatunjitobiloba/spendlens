export function PageHeader({
  title,
  description,
  aside,
}: {
  title: string;
  description?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="max-w-2xl min-w-0">
        <h1 className="text-[22px] font-[650] tracking-[-0.03em] sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 text-[14px] text-t3">{description}</p>}
      </div>
      {aside}
    </div>
  );
}
