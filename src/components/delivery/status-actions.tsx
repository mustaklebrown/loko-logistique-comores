"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { updateStatus } from "@/app/actions/delivery"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Truck, MapPin, CheckCircle2, XCircle } from "lucide-react"

interface StatusActionsProps {
    deliveryId: string
    currentStatus: string
}

const statusFlow = [
    { status: "IN_TRANSIT", label: "Démarrer la livraison", icon: Truck },
    { status: "ARRIVED_ZONE", label: "Arrivé dans la zone", icon: MapPin },
]

export function StatusActions({ deliveryId, currentStatus }: StatusActionsProps) {
    const [isPending, setIsPending] = useState(false)
    const router = useRouter()

    async function handleStatusUpdate(newStatus: string) {
        setIsPending(true)
        try {
            const result = await updateStatus({
                deliveryId,
                status: newStatus as any,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Statut mis à jour !")
                router.refresh()
            }
        } catch (err) {
            toast.error("Une erreur est survenue")
        } finally {
            setIsPending(false)
        }
    }

    // Determine next valid statuses based on current status
    const getNextActions = () => {
        switch (currentStatus) {
            case "CREATED":
                return [] // Need courier assigned first
            case "ASSIGNED":
                return [{ status: "IN_TRANSIT", label: "Démarrer la livraison", icon: Truck }]
            case "IN_TRANSIT":
                return [{ status: "ARRIVED_ZONE", label: "Arrivé dans la zone", icon: MapPin }]
            case "ARRIVED_ZONE":
                return [] // Will use proof of delivery
            default:
                return []
        }
    }

    const actions = getNextActions()

    if (actions.length === 0) return null

    return (
        <div className="space-y-2">
            {actions.map((action) => {
                const Icon = action.icon
                return (
                    <Button
                        key={action.status}
                        onClick={() => handleStatusUpdate(action.status)}
                        disabled={isPending}
                        className="w-full h-12 text-base gap-2"
                    >
                        {isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Icon className="h-5 w-5" />
                                {action.label}
                            </>
                        )}
                    </Button>
                )
            })}
        </div>
    )
}
