"use client";

import { AlertCircle } from "lucide-react";

interface ErrorAlertProps {
    error: string | null;
}

export function ErrorAlert({ error }: ErrorAlertProps) {
    if (!error) return null;

    return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 m-4">
            <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-red-700 dark:text-red-300 font-medium">Error</p>
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
            </div>
        </div>
    );
}
