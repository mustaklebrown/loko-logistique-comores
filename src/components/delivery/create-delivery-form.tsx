"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { createDeliverySchema, CreateDeliveryInput } from "@/lib/schemas"
import { createDelivery } from "@/app/actions/delivery"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"


import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface CreateDeliveryFormProps {
    location: { lat: number; lng: number } | null
}

export function CreateDeliveryForm({ location }: CreateDeliveryFormProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    const form = useForm<CreateDeliveryInput>({
        resolver: zodResolver(createDeliverySchema),
        defaultValues: {
            description: "",
            latitude: 0,
            longitude: 0,
        }
    })

    useEffect(() => {
        if (location) {
            form.setValue("latitude", location.lat)
            form.setValue("longitude", location.lng)
        }
    }, [location, form])

    async function onSubmit(data: CreateDeliveryInput) {
        if (!location) {
            toast.error("Veuillez sélectionner un emplacement")
            return
        }

        setIsPending(true)
        try {
            const payload = {
                ...data,
                latitude: location.lat,
                longitude: location.lng
            }

            const result = await createDelivery(payload)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Livraison créée avec succès !")
                router.push(`/deliveries/${result.deliveryId}`)
            }
        } catch (err) {
            toast.error("Une erreur est survenue")
        } finally {
            setIsPending(false)
        }
    }

    if (!location) {
        return (
            <Card className="w-full shadow-lg">
                <CardContent className="p-4 text-center text-muted-foreground">
                    <p>Tapez sur la carte pour placer le point de livraison</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full shadow-lg animate-in slide-in-from-bottom">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Nouvelle Livraison</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Textarea
                            placeholder="Description (ex: Portail bleu, près de la mosquée...)"
                            {...form.register("description")}
                        />
                        {form.formState.errors.description && (
                            <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        GPS: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </div>

                    <Button type="submit" className="w-full" disabled={isPending}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Créer la livraison"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
