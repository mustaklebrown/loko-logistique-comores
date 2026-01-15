
"use client"

import { useOffline } from "@/hooks/use-offline";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineAlert() {
    const isOffline = useOffline();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="fixed top-0 left-0 right-0 z-100 bg-destructive text-destructive-foreground py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium shadow-lg"
                >
                    <WifiOff className="h-4 w-4" />
                    <span>Mode hors ligne - Les données affichées peuvent être anciennes.</span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
