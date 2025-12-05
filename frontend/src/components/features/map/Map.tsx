// components/map/MonoMap.tsx
import { useState } from "react";
import { MapContainer, TileLayer, Marker, ScaleControl, Tooltip } from "react-leaflet";
import { useTheme } from "@/components/common/ThemeProvider";
import "leaflet/dist/leaflet.css";
import "./map.css";

import L from "leaflet";

// Fix for default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/images/marker-icon-2x.png",
    iconUrl: "/leaflet/images/marker-icon.png",
    shadowUrl: "/leaflet/images/marker-shadow.png",
});

// Capacity-based color coding
const getCapacityColor = (currentCapacity: number, maxCapacity: number, isDark: boolean) => {
    const percentage = currentCapacity / maxCapacity;
    
    if (percentage >= 0.9) return isDark ? "#dc2626" : "#ef4444";
    if (percentage >= 0.7) return isDark ? "#ea580c" : "#f97316";
    if (percentage >= 0.5) return isDark ? "#ca8a04" : "#eab308";
    if (percentage >= 0.3) return isDark ? "#16a34a" : "#22c55e";
    return isDark ? "#059669" : "#10b981";
};

// Mock data
const MOCK_EVACUATION_CENTERS = [
    {
        id: 1,
        name: "Main Evacuation Center",
        position: [8.230205, 124.249607] as [number, number],
        currentCapacity: 450,
        maxCapacity: 500,
        address: "123 Main St, Cagayan de Oro",
        contact: "0912-345-6789"
    },
    {
        id: 2,
        name: "Medical Station Alpha",
        position: [8.235205, 124.254607] as [number, number],
        currentCapacity: 75,
        maxCapacity: 100,
        address: "456 Health Ave, Cagayan de Oro",
        contact: "0913-456-7890"
    },
    {
        id: 3,
        name: "Temporary Shelter A",
        position: [8.225205, 124.244607] as [number, number],
        currentCapacity: 280,
        maxCapacity: 300,
        address: "789 Shelter Rd, Cagayan de Oro",
        contact: "0914-567-8901"
    },
    {
        id: 4,
        name: "Emergency Food Station",
        position: [8.240205, 124.259607] as [number, number],
        currentCapacity: 120,
        maxCapacity: 200,
        address: "321 Food Blvd, Cagayan de Oro",
        contact: "0915-678-9012"
    },
    {
        id: 5,
        name: "North District Shelter",
        position: [8.245205, 124.264607] as [number, number],
        currentCapacity: 40,
        maxCapacity: 150,
        address: "654 North St, Cagayan de Oro",
        contact: "0916-789-0123"
    }
];

// Create icon with tooltip that shows name by default
const createMarkerIcon = (name: string, color: string, currentCapacity: number, maxCapacity: number) => {
    const percentage = Math.round((currentCapacity / maxCapacity) * 100);
    
    return L.divIcon({
        html: `
            <div class="group relative cursor-pointer" data-name="${name}" data-capacity="${percentage}% • ${currentCapacity}/${maxCapacity}">
                <!-- Main marker -->
                <div class="relative w-7 h-7 rounded-full border-2 border-white shadow-lg transition-all duration-200 group-hover:scale-110"
                     style="background-color: ${color}">
                </div>
                
                <!-- Center dot -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-2.5 h-2.5 rounded-full bg-white">
                </div>
            </div>
        `,
        className: "custom-marker",
        iconSize: [28, 48],
        iconAnchor: [14, 24],
    });
};

interface EvacuationCenter {
    id: number;
    name: string;
    position: [number, number];
    currentCapacity: number;
    maxCapacity: number;
    address: string;
    contact: string;
}

interface MapProps {
    center?: [number, number];
    zoom?: number;
    centers?: EvacuationCenter[];
    className?: string;
    onCenterClick?: (id: number) => void;
}

export default function MonoMap({
    center = [8.230205, 124.249607],
    zoom = 13,
    centers = MOCK_EVACUATION_CENTERS,
    className = "",
    onCenterClick = () => {},
}: MapProps) {
    const { theme } = useTheme();
    const [hoveredCenter, setHoveredCenter] = useState<number | null>(null);
    const isDark = theme === "dark";

    const handleMarkerClick = (id: number) => {
        onCenterClick(id);
    };

    const handleMarkerHover = (id: number | null) => {
        setHoveredCenter(id);
    };

    // Calculate bounds
    const calculateBounds = () => {
        if (centers.length === 0) return undefined;
        return centers.map(c => c.position);
    };

    return (
        <div className={`relative rounded-xl overflow-hidden shadow-lg border ${className} h-full`}>
            <MapContainer
                center={center}
                zoom={zoom}
                bounds={calculateBounds()}
                className="h-full w-full"
                scrollWheelZoom={true}
                zoomControl={true}
            >
                <TileLayer
                    url={isDark 
                        ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                        : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                    }
                    attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxZoom={19}
                    subdomains="abcd"
                />
                
                <ScaleControl imperial={false} position="bottomleft" />
                
                {centers.map((center) => {
                    const color = getCapacityColor(center.currentCapacity, center.maxCapacity, isDark);
                    const icon = createMarkerIcon(center.name, color, center.currentCapacity, center.maxCapacity);
                    const percentage = Math.round((center.currentCapacity / center.maxCapacity) * 100);
                    
                    return (
                        <Marker
                            key={center.id}
                            position={center.position}
                            icon={icon}
                            eventHandlers={{
                                click: () => handleMarkerClick(center.id),
                                mouseover: () => handleMarkerHover(center.id),
                                mouseout: () => handleMarkerHover(null),
                            }}
                        >
                            <Tooltip
                                direction="top"
                                offset={[0, -45]}
                                opacity={1}
                                permanent={false}
                                className="custom-tooltip"
                            >
                                <div className="px-3 py-2">
                                    <div className="font-medium text-sm text-foreground">{center.name}</div>
                                    <div className="text-xs mt-1 space-y-1">
                                        <div className="flex items-center gap-2 text-foreground">
                                            <div 
                                                className="w-2 h-2 rounded-full" 
                                                style={{ backgroundColor: color }}
                                            ></div>
                                            <span>{percentage}% full</span>
                                        </div>
                                        <div className="text-muted-foreground">
                                            {center.currentCapacity}/{center.maxCapacity} occupancy
                                        </div>
                                    </div>
                                </div>
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}