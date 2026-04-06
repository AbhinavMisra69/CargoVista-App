"use client"

import * as React from "react"
import {
  Bot,
  SquareTerminal,
  Network,
  Zap,
  Crown
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// Static navigation data
const data = {
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        { title: "Route Planner", url: "/dashboard" },
        { title: "Admin", url: "/admin" },
        { title: "API (Sellers)", url: "/api/sellers" },
      ],
    },
    {
      title: "Logistics Models",
      url: "#",
      icon: Bot,
      isActive: true,
      items: [
        { title: "Hub & Spoke", url: "/models/hubandspoke", icon: Network },
        { title: "Point to Point", url: "/models/pointto-oint", icon: Zap },
        { title: "Personalized", url: "/models/personalised", icon: Crown },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState({
    name: "User",
    email: "user@cargovista.com",
    avatar: "",
  })

  React.useEffect(() => {
    const safeParse = (key: string) => {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch (e) {
        return item;
      }
    };
    const storedData = safeParse("user") || safeParse("seller");
    if (storedData && typeof storedData === 'object') {
      setUser({
        name: storedData.name || storedData.username || "Seller",
        email: storedData.email || "seller@cargovista.com",
        avatar: storedData.avatar || ""
      });
    }
  }, []);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
      // --- THE MAGIC FIX ---
      // We override the CSS variables that Shadcn uses to paint the sidebar.
      // This forces the "Navy Blue" theme on all child components automatically.
      style={
        {
          "--sidebar-background": "222.2 84% 4.9%", // Deep Navy (#020817)
          "--sidebar-foreground": "210 40% 98%",    // White Text
          "--sidebar-primary": "217.2 91.2% 59.8%", // Bright Blue Accent
          "--sidebar-primary-foreground": "222.2 47.4% 11.2%", // Dark Text on Accent
          "--sidebar-accent": "217.2 32.6% 17.5%",  // Lighter Navy for Hover
          "--sidebar-accent-foreground": "210 40% 98%", // White Text on Hover
          "--sidebar-border": "217.2 32.6% 17.5%",  // Subtle Border
          "--sidebar-ring": "224.3 76.3% 48%",
        } as React.CSSProperties
      }
    >
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}