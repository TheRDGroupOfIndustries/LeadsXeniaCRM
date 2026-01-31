"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "danger" | "warning" | "info";
    loading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "danger",
    loading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            icon: "bg-red-500/20 border-red-400/30 text-red-400",
            button: "bg-red-600 hover:bg-red-700 text-white",
            iconColor: "text-red-400"
        },
        warning: {
            icon: "bg-yellow-500/20 border-yellow-400/30 text-yellow-400",
            button: "bg-yellow-600 hover:bg-yellow-700 text-white",
            iconColor: "text-yellow-400"
        },
        info: {
            icon: "bg-blue-500/20 border-blue-400/30 text-blue-400",
            button: "bg-blue-600 hover:bg-blue-700 text-white",
            iconColor: "text-blue-400"
        }
    };

    const styles = variantStyles[variant];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="p-6 text-center">
                    {/* Icon */}
                    <div className={`mx-auto w-16 h-16 rounded-full border ${styles.icon} flex items-center justify-center mb-4`}>
                        <AlertTriangle className={`h-8 w-8 ${styles.iconColor}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {title}
                    </h3>

                    {/* Message */}
                    <p className="text-zinc-400 text-sm mb-6">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            className={`flex-1 ${styles.button}`}
                            onClick={onConfirm}
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                confirmText
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
