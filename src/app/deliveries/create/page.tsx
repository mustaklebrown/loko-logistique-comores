"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Map } from "@/components/map"
import { CreateDeliveryForm } from "@/components/delivery/create-delivery-form"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/layout"

export default function CreateDeliveryPage() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)

    return (
        <div className="min-h-screen bg-background">
            {/* Custom Header */}
            <header className="absolute top-0 left-0 right-0 z-20 p-4">
                <div className="mx-auto flex max-w-lg items-center gap-3">
                    <Link href="/">
                        <Button variant="secondary" size="icon" className="shadow-lg bg-background/80 backdrop-blur-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex-1 text-center">
                        <h1 className="text-sm font-semibold bg-background/80 backdrop-blur-xl inline-block px-4 py-2 rounded-full shadow-lg">
                            Nouvelle livraison
                        </h1>
                    </div>
                    <div className="w-9" /> {/* Spacer for alignment */}
                </div>
            </header>

            {/* Map */}
            <div className="absolute inset-0 z-0">
                <Map
                    onLocationSelect={(lat, lng) => setLocation({ lat, lng })}
                    markers={location ? [{ lat: location.lat, lng: location.lng }] : []}
                />
            </div>

            {/* Form Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-20 bg-linear-to-t from-background via-background/95 to-transparent">
                <div className="max-w-md mx-auto">
                    <CreateDeliveryForm location={location} />
                </div>
            </div>

            <BottomNav />
        </div>
    )
}

