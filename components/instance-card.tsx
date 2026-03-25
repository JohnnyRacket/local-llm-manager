"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/status-badge"
import { startInstance, stopInstance, restartInstance } from "@/app/actions"
import type { InstanceStatus } from "@/lib/types"

interface InstanceCardProps {
  instance: InstanceStatus
  onConfigOpen: () => void
  onLogsToggle: () => void
  logsOpen: boolean
}

export function InstanceCard({
  instance,
  onConfigOpen,
  onLogsToggle,
  logsOpen,
}: InstanceCardProps) {
  const [isPending, startTransition] = useTransition()
  const { config, processState, healthStatus, pid, uptime } = instance

  const isStopped = processState === "stopped"
  const isRunning =
    processState === "running" || processState === "starting"

  function handleStart() {
    startTransition(async () => {
      const result = await startInstance(config.id)
      if (result.success) {
        toast.success(`${config.name} starting...`)
      } else {
        toast.error(result.error ?? "Failed to start")
      }
    })
  }

  function handleStop() {
    startTransition(async () => {
      const result = await stopInstance(config.id)
      if (result.success) {
        toast.success(`${config.name} stopped`)
      } else {
        toast.error(result.error ?? "Failed to stop")
      }
    })
  }

  function handleRestart() {
    startTransition(async () => {
      const result = await restartInstance(config.id)
      if (result.success) {
        toast.success(`${config.name} restarting...`)
      } else {
        toast.error(result.error ?? "Failed to restart")
      }
    })
  }

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              {config.id === "gpu" ? "🖥️" : "⚡"} {config.name}
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              Port {config.port}
              {pid ? ` · PID ${pid}` : ""}
              {uptime ? ` · Up ${formatUptime(uptime)}` : ""}
            </CardDescription>
          </div>
          <StatusBadge
            processState={processState}
            healthStatus={healthStatus}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Model info */}
        <div>
          <p className="text-sm text-muted-foreground">Model</p>
          <p className="font-mono text-sm break-all">{config.hfModel}</p>
        </div>

        {/* Key params */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">GPU Layers</span>
            <span className="font-mono">{config.ngl}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Context</span>
            <span className="font-mono">
              {config.ctxSize >= 1024
                ? `${Math.round(config.ctxSize / 1024)}K`
                : config.ctxSize}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Parallel</span>
            <span className="font-mono">{config.parallel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Threads</span>
            <span className="font-mono">
              {config.threads === 0 ? "auto" : config.threads}
            </span>
          </div>
        </div>

        {/* Error message */}
        {instance.errorMessage && (
          <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {instance.errorMessage}
          </p>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {isStopped ? (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={isPending}
            >
              Start
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleStop}
                disabled={isPending}
              >
                Stop
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestart}
                disabled={isPending}
              >
                Restart
              </Button>
            </>
          )}
          <Button size="sm" variant="outline" onClick={onConfigOpen}>
            Configure
          </Button>
          <Button
            size="sm"
            variant={logsOpen ? "secondary" : "ghost"}
            onClick={onLogsToggle}
          >
            Logs
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
