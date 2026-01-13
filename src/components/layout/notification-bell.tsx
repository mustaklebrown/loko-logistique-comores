"use client"

import { useEffect, useState, useCallback } from "react"
import { Bell, Check, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "@/app/actions/notifications"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import { fr } from "date-fns/locale"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

export function NotificationBell() {
    const router = useRouter()
    const [notifications, setNotifications] = useState<any[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isOpen, setIsOpen] = useState(false)

    const fetchNotifications = useCallback(async (showToast = false) => {
        // Skip fetch if page is hidden to save bandwidth
        if (document.visibilityState === 'hidden') return;

        const res = await getNotifications()
        if (res.success) {
            const newNotifications = res.notifications || []
            const newUnreadCount = res.unreadCount || 0

            // Show toast if unread count increased or new unread found
            if (showToast && newUnreadCount > unreadCount && newNotifications.length > 0) {
                const latest = newNotifications[0]
                if (!latest.isRead) {
                    toast(latest.title, {
                        description: latest.message,
                        action: latest.link ? {
                            label: "Voir",
                            onClick: () => router.push(latest.link!)
                        } : undefined
                    })
                }
            }

            setNotifications(newNotifications)
            setUnreadCount(newUnreadCount)
        }
    }, [unreadCount, router])

    useEffect(() => {
        fetchNotifications(false)
        // Poll every 30 seconds for new notifications (reduce frequency for low bandwidth)
        const interval = setInterval(() => fetchNotifications(true), 30000)
        return () => clearInterval(interval)
    }, [fetchNotifications])

    const handleMarkAsRead = async (id: string) => {
        const res = await markAsRead(id)
        if (res.success) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
    }

    const handleMarkAllAsRead = async () => {
        const res = await markAllAsRead()
        if (res.success) {
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            setUnreadCount(0)
        }
    }

    const handleDelete = async (id: string) => {
        const res = await deleteNotification(id)
        if (res.success) {
            const deleted = notifications.find(n => n.id === id)
            if (deleted && !deleted.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
            setNotifications(prev => prev.filter(n => n.id !== id))
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-sm">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md bg-background/95 backdrop-blur-md border-l border-border/50">
                <SheetHeader className="pb-4 border-b border-border/50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} className="text-xs h-8">
                                <Check className="h-3 w-3 mr-1" />
                                Tout lire
                            </Button>
                        )}
                    </div>
                    <SheetDescription>
                        Restez informé de l'état de vos livraisons.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "relative group p-4 rounded-xl border transition-all duration-200",
                                        notification.isRead
                                            ? "bg-muted/30 border-border/30 opacity-80"
                                            : "bg-card border-primary/20 shadow-sm ring-1 ring-primary/5"
                                    )}
                                >
                                    {!notification.isRead && (
                                        <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary" />
                                    )}

                                    <div className="flex flex-col gap-1">
                                        <h4 className="font-semibold text-sm text-foreground pr-4">
                                            {notification.title}
                                        </h4>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                                                {formatDistanceToNow(new Date(notification.createdAt), {
                                                    addSuffix: true,
                                                    locale: fr
                                                })}
                                            </span>

                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {notification.link && (
                                                    <Link href={notification.link} onClick={() => setIsOpen(false)}>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {!notification.isRead && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        className="h-7 w-7 rounded-lg hover:text-emerald-500"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(notification.id)}
                                                    className="h-7 w-7 rounded-lg hover:text-destructive"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <Bell className="h-12 w-12 mb-4" />
                            <p className="text-sm font-medium">Aucune notification pour le moment</p>
                        </div>
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
