import { spawn, type ChildProcess } from "node:child_process"
import { EventEmitter } from "node:events"
import type { InstanceConfig, InstanceId } from "./types"

const MAX_LOG_LINES = 1000

interface ManagedProcess {
  process: ChildProcess
  config: InstanceConfig
  logs: string[]
  startedAt: Date
  state: "starting" | "running" | "error"
  errorMessage?: string
  emitter: EventEmitter
}

class ProcessManager {
  private processes = new Map<InstanceId, ManagedProcess>()

  start(config: InstanceConfig): void {
    // Stop existing process if running
    if (this.processes.has(config.id)) {
      this.stopSync(config.id)
    }

    const args = this.buildArgs(config)
    const child = spawn(config.binaryPath, args, {
      stdio: ["ignore", "pipe", "pipe"],
      detached: false,
    })

    const managed: ManagedProcess = {
      process: child,
      config,
      logs: [],
      startedAt: new Date(),
      state: "starting",
      emitter: new EventEmitter(),
    }

    const pushLog = (line: string) => {
      managed.logs.push(line)
      if (managed.logs.length > MAX_LOG_LINES) {
        managed.logs.shift()
      }
      managed.emitter.emit("log", line)
    }

    child.stdout?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean)
      for (const line of lines) {
        pushLog(line)
        // Detect when server is ready
        if (
          line.includes("listening") ||
          line.includes("server is listening")
        ) {
          managed.state = "running"
        }
      }
    })

    child.stderr?.on("data", (data: Buffer) => {
      const lines = data.toString().split("\n").filter(Boolean)
      for (const line of lines) {
        pushLog(`[stderr] ${line}`)
        // llama-server logs to stderr by default, check for ready signal
        if (
          line.includes("listening") ||
          line.includes("server is listening") ||
          line.includes("all slots are idle")
        ) {
          managed.state = "running"
        }
      }
    })

    child.on("error", (err) => {
      managed.state = "error"
      managed.errorMessage = err.message
      pushLog(`[error] ${err.message}`)
    })

    child.on("exit", (code, signal) => {
      pushLog(
        `[exit] Process exited with code ${code}, signal ${signal}`
      )
      if (managed.state !== "error") {
        managed.state = "error"
        managed.errorMessage = `Exited with code ${code}`
      }
      // Clean up after a short delay so status can be read
      setTimeout(() => {
        const current = this.processes.get(config.id)
        if (current?.process.pid === child.pid) {
          this.processes.delete(config.id)
        }
      }, 5000)
    })

    this.processes.set(config.id, managed)
  }

  async stop(id: InstanceId): Promise<void> {
    const managed = this.processes.get(id)
    if (!managed) return

    const child = managed.process
    if (child.exitCode !== null) {
      this.processes.delete(id)
      return
    }

    // Send SIGTERM first
    child.kill("SIGTERM")

    // Wait up to 5s for graceful shutdown
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        if (child.exitCode === null) {
          child.kill("SIGKILL")
        }
        resolve()
      }, 5000)

      child.once("exit", () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    this.processes.delete(id)
  }

  private stopSync(id: InstanceId): void {
    const managed = this.processes.get(id)
    if (!managed) return
    if (managed.process.exitCode === null) {
      managed.process.kill("SIGKILL")
    }
    this.processes.delete(id)
  }

  async restart(config: InstanceConfig): Promise<void> {
    await this.stop(config.id)
    this.start(config)
  }

  getStatus(id: InstanceId): {
    processState: "running" | "stopped" | "starting" | "error"
    pid?: number
    uptime?: number
    errorMessage?: string
  } {
    const managed = this.processes.get(id)
    if (!managed) {
      return { processState: "stopped" }
    }

    // Check if process actually died
    if (managed.process.exitCode !== null && managed.state !== "error") {
      return {
        processState: "error",
        errorMessage: `Exited with code ${managed.process.exitCode}`,
      }
    }

    return {
      processState: managed.state,
      pid: managed.process.pid,
      uptime: Math.floor(
        (Date.now() - managed.startedAt.getTime()) / 1000
      ),
      errorMessage: managed.errorMessage,
    }
  }

  getLogs(id: InstanceId, lastN = 100): string[] {
    const managed = this.processes.get(id)
    if (!managed) return []
    return managed.logs.slice(-lastN)
  }

  getLogEmitter(id: InstanceId): EventEmitter | null {
    return this.processes.get(id)?.emitter ?? null
  }

  isRunning(id: InstanceId): boolean {
    const managed = this.processes.get(id)
    if (!managed) return false
    return managed.process.exitCode === null
  }

  private buildArgs(config: InstanceConfig): string[] {
    const args: string[] = [
      "-hf",
      config.hfModel,
      "-ngl",
      String(config.ngl),
      "--port",
      String(config.port),
      "--host",
      config.host,
      "--ctx-size",
      String(config.ctxSize),
    ]

    if (config.parallel > 0) {
      args.push("--parallel", String(config.parallel))
    }

    if (config.threads > 0) {
      args.push("--threads", String(config.threads))
    }

    if (config.temp !== 0.8) {
      args.push("--temp", String(config.temp))
    }

    if (config.topP !== 0.9) {
      args.push("--top-p", String(config.topP))
    }

    if (config.topK !== 40) {
      args.push("--top-k", String(config.topK))
    }

    if (config.repeatPenalty !== 1.0) {
      args.push("--repeat-penalty", String(config.repeatPenalty))
    }

    if (config.cacheTypeK && config.cacheTypeK !== "f16") {
      args.push("--cache-type-k", config.cacheTypeK)
    }

    if (config.cacheTypeV && config.cacheTypeV !== "f16") {
      args.push("--cache-type-v", config.cacheTypeV)
    }

    return args
  }
}

// Singleton — survives hot reloads in dev via globalThis
const globalForPM = globalThis as unknown as {
  processManager?: ProcessManager
}

export const processManager =
  globalForPM.processManager ?? new ProcessManager()

if (process.env.NODE_ENV !== "production") {
  globalForPM.processManager = processManager
}
