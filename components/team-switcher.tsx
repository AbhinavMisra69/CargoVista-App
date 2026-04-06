"use client"

import * as React from "react"
import { GalleryVerticalEnd } from "lucide-react"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-default hover:bg-transparent"
        >
          {/* Logo Container */}
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-400 text-white overflow-hidden">
  <img 
    src="/cargovista.png" 
    alt="CargoVista Logo" 
    className="h-full w-full object-cover" 
  />
</div>
          
          {/* Text Container */}
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-bold">CargoVista</span>
            <span className="truncate text-xs text-neutral-400">Intelligent Logistics</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}