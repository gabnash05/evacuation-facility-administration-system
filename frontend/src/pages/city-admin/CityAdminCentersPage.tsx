"use client";

import { useState, useMemo } from "react";
import { EvacuationCenterTable } from "@/components/features/evacuation-center/EvacuationCenterTable";
import { EvacuationCenterTableToolbar } from "@/components/features/evacuation-center/EvacuationCenterTableToolbar";
import { EvacuationCenterTablePagination } from "@/components/features/evacuation-center/EvacuationCenterTablePagination";

// Generate 40 dummy evacuation centers
const generateDummyCenters = () => {
  const barangays = [
    "Hinaplanon", "Palao", "Mahayahay", "Tibanga", "San Miguel", 
    "Sta. Felomina", "Tominobo", "Upper Hinaplanon", "Puga-an", "Dalipuga",
    "Buru-un", "Suarez", "Tambo", "Ubaldo Laya", "Villa Verde",
    "Poblacion", "Bagong Silang", "Luinab", "San Roque", "Maria Cristina"
  ];
  
  const centerNames = [
    "Elementary School", "National High School", "Barangay Hall", "Gymnasium", 
    "Community Center", "Parish Church", "Covered Court", "Evacuation Center",
    "Sports Complex", "Multi-Purpose Hall"
  ];

  const centers = [];
  
  for (let i = 1; i <= 40; i++) {
    const barangay = barangays[Math.floor(Math.random() * barangays.length)];
    const centerType = centerNames[Math.floor(Math.random() * centerNames.length)];
    const capacity = Math.floor(Math.random() * 500) + 100; // 100-600 capacity
    const currentOccupancy = Math.floor(Math.random() * capacity);
    const usage = Math.round((currentOccupancy / capacity) * 100);
    
    const status: 'Active' | 'Inactive' = Math.random() > 0.3 ? 'Active' : 'Inactive';
    
    centers.push({
      id: i,
      name: `${barangay} ${centerType}`,
      barangay: barangay,
      status: status,
      capacity: capacity,
      currentOccupancy: currentOccupancy,
      usage: usage
    });
  }
  
  return centers;
};

export function CityAdminCentersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null; // Added null for unsorted state
  } | null>(null);

  // Generate all dummy data
  const allEvacuationCenters = useMemo(() => generateDummyCenters(), []);

  // Filter and paginate data based on search and pagination
  const filteredAndPaginatedCenters = useMemo(() => {
    // First, filter by search query
    let filtered = allEvacuationCenters;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = allEvacuationCenters.filter(center =>
        center.name.toLowerCase().includes(query) ||
        center.barangay.toLowerCase().includes(query) ||
        center.status.toLowerCase().includes(query)
      );
    }

    // Then, apply sorting only if sortConfig has a direction
    if (sortConfig && sortConfig.direction) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key as keyof typeof a];
        const bValue = b[sortConfig.key as keyof typeof b];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }
        
        return 0;
      });
    }

    // Finally, apply pagination
    const startIndex = (currentPage - 1) * entriesPerPage;
    const endIndex = startIndex + entriesPerPage;
    
    return filtered.slice(startIndex, endIndex);
  }, [allEvacuationCenters, searchQuery, sortConfig, currentPage, entriesPerPage]);

  // Total entries after filtering (for pagination)
  const totalFilteredEntries = useMemo(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return allEvacuationCenters.filter(center =>
        center.name.toLowerCase().includes(query) ||
        center.barangay.toLowerCase().includes(query) ||
        center.status.toLowerCase().includes(query)
      ).length;
    }
    return allEvacuationCenters.length;
  }, [allEvacuationCenters, searchQuery]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      // If clicking a different column, start with ascending
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      
      // If clicking the same column, cycle through states
      switch (current.direction) {
        case 'asc':
          return { key, direction: 'desc' };
        case 'desc':
          return { key, direction: null }; // Unsorted
        case null:
        default:
          return { key, direction: 'asc' };
      }
    });
    // Reset to first page when sorting
    setCurrentPage(1);
  };

  const handleAddCenter = () => {
    console.log("Add Center clicked");
    // Implementation for adding a new center
  };

  const handleEntriesPerPageChange = (entries: number) => {
    setEntriesPerPage(entries);
    // Reset to first page when changing entries per page
    setCurrentPage(1);
    // Clear sort when changing page size
    setSortConfig(null);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    // Reset to first page when searching
    setCurrentPage(1);
    // Clear sort when searching
    setSortConfig(null);
  };

  return (
    <div className="w-full min-w-0 bg-background flex flex-col relative p-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evacuation Centers</h1>
          <p className="text-muted-foreground">Manage evacuation centers and their information</p>
        </div>

        {/* Main Table Card */}
        <div className="border border-border">
          {/* Card Header */}
          <div className="bg-card border-b border-border p-4">
            <h3 className="font-semibold text-base text-foreground">Center List</h3>
          </div>

          {/* Controls Bar */}
          <div className="bg-card border-b border-border p-4">
            <EvacuationCenterTableToolbar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              onAddCenter={handleAddCenter}
              entriesPerPage={entriesPerPage}
              onEntriesPerPageChange={handleEntriesPerPageChange}
            />
          </div>

          {/* Table Section */}
          <div className="border-b border-border">
            <EvacuationCenterTable
              data={filteredAndPaginatedCenters}
              sortConfig={sortConfig}
              onSort={handleSort}
            />
          </div>

          {/* Pagination Section */}
          <div className="bg-card p-4">
            <EvacuationCenterTablePagination
              currentPage={currentPage}
              entriesPerPage={entriesPerPage}
              totalEntries={totalFilteredEntries}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}