"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
// cmdk is dynamically imported on the client to avoid module initialization during SSR
// which can cause runtime errors in some embedded WebView / hydration scenarios.
let _cmdkPromise: Promise<any> | null = null
function ensureCmdkImported() {
  if (typeof window === "undefined") return null
  if (!_cmdkPromise) _cmdkPromise = import("cmdk")
  return _cmdkPromise
}

function useCmdk() {
  const [mod, setMod] = React.useState<any | null>(null)
  React.useEffect(() => {
    const p = ensureCmdkImported()
    if (!p) return
    let mounted = true
    p.then((m) => {
      if (!mounted) return
      // normalize ESM/CJS interop: some bundlers expose exports on .default
      const normalized = m && (m.Command ? m : m.default ? m.default : m)
      setMod(normalized)
    }).catch(() => {})
    return () => {
      mounted = false
    }
  }, [])
  return mod
}
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const Command = React.forwardRef<
  any,
  any
>(({ className, ...props }, ref) => {
  const cmdk = useCmdk()
  if (!cmdk) return null
  const { Command: CommandPrimitive } = cmdk
  return (
    <CommandPrimitive
      ref={ref}
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
        className
      )}
      {...props}
    />
  )
})
Command.displayName = "Command"

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <DialogHeader>
          <DialogTitle>Comando</DialogTitle>
        </DialogHeader>
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<any, any>(({ className, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const cmdk = useCmdk()
  if (!mounted || !cmdk) {
    return (
      <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
        <input
          aria-hidden
          className={cn(
            "flex h-11 w-full rounded-md bg-transparent py-3 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          readOnly
        />
      </div>
    )
  }

  const { Input: CommandInputPrimitive } = cmdk
  return (
    <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandInputPrimitive
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
})

CommandInput.displayName = "CommandInput"

const CommandList = React.forwardRef<any, any>(({ className, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const cmdk = useCmdk()
  if (!mounted || !cmdk) return null
  const { List: CommandListPrimitive } = cmdk
  return (
    <CommandListPrimitive
      ref={ref}
      className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
      {...props}
    />
  )
})

CommandList.displayName = "CommandList"

const CommandEmpty = React.forwardRef<any, any>((props, ref) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const cmdk = useCmdk()
  if (!mounted || !cmdk) return null
  const { Empty: CommandEmptyPrimitive } = cmdk
  return (
    <CommandEmptyPrimitive
      ref={ref}
      className="py-6 text-center text-sm"
      {...props}
    />
  )
})

CommandEmpty.displayName = "CommandEmpty"

const CommandGroup = React.forwardRef<any, any>(({ className, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const cmdk = useCmdk()
  if (!mounted || !cmdk) return null
  const { Group: CommandGroupPrimitive } = cmdk
  return (
    <CommandGroupPrimitive
      ref={ref}
      className={cn(
        "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
})

CommandGroup.displayName = "CommandGroup"

const CommandSeparator = React.forwardRef<any, any>(({ className, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const cmdk = useCmdk()
  if (!mounted || !cmdk) return null
  const { Separator: CommandSeparatorPrimitive } = cmdk
  return (
    <CommandSeparatorPrimitive
      ref={ref}
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  )
})
CommandSeparator.displayName = "CommandSeparator"

const CommandItem = React.forwardRef<any, any>(({ className, ...props }, ref) => {
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const cmdk = useCmdk()
  if (!mounted || !cmdk) return null
  const { Item: CommandItemPrimitive } = cmdk
  return (
    <CommandItemPrimitive
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  )
})

CommandItem.displayName = "CommandItem"

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
