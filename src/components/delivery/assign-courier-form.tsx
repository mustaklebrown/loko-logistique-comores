"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { assignCourier } from "@/app/actions/delivery"
import { getCouriers } from "@/app/actions/users"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"

interface AssignCourierFormProps {
    deliveryId: string
    currentUserId?: string
    userRole?: string
    isSeller?: boolean
}

type Courier = {
    id: string
    name: string | null
    email: string | null
    phone: string | null
}

export function AssignCourierForm({ deliveryId, currentUserId, userRole, isSeller }: AssignCourierFormProps) {
    const [isPending, setIsPending] = useState(false)
    const [couriers, setCouriers] = useState<Courier[]>([])
    const [selectedCourier, setSelectedCourier] = useState<string>("")
    const [isLoadingCouriers, setIsLoadingCouriers] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (userRole === 'courier') return; // Don't load list if acting as courier

        async function loadCouriers() {
            const result = await getCouriers()
            if (result.success && result.couriers) {
                setCouriers(result.couriers)
            }
            setIsLoadingCouriers(false)
        }
        loadCouriers()
    }, [userRole])

    async function handleAssign(courierIdToAssign?: string) {
        const id = courierIdToAssign || selectedCourier;
        if (!id) {
            toast.error("Veuillez sélectionner un coursier")
            return
        }

        setIsPending(true)
        try {
            const result = await assignCourier({
                deliveryId,
                courierId: id,
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(userRole === 'courier' ? "Course acceptée !" : "Coursier assigné !")
                router.refresh()
            }
        } catch (err) {
            toast.error("Une erreur est survenue")
        } finally {
            setIsPending(false)
        }
    }

    if (userRole === 'courier') {
        return (
            <Button
                onClick={() => handleAssign(currentUserId)}
                disabled={isPending}
                className="w-full gap-2"
                size="lg"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <User className="h-4 w-4" />
                        Accepter la course
                    </>
                )}
            </Button>
        )
    }

    if (isLoadingCouriers) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (couriers.length === 0) {
        return (
            <div className="text-center p-4 text-sm text-muted-foreground">
                Aucun coursier disponible.
                <br />
                <span className="text-xs">Ajoutez des utilisateurs avec le rôle COURIER.</span>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <Select value={selectedCourier} onValueChange={setSelectedCourier}>
                <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un coursier" />
                </SelectTrigger>
                <SelectContent>
                    {couriers.map((courier) => (
                        <SelectItem key={courier.id} value={courier.id}>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{courier.name || courier.email || "Coursier"}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Button
                onClick={() => handleAssign()}
                disabled={isPending || !selectedCourier}
                className="w-full"
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    isSeller ? "Confirmer & Assigner" : "Assigner le coursier"
                )}
            </Button>
        </div>
    )
}
