import { useState } from "react";
import HouseholdTable, { type TableHeader } from "@/components/features/auth/household/HouseholdTable";
import { DataTablePagination } from "@/components/features/auth/household/DataTablePagination";
import { SearchBar } from "@/components/features/auth/household/Searchbar";

export function CityAdminHouseholdsPage() {
  const ROWS_PER_PAGE = 15;
  const [pageIndex, setPageIndex] = useState(0);
  const [householdsData, setHouseholdsData] = useState<any[]>([]);

  const headers: TableHeader[] = [
    { key: "name",       text: "Household Name",    className: "text-center" },
    { key: "head",       text: "Household Head",    className: "text-center" },
    { key: "address",    text: "Address",           className: "text-center" },
    { key: "evacCenter", text: "Evacuation Center", className: "text-center" },
  ];

  const pageCount = householdsData.length > 0 ? Math.ceil(householdsData.length / ROWS_PER_PAGE) : 1;
  const canPreviousPage = pageIndex > 0;
  const canNextPage = pageIndex < pageCount - 1;

  const currentPageData = householdsData.slice(
    pageIndex * ROWS_PER_PAGE,
    (pageIndex * ROWS_PER_PAGE) + ROWS_PER_PAGE
  );


  return (
    <div className="w-full bg-background text-foreground p-8 space-y-6">
      <h1 className="text-3xl font-bold">City Admin - Household Management</h1>

      <SearchBar
        placeholder="Search households..."
        className="max-w-sm" 
      />

      <div className="border border-border rounded-lg bg-card">
        <HouseholdTable
          headers={headers}
          data={currentPageData}
        />
        <DataTablePagination
          pageIndex={pageIndex}
          pageCount={pageCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          onPreviousPage={() => setPageIndex(pageIndex - 1)}
          onNextPage={() => setPageIndex(pageIndex + 1)}
        />
      </div>
    </div>
  );
}