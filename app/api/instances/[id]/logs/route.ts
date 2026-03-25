import { processManager } from "@/lib/process-manager"
import type { InstanceId } from "@/lib/types"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (id !== "gpu" && id !== "cpu") {
    return Response.json({ error: "Invalid instance ID" }, { status: 400 })
  }

  const instanceId = id as InstanceId
  const encoder = new TextEncoder()

  // Send existing logs first, then stream new ones
  const existingLogs = processManager.getLogs(instanceId, 200)
  const emitter = processManager.getLogEmitter(instanceId)

  const stream = new ReadableStream({
    start(controller) {
      // Send existing logs
      for (const line of existingLogs) {
        controller.enqueue(encoder.encode(`data: ${line}\n\n`))
      }

      if (!emitter) {
        controller.enqueue(
          encoder.encode(`data: [No active process for ${id}]\n\n`)
        )
        controller.close()
        return
      }

      const onLog = (line: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${line}\n\n`))
        } catch {
          // Stream closed
          emitter.removeListener("log", onLog)
        }
      }

      emitter.on("log", onLog)

      // Clean up when client disconnects
      request.signal.addEventListener("abort", () => {
        emitter.removeListener("log", onLog)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
