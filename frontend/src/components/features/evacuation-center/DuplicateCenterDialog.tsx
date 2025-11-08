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

interface DuplicateCenterDialogProps {
    isOpen: boolean;
    onClose: () => void;
    centerName: string;
}

export function DuplicateCenterDialog({ isOpen, onClose, centerName }: DuplicateCenterDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <div className="flex-shrink-0">
                            <div className="bg-yellow-100 p-2 rounded-full dark:bg-yellow-900/20">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                            </div>
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-semibold">
                                Duplicate Center Name
                            </DialogTitle>
                            <DialogDescription className="mt-1">
                                This center already exists.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p className="text-sm text-muted-foreground">
                        An evacuation center with the name{" "}
                        <strong className="font-semibold text-foreground">"{centerName}"</strong>{" "}
                        already exists in the system.
                    </p>
                </div>

                <DialogFooter>
                    <Button type="button" onClick={onClose} className="mt-2 sm:mt-0">
                        OK
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
