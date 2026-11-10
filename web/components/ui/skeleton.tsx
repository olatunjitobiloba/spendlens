import { cn } from "cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-foreground/[0.06] motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
