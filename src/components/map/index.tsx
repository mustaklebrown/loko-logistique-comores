"use client"
import dynamic from "next/dynamic"

export const Map = dynamic(() => import("./map-component"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-muted-foreground">Chargement de la carte...</div>
})
