"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading?: boolean;
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    loading = false,
}: ConfirmationDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                            <div className="bg-blue-100 p-2 rounded-full dark:bg-blue-900/20">
                                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                            </div>
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                {title}
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                {message}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                        className="mt-2 sm:mt-0"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}