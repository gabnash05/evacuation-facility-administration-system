// components/features/attendance/VolunteerAttendancePage.tsx
import { useEffect, useMemo, useState } from "react";
import { AttendanceTable } from "@/components/features/attendance/AttendanceTable";
import { AttendanceTableToolbar } from "@/components/features/attendance/AttendanceTableToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { CheckInModal } from "@/components/features/attendance/CheckInModal";
import { CheckOutModal } from "@/components/features/attendance/CheckOutModal";
import { TransferModal } from "@/components/features/attendance/TransferModal";
import { SuccessToast } from "@/components/common/SuccessToast";
import { useAttendanceStore } from "@/store/attendanceRecordsStore";
import { debounce } from "@/utils/helpers";
import { useAuthStore } from "@/store/authStore";

export function VolunteerAttendancePage() {
    const {
        attendanceRecords,
        loading,
        error,
        searchQuery,
        currentPage,
        entriesPerPage,
        sortConfig,
        pagination,
        setSearchQuery,
        setCurrentPage,
        setEntriesPerPage,
        setSortConfig,
        setFilters,
        fetchAttendanceRecords,
        deleteAttendanceRecord,
    } = useAttendanceStore();

    // Get current user and center_id
    const { user } = useAuthStore();
    const userRole = user?.role;
    const centerId = user?.center_id;

    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
    const [successToast, setSuccessToast] = useState({
        isOpen: false,
        message: "",
    });

    const debouncedFetchAttendanceRecords = useMemo(
        () => debounce(() => fetchAttendanceRecords(), 500),
        [fetchAttendanceRecords]
    );

    // Set center filter and fetch records when centerId is available
    useEffect(() => {
        if (centerId) {
            setFilters({ centerId });
        }
    }, [centerId, setFilters]);

    useEffect(() => {
        if (centerId) {
            debouncedFetchAttendanceRecords();
        }
    }, [searchQuery, currentPage, entriesPerPage, sortConfig, centerId, debouncedFetchAttendanceRecords]);

    const handleSort = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            setSortConfig({ key, direction: "asc" });
            return;
        }

        switch (sortConfig.direction) {
            case "asc":
                setSortConfig({ key, direction: "desc" });
                break;
            case "desc":
                setSortConfig(null);
                break;
            case null:
                // Shouldn't happen, but handle it
                setSortConfig({ key, direction: "asc" });
                break;
        }
    };

    const handleOpenCheckOutModal = (id: number) => {
        setSelectedRecordId(id);
        setIsCheckOutModalOpen(true);
    };

    const handleOpenTransferModal = (id: number) => {
        setSelectedRecordId(id);
        setIsTransferModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await deleteAttendanceRecord(id);
            showSuccessToast("Attendance record deleted successfully");
        } catch (error) {
            console.error("Error deleting attendance record:", error);
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

    const handleToastClose = () => {
        setSuccessToast({ isOpen: false, message: "" });
    };

    const showSuccessToast = (message: string) => {
        setSuccessToast({ isOpen: true, message });
    };

    const headers = [
        { key: "individual_name", label: "Individual", sortable: true },
        { key: "center_name", label: "Center", sortable: true },
        { key: "event_name", label: "Event", sortable: true },
        { key: "household_name", label: "Household", sortable: true },
        { key: "status", label: "Status", sortable: true },
        { key: "check_in_time", label: "Check In", sortable: true },
        { key: "check_out_time", label: "Check Out", sortable: true },
        { key: "transfer_time", label: "Transfer", sortable: true },
    ];

    const tableData = attendanceRecords.map(record => ({
        record_id: record.record_id,
        individual_name: record.individual_name || "N/A",
        center_name: record.center_name || `Center ${record.center_id}`,
        event_name: record.event_name || `Event ${record.event_id}`,
        household_name: record.household_name || `Household ${record.household_id}`,
        status: record.status,
        check_in_time: record.check_in_time
            ? new Date(record.check_in_time).toLocaleString()
            : "N/A",
        check_out_time: record.check_out_time
            ? new Date(record.check_out_time).toLocaleString()
            : "N/A",
        transfer_time: record.transfer_time
            ? new Date(record.transfer_time).toLocaleString()
            : "N/A",
        notes: record.notes,
    }));

    if (!centerId) {
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
                        View and manage attendance records for your center.
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
                        <AttendanceTableToolbar
                            searchQuery={searchQuery}
                            onSearchChange={handleSearchChange}
                            onCheckIn={() => setIsCheckInModalOpen(true)}
                            entriesPerPage={entriesPerPage}
                            onEntriesPerPageChange={handleEntriesPerPageChange}
                            loading={loading}
                        />
                    </div>
                    <div className="border-b border-border">
                        {loading && attendanceRecords.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="text-muted-foreground">
                                    Loading attendance records...
                                </div>
                            </div>
                        ) : (
                            <AttendanceTable
                                headers={headers}
                                data={tableData}
                                sortConfig={sortConfig}
                                onSort={handleSort}
                                onCheckOut={handleOpenCheckOutModal}
                                onTransfer={handleOpenTransferModal}
                                onDelete={handleDelete}
                                loading={loading}
                                userRole={userRole}
                            />
                        )}
                    </div>
                    <div className="bg-card p-4">
                        <TablePagination
                            currentPage={currentPage}
                            entriesPerPage={entriesPerPage}
                            totalEntries={pagination?.total_items || 0}
                            onPageChange={handlePageChange}
                            loading={loading}
                            entriesLabel="attendance records"
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <CheckInModal
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                onSuccess={() => {
                    setIsCheckInModalOpen(false);
                    showSuccessToast("Individual checked in successfully");
                    fetchAttendanceRecords();
                }}
                defaultCenterId={centerId} // This locks the center field in the modal
            />

            <CheckOutModal
                isOpen={isCheckOutModalOpen}
                recordId={selectedRecordId}
                onClose={() => setIsCheckOutModalOpen(false)}
                onSuccess={() => {
                    setIsCheckOutModalOpen(false);
                    showSuccessToast("Individual checked out successfully");
                    fetchAttendanceRecords();
                }}
            />

            <TransferModal
                isOpen={isTransferModalOpen}
                recordId={selectedRecordId}
                onClose={() => setIsTransferModalOpen(false)}
                onSuccess={() => {
                    setIsTransferModalOpen(false);
                    showSuccessToast("Individual transferred successfully");
                    fetchAttendanceRecords();
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