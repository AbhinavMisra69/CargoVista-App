"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect } from "react"
// IMPORT DATA FROM NEW FILE
import { City, NORTH_INDIA_CITIES } from "./cityData"

const iconUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapDisplayProps {
  allCities?: City[]
  activeRoute?: {
    pathNames: string[] 
    color: string
  }
}

function MapUpdater({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [50, 50] })
    }
  }, [bounds, map])
  return null
}

export default function MapDisplay({ allCities = NORTH_INDIA_CITIES, activeRoute }: MapDisplayProps) {
  let routeCoordinates: [number, number][] = []
  let bounds: L.LatLngBoundsExpression | null = null

  if (activeRoute && activeRoute.pathNames.length > 0) {
    routeCoordinates = activeRoute.pathNames
      .map(name => allCities.find(c => c.name === name)?.coords)
      .filter((coords): coords is [number, number] => coords !== undefined)

    if (routeCoordinates.length > 0) {
      const lats = routeCoordinates.map(c => c[0])
      const lngs = routeCoordinates.map(c => c[1])
      bounds = [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ]
    }
  } else {
    bounds = [ [25.0, 73.0], [32.0, 80.0] ]
  }

  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
      <MapContainer 
        center={[28.6139, 77.2090]} 
        zoom={6} 
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        {allCities.map((city) => (
          <Marker 
            key={city.id} 
            position={city.coords} 
            icon={defaultIcon}
            opacity={activeRoute?.pathNames.includes(city.name) ? 1 : 0.5} 
          >
            <Popup className="font-sans">
              <div className="text-sm font-bold">{city.name}</div>
              <div className="text-xs text-slate-500">ID: {city.id}</div>
            </Popup>
          </Marker>
        ))}
        {routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates} 
            pathOptions={{ color: activeRoute?.color || "blue", weight: 4, opacity: 0.8, dashArray: '10, 10' }} 
          />
        )}
        {bounds && <MapUpdater bounds={bounds} />}
      </MapContainer>
    </div>
  )
}