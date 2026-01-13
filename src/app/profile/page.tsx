
import { LogoutButton } from "@/components/auth/logout-button"
import { getUserLogs } from "@/app/actions/users"
import { ProfileTabs } from "@/components/profile/profile-tabs"
import { getSession } from "@/lib/auth-server"
import { BottomNav, Header } from "@/components/layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LogIn } from "lucide-react"
import Link from "next/link"
import { getSavedAddresses } from "@/app/actions/saved-addresses"

export default async function ProfilePage() {
    const session = await getSession()
    const [logsResult, addressesResult] = await Promise.all([
        session ? getUserLogs() : { logs: [] },
        session ? getSavedAddresses() : { addresses: [] }
    ])

    const logs = logsResult.logs || []
    const savedAddresses = (addressesResult as any).success ? (addressesResult as any).addresses : []

    return (
        <div className="min-h-screen bg-background pb-24">
            <Header title="Profil" />

            <main className="mx-auto max-w-lg px-4 py-4 space-y-6">
                {/* Profile Header */}
                {session ? (
                    <>
                        <Card className="border-none shadow-none bg-transparent">
                            <div className="flex flex-col items-center gap-4 text-center">
                                {session.user.image ? (
                                    <img
                                        src={session.user.image}
                                        alt={session.user.name || "User"}
                                        className="h-24 w-24 rounded-full object-cover bg-muted ring-4 ring-background shadow-lg"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-3xl font-bold ring-4 ring-background shadow-lg">
                                        {session.user.name?.charAt(0).toUpperCase() || "U"}
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold">{session.user.name || "Utilisateur"}</h2>
                                    <p className="text-sm text-muted-foreground">{session.user.email}</p>
                                    <div className="mt-2 flex justify-center gap-2">
                                        <span className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full capitalize border border-primary/20">
                                            {session.user.role || "Client"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Tabs for Edit, History, Settings, FAQ */}
                        <ProfileTabs user={session.user} logs={logs} savedAddresses={savedAddresses} />

                        {/* Logout */}
                        <div className="pt-4">
                            <LogoutButton />
                        </div>
                    </>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Non connecté</CardTitle>
                            <CardDescription>
                                Connectez-vous pour accéder à votre profil et gérer vos livraisons.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Link href="/login">
                                <Button className="w-full gap-2">
                                    <LogIn className="h-4 w-4" />
                                    Se connecter / S'inscrire
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}

                {/* Version */}
                <p className="text-center text-xs text-muted-foreground pt-4">
                    Loko v1.0.0 • © 2026 Loko Comores
                </p>
            </main>

            <BottomNav />
        </div>
    )
}
