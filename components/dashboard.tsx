"use client"

import { useState } from "react"
import { useInstanceStatus } from "@/hooks/use-instance-status"
import { InstanceCard } from "@/components/instance-card"
import { InstanceConfigDialog } from "@/components/instance-config-dialog"
import { LogViewer } from "@/components/log-viewer"
import { Skeleton } from "@/components/ui/skeleton"
import type { InstanceId } from "@/lib/types"

export function Dashboard() {
  const { instances, isLoading } = useInstanceStatus(3000)
  const [configOpen, setConfigOpen] = useState<InstanceId | null>(null)
  const [logsOpen, setLogsOpen] = useState<InstanceId | null>(null)

  if (isLoading && instances.length === 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    )
  }

  const configInstance = instances.find((i) => i.id === configOpen)

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {instances.map((instance) => (
          <InstanceCard
            key={instance.id}
            instance={instance}
            onConfigOpen={() => setConfigOpen(instance.id)}
            onLogsToggle={() =>
              setLogsOpen((prev) =>
                prev === instance.id ? null : instance.id
              )
            }
            logsOpen={logsOpen === instance.id}
          />
        ))}
      </div>

      {/* Log viewer panel */}
      {logsOpen && (
        <div className="mt-6">
          <LogViewer
            instanceId={logsOpen}
            instanceName={
              instances.find((i) => i.id === logsOpen)?.config.name ??
              logsOpen
            }
            onClose={() => setLogsOpen(null)}
          />
        </div>
      )}

      {/* Config dialog */}
      {configInstance && (
        <InstanceConfigDialog
          config={configInstance.config}
          open={configOpen !== null}
          onOpenChange={(open) => {
            if (!open) setConfigOpen(null)
          }}
        />
      )}
    </>
  )
}
