"use client"

import { signOut } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        await signOut({
            fetchOptions: {
                onSuccess: () => {
                    toast.success("Déconnexion réussie")
                    router.push("/login")
                    router.refresh()
                },
            },
        })
    }

    return (
        <Button
            variant="outline"
            className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
        >
            <LogOut className="h-4 w-4" />
            Se déconnecter
        </Button>
    )
}
