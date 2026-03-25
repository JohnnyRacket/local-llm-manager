"use client"

import { useActionState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { saveInstanceConfig, restartInstance } from "@/app/actions"
import type { ActionResult, InstanceConfig } from "@/lib/types"

interface InstanceConfigFormProps {
  config: InstanceConfig
  onClose: () => void
}

const initialState: ActionResult = { success: false }

export function InstanceConfigForm({
  config,
  onClose,
}: InstanceConfigFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveInstanceConfig,
    initialState
  )
  const [isRestarting, startRestart] = useTransition()

  // Handle restart prompt after successful save
  if (state.success && state.needsRestart) {
    return (
      <div className="space-y-4 p-1">
        <p className="text-sm">
          Configuration saved. The instance is currently running — restart to
          apply changes?
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={isRestarting}
            onClick={() => {
              startRestart(async () => {
                const result = await restartInstance(config.id)
                if (result.success) {
                  toast.success("Restarting...")
                } else {
                  toast.error(result.error ?? "Failed to restart")
                }
                onClose()
              })
            }}
          >
            Restart Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              toast.success("Configuration saved")
              onClose()
            }}
          >
            Later
          </Button>
        </div>
      </div>
    )
  }

  if (state.success) {
    toast.success("Configuration saved")
    onClose()
  }

  return (
    <form action={formAction} className="space-y-4 p-1">
      {/* Hidden fields */}
      <input type="hidden" name="id" value={config.id} />
      <input type="hidden" name="name" value={config.name} />
      <input type="hidden" name="binaryPath" value={config.binaryPath} />
      <input type="hidden" name="host" value={config.host} />

      {/* Model */}
      <div className="space-y-2">
        <Label htmlFor="hfModel">HuggingFace Model</Label>
        <Input
          id="hfModel"
          name="hfModel"
          defaultValue={config.hfModel}
          placeholder="org/model-GGUF:quantization"
          className="font-mono text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Port */}
        <div className="space-y-2">
          <Label htmlFor="port">Port</Label>
          <Input
            id="port"
            name="port"
            type="number"
            defaultValue={config.port}
          />
        </div>

        {/* GPU Layers */}
        <div className="space-y-2">
          <Label htmlFor="ngl">GPU Layers</Label>
          <Input
            id="ngl"
            name="ngl"
            type="number"
            defaultValue={config.ngl}
            min={0}
            max={999}
          />
        </div>

        {/* Context Size */}
        <div className="space-y-2">
          <Label htmlFor="ctxSize">Context Size</Label>
          <Input
            id="ctxSize"
            name="ctxSize"
            type="number"
            defaultValue={config.ctxSize}
            min={512}
            step={512}
          />
        </div>

        {/* Parallel Slots */}
        <div className="space-y-2">
          <Label htmlFor="parallel">Parallel Slots</Label>
          <Input
            id="parallel"
            name="parallel"
            type="number"
            defaultValue={config.parallel}
            min={0}
            max={64}
          />
        </div>

        {/* Threads */}
        <div className="space-y-2">
          <Label htmlFor="threads">Threads (0 = auto)</Label>
          <Input
            id="threads"
            name="threads"
            type="number"
            defaultValue={config.threads}
            min={0}
            max={256}
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <Label htmlFor="temp">Temperature</Label>
          <Input
            id="temp"
            name="temp"
            type="number"
            defaultValue={config.temp}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        {/* Top-P */}
        <div className="space-y-2">
          <Label htmlFor="topP">Top-P</Label>
          <Input
            id="topP"
            name="topP"
            type="number"
            defaultValue={config.topP}
            min={0}
            max={1}
            step={0.05}
          />
        </div>

        {/* Top-K */}
        <div className="space-y-2">
          <Label htmlFor="topK">Top-K</Label>
          <Input
            id="topK"
            name="topK"
            type="number"
            defaultValue={config.topK}
            min={0}
            max={1000}
          />
        </div>

        {/* Repeat Penalty */}
        <div className="space-y-2">
          <Label htmlFor="repeatPenalty">Repeat Penalty</Label>
          <Input
            id="repeatPenalty"
            name="repeatPenalty"
            type="number"
            defaultValue={config.repeatPenalty}
            min={0}
            max={2}
            step={0.01}
          />
        </div>

        {/* Cache Type K */}
        <div className="space-y-2">
          <Label htmlFor="cacheTypeK">Cache Type K</Label>
          <Select name="cacheTypeK" defaultValue={config.cacheTypeK}>
            <SelectTrigger id="cacheTypeK">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="f16">f16</SelectItem>
              <SelectItem value="q8_0">q8_0</SelectItem>
              <SelectItem value="q4_0">q4_0</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cache Type V */}
        <div className="space-y-2">
          <Label htmlFor="cacheTypeV">Cache Type V</Label>
          <Select name="cacheTypeV" defaultValue={config.cacheTypeV}>
            <SelectTrigger id="cacheTypeV">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="f16">f16</SelectItem>
              <SelectItem value="q8_0">q8_0</SelectItem>
              <SelectItem value="q4_0">q4_0</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Error */}
      {state.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
