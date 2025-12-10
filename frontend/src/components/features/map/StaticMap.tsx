// components/map/StaticMap.tsx
"use client";

import { useEffect, useRef } from "react";
import MonoMap from "./MonoMap";
import type { EvacuationCenter } from "@/types/center";

interface StaticMapProps {
    center?: [number, number];
    zoom?: number;
    markers?: Array<{
        id: number;
        name: string;
        position: [number, number];
        currentCapacity: number;
        maxCapacity: number;
        address: string;
        contact: string;
    }>;
}

export function StaticMap({ 
    center = [8.230205, 124.249607], 
    zoom = 13,
    markers = [],
}: StaticMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);

    // Generate mock centers if none provided
    // const mockCenters = markers.length > 0 ? markers : [
    //     { 
    //         id: 1, 
    //         name: "", 
    //         position: [8.231, 124.248] as [number, number], 
    //         currentCapacity: 120, 
    //         maxCapacity: 200,
    //         address: "123 Main St",
    //         contact: "N/A"
    //     },
    //     { 
    //         id: 3, 
    //         name: "", 
    //         position: [8.215, 124.260] as [number, number], 
    //         currentCapacity: 45, 
    //         maxCapacity: 100,
    //         address: "789 West Rd",
    //         contact: "N/A"
    //     },
    //     { 
    //         id: 5, 
    //         name: "", 
    //         position: [8.210, 124.240] as [number, number], 
    //         currentCapacity: 60, 
    //         maxCapacity: 80,
    //         address: "202 South Blvd",
    //         contact: "N/A"
    //     },
    // ];
    
    const mockCenters = [{
        id: 1, 
        name: "", 
        position: [0, 0] as [number, number], 
        currentCapacity: 120, 
        maxCapacity: 200,
        address: "123 Main St",
        contact: "N/A"
    }]

    // Disable map interactions
    useEffect(() => {
        if (mapContainerRef.current) {
            const disableInteractions = () => {
                // Disable zoom controls
                const zoomControls = mapContainerRef.current?.querySelector('.leaflet-control-zoom');
                if (zoomControls) {
                    zoomControls.setAttribute('style', 'pointer-events: none; opacity: 0.5;');
                }

                // Disable map dragging
                const map = mapContainerRef.current?.querySelector('.leaflet-container');
                if (map) {
                    map.classList.add('leaflet-container--static');
                }

                // Disable marker clicks
                const markers = mapContainerRef.current?.querySelectorAll('.custom-marker');
                markers?.forEach(marker => {
                    marker.setAttribute('style', 'pointer-events: none; cursor: default;');
                });
            };

            // Wait for map to load, then disable interactions
            setTimeout(disableInteractions, 100);
        }
    }, []);

    const handleCenterClick = () => {
        // Do nothing - map is non-interactive
        return;
    };

    return (
        <div ref={mapContainerRef} className="relative w-full h-full">
            <MonoMap 
                center={center}
                zoom={zoom}
                onCenterClick={handleCenterClick}
                className="static-map" // Add custom class for styling
            />
        </div>
    );
}