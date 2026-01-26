"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center py-4",
      className
    )}
    {...props}
  >
    {/* FIX: Changed bg-slate-700 to bg-slate-600. 
       If this is still too dark, change it to 'bg-slate-500'.
    */}
    <SliderPrimitive.Track
      className="relative h-3 w-full grow overflow-hidden rounded-full bg-slate-600"
    >
      <SliderPrimitive.Range className="absolute h-full bg-blue-500" />
    </SliderPrimitive.Track>
    
    <SliderPrimitive.Thumb
      className="block h-6 w-6 rounded-full border-2 border-blue-500 bg-white ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:scale-110 hover:cursor-grab active:cursor-grabbing shadow-lg"
    />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }