"use client"

import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"

// --- FIX: Leaflet Default Icons ---
const iconRetinaUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png';
const iconUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png';
const shadowUrl = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

// --- TYPES ---
export type City = { name: string; coords: [number, number] }

export type RouteData = { 
  path: [number, number][] 
  color?: string
  cityNames: string[] // The whitelist of cities to show
}

// --- PROPS ---
interface MapDisplayProps {
  allCities: City[]
  activeRoute: RouteData | null
}

// --- CONTROLLER ---
function MapController({ route }: { route: RouteData | null }) {
  const map = useMap()
  useEffect(() => {
    if (route && route.path.length > 0) {
      const routeBounds = L.latLngBounds(route.path)
      map.fitBounds(routeBounds, { padding: [50, 50], maxZoom: 9 })
    } else {
      map.flyTo([29.5, 77.5], 7, { duration: 1.5 }) 
    }
  }, [route, map])
  return null
}

export default function MapDisplay({ allCities, activeRoute }: MapDisplayProps) {
  return (
    <div className="h-full w-full rounded-xl overflow-hidden border z-0 relative">
      <MapContainer 
        center={[29.5, 77.5]} 
        zoom={7} 
        scrollWheelZoom={true} 
        className="h-full w-full"
      >
        <TileLayer
          attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        <MapController route={activeRoute} />

        {allCities.map((city, idx) => {
          // 1. Check if this city should be shown
          // Show IF (No route is active) OR (City name is in the active route's list)
          const isVisible = !activeRoute || activeRoute.cityNames.includes(city.name);

          // 2. If not visible, return NULL so the marker doesn't render at all
          if (!isVisible) return null;

          return (
            <Marker key={idx} position={city.coords}>
              <Tooltip 
                permanent 
                direction="bottom" 
                offset={[0, 10]} 
                className="font-bold text-xs bg-transparent border-0 shadow-none text-black"
              >
                {city.name}
              </Tooltip>
            </Marker>
          )
        })}

        {activeRoute && (
          <Polyline 
            positions={activeRoute.path} 
            pathOptions={{ 
              color: activeRoute.color || 'blue', 
              weight: 4, 
              opacity: 0.8, 
              dashArray: "10 5" 
            }} 
          />
        )}
      </MapContainer>
    </div>
  )
}