"use client";

import { useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeProvider";

interface SuccessToastProps {
    isOpen: boolean;
    message: string;
    duration?: number;
    onClose: () => void;
}

export function SuccessToast({ 
    isOpen, 
    message, 
    duration = 2000,
    onClose
}: SuccessToastProps) {
    const { theme } = useTheme();

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, duration, onClose]);

    if (!isOpen) return null;

    // Theme-based styling
    const getToastStyles = () => {
        const baseStyles = "fixed top-4 right-4 z-[100] animate-in slide-in-from-right-full duration-300 rounded-lg shadow-lg p-4 max-w-sm";
        
        if (theme === "dark") {
            return cn(
                baseStyles,
                "bg-green-900/80 border border-green-700 text-green-100 backdrop-blur-sm"
            );
        } else {
            return cn(
                baseStyles,
                "bg-green-50 border border-green-200 text-green-800"
            );
        }
    };

    const getIconColor = () => {
        return theme === "dark" ? "text-green-300" : "text-green-600";
    };

    const getTextColor = () => {
        return theme === "dark" ? "text-green-100" : "text-green-800";
    };

    return (
        <div className={getToastStyles()}>
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    <CheckCircle className={cn("h-5 w-5", getIconColor())} />
                </div>
                <div className="flex-1">
                    <p className={cn("text-sm font-medium", getTextColor())}>
                        {message}
                    </p>
                </div>
            </div>
        </div>
    );
}