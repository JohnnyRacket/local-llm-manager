import { getConfig } from "@/lib/config"
import { checkHealth } from "@/lib/health"
import { processManager } from "@/lib/process-manager"
import type { InstanceStatus } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET() {
  const config = await getConfig()

  const instances: InstanceStatus[] = await Promise.all(
    config.instances.map(async (instanceConfig) => {
      const status = processManager.getStatus(instanceConfig.id)
      const health =
        status.processState === "running" || status.processState === "starting"
          ? await checkHealth(instanceConfig.port)
          : { status: "unreachable" as const }

      return {
        id: instanceConfig.id,
        config: instanceConfig,
        processState: status.processState,
        healthStatus: health.status,
        pid: status.pid,
        uptime: status.uptime,
        errorMessage: status.errorMessage,
      }
    })
  )

  return Response.json({ instances })
}
