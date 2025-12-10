// components/features/attendance/VolunteerAttendancePage.tsx
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
import { debounce } from "@/utils/helpers";
import { useAuthStore } from "@/store/authStore";
import type { Individual } from "@/types/individual";

export function VolunteerAttendancePage() {
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

    // Filter states
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [genderFilter, setGenderFilter] = useState<string>("all");
    const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
    
    // For volunteer, we'll filter individuals by their household's center_id
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

    // Initialize with user's center and fetch centers
    useEffect(() => {
        if (userCenterId) {
            setCenterFilter(userCenterId);
            // Filter by household center_id AND individuals transferred FROM this center
            setFilter("center_id", userCenterId);
        }
        fetchAllCenters();
    }, [userCenterId, setFilter, fetchAllCenters]);

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

        // For volunteer, filter by center_id (includes registered individuals AND transfers FROM center)
        if (userCenterId) {
            setFilter("center_id", userCenterId);
        }
    }, [statusFilter, genderFilter, ageGroupFilter, userCenterId, setFilter]);

    const handleSort = (key: string) => {
        // Map frontend keys to backend sort keys
        const sortMapping: Record<string, string> = {
            "full_name": "full_name",
            "age": "age",
            "gender": "gender",
            "status": "current_status",
            "current_center_name": "current_center_name",
            "last_check_in_time": "last_check_in_time"
        };

        const backendKey = sortMapping[key] || key;
        
        // Determine new sort direction
        let newDirection: "asc" | "desc" = "asc";
        
        if (sortConfig?.key === key) {
            // Toggle direction if same key
            newDirection = sortConfig.direction === "asc" ? "desc" : "asc";
        }
        
        // Update local sort state
        setSortConfig({
            key,
            direction: newDirection
        });
        
        // Fetch with proper sort parameters
        fetchIndividuals({
            sortBy: backendKey,
            sortOrder: newDirection
        });
    };

    useEffect(() => {
        // Reset sorting when filters change significantly
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

    const handleDelete = async (id: number) => {
        try {
            // Note: Deleting individuals might be handled differently
            // This is just a placeholder
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
        
        // Trigger fetch immediately when search is cleared
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
                // Volunteer cannot change center filter
                if (userRole !== "volunteer") {
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
        // Center filter remains fixed to user's center
        clearFilters();
        setCurrentPage(1);
    };

    const handleOpenCheckInModal = (individualId: number, record: any) => {
        // Find the full individual data
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

    // Determine if user can perform actions
    const canCheckOut = (individual: Individual) => {
        // Volunteers can only check out individuals currently checked into their center
        return userCenterId && 
               individual.current_status === "checked_in" && 
               individual.current_center_id === userCenterId;
    };

    const canTransfer = (individual: Individual) => {
        // Volunteers can only transfer individuals from their center
        return userCenterId && 
               individual.current_status === "checked_in" && 
               individual.current_center_id === userCenterId;
    };

    const canCheckIn = (individual: Individual) => {
        // Volunteers can check in individuals who are:
        // 1. Registered to this center (household.center_id matches user's center)
        // 2. Not currently checked in somewhere else
        
        // Check if individual belongs to this center (via household)
        const belongsToThisCenter = userCenterId && 
            individual.household?.center_id === userCenterId;
        
        // Check if individual is available for check-in
        const isAvailableForCheckIn = 
            individual.current_status === "checked_out" || 
            individual.current_status === "transferred" ||
            !individual.last_check_in_time; // Never been checked in
        
        return belongsToThisCenter && isAvailableForCheckIn;
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
    
    const tableData = individuals.map(individual => {
        const canPerformCheckOut = canCheckOut(individual);
        const canPerformTransfer = canTransfer(individual);
        const canPerformCheckIn = canCheckIn(individual);
        
        // Generate full name from first and last name
        const fullName = `${individual.first_name} ${individual.last_name}`.trim();
        
        // Get household name
        const householdName = individual.household?.household_name || 
                            individual.household_name || 
                            `Household ${individual.household_id}`;
        
        // Get current center name
        const centerName = individual.current_center_name || "Not checked in";
        
        // Get last check-in time
        const lastCheckInTime = individual.last_check_in_time;
        const formattedLastCheckIn = lastCheckInTime 
            ? new Date(lastCheckInTime).toLocaleString('en-US', { timeZone: 'UTC' })
            : "Never";

        // Check if individual belongs to this center (via household)
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
            // Center information
            center_name: centerName,
            current_center_name: centerName,
            current_center_id: individual.current_center_id,
            belongs_to_this_center: belongsToThisCenter,
            // Household information
            household_name: householdName,
            household_id: individual.household_id,
            household_center_id: individual.household?.center_id,
            // Time information
            last_check_in_time: formattedLastCheckIn,
            check_in_time: lastCheckInTime,
            // Action flags
            can_check_out: canPerformCheckOut as boolean,
            can_transfer: canPerformTransfer as boolean,
            can_check_in: canPerformCheckIn as boolean,
            // For type compatibility
            event_name: "",
            check_out_time: null,
            transfer_time: null,
        };
    });

    // Filter centers to only show user's center for volunteer
    const filteredCenters = userRole === "volunteer" && userCenterId
        ? centers.filter(center => center.center_id === userCenterId)
        : centers;

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
                    <h1 className="text-2xl font-bold tracking-tight">Attendance Management</h1>
                    <p className="text-muted-foreground">
                        Manage individuals registered to your center: {centers.find(c => c.center_id === userCenterId)?.center_name || `Center #${userCenterId}`}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Showing individuals registered to this center (via household assignment)
                    </p>
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
                            onCheckIn={() => setIsCheckInModalOpen(true)}
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
                            // Filter controls
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
                                        canCheckOut: individual?.can_check_out || false,
                                        canTransfer: individual?.can_transfer || false,
                                        canCheckIn: individual?.can_check_in || false,
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
                }}
                onSuccess={() => {
                    setIsCheckInModalOpen(false);
                    setIndividualToCheckIn(null);
                    showSuccessToast("Individual checked in successfully");
                    fetchIndividuals();
                }}
                defaultCenterId={userCenterId} // Always check into user's center
                individualToCheckIn={individualToCheckIn}
            />

            <CheckOutModal
                isOpen={isCheckOutModalOpen}
                recordId={selectedRecordId}
                onClose={() => setIsCheckOutModalOpen(false)}
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
                defaultCenterId={userCenterId} // Restrict to checking out from user's center
            />

            <TransferIndividualModal
                isOpen={isTransferModalOpen}
                defaultCenterId={userCenterId}
                initialIndividualId={selectedIndividualId || undefined}
                onClose={() => setIsTransferModalOpen(false)}
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
                sourceCenterId={userCenterId} // Restrict to transferring from user's center
            />

            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}