
"use client"

import { createContext, forwardRef, useContext } from "react"
import { type VariantProps, cva } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const verticalSidebarVariants = cva("group transition-all ease-in-out duration-300", {
  variants: {
    variant: {
      default: "data-[state=open]:w-72 data-[state=closed]:w-20",
      compact: "data-[state=open]:w-72 data-[state=closed]:w-20",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof verticalSidebarVariants> {
  isOpen?: boolean
}

type SidebarContextProps = {
  isOpen: boolean
} & VariantProps<typeof verticalSidebarVariants>

const SidebarContext = createContext<SidebarContextProps>({
  isOpen: true,
  variant: "default",
})

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({ className, variant, isOpen = true, ...props }, ref) => (
  <aside
    ref={ref}
    data-state={isOpen ? "open" : "closed"}
    className={cn("hidden h-screen md:block", verticalSidebarVariants({ variant }), className)}
    {...props}
  >
    <SidebarContext.Provider value={{ isOpen, variant }}>{props.children}</SidebarContext.Provider>
  </aside>
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex h-20 items-center justify-center p-4", className)}
      {...props}
    >
      {props.children}
    </div>
  )
)
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex-grow", className)} {...props} />
)
SidebarContent.displayName = "SidebarContent"

const SidebarFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4", className)} {...props} />
  )
)
SidebarFooter.displayName = "SidebarFooter"

interface SidebarItemProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ReactNode
  isActive?: boolean
}

const SidebarItem = forwardRef<HTMLDivElement, SidebarItemProps>(({ className, icon, isActive, ...props }, ref) => {
  const { isOpen } = useContext(SidebarContext)

  return (
    <div
      ref={ref}
      className={cn(
        "flex cursor-pointer items-center justify-center gap-x-4 rounded-lg p-4 transition-colors duration-300",
  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted-gray",
        isOpen ? "justify-start" : "justify-center",
        className
      )}
      {...props}
    >
  <span className="text-foreground dark:text-white">{icon}</span>
      <span className={cn("transition-opacity duration-300", isOpen ? "opacity-100" : "opacity-0")}>{props.children}</span>
    </div>
  )
})
SidebarItem.displayName = "SidebarItem"

const SidebarTrigger = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn("md:hidden", className)}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
)
SidebarTrigger.displayName = "SidebarTrigger"

const SidebarInset = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
      <main
        ref={ref}
        className={cn("flex-1", className)}
        {...props}
      />
    )
  )
  SidebarInset.displayName = "SidebarInset"

export { Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarItem, SidebarTrigger, SidebarInset }

    