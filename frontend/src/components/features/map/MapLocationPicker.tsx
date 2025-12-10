// components/map/MapLocationPicker.tsx

import { useState, useCallback } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    ScaleControl,
    useMapEvents,
} from "react-leaflet";
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

// Create a custom icon for the location picker
const createLocationIcon = (isDark: boolean) => {
    const color = isDark ? "#3b82f6" : "#2563eb"; // Blue color for selection
    const shadowColor = isDark ? "rgba(37, 99, 235, 0.5)" : "rgba(59, 130, 246, 0.5)";

    return L.divIcon({
        html: `
            <div class="relative group">
                <!-- Outer pulse animation -->
                <div class="absolute inset-0 animate-ping rounded-full"
                     style="background-color: ${shadowColor}; transform: scale(1.5);">
                </div>
                
                <!-- Main marker -->
                <div class="relative w-8 h-8 rounded-full border-3 border-white shadow-xl transition-all duration-200 group-hover:scale-110"
                     style="background-color: ${color}">
                </div>
                
                <!-- Center dot -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-3 h-3 rounded-full bg-white">
                </div>
                
                <!-- Plus sign for clarity -->
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-0.5 h-4 rounded-full bg-white"></div>
                <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-4 h-0.5 rounded-full bg-white"></div>
            </div>
        `,
        className: "location-picker-marker",
        iconSize: [32, 52],
        iconAnchor: [16, 26],
    });
};

interface MapLocationPickerProps {
    /** Initial center position of the map [lat, lng] */
    initialCenter?: [number, number];
    /** Initial zoom level */
    zoom?: number;
    /** Optional initial selected location [lat, lng] */
    initialLocation?: [number, number] | null;
    /** Callback when location is selected */
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    /** Optional callback when cancelled */
    onCancel?: () => void;
    /** Additional CSS classes */
    className?: string;
    /** Show coordinates display */
    showCoordinates?: boolean;
    /** Allow dragging the marker */
    draggable?: boolean;
}

// Map click handler component
function MapClickHandler({
    onLocationSelect,
    setLocation,
}: {
    onLocationSelect: (location: { lat: number; lng: number }) => void;
    setLocation: (loc: [number, number] | null) => void;
}) {
    useMapEvents({
        click: (e) => {
            const { lat, lng } = e.latlng;
            const newLocation: [number, number] = [lat, lng];
            setLocation(newLocation);
            onLocationSelect({ lat, lng });
        },
    });
    return null;
}

export default function MapLocationPicker({
    initialCenter = [8.230205, 124.249607],
    zoom = 13,
    initialLocation = null,
    onLocationSelect,
    onCancel,
    className = "",
    showCoordinates = true,
    draggable = true,
}: MapLocationPickerProps) {
    const { theme } = useTheme();
    const [location, setLocation] = useState<[number, number] | null>(initialLocation);
    const isDark = theme === "dark";

    const handleLocationSelect = useCallback(
        (newLocation: [number, number]) => {
            setLocation(newLocation);
            onLocationSelect({ lat: newLocation[0], lng: newLocation[1] });
        },
        [onLocationSelect]
    );

    const handleDragEnd = useCallback(
        (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            setLocation([lat, lng]);
            onLocationSelect({ lat, lng });
        },
        [onLocationSelect]
    );

    const handleReset = () => setLocation(null);

    const locationIcon = createLocationIcon(isDark);

    return (
        <div className={`flex flex-col h-full min-h-0 ${className}`}>
            
            {/* TOP PANEL — scrollable, fixed height */}
            <div className="shrink-0 mb-4 space-y-2 max-h-[24vh] overflow-y-auto pr-1">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-medium text-foreground">Select Location</h3>
                        <p className="text-sm text-muted-foreground">
                            Click on the map to select a location for the evacuation center
                        </p>
                    </div>

                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-3 py-1 text-sm border border-input rounded-md hover:bg-accent transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>

                {showCoordinates && location && (
                    <div className="p-3 bg-card border rounded-md space-y-1">
                        <div className="text-sm font-medium text-foreground">Selected Coordinates</div>
                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Latitude</div>
                                <div className="font-mono text-foreground">{location[0].toFixed(6)}°</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-muted-foreground">Longitude</div>
                                <div className="font-mono text-foreground">{location[1].toFixed(6)}°</div>
                            </div>
                        </div>
                    </div>
                )}

                {!location && (
                    <div className="p-3 bg-muted/30 border border-dashed rounded-md">
                        <p className="text-sm text-muted-foreground">
                            Click anywhere on the map to set the evacuation center location
                        </p>
                    </div>
                )}
            </div>

            {/* MAP SECTION — takes ALL remaining space */}
            <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden shadow-lg border">
                <MapContainer
                    center={location || initialCenter}
                    zoom={zoom}
                    className="h-full w-full"
                    scrollWheelZoom={true}
                    zoomControl={true}
                >
                    <TileLayer
                        url={
                            isDark
                                ? "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                                : "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                        }
                        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
                        maxZoom={19}
                    />

                    <ScaleControl imperial={false} position="bottomleft" />

                    <MapClickHandler
                        onLocationSelect={({ lat, lng }) => handleLocationSelect([lat, lng])}
                        setLocation={setLocation}
                    />

                    {location && (
                        <Marker
                            position={location}
                            icon={locationIcon}
                            draggable={draggable}
                            eventHandlers={{ dragend: handleDragEnd }}
                        />
                    )}
                </MapContainer>

                {/* Map overlay controls */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                    {location && (
                        <button
                            onClick={handleReset}
                            className="px-3 py-2 text-sm bg-background/90 backdrop-blur-sm border rounded-md shadow-sm hover:bg-accent transition-colors text-foreground"
                        >
                            Clear Location
                        </button>
                    )}
                </div>

                {/* Map instructions bubble */}
                <div className="absolute top-4 right-4">
                    <div className="bg-background/90 backdrop-blur-sm border rounded-md p-3 max-w-xs shadow-sm">
                        <div className="text-sm space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-foreground">Click to place marker</span>
                            </div>
                            {draggable && (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full border-2 border-blue-500"></div>
                                    <span className="text-foreground">Drag to adjust</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTTOM PANEL — unchanged */}
            {location && (
                <div className="mt-4 p-4 bg-card border rounded-md shrink-0">
                    <div className="flex justify-between items-center">
                        <div>
                            <h4 className="font-medium text-foreground">Location Selected</h4>
                            <p className="text-sm text-muted-foreground">
                                You can drag the marker to fine-tune the position
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigator.clipboard.writeText(`${location[0]}, ${location[1]}`)}
                                className="px-3 py-1 text-sm border border-input rounded-md hover:bg-accent transition-colors"
                                title="Copy coordinates"
                            >
                                Copy
                            </button>
                            <button
                                onClick={handleReset}
                                className="px-3 py-1 text-sm border border-destructive/20 text-destructive rounded-md hover:bg-destructive/10 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
