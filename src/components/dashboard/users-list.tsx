"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateUserRole } from "@/app/actions/users"
import { toast } from "sonner"
import Image from "next/image"

interface UsersListProps {
    users: any[]
}

export function UsersList({ users: initialUsers }: UsersListProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
    const [users, setUsers] = useState(initialUsers)

    const filteredUsers = users.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        setIsUpdating(true)
        const res = await updateUserRole(userId, newRole)
        if (res.success) {
            toast.success("Rôle mis à jour")
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
        } else {
            toast.error(res.error || "Erreur lors de la mise à jour")
        }
        setIsUpdating(false)
    }

    return (
        <div className="flex flex-col">
            <div className="p-4 border-b border-border bg-muted/30">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un utilisateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background border-input text-foreground h-10"
                    />
                </div>
            </div>

            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((u: any, index: number) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.05 * index }}
                            className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden border border-primary/20 relative">
                                    {u.image ? (
                                        <Image src={u.image} alt={u.name || "User Avatar"} fill className="object-cover" />
                                    ) : (
                                        u.name?.charAt(0).toUpperCase() || "U"
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground truncate">{u.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Select
                                    defaultValue={u.role || "client"}
                                    onValueChange={(val) => handleRoleUpdate(u.id, val)}
                                    disabled={isUpdating}
                                >
                                    <SelectTrigger className="w-[100px] h-8 text-[11px] font-medium bg-background border-input">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="client">Client</SelectItem>
                                        <SelectItem value="courier">Coursier</SelectItem>
                                        <SelectItem value="seller">Vendeur</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="p-12 text-center text-muted-foreground">
                        Aucun utilisateur trouvé
                    </div>
                )}
            </div>
        </div>
    )
}
