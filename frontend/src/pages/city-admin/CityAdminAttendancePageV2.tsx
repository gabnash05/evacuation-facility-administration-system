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

export function CityAdminAttendancePage() {
    // Use individual store instead of attendance store for main data
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

    // Use the evacuation center store
    const { 
        centers: allCenters, 
        fetchAllCenters,
        loading: centersLoading 
    } = useEvacuationCenterStore();

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
    const [centerFilter, setCenterFilter] = useState<number | undefined>(undefined);

    // Sorting state
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc";
    } | null>(null);

    // Fetch centers when component mounts
    useEffect(() => {
        fetchAllCenters();
    }, [fetchAllCenters]);

    // Filter centers based on user role
    const centers = useMemo(() => {
        if (userRole === "center_admin" && userCenterId) {
            // Center admins only see their own center
            return allCenters.filter(center => center.center_id === userCenterId);
        }
        // City admins and super admins see all active centers
        return allCenters.filter(center => center.status === "active");
    }, [allCenters, userRole, userCenterId]);

    const debouncedFetchIndividuals = useMemo(
        () => debounce(() => fetchIndividuals(), 500),
        [fetchIndividuals]
    );

    // Initialize with user's center if they have one
    useEffect(() => {
        if (userCenterId) {
            setCenterFilter(userCenterId);
            setFilter("center_id", userCenterId);
        }
    }, [userCenterId, setFilter]);

    useEffect(() => {
        debouncedFetchIndividuals();
    }, [
        searchQuery,
        currentPage,
        entriesPerPage,
        statusFilter,
        genderFilter,
        ageGroupFilter,
        centerFilter,
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

        if (centerFilter) {
            setFilter("center_id", centerFilter);
        } else {
            setFilter("center_id", undefined);
        }
    }, [statusFilter, genderFilter, ageGroupFilter, centerFilter, setFilter]);

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
    }, [searchQuery, statusFilter, genderFilter, ageGroupFilter, centerFilter]);

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
                setCenterFilter(value as number);
                break;
        }
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setStatusFilter("all");
        setGenderFilter("all");
        setAgeGroupFilter("all");
        setCenterFilter(userCenterId || undefined);
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
    const canCheckOut = (individual: any) => {
        // Center admins can only check out individuals at their center
        if (userRole === "center_admin" && userCenterId) {
            return individual.current_status === "checked_in" && 
                   individual.current_center_details?.center_id === userCenterId;
        }
        // City admins and super admins can check out from any center
        return ["super_admin", "city_admin"].includes(userRole || "") && 
               individual.current_status === "checked_in";
    };

    const canTransfer = (individual: any) => {
        // Center admins can only transfer individuals from their center
        if (userRole === "center_admin" && userCenterId) {
            return individual.current_status === "checked_in" && 
                   individual.current_center_details?.center_id === userCenterId;
        }
        // City admins and super admins can transfer from any center
        return ["super_admin", "city_admin"].includes(userRole || "") && 
               individual.current_status === "checked_in";
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
        
        // Generate full name from first and last name
        const fullName = `${individual.first_name} ${individual.last_name}`.trim();
        
        // Get household name - use household.household_name from backend
        const householdName = individual.household?.household_name || 
                            individual.household_name || 
                            `Household ${individual.household_id}`;
        
        // Get center name - use current_center_name from backend
        const centerName = individual.current_center_name || "Not checked in";
        
        // Get last check-in time - use last_check_in_time from backend
        const lastCheckInTime = individual.last_check_in_time;
        const formattedLastCheckIn = lastCheckInTime 
            ? new Date(lastCheckInTime).toLocaleString('en-US', { timeZone: 'UTC' })
            : "Never";

        return {
            record_id: individual.individual_id, // Using individual_id as record_id for actions
            individual_id: individual.individual_id,
            individual_name: fullName,
            full_name: fullName,
            age: individual.age || "N/A",
            gender: individual.gender || "N/A",
            relationship_to_head: individual.relationship_to_head || "N/A",
            current_status: individual.current_status || "checked_out",
            status: individual.current_status || "checked_out", // For badge display
            // Center information - use actual backend fields
            center_name: centerName,
            current_center_name: centerName,
            current_center_id: individual.current_center_id,
            // Household information - use actual backend fields
            household_name: householdName,
            household_id: individual.household_id,
            // Time information - use actual backend fields
            last_check_in_time: formattedLastCheckIn,
            check_in_time: lastCheckInTime, // Raw for sorting
            // Action flags
            can_check_out: canPerformCheckOut,
            can_transfer: canPerformTransfer,
            // For type compatibility
            event_name: "",
            check_out_time: null,
            transfer_time: null,
        };
    });

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Individual Status Dashboard</h1>
                    <p className="text-muted-foreground">View and manage individual status across centers</p>
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
                            loading={loading || centersLoading}
                            // Add filter controls
                            filters={{
                                status: statusFilter,
                                gender: genderFilter,
                                ageGroup: ageGroupFilter,
                                centerId: centerFilter
                            }}
                            onFilterChange={handleFilterChange}
                            onClearFilters={handleClearFilters}
                            centers={centers}
                            userRole={userRole}
                            userCenterId={userCenterId || undefined}
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
                                    
                                    // Check if individual is checked out or transferred (can be checked in)
                                    const isCheckedOutOrTransferred = 
                                        individual?.current_status === 'checked_out' || 
                                        individual?.current_status === 'transferred';
                                    
                                    // Check if user has permission to check in at this center
                                    let canCheckIn = false;
                                    if (userRole === "center_admin" && userCenterId) {
                                        // Center admins can only check in individuals to their center
                                        // Use centerFilter instead of defaultCenterId
                                        canCheckIn = isCheckedOutOrTransferred && (centerFilter === userCenterId);
                                    } else if (["super_admin", "city_admin"].includes(userRole || "")) {
                                        // Super admins and city admins can check in to any center
                                        canCheckIn = isCheckedOutOrTransferred;
                                    }
                                    
                                    return {
                                        canCheckOut: individual?.can_check_out || false,
                                        canTransfer: individual?.can_transfer || false,
                                        canCheckIn: canCheckIn,
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
                defaultCenterId={centerFilter}
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
                defaultCenterId={centerFilter}
            />

            <TransferIndividualModal
                isOpen={isTransferModalOpen}
                defaultCenterId={centerFilter}
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
            />

            <SuccessToast
                isOpen={successToast.isOpen}
                message={successToast.message}
                onClose={handleToastClose}
            />
        </div>
    );
}