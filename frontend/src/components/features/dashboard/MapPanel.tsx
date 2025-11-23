"use client";

import { Eye, EyeOff, Map } from "lucide-react";

interface SelectedCenter {
    name: string;
    address: string;
    status: "active" | "inactive" | "closed";
    capacity: number;
    current_occupancy: number;
}

interface MapPanelProps {
    isPanelVisible: boolean;
    setIsPanelVisible: (visible: boolean) => void;
    selectedCenter: SelectedCenter;
    isLoadingCenter: boolean;
    getCenterStatusStyles: (status: string) => string;
    getUsageColor: (percentage: number) => string;
}

export function MapPanel({
    isPanelVisible,
    setIsPanelVisible,
    selectedCenter,
    isLoadingCenter,
    getCenterStatusStyles,
    getUsageColor,
}: MapPanelProps) {
    const usagePercentage =
        selectedCenter.capacity > 0
            ? Math.round((selectedCenter.current_occupancy / selectedCenter.capacity) * 100)
            : 0;

    const formatStatus = (status: string) => {
        switch (status) {
            case "active":
                return "Active";
            case "inactive":
                return "Inactive";
            case "closed":
                return "Closed";
            default:
                return status;
        }
    };

    return (
        <div className="relative w-full h-[43vh] border-b border-border flex">
            {/* Map Placeholder */}
            <div className="flex-1 bg-muted/30 flex items-center justify-center text-muted-foreground">
                <p>Map Placeholder</p>
            </div>

            {/* Right Info Panel */}
            {isPanelVisible && (
                <div className="w-[500px] bg-card border-l border-border">
                    {isLoadingCenter ? (
                        <div className="p-6 space-y-4">
                            <div className="animate-pulse">
                                <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                                <div className="h-10 bg-muted rounded mb-2" />
                                <div className="h-10 bg-muted rounded" />
                            </div>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="flex items-start gap-4 mb-5">
                                <div className="flex-1">
                                    <h2
                                        className="text-3xl font-semibold text-foreground leading-tight line-clamp-3"
                                        title={selectedCenter.name}
                                    >
                                        {selectedCenter.name}
                                    </h2>
                                </div>
                                {/* Blank photo placeholder */}
                                <div className="w-40 h-28 bg-muted rounded-lg" />
                            </div>

                            <div className="space-y-4">
                                {/* Conditional Address Row - Only show if address exists */}
                                {selectedCenter.address ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-48 flex-none">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Address
                                            </p>
                                            <div className="border border-border rounded-lg px-3 py-2 bg-background flex items-center justify-between">
                                                <p
                                                    className="text-sm font-medium truncate"
                                                    title={selectedCenter.address}
                                                >
                                                    {selectedCenter.address}
                                                </p>
                                                <Map className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                            </div>
                                        </div>
                                        <div className="w-40 flex-none">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Status
                                            </p>
                                            <div
                                                className={`rounded-lg px-3 py-2 text-sm font-medium h-auto w-full text-center border ${getCenterStatusStyles(selectedCenter.status)}`}
                                            >
                                                {formatStatus(selectedCenter.status)}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* No Address - Just Status */
                                    <div className="flex items-center gap-3">
                                        <div className="w-40 flex-none">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Status
                                            </p>
                                            <div
                                                className={`rounded-lg px-3 py-2 text-sm font-medium h-auto w-full text-center border ${getCenterStatusStyles(selectedCenter.status)}`}
                                            >
                                                {formatStatus(selectedCenter.status)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Capacity, Current, Usage, and Hide Button Row */}
                                <div className="flex items-center gap-3">
                                    <div className="w-30">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Capacity
                                        </p>
                                        <div className="border border-border rounded-lg px-3 py-2 bg-background">
                                            <p className="text-sm font-medium">
                                                {selectedCenter.capacity.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-30">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            Current Occupancy
                                        </p>
                                        <div className="border border-border rounded-lg px-3 py-2 bg-background">
                                            <p className="text-sm font-medium">
                                                {selectedCenter.current_occupancy.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-20">
                                        <p className="text-xs text-muted-foreground mb-1">Usage</p>
                                        <div
                                            className={`border border-border rounded-lg px-3 py-2 text-center ${getUsageColor(usagePercentage)}`}
                                        >
                                            <p className="text-sm font-semibold text-white">
                                                {usagePercentage}%
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-16">
                                        <p className="text-xs text-muted-foreground mb-1 opacity-0">
                                            Hide
                                        </p>
                                        <button
                                            onClick={() => setIsPanelVisible(false)}
                                            className="border border-border rounded-lg px-3 py-2 bg-background hover:bg-muted transition-colors w-full flex items-center justify-center"
                                            aria-label="Hide evacuation center information panel"
                                            title="Hide panel"
                                        >
                                            <EyeOff className="h-5 w-5 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Show Panel Button (when hidden) */}
            {!isPanelVisible && (
                <button
                    onClick={() => setIsPanelVisible(true)}
                    className="absolute top-4 right-4 bg-card border border-border rounded-lg px-3 py-2 shadow-md hover:bg-muted transition-colors z-10"
                    aria-label="Show evacuation center information panel"
                    title="Show panel"
                >
                    <Eye className="h-5 w-5 text-muted-foreground" />
                </button>
            )}
        </div>
    );
}
