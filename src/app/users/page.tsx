import { getAllUsers } from "@/app/actions/users"
import { Header, BottomNav } from "@/components/layout"
import { UsersList } from "@/components/dashboard"
import { Card } from "@/components/ui/card"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth-server"

export default async function UsersManagementPage() {
    const session = await getSession()
    if (session?.user?.role !== 'admin') {
        redirect('/dashboard')
    }

    const result = await getAllUsers()
    const users = result.success ? result.users : []

    return (
        <div className="min-h-screen bg-background pb-20">
            <Header title="Utilisateurs" />
            <main className="max-w-lg mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Gestion des Utilisateurs</h1>
                    <p className="text-muted-foreground mt-1">Gérez les rôles et permissions des utilisateurs</p>
                </div>

                <Card className="bg-card border-border shadow-sm overflow-hidden">
                    <UsersList users={users} />
                </Card>
            </main>
            <BottomNav />
        </div>
    )
}
