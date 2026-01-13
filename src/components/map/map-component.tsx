"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix leaflet icons
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

// Component to handle map clicks
function LocationMarker({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null)
    const map = useMapEvents({
        click(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
            onLocationSelect?.(e.latlng.lat, e.latlng.lng)
        },
        locationfound(e) {
            setPosition(e.latlng)
            map.flyTo(e.latlng, map.getZoom())
            onLocationSelect?.(e.latlng.lat, e.latlng.lng)
        },
    })

    useEffect(() => {
        // Try to locate user on mount if needed, or trigger via button
        // map.locate() 
    }, [map])

    return position === null ? null : (
        <Marker position={position} icon={defaultIcon}>
            <Popup>Point de livraison sélectionné</Popup>
        </Marker>
    )
}

interface MapComponentProps {
    center?: [number, number]
    zoom?: number
    markers?: Array<{ lat: number; lng: number; description?: string }>
    onLocationSelect?: (lat: number, lng: number) => void
    readOnly?: boolean
    className?: string
}

const ComorosCenter: [number, number] = [-11.7172, 43.2473] // Moroni

export default function MapComponent({
    center = ComorosCenter,
    zoom = 13,
    markers,
    onLocationSelect,
    readOnly = false,
    className
}: MapComponentProps) {

    return (
        <div className={className || "h-full w-full"}>
            <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: "100%", width: "100%", zIndex: 0 }}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {!readOnly && <LocationMarker onLocationSelect={onLocationSelect} />}

                {markers?.map((m, i) => (
                    <Marker key={i} position={[m.lat, m.lng]} icon={defaultIcon}>
                        {m.description && <Popup>{m.description}</Popup>}
                    </Marker>
                ))}
            </MapContainer>
        </div>
    )
}
