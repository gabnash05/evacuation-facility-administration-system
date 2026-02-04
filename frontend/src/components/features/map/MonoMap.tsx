// components/map/MonoMap.tsx

// MAP TILES FROM:
// https://docs.stadiamaps.com/themes/

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, ScaleControl, Tooltip, useMap } from "react-leaflet";
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
const getCapacityColor = (currentCapacity: number, maxCapacity: number, isDark: boolean, isHighlighted: boolean = false) => {
    const percentage = currentCapacity / maxCapacity;
    
    if (isHighlighted) {
        // Return special highlight color for the admin's center
        return isDark ? "#3b82f6" : "#2563eb"; // Blue color for highlighted center
    }
    
    if (percentage >= 0.9) return isDark ? "#dc2626" : "#ef4444";
    if (percentage >= 0.7) return isDark ? "#ea580c" : "#f97316";
    if (percentage >= 0.5) return isDark ? "#ca8a04" : "#eab308";
    if (percentage >= 0.3) return isDark ? "#16a34a" : "#22c55e";
    return isDark ? "#059669" : "#10b981";
};

// Create icon with tooltip that shows name by default
const createMarkerIcon = (name: string, color: string, currentCapacity: number, maxCapacity: number, isHighlighted: boolean = false) => {
    const percentage = Math.round((currentCapacity / maxCapacity) * 100);
    
    return L.divIcon({
        html: `
            <div class="group relative cursor-pointer" data-name="${name}" data-capacity="${percentage}% • ${currentCapacity}/${maxCapacity}">
                <!-- Main marker -->
                <div class="relative w-7 h-7 rounded-full border-2 border-white shadow-lg transition-all duration-200 group-hover:scale-110"
                     style="background-color: ${color}">
                    ${isHighlighted ? `
                    <!-- Highlight ring for admin's center -->
                    <div class="absolute inset-0 rounded-full animate-ping"
                         style="background-color: ${color}; opacity: 0.3;">
                    </div>
                    ` : ''}
                </div>
                
                <!-- Center dot -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-2.5 h-2.5 rounded-full bg-white">
                </div>
            </div>
        `,
        className: isHighlighted ? "custom-marker highlighted-marker" : "custom-marker",
        iconSize: [28, 48],
        iconAnchor: [14, 24],
    });
};

// Component to handle map centering
interface ChangeCenterProps {
    center: [number, number];
    zoom?: number;
    animate?: boolean;
    duration?: number;
}

function ChangeCenter({ center, zoom, animate = true, duration = 1 }: ChangeCenterProps) {
    const map = useMap();
    const [hasAnimated, setHasAnimated] = useState(false);
    
    useEffect(() => {
        if (!center || isNaN(center[0]) || isNaN(center[1])) return;
        
        // Add a delay for the initial animation
        if (animate && !hasAnimated) {
            const timer = setTimeout(() => {
                map.flyTo(center, zoom || map.getZoom(), {
                    duration: duration,
                    easeLinearity: 0.25
                });
                setHasAnimated(true);
            }, 800);
            
            return () => clearTimeout(timer);
        } else if (!animate) {
            // Set view immediately without animation
            map.setView(center, zoom || map.getZoom());
        }
    }, [center, zoom, map, animate, duration, hasAnimated]);
    
    return null;
}

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
    highlightCenterId?: number;
    shouldAnimateCenter?: boolean;
}

export default function MonoMap({
    center = [8.230205, 124.249607],
    zoom = 13,
    centers = [], // Default to empty array
    className = "",
    onCenterClick = () => {},
    highlightCenterId,
    shouldAnimateCenter = true,
}: MapProps) {
    const { theme } = useTheme();
    const [hoveredCenter, setHoveredCenter] = useState<number | null>(null);
    const [clickedCenter, setClickedCenter] = useState<EvacuationCenter | null>(null);
    const isDark = theme === "dark";
    const mapRef = useRef<any>(null);

    // Find the highlighted center for map centering
    const highlightedCenter = centers.find(c => c.id === highlightCenterId);
    const effectiveCenter = highlightedCenter?.position || center;
    const effectiveZoom = highlightedCenter ? 17 : zoom;

    const handleMarkerClick = (id: number) => {
        const clickedCenter = centers.find(c => c.id === id);
        if (clickedCenter) {
            setClickedCenter(clickedCenter);
            
            // Animate to the clicked center with flyTo
            if (mapRef.current) {
                mapRef.current.flyTo(clickedCenter.position, 15, {
                    duration: 1,
                    easeLinearity: 0.25
                });
            }
            
            // Call the parent callback
            onCenterClick(id);
        }
    };

    const handleMarkerHover = (id: number | null) => {
        setHoveredCenter(id);
    };

    // Calculate bounds - handle empty centers array
    const calculateBounds = () => {
        if (centers.length === 0) {
            // Return undefined to use the default center/zoom
            return undefined;
        }
        return centers.map(c => c.position);
    };

    return (
        <div className={`relative rounded-xl overflow-hidden shadow-lg border ${className} h-full`}>
            <MapContainer
                center={effectiveCenter}
                zoom={effectiveZoom}
                bounds={calculateBounds()}
                className="h-full w-full"
                scrollWheelZoom={true}
                zoomControl={true}
                ref={mapRef}
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
                
                {/* Use ChangeCenter component for programmatic control */}
                {highlightedCenter && (
                    <ChangeCenter 
                        center={highlightedCenter.position} 
                        zoom={17} 
                        animate={shouldAnimateCenter}
                        duration={1.5}
                    />
                )}
                
                {/* Center for clicked marker */}
                {clickedCenter && clickedCenter.id !== highlightCenterId && (
                    <ChangeCenter 
                        center={clickedCenter.position} 
                        zoom={15} 
                        animate={true}
                        duration={1}
                    />
                )}
                
                {centers.map((center) => {
                    const isHighlighted = center.id === highlightCenterId;
                    const color = getCapacityColor(center.currentCapacity, center.maxCapacity, isDark, isHighlighted);
                    const icon = createMarkerIcon(center.name, color, center.currentCapacity, center.maxCapacity, isHighlighted);
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
                                className={`custom-tooltip ${isHighlighted ? 'highlighted-tooltip' : ''}`}
                            >
                                <div className="px-3 py-2">
                                    <div className="font-medium text-sm text-foreground flex flex-wrap items-center">
                                        {center.name}
                                        {isHighlighted && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full shrink-0">
                                                Your Center
                                            </span>
                                        )}
                                    </div>
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