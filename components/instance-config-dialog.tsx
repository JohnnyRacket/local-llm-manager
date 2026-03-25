"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { InstanceConfigForm } from "@/components/instance-config-form"
import type { InstanceConfig } from "@/lib/types"

interface InstanceConfigDialogProps {
  config: InstanceConfig
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InstanceConfigDialog({
  config,
  open,
  onOpenChange,
}: InstanceConfigDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure {config.name}</DialogTitle>
          <DialogDescription>
            Change model, context size, sampling parameters, and more.
          </DialogDescription>
        </DialogHeader>
        <InstanceConfigForm
          config={config}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
