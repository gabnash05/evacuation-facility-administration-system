"use client";

import { useEffect } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/common/ThemeProvider";

interface SuccessToastProps {
    isOpen: boolean;
    message: string;
    duration?: number;
    onClose: () => void;
}

/**
 * Heuristic to decide whether a message should be treated as an error.
 * Matches common error words/phrases (case-insensitive).
 */
function isErrorMessage(message: string | undefined | null) {
    if (!message) return false;
    const s = message.toLowerCase();
    return /failed|failure|error|invalid|cannot|unable|unauthorized|forbidden|not found|exception|unable to|could not/i.test(
        s
    );
}

export function SuccessToast({ isOpen, message, duration = 2000, onClose }: SuccessToastProps) {
    const { theme } = useTheme();

    // Use a slightly longer duration for error messages so users can read them
    const computedDuration = isErrorMessage(message) ? Math.max(duration, 4000) : duration;

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, computedDuration);
            return () => clearTimeout(timer);
        }
    }, [isOpen, computedDuration, onClose]);

    if (!isOpen) return null;

    const error = isErrorMessage(message);

    // Theme-based styling, separating success vs error
    const getToastStyles = () => {
        const baseStyles =
            "fixed top-4 right-4 z-[100] animate-in slide-in-from-right-full duration-300 rounded-lg shadow-lg p-4 max-w-sm";

        if (error) {
            // Error / destructive styles
            if (theme === "dark") {
                return cn(baseStyles, "bg-red-900/80 border border-red-700 text-red-100 backdrop-blur-sm");
            } else {
                return cn(baseStyles, "bg-red-50 border border-red-200 text-red-800");
            }
        } else {
            // Success styles (existing)
            if (theme === "dark") {
                return cn(baseStyles, "bg-green-900/80 border border-green-700 text-green-100 backdrop-blur-sm");
            } else {
                return cn(baseStyles, "bg-green-50 border border-green-200 text-green-800");
            }
        }
    };

    const getIconColor = () => {
        if (error) {
            return theme === "dark" ? "text-red-300" : "text-red-600";
        }
        return theme === "dark" ? "text-green-300" : "text-green-600";
    };

    const getTextColor = () => {
        if (error) {
            return theme === "dark" ? "text-red-100" : "text-red-800";
        }
        return theme === "dark" ? "text-green-100" : "text-green-800";
    };

    return (
        <div className={getToastStyles()} role={error ? "alert" : "status"} aria-live="polite">
            <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                    {error ? (
                        <AlertCircle className={cn("h-5 w-5", getIconColor())} />
                    ) : (
                        <CheckCircle className={cn("h-5 w-5", getIconColor())} />
                    )}
                </div>
                <div className="flex-1">
                    <p className={cn("text-sm font-medium", getTextColor())}>{message}</p>
                </div>
            </div>
        </div>
    );
}