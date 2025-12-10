"use client";

import { Eye, EyeOff, Map, Image } from "lucide-react";
import MonoMap from "../map/MonoMap"
import type { EvacuationCenter } from "@/types/center";

interface SelectedCenter {
    name: string;
    address: string;
    status: "active" | "inactive" | "closed";
    capacity: number;
    current_occupancy: number;
    latitude?: number;
    longitude?: number;
}

interface MapPanelProps {
    isPanelVisible: boolean;
    setIsPanelVisible: (visible: boolean) => void;
    selectedCenter: SelectedCenter;
    isLoadingCenter: boolean;
    getCenterStatusStyles: (status: string) => string;
    getUsageColor: (percentage: number) => string;
    centers?: EvacuationCenter[];
    highlightCenterId?: number;
}

export function MapPanel({
    isPanelVisible,
    setIsPanelVisible,
    selectedCenter,
    isLoadingCenter,
    getCenterStatusStyles,
    getUsageColor,
    centers = [],
    highlightCenterId,
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

    // Filter out centers with invalid coordinates
    const validCenters = centers.filter(center => 
        center.latitude != null && 
        center.longitude != null &&
        !isNaN(center.latitude) && 
        !isNaN(center.longitude) &&
        Math.abs(center.latitude) <= 90 &&
        Math.abs(center.longitude) <= 180
    );

    // Format centers for MonoMap
    const formattedCenters = validCenters.map(center => ({
        id: center.center_id,
        name: center.center_name,
        position: [center.latitude, center.longitude] as [number, number],
        currentCapacity: center.current_occupancy,
        maxCapacity: center.capacity,
        address: center.address,
        contact: "",
    }));

    // Set map center to the admin's assigned center or first center or default
    const adminCenter = validCenters.find(center => center.center_id === highlightCenterId);
    const mapCenter: [number, number] = adminCenter 
        ? [adminCenter.latitude, adminCenter.longitude]
        : validCenters.length > 0 
            ? [validCenters[0].latitude, validCenters[0].longitude]
            : [8.230205, 124.249607];

    return (
        <div className="relative w-full h-[50vh] border-b border-border flex">
            {/* Map - Takes up most of the space */}
            <div className={`${isPanelVisible ? "flex-1" : "w-full"} rounded-lg overflow-hidden z-0`}>
                <MonoMap 
                    centers={formattedCenters}
                    center={mapCenter}
                    onCenterClick={(id) => {
                        // Optional: Handle marker click if needed
                        console.log("Marker clicked:", id);
                    }}
                    highlightCenterId={highlightCenterId}
                />
            </div>

            {/* Right Info Panel - Narrower */}
            {isPanelVisible && (
                <div className="w-[350px] bg-card border-l border-border flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoadingCenter ? (
                            <div className="space-y-4">
                                <div className="animate-pulse">
                                    <div className="h-40 bg-muted rounded-lg mb-4" />
                                    <div className="h-8 bg-muted rounded w-3/4 mb-4" />
                                    <div className="h-10 bg-muted rounded mb-2" />
                                    <div className="h-10 bg-muted rounded" />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Blank Photo Placeholder */}
                                <div className="relative">
                                    <div className="w-full h-35 bg-muted rounded-lg flex flex-col items-center justify-center">
                                        <Image className="h-12 w-12 text-muted-foreground/60 mb-2" />
                                        <span className="text-sm text-muted-foreground">
                                            Center Photo
                                        </span>
                                        <span className="text-xs text-muted-foreground/60 mt-1">
                                            
                                        </span>
                                    </div>
                                </div>

                                {/* Center Name */}
                                <div className="mb-3">
                                    <h2
                                        className="text-xl font-semibold text-foreground leading-tight line-clamp-2"
                                        title={selectedCenter.name}
                                    >
                                        {selectedCenter.name}
                                    </h2>
                                </div>

                                {/* Address and Status Section */}
                                <div className="space-y-3">
                                    {selectedCenter.address ? (
                                        <>
                                            {/* Address Field */}
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Address
                                                </p>
                                                <div className="border border-border rounded-lg px-3 py-2 bg-background">
                                                    <div className="flex items-start gap-2">
                                                        <Map className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                                        <p
                                                            className="text-sm font-medium line-clamp-3"
                                                            title={selectedCenter.address}
                                                        >
                                                            {selectedCenter.address}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Status Field */}
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-1">
                                                    Status
                                                </p>
                                                <div
                                                    className={`rounded-lg px-3 py-2 text-sm font-medium w-full text-center border ${getCenterStatusStyles(selectedCenter.status)}`}
                                                >
                                                    {formatStatus(selectedCenter.status)}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* No Address - Just Status */
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Status
                                            </p>
                                            <div
                                                className={`rounded-lg px-3 py-2 text-sm font-medium w-full text-center border ${getCenterStatusStyles(selectedCenter.status)}`}
                                            >
                                                {formatStatus(selectedCenter.status)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}