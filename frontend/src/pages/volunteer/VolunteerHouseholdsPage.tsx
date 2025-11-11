import { useEffect, useMemo, useState } from "react";
import { HouseholdTable } from "@/components/features/household/HouseholdTable";
import { HouseholdTableToolbar } from "@/components/features/household/HouseholdTableToolbar";
import { TablePagination } from "@/components/common/TablePagination";
import { AddHouseholdModal } from "@/components/features/household/AddHouseholdModal";
import { EditHouseholdModal } from "@/components/features/household/EditHouseholdModal";
import { SuccessToast } from "@/components/common/SuccessToast";
import { useHouseholdStore } from "@/store/householdStore";
import { useUserStore } from "@/store/userStore";
import { debounce } from "@/utils/helpers";

export function VolunteerHouseholdsPage() {
    const { households, loading: householdsLoading, error, searchQuery, currentPage, entriesPerPage, sortConfig, pagination, setSearchQuery, setCurrentPage, setEntriesPerPage, setSortConfig, fetchHouseholds, deleteHousehold } = useHouseholdStore();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedHouseholdId, setSelectedHouseholdId] = useState<number | null>(null);
    const [successToast, setSuccessToast] = useState({ isOpen: false, message: "" });
    const { currentUser, loading: userLoading, initializeCurrentUser } = useUserStore();
    const centerId = currentUser?.center_id;

    useEffect(() => {
        initializeCurrentUser();
    }, [initializeCurrentUser]);

    const debouncedFetchHouseholds = useMemo(() => debounce(() => { if (centerId) { fetchHouseholds(centerId); } }, 500), [fetchHouseholds, centerId]);

    useEffect(() => {
        if (centerId) {
            debouncedFetchHouseholds();
        }
    }, [searchQuery, currentPage, entriesPerPage, sortConfig, centerId, debouncedFetchHouseholds]);

    const handleSort = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            setSortConfig({ key, direction: "asc" });
            return;
        }
        switch (sortConfig.direction) {
            case "asc": setSortConfig({ key, direction: "desc" }); break;
            case "desc": setSortConfig({ key, direction: null }); break;
            default: setSortConfig({ key, direction: "asc" }); break;
        }
    };

    const handleOpenEditModal = (id: number) => { setSelectedHouseholdId(id); setIsEditModalOpen(true); };
    const handleDelete = async (id: number) => { try { await deleteHousehold(id); showSuccessToast("Household deleted successfully"); } catch (error) { console.error("Error deleting household:", error); } };
    const handleEntriesPerPageChange = (entries: number) => { setEntriesPerPage(entries); setCurrentPage(1); };
    const handleSearchChange = (query: string) => { setSearchQuery(query); setCurrentPage(1); };
    const handlePageChange = (page: number) => { setCurrentPage(page); };
    const showSuccessToast = (message: string) => { setSuccessToast({ isOpen: true, message }); };
    
    const headers = [ { key: "householdName", label: "Household Name", sortable: true }, { key: "householdHead", label: "Household Head", sortable: true }, { key: "address", label: "Address", sortable: true }, ];
    const tableData = households.map(h => ({ household_id: h.household_id, householdName: h.household_name, householdHead: h.household_head ? `${h.household_head.first_name} ${h.household_head.last_name}` : "N/A", address: h.address || "N/A", }));

    if (userLoading) {
        return <div className="p-6 text-center text-muted-foreground">Loading user information...</div>;
    }
    if (!centerId) {
        return <div className="p-6"><div className="bg-destructive/15 text-destructive p-4 rounded-md"><span className="text-sm font-medium">Error: You are not assigned to an evacuation center. Please contact an administrator.</span></div></div>;
    }

    return (
        <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
            <div className="space-y-6">
                <div><h1 className="text-2xl font-bold">Household Management</h1><p className="text-muted-foreground">Manage records for your center.</p></div>
                {error && <div className="bg-destructive/15 text-destructive p-4 rounded-md">{error}</div>}
                <div className="border rounded-lg">
                    <div className="p-4 bg-card border-b"><HouseholdTableToolbar searchQuery={searchQuery} onSearchChange={handleSearchChange} onAddHousehold={() => setIsAddModalOpen(true)} entriesPerPage={entriesPerPage} onEntriesPerPageChange={handleEntriesPerPageChange} loading={householdsLoading} /></div>
                    <div className="border-b">{householdsLoading && households.length === 0 ? (<div className="p-8 text-center text-muted-foreground">Loading...</div>) : (<HouseholdTable headers={headers} data={tableData} sortConfig={sortConfig} onSort={handleSort} onEdit={handleOpenEditModal} onDelete={handleDelete} loading={householdsLoading} />)}</div>
                    <div className="p-4 bg-card"><TablePagination currentPage={currentPage} entriesPerPage={entriesPerPage} totalEntries={pagination?.total_items || 0} onPageChange={handlePageChange} loading={householdsLoading} entriesLabel="households" /></div>
                </div>
            </div>
            <AddHouseholdModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { setIsAddModalOpen(false); showSuccessToast("Household created"); if (centerId) fetchHouseholds(centerId); }} defaultCenterId={centerId} />
            <EditHouseholdModal isOpen={isEditModalOpen} householdId={selectedHouseholdId} onClose={() => setIsEditModalOpen(false)} onSuccess={() => { setIsEditModalOpen(false); showSuccessToast("Household updated"); if (centerId) fetchHouseholds(centerId); }} isCenterAdminView={true} />
            <SuccessToast isOpen={successToast.isOpen} message={successToast.message} onClose={() => setSuccessToast({isOpen: false, message: ""})} />
        </div>
    );
}   