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
import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteHouseholdDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    householdName: string;
    loading?: boolean;
}

export function DeleteHouseholdDialog({
    isOpen,
    onClose,
    onConfirm,
    householdName,
    loading = false,
}: DeleteHouseholdDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                            <div className="bg-destructive/10 p-2 rounded-full">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                            </div>
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                Delete Household
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                This action cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        Are you sure you want to delete{" "}
                        <strong className="font-semibold text-foreground">"{householdName}"</strong>
                        ? This will also remove all individuals associated with this household.
                    </p>
                </div>

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
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
