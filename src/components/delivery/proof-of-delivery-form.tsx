"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { submitProof } from "@/app/actions/delivery"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Camera, MapPin } from "lucide-react"

interface ProofOfDeliveryFormProps {
    deliveryId: string
}

export function ProofOfDeliveryForm({ deliveryId }: ProofOfDeliveryFormProps) {
    const [isPending, setIsPending] = useState(false)
    const [otp, setOtp] = useState("")
    const [isGettingLocation, setIsGettingLocation] = useState(false)
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
    const router = useRouter()

    useEffect(() => {
        handleGetLocation()
    }, [])

    async function handleGetLocation() {
        setIsGettingLocation(true)
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                })
            })
            setLocation({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            })
            toast.success("Position GPS capturée !")
        } catch (err) {
            toast.error("Impossible d'obtenir la position GPS")
        } finally {
            setIsGettingLocation(false)
        }
    }

    async function handleSubmit() {
        if (!location) {
            toast.error("Veuillez capturer votre position GPS")
            return
        }

        if (!otp || otp.length < 4) {
            toast.error("Veuillez entrer le code de confirmation complet")
            return
        }

        setIsPending(true)
        try {
            const result = await submitProof({
                deliveryId,
                otp: otp || undefined,
                latitude: location.lat,
                longitude: location.lng,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Livraison confirmée !")
                router.refresh()
                router.push("/dashboard")
            }
        } catch (err) {
            toast.error("Une erreur est survenue")
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Confirmer la livraison
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* GPS Location */}
                <div className="space-y-2">
                    <Label>Position GPS</Label>
                    {location ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{location.lat.toFixed(6)}, {location.lng.toFixed(6)}</span>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleGetLocation}
                            disabled={isGettingLocation}
                            className="w-full gap-2"
                        >
                            {isGettingLocation ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <MapPin className="h-4 w-4" />
                            )}
                            Capturer ma position
                        </Button>
                    )}
                </div>

                {/* OTP Code (Required) */}
                <div className="space-y-2">
                    <Label htmlFor="otp">Code de confirmation (Requis)</Label>
                    <Input
                        id="otp"
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        placeholder="Ex: 1234"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={4}
                        className="text-center text-lg tracking-widest font-mono"
                    />
                </div>

                {/* Photo capture placeholder */}
                <Button variant="outline" className="w-full gap-2" disabled>
                    <Camera className="h-4 w-4" />
                    Prendre une photo (bientôt)
                </Button>

                {/* Submit */}
                <Button
                    onClick={handleSubmit}
                    disabled={isPending || !location}
                    className="w-full h-12 text-base gap-2"
                >
                    {isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : !location ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            <span className="text-muted-foreground">Localisation requise...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="h-5 w-5" />
                            Confirmer la livraison
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
