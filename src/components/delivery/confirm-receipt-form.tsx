
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckCircle2, Loader2, Key } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { confirmReceiptSchema } from "@/lib/schemas"
import { confirmReceipt } from "@/app/actions/delivery"

interface ConfirmReceiptFormProps {
    deliveryId: string
    isConfirmed?: boolean
}

export function ConfirmReceiptForm({ deliveryId, isConfirmed = false }: ConfirmReceiptFormProps) {
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm<z.infer<typeof confirmReceiptSchema>>({
        resolver: zodResolver(confirmReceiptSchema),
        defaultValues: {
            deliveryId,
            otp: "",
        },
    })

    async function onSubmit(values: z.infer<typeof confirmReceiptSchema>) {
        setIsLoading(true)
        try {
            const result = await confirmReceipt(values)
            if (result.success) {
                toast.success("Réception confirmée !")
            } else {
                toast.error(result.error || "Une erreur est survenue")
            }
        } catch (error) {
            toast.error("Erreur lors de la confirmation")
        } finally {
            setIsLoading(false)
        }
    }

    if (isConfirmed) {
        return (
            <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="pt-6">
                    <div className="flex flex-col items-center text-center gap-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        <h3 className="font-bold text-emerald-900">Vous avez confirmé la réception</h3>
                        <p className="text-sm text-emerald-700">Merci de votre confiance !</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    Confirmer la Réception
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Le coursier doit vous donner un code de vérification. Entrez-le ici pour confirmer que vous avez bien reçu votre colis.
                </p>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            {...form.register("otp")}
                            placeholder="Code coursier (4 chiffres)"
                            className="bg-background text-center text-lg font-mono tracking-widest"
                            maxLength={4}
                            required
                        />
                        <Button type="submit" disabled={isLoading} className="shrink-0">
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
