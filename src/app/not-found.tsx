import Link from "next/link"
import { Home, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
                <AlertCircle className="h-12 w-12 text-primary" />
            </div>

            <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                404
            </h1>
            <h2 className="mb-4 text-xl font-semibold text-foreground">
                Page Non Trouvée
            </h2>
            <p className="mb-8 max-w-md text-muted-foreground">
                Désolé, nous ne parvenons pas à trouver la page que vous recherchez. Elle a peut-être été déplacée ou supprimée.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/">
                    <Button className="h-12 gap-2 px-8 text-base">
                        <Home className="h-5 w-5" />
                        Retour à l'accueil
                    </Button>
                </Link>
                <Link href="/dashboard">
                    <Button variant="outline" className="h-12 gap-2 px-8 text-base">
                        <ArrowLeft className="h-5 w-5" />
                        Tableau de bord
                    </Button>
                </Link>
            </div>

            <div className="mt-16 text-sm text-muted-foreground font-medium">
                Loko Logistics &bull; Service de Livraison
            </div>
        </div>
    )
}
