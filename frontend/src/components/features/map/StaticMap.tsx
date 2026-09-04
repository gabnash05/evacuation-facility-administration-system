// components/map/StaticMap.tsx
"use client";

import { useEffect, useRef } from "react";
import MonoMap from "./MonoMap";

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

    // Disable map interactions
    useEffect(() => {
        if (mapContainerRef.current) {
            const disableInteractions = () => {
                // Disable zoom controls
                const zoomControls =
                    mapContainerRef.current?.querySelector(".leaflet-control-zoom");
                if (zoomControls) {
                    zoomControls.setAttribute("style", "pointer-events: none; opacity: 0.5;");
                }

                // Disable map dragging
                const map = mapContainerRef.current?.querySelector(".leaflet-container");
                if (map) {
                    map.classList.add("leaflet-container--static");
                }

                // Disable marker clicks
                const markers = mapContainerRef.current?.querySelectorAll(".custom-marker");
                markers?.forEach(marker => {
                    marker.setAttribute("style", "pointer-events: none; cursor: default;");
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
                centers={markers}
                onCenterClick={handleCenterClick}
                className="static-map" // Add custom class for styling
            />
        </div>
    );
}
