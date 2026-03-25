import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  processState: "running" | "stopped" | "starting" | "error"
  healthStatus: "ok" | "loading" | "error" | "unreachable"
}

export function StatusBadge({ processState, healthStatus }: StatusBadgeProps) {
  const label = getLabel(processState, healthStatus)
  const variant = getVariant(processState, healthStatus)

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium",
        variant === "green" &&
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        variant === "yellow" &&
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
        variant === "red" &&
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
        variant === "gray" &&
          "border-muted-foreground/30 bg-muted text-muted-foreground"
      )}
    >
      <span
        className={cn(
          "size-2 rounded-full",
          variant === "green" && "bg-emerald-500",
          variant === "yellow" && "bg-amber-500 animate-pulse",
          variant === "red" && "bg-red-500",
          variant === "gray" && "bg-muted-foreground/50"
        )}
      />
      {label}
    </Badge>
  )
}

function getLabel(
  processState: string,
  healthStatus: string
): string {
  if (processState === "stopped") return "Stopped"
  if (processState === "error") return "Error"
  if (processState === "starting") return "Starting"
  if (healthStatus === "ok") return "Running"
  if (healthStatus === "loading") return "Loading Model"
  return "Starting"
}

function getVariant(
  processState: string,
  healthStatus: string
): "green" | "yellow" | "red" | "gray" {
  if (processState === "stopped") return "gray"
  if (processState === "error") return "red"
  if (processState === "starting" || healthStatus === "loading") return "yellow"
  if (healthStatus === "ok") return "green"
  return "yellow"
}
