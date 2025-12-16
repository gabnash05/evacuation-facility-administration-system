"use client";

import { useEffect, useState } from "react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { useStatsStore } from "@/store/statsStore";
import { useEventStore } from "@/store/eventStore";
import { AGE_GROUP_LABELS, GENDER_LABELS } from "@/schemas/stats";
import type { Gender, AgeGroup } from "@/types/stats";

interface StatsRowProps {
    centerId?: number; // For center admin - only show their center's stats
}

export function StatsRow({ centerId }: StatsRowProps) {
    const {
        stats,
        loading,
        filters,
        setGenderFilter,
        setAgeGroupFilter,
        setEventFilter,  // NEW
        fetchStats,
        resetFilters,
        getStatsForDisplay,
    } = useStatsStore();

    // NEW: Fetch events for the event filter
    const { events, fetchEvents } = useEventStore();
    const [loadingEvents, setLoadingEvents] = useState(false);

    // Fetch events on mount - filter by centerId for center admin
    useEffect(() => {
        const loadEvents = async () => {
            setLoadingEvents(true);
            try {
                await fetchEvents(centerId);
            } catch (error) {
                console.error("Failed to fetch events for stats filter:", error);
            } finally {
                setLoadingEvents(false);
            }
        };
        loadEvents();
    }, [centerId, fetchEvents]);

    // Fetch stats on mount and when filters change
    useEffect(() => {
        fetchStats(centerId);
    }, [filters.gender, filters.age_group, filters.event_id, centerId]);

    const statsData = getStatsForDisplay();

    const handleGenderChange = (value: string) => {
        if (value === "all") {
            setGenderFilter(null);
        } else {
            setGenderFilter(value as Gender);
        }
    };

    const handleAgeGroupChange = (value: string) => {
        if (value === "all") {
            setAgeGroupFilter(null);
        } else {
            setAgeGroupFilter(value as AgeGroup);
        }
    };

    // NEW: Handle event filter change
    const handleEventChange = (value: string) => {
        if (value === "all") {
            setEventFilter(null);
        } else {
            setEventFilter(parseInt(value));
        }
    };

    const handleResetFilters = () => {
        resetFilters();
    };

    const hasActiveFilters = 
        filters.gender !== null || 
        filters.age_group !== null || 
        filters.event_id !== null;  // NEW

    return (
        <div className="w-full bg-card border-b border-border">
            {/* Filters Section */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">Filter Stats:</span>

                {/* Gender Filter */}
                <Select value={filters.gender || "all"} onValueChange={handleGenderChange}>
                    <SelectTrigger className="w-[140px] h-8">
                        <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        {Object.entries(GENDER_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Age Group Filter */}
                <Select value={filters.age_group || "all"} onValueChange={handleAgeGroupChange}>
                    <SelectTrigger className="w-[160px] h-8">
                        <SelectValue placeholder="Age Group" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Ages</SelectItem>
                        {Object.entries(AGE_GROUP_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* NEW: Event Filter */}
                <Select 
                    value={filters.event_id?.toString() || "all"} 
                    onValueChange={handleEventChange}
                    disabled={loadingEvents}
                >
                    <SelectTrigger className="w-[200px] h-8">
                        <SelectValue placeholder="Event" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        {events.map((event) => (
                            <SelectItem key={event.event_id} value={event.event_id.toString()}>
                                {event.event_name} ({event.status})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Reset Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-8 px-2 text-xs"
                    >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                )}
            </div>

            {/* Stats Display Section */}
            {loading ? (
                <div className="flex justify-around py-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex flex-col items-center gap-1 animate-pulse">
                            <div className="h-10 w-10 bg-muted rounded-full mb-2" />
                            <div className="h-4 w-20 bg-muted rounded" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex justify-around py-4 text-center">
                    {statsData.map((stat, i) => {
                        // Determine if filters should affect this stat
                        // Stats 0 and 1: affected by gender, age, and event filters
                        // Stat 2 (aid distribution): affected by event filter only
                        const isFiltered = 
                            (i === 0 || i === 1) ? hasActiveFilters :
                            (i === 2) ? filters.event_id !== null :
                            false;

                        return (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <div className="flex items-center gap-2">
                                    {/* Progress Circle */}
                                    <div className="relative w-10 h-10">
                                        <svg
                                            className="w-10 h-10 -rotate-90"
                                            viewBox="0 0 36 36"
                                        >
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                className="text-muted"
                                            />
                                            <circle
                                                cx="18"
                                                cy="18"
                                                r="16"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeDasharray={`${stat.percentage} ${100 - stat.percentage}`}
                                                className={
                                                    isFiltered
                                                        ? "text-green-500"
                                                        : "text-blue-500"
                                                }
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                                            {stat.percentage}%
                                        </div>
                                    </div>
                                    <div className="text-xl font-semibold">{stat.value}</div>
                                    {stat.max && (
                                        <p className="text-sm text-muted-foreground">
                                            /{stat.max}
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm font-medium">
                                    {stat.label}
                                    {isFiltered && (
                                        <span className="text-xs text-green-600 ml-1">
                                            (filtered)
                                        </span>
                                    )}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}