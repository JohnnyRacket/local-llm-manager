export type InstanceId = "gpu" | "cpu"

export interface InstanceConfig {
  id: InstanceId
  name: string
  binaryPath: string
  port: number
  host: string
  hfModel: string
  ngl: number
  ctxSize: number
  parallel: number
  threads: number
  temp: number
  topP: number
  topK: number
  repeatPenalty: number
  cacheTypeK: string
  cacheTypeV: string
}

export interface InstanceStatus {
  id: InstanceId
  config: InstanceConfig
  processState: "running" | "stopped" | "starting" | "error"
  healthStatus: "ok" | "loading" | "error" | "unreachable"
  pid?: number
  uptime?: number
  errorMessage?: string
}

export interface AppConfig {
  instances: InstanceConfig[]
}

export interface ActionResult {
  success: boolean
  error?: string
  needsRestart?: boolean
}
