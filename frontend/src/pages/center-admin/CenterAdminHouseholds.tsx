// CenterAdminHouseholds.tsx

import { useState, useEffect } from "react";
import HouseholdTable, { type TableHeader } from "@/components/features/auth/household/HouseholdTable";
import { DataTablePagination } from "@/components/features/auth/household/DataTablePagination"; 
import { SearchBar } from "@/components/features/auth/household/Searchbar";

// Define an interface for the pagination metadata from the API
interface PaginationState {
  page: number;
  per_page: number;
  page_count: number;
  total_records: number;
  can_next_page: boolean;
  can_previous_page: boolean;
}

export function CenterAdminHouseholdsPage() {
  // --- STATE MANAGEMENT ---
  const [householdsData, setHouseholdsData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State for pagination, initialized with default values
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    per_page: 15,
    page_count: 1,
    total_records: 0,
    can_next_page: false,
    can_previous_page: false,
  });

  // --- DATA FETCHING ---
  
  // Effect to fetch data when page or search query changes
  useEffect(() => {
    const fetchHouseholds = async () => {
      setIsLoading(true);
      try {
        // Construct the URL with query parameters for pagination and search
        const params = new URLSearchParams({
          page: String(pagination.page),
          per_page: String(pagination.per_page),
          search: debouncedSearchQuery,
        });
        
        const response = await fetch(`http://localhost:5000/api/households?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const result = await response.json();
        
        // Update state with data and pagination info from the API
        setHouseholdsData(result.data);
        setPagination(result.pagination);

      } catch (error) {
        console.error("Error fetching households:", error);
        // Handle error state here, e.g., show a toast notification
      } finally {
        setIsLoading(false);
      }
    };

    fetchHouseholds();
  }, [pagination.page, pagination.per_page, debouncedSearchQuery]);
  
  // Effect to debounce the search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to page 1 when a new search is performed
      if (pagination.page !== 1) {
          setPagination(p => ({ ...p, page: 1 }));
      }
    }, 500); // 500ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);


  // --- COMPONENT LOGIC ---
  const headers: TableHeader[] = [
    { key: "name",    text: "HOUSEHOLD NAME", className: "text-center" },
    { key: "head",    text: "HOUSEHOLD HEAD", className: "text-center" },
    { key: "address", text: "ADDRESS",        className: "text-center" },
  ];

  return (
    <div className="w-full bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-6">
        Center Admin - Household Management
      </h1>

      <SearchBar
        placeholder="Search households..."
        className="max-w-sm"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className="border border-border rounded-lg bg-card">
        <HouseholdTable
          headers={headers}
          // Show a loading message or the data
          data={isLoading ? [] : householdsData}
        />

        <DataTablePagination
          pageIndex={pagination.page - 1} // API is 1-based, component is 0-based
          pageCount={pagination.page_count}
          canPreviousPage={pagination.can_previous_page}
          canNextPage={pagination.can_next_page}
          onPreviousPage={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
          onNextPage={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
        />
      </div>
    </div>
  );
}