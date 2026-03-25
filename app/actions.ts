"use server"

import { revalidatePath } from "next/cache"
import { getInstanceConfig, updateInstanceConfig } from "@/lib/config"
import { processManager } from "@/lib/process-manager"
import { instanceConfigSchema } from "@/lib/schemas"
import type { ActionResult, InstanceId } from "@/lib/types"

export async function startInstance(id: InstanceId): Promise<ActionResult> {
  try {
    const config = await getInstanceConfig(id)
    processManager.start(config)
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to start instance",
    }
  }
}

export async function stopInstance(id: InstanceId): Promise<ActionResult> {
  try {
    await processManager.stop(id)
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to stop instance",
    }
  }
}

export async function restartInstance(id: InstanceId): Promise<ActionResult> {
  try {
    const config = await getInstanceConfig(id)
    await processManager.restart(config)
    revalidatePath("/")
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error ? err.message : "Failed to restart instance",
    }
  }
}

export async function saveInstanceConfig(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = instanceConfigSchema.safeParse(raw)

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return {
      success: false,
      error: `${firstError.path.join(".")}: ${firstError.message}`,
    }
  }

  try {
    await updateInstanceConfig(parsed.data.id, parsed.data)
    const isRunning = processManager.isRunning(parsed.data.id)
    revalidatePath("/")
    return { success: true, needsRestart: isRunning }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to save config",
    }
  }
}
