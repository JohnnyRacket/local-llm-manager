import { readFile, writeFile, mkdir } from "node:fs/promises"
import { homedir } from "node:os"
import { join, dirname } from "node:path"
import type { AppConfig, InstanceConfig, InstanceId } from "./types"

const CONFIG_PATH =
  process.env.LLM_MANAGER_CONFIG_PATH ??
  join(homedir(), ".config", "llm-manager", "config.json")

const home = homedir()

const DEFAULT_CONFIG: AppConfig = {
  instances: [
    {
      id: "gpu",
      name: "GPU Instance",
      binaryPath: join(home, "llama.cpp", "build", "bin", "llama-server"),
      port: 8080,
      host: "0.0.0.0",
      hfModel: process.env.LLM_DEFAULT_GPU_MODEL ?? "nvidia/NVIDIA-Nemotron-3-Nano-4B-GGUF:Q4_K_M",
      ngl: 99,
      ctxSize: 262144,
      parallel: 4,
      threads: 0,
      temp: 0.8,
      topP: 0.9,
      topK: 40,
      repeatPenalty: 1.0,
      cacheTypeK: "q8_0",
      cacheTypeV: "q8_0",
    },
    {
      id: "cpu",
      name: "CPU Instance",
      binaryPath: join(home, "llama-cpp-cpu", "build", "bin", "llama-server"),
      port: 8081,
      host: "0.0.0.0",
      hfModel: process.env.LLM_DEFAULT_CPU_MODEL ?? "unsloth/Qwen3-Coder-Next-GGUF:Q4_K_XL",
      ngl: 0,
      ctxSize: 65536,
      parallel: 1,
      threads: 0,
      temp: 0.7,
      topP: 0.8,
      topK: 20,
      repeatPenalty: 1.05,
      cacheTypeK: "f16",
      cacheTypeV: "f16",
    },
  ],
}

export async function getConfig(): Promise<AppConfig> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8")
    return JSON.parse(raw) as AppConfig
  } catch {
    // File doesn't exist yet — write defaults and return them
    await saveConfig(DEFAULT_CONFIG)
    return DEFAULT_CONFIG
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await mkdir(dirname(CONFIG_PATH), { recursive: true })
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8")
}

export async function getInstanceConfig(
  id: InstanceId
): Promise<InstanceConfig> {
  const config = await getConfig()
  const instance = config.instances.find((i) => i.id === id)
  if (!instance) {
    throw new Error(`Instance "${id}" not found in config`)
  }
  return instance
}

export async function updateInstanceConfig(
  id: InstanceId,
  partial: Partial<InstanceConfig>
): Promise<InstanceConfig> {
  const config = await getConfig()
  const index = config.instances.findIndex((i) => i.id === id)
  if (index === -1) {
    throw new Error(`Instance "${id}" not found in config`)
  }
  config.instances[index] = { ...config.instances[index], ...partial }
  await saveConfig(config)
  return config.instances[index]
}
