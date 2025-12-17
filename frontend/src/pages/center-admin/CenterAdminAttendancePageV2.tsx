// components/features/attendance/CenterAdminAttendancePageV2.tsx
import { useEffect, useMemo, useState } from "react";
import { AttendanceTable } from "@/components/features/attendance/AttendanceTableV2";
import { AttendanceTableToolbarV2 } from "@/components/features/attendance/AttendanceTableToolbarV2";
import { TablePagination } from "@/components/common/TablePagination";
import { CheckInModal } from "@/components/features/attendance/CheckInModal";
import { CheckOutModal } from "@/components/features/attendance/CheckOutModal";
import { TransferIndividualModal } from "@/components/features/transfer/TransferIndividualModal";
import { SuccessToast } from "@/components/common/SuccessToast";
import { useIndividualStore } from "@/store/individualStore";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { useEvacuationCenterStore } from "@/store/evacuationCenterStore";
import { useEventStore } from "@/store/eventStore";
import { debounce } from "@/utils/helpers";
import { useAuthStore } from "@/store/authStore";
import type { Individual } from "@/types/individual";

export function CenterAdminAttendancePage() {
    const {
        paginatedIndividuals: individuals,
        loading,
        error,
        searchQuery,
        currentPage,
        entriesPerPage,
        totalRecords,
        setSearchQuery,
        setCurrentPage,
        setEntriesPerPage,
        setFilter,
        clearFilters,
        fetchIndividuals,
    } = useIndividualStore();

    const {
        checkOutIndividual,
        checkOutMultipleIndividuals,
        transferIndividual,
        transferMultipleIndividuals,
    } = useAttendanceStore();

    const { centers, fetchAllCenters } = useEvacuationCenterStore();
    const { activeEvent, fetchActiveEvent } = useEventStore();

    // Get current user and role
    const { user } = useAuthStore();
    const userRole = user?.role;
    const userCenterId = user?.center_id;

    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedIndividualId, setSelectedIndividualId] = useState<number | null>(null);
    const [individualToCheckIn, setIndividualToCheckIn] = useState<any>(null);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [successToast, setSuccessToast] = useState({
        isOpen: false,
        message: "",
    });
    const [eventError, setEventError] = useState<string | null>(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [genderFilter, setGenderFilter] = useState<string>("all");
    const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
    
    // For center admin, we'll filter individuals by their household's center_id
    const [centerFilter, setCenterFilter] = useState<number | undefined>(userCenterId || undefined);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    const debouncedFetchIndividuals = useMemo(
        () => debounce(() => fetchIndividuals(), 500),
        [fetchIndividuals]
    );

    // Initialize with user's center and fetch centers/event
    useEffect(() => {
        if (userCenterId) {
            setCenterFilter(userCenterId);
            setFilter("center_id", userCenterId);
        }
        fetchAllCenters();
        fetchActiveEvent();
    }, [userCenterId, setFilter, fetchAllCenters, fetchActiveEvent]);

    // Check for active event and center status - only when modals are opening
    useEffect(() => {
        if (isCheckInModalOpen || isCheckOutModalOpen || isTransferModalOpen) {
            if (!activeEvent) {
                setEventError("No active event found. An event must be active to perform attendance actions.");
            } else if (userCenterId) {
                const userCenter = centers.find(c => c.center_id === userCenterId);
                if (!userCenter || userCenter.status !== "active") {
                    setEventError("Your evacuation center is not active. Please contact administration.");
                } else {
                    setEventError(null);
                }
            }
        }
    }, [activeEvent, centers, userCenterId, isCheckInModalOpen, isCheckOutModalOpen, isTransferModalOpen]);

    // Check for event/center status on initial load
    useEffect(() => {
        if (!activeEvent) {
            setEventError("No active event found. An event must be active to perform attendance actions.");
        } else if (userCenterId) {
            const userCenter = centers.find(c => c.center_id === userCenterId);
            if (!userCenter || userCenter.status !== "active") {
                setEventError("Your evacuation center is not active. Please contact administration.");
            } else {
                setEventError(null);
            }
        }
    }, [activeEvent, centers, userCenterId]);

    useEffect(() => {
        if (userCenterId) {
            debouncedFetchIndividuals();
        }
    }, [
        searchQuery,
        currentPage,
        entriesPerPage,
        statusFilter,
        genderFilter,
        ageGroupFilter,
        userCenterId,
        debouncedFetchIndividuals
    ]);

    useEffect(() => {
        // Update filters in store when local filter states change
        if (statusFilter !== "all") {
            setFilter("status", statusFilter);
        } else {
            setFilter("status", undefined);
        }

        if (genderFilter !== "all") {
            setFilter("gender", genderFilter);
        } else {
            setFilter("gender", undefined);
        }

        if (ageGroupFilter !== "all") {
            setFilter("age_group", ageGroupFilter);
        } else {
            setFilter("age_group", undefined);
        }

        if (userCenterId) {
            setFilter("center_id", userCenterId);
        }
    }, [statusFilter, genderFilter, ageGroupFilter, userCenterId, setFilter]);

    const handleSort = (key: string) => {
        const sortMapping: Record<string, string> = {
            "full_name": "full_name",
            "age": "age",
            "gender": "gender",
            "status": "current_status",
            "current_center_name": "current_center_name",
            "last_check_in_time": "last_check_in_time"
        };

        const backendKey = sortMapping[key] || key;
        
        let newDirection: "asc" | "desc" = "asc";
        
        if (sortConfig?.key === key) {
            newDirection = sortConfig.direction === "asc" ? "desc" : "asc";
        }
        
        setSortConfig({
            key,
            direction: newDirection
        });
        
        fetchIndividuals({
            sortBy: backendKey,
            sortOrder: newDirection
        });
    };

    useEffect(() => {
        setSortConfig(null);
    }, [searchQuery, statusFilter, genderFilter, ageGroupFilter]);

    const handleOpenCheckOutModal = (individualId: number, recordId?: number) => {
        setSelectedIndividualId(individualId);
        setSelectedRecordId(recordId || null);
        setIsCheckOutModalOpen(true);
    };

    const handleOpenTransferModal = (individualId: number, recordId?: number) => {
        setSelectedIndividualId(individualId);
        setSelectedRecordId(recordId || null);
        setIsTransferModalOpen(true);
    };

    const handleOpenCheckInModalFromToolbar = () => {
        setIsCheckInModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            console.log("Delete individual:", id);
            showSuccessToast("Individual deleted successfully");
            fetchIndividuals();
        } catch (error) {
            console.error("Error deleting individual:", error);
        }
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    };

    const handleSearchChange = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1);
        
        if (query.trim() === "") {
            fetchIndividuals();
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleFilterChange = (type: string, value: string | number) => {
        switch (type) {
            case "status":
                setStatusFilter(value as string);
                break;
            case "gender":
                setGenderFilter(value as string);
                break;
            case "age_group":
                setAgeGroupFilter(value as string);
                break;
            case "center_id":
                if (userRole !== "center_admin") {
                    setCenterFilter(value as number);
                }
                break;
        }
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setStatusFilter("all");
        setGenderFilter("all");
        setAgeGroupFilter("all");
        clearFilters();
        setCurrentPage(1);
    };

    const handleOpenCheckInModal = (individualId: number, record: any) => {
        const individual = individuals.find(ind => ind.individual_id === individualId);
        if (individual) {
            setIndividualToCheckIn(individual);
            setIsCheckInModalOpen(true);
        }
    };

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    const showSuccessToast = (message: string) => {
        setSuccessToast({ isOpen: true, message });
    };

    // Helper function to check if actions are allowed (without setting state)
    const canPerformActions = useMemo(() => {
        if (!activeEvent) {
            return false;
        }

        if (userCenterId) {
            const userCenter = centers.find(c => c.center_id === userCenterId);
            if (!userCenter || userCenter.status !== "active") {
                return false;
            }
        }

        return true;
    }, [activeEvent, centers, userCenterId]);

    // Determine if user can perform actions on specific individuals
    const canCheckOut = useMemo(() => (individual: Individual) => {
        if (!canPerformActions) return false;
        
        return userCenterId && 
               individual.current_status === "checked_in" && 
               individual.current_center_id === userCenterId;
    }, [canPerformActions, userCenterId]);

    const canTransfer = useMemo(() => (individual: Individual) => {
        if (!canPerformActions) return false;
        
        return userCenterId && 
               individual.current_status === "checked_in" && 
               individual.current_center_id === userCenterId;
    }, [canPerformActions, userCenterId]);

    const canCheckIn = useMemo(() => (individual: Individual) => {
        if (!canPerformActions) return false;
        
        const belongsToThisCenter = userCenterId && 
            individual.household?.center_id === userCenterId;
        
        if (!belongsToThisCenter) return false;
        
        const isAvailableForCheckIn = 
            individual.current_status === "checked_out" || 
            individual.current_status === "transferred" ||
            !individual.last_check_in_time;
        
        return isAvailableForCheckIn;
    }, [canPerformActions, userCenterId]);

    const getEventStatusBadge = () => {
        if (!activeEvent) {
            return (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    No Active Event
                </div>
            );
        }
        
        const userCenter = userCenterId ? centers.find(c => c.center_id === userCenterId) : null;
        const isCenterActive = userCenter?.status === "active";
        
        if (!isCenterActive) {
            return (
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Center Inactive
                </div>
            );
        }
        
        return (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active Event: {activeEvent.event_name}
            </div>
        );
    };

    const headers = [
        { key: "full_name", label: "Name", sortable: true },
        { key: "age", label: "Age", sortable: true },
        { key: "gender", label: "Gender", sortable: true },
        { key: "relationship_to_head", label: "Relationship", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "current_center_name", label: "Current Center", sortable: true },
        { key: "household_name", label: "Household", sortable: true },
        { key: "last_check_in_time", label: "Last Check-in", sortable: true },
    ];
    
    const tableData = useMemo(() => individuals.map(individual => {
        const canPerformCheckOut = canCheckOut(individual);
        const canPerformTransfer = canTransfer(individual);
        const canPerformCheckIn = canCheckIn(individual);
        
        const fullName = `${individual.first_name} ${individual.last_name}`.trim();
        
        const householdName = individual.household?.household_name || 
                            individual.household_name || 
                            `Household ${individual.household_id}`;
        
        const centerName = individual.current_center_name || "Not checked in";
        
        const lastCheckInTime = individual.last_check_in_time;
        const formattedLastCheckIn = lastCheckInTime 
            ? new Date(lastCheckInTime).toLocaleString('en-US', { timeZone: 'UTC' })
            : "Never";

        const belongsToThisCenter = userCenterId && 
            individual.household?.center_id === userCenterId;
        
        return {
            record_id: individual.individual_id,
            individual_id: individual.individual_id,
            individual_name: fullName,
            full_name: fullName,
            age: individual.age || "N/A",
            gender: individual.gender || "N/A",
            relationship_to_head: individual.relationship_to_head || "N/A",
            current_status: individual.current_status || "checked_out",
            status: individual.current_status || "checked_out",
            center_name: centerName,
            current_center_name: centerName,
            current_center_id: individual.current_center_id,
            belongs_to_this_center: belongsToThisCenter,
            household_name: householdName,
            household_id: individual.household_id,
            household_center_id: individual.household?.center_id,
            last_check_in_time: formattedLastCheckIn,
            check_in_time: lastCheckInTime,
            can_check_out: canPerformCheckOut as boolean,
            can_transfer: canPerformTransfer as boolean,
            can_check_in: canPerformCheckIn as boolean,
            event_name: activeEvent?.event_name || "",
            check_out_time: null,
            transfer_time: null,
        };
    }), [individuals, canCheckOut, canTransfer, canCheckIn, userCenterId, activeEvent]);

    const filteredCenters = userRole === "center_admin" && userCenterId
        ? centers.filter(center => center.center_id === userCenterId)
        : centers;

    // Calculate if actions should be disabled
    const shouldDisableActions = !canPerformActions;

    if (!userCenterId) {
        return (
            <div className="p-6">
                <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                            Error: No evacuation center assigned to your account.
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
                            <p className="text-muted-foreground">
                                Manage individuals registered to your center: {centers.find(c => c.center_id === userCenterId)?.center_name || `Center #${userCenterId}`}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Showing individuals registered to this center (via household assignment)
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {getEventStatusBadge()}
                        </div>
                    </div>
                    
                    {/* Event Status Warning */}
                    {eventError && (
                        <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-700">
                                        {eventError}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive p-4 rounded-md">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Error: {error}</span>
                        </div>
                    </div>
                )}

                <div className="border border-border rounded-lg">
                    <div className="bg-card border-b border-border p-4">
                        <AttendanceTableToolbarV2
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onCheckIn={handleOpenCheckInModalFromToolbar}
                            onOpenCheckOut={() => {
                                setSelectedIndividualId(null);
                                setSelectedRecordId(null);
                                setIsCheckOutModalOpen(true);
                            }}
                            onOpenTransfer={() => {
                                setSelectedIndividualId(null);
                                setSelectedRecordId(null);
                                setIsTransferModalOpen(true);
                            }}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                            filters={{
                                status: statusFilter,
                                gender: genderFilter,
                                ageGroup: ageGroupFilter,
                                centerId: centerFilter
                            }}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                            centers={filteredCenters}
                            userRole={userRole}
                            userCenterId={userCenterId}
                            disabledActions={shouldDisableActions}
                        />
                    </div>
                    <div className="border-b border-border">
                        {loading && individuals.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">
                                    Loading individuals...
                                </div>
                            </div>
                        ) : (
                            <AttendanceTable
                                headers={headers}
                                data={tableData}
                                sortConfig={{
                                    key: sortConfig?.key || "",
                                    direction: sortConfig?.direction || null
                                }}
                                onSort={handleSort}
                                onCheckOut={(recordId) => {
                                    const individual = tableData.find(i => i.record_id === recordId);
                                    if (individual) {
                                        handleOpenCheckOutModal(individual.individual_id, recordId);
                                    }
                                }}
                                onTransfer={(recordId) => {
                                    const individual = tableData.find(i => i.record_id === recordId);
                                    if (individual) {
                                        handleOpenTransferModal(individual.individual_id, recordId);
                                    }
                                }}
                                onCheckIn={handleOpenCheckInModal}
                                onDelete={handleDelete}
                                loading={loading}
                                userRole={userRole}
                                showActions={(record: any) => {
                                    const individual = tableData.find(i => i.record_id === record.record_id);
                                    
                                    return {
                                        canCheckOut: !shouldDisableActions && (individual?.can_check_out || false),
                                        canTransfer: !shouldDisableActions && (individual?.can_transfer || false),
                                        canCheckIn: !shouldDisableActions && (individual?.can_check_in || false),
                                    };
                                }}
                            />
                        )}
                    </div>
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={totalRecords}
                            onPageChange={handlePageChange}
                            loading={loading}
                            entriesLabel="individuals"
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CheckInModal
                isOpen={isCheckInModalOpen}
                onClose={() => {
                    setIsCheckInModalOpen(false);
                    setIndividualToCheckIn(null);
                    setEventError(null);
                }}
                onSuccess={() => {
                    setIsCheckInModalOpen(false);
                    setIndividualToCheckIn(null);
                    showSuccessToast("Individual checked in successfully");
                    fetchIndividuals();
                }}
                defaultCenterId={userCenterId}
                individualToCheckIn={individualToCheckIn}
            />

            <CheckOutModal
                isOpen={isCheckOutModalOpen}
                recordId={selectedRecordId}
                onClose={() => {
                    setIsCheckOutModalOpen(false);
                    setEventError(null);
                }}
                onCheckOut={async (recordId: number, data) => {
                    await checkOutIndividual(recordId, data);
                }}
                onBatchCheckOut={async (data) => {
                    await checkOutMultipleIndividuals(data);
                }}
                onSuccess={(checkoutCount?: number) => {
                    setIsCheckOutModalOpen(false);
                    const message = selectedIndividualId 
                        ? "Individual checked out successfully"
                        : `${checkoutCount || 0} individuals checked out successfully`;
                    showSuccessToast(message);
                    fetchIndividuals();
                }}
                defaultCenterId={userCenterId}
            />

            <TransferIndividualModal
                isOpen={isTransferModalOpen}
                defaultCenterId={userCenterId}
                initialIndividualId={selectedIndividualId || undefined}
                onClose={() => {
                    setIsTransferModalOpen(false);
                    setEventError(null);
                }}
                onTransfer={async (recordId: number, data) => {
                    await transferIndividual(recordId, data as any);
                }}
                onBatchTransfer={async (data) => {
                    await transferMultipleIndividuals(data);
                }}
                onSuccess={(transferCount?: number) => {
                    setIsTransferModalOpen(false);
                    const message = (transferCount || 1) === 1 
                        ? "Individual transferred successfully"
                        : `${transferCount || 0} individuals transferred successfully`;
                    showSuccessToast(message);
                    fetchIndividuals();
                }}
                sourceCenterId={userCenterId}
            />

            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}