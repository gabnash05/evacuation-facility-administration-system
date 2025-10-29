"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Filter, ChevronsUpDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  showEntries?: boolean;
  entriesPerPage?: number;
  onEntriesChange?: (value: number) => void;
  showSearch?: boolean;
  showFilter?: boolean;
  onRowClick?: (row: any, index: number) => void;
  renderCell?: (key: string, value: any, row: any) => React.ReactNode;
  renderActions?: (row: any, index: number) => React.ReactNode;
}

export function DataTable({
  title,
  columns,
  data,
  showEntries = true,
  entriesPerPage = 10,
  onEntriesChange,
  showSearch = true,
  showFilter = false,
  onRowClick,
  renderCell,
  renderActions,
}: DataTableProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
      case "Recovery":
      case "Ongoing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Closed":
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const defaultRenderCell = (key: string, value: any, row: any) => {
    if (key === "status") {
      return (
        <Badge variant="secondary" className={getStatusColor(value)}>
          {value}
        </Badge>
      );
    }
    return value;
  };

  return (
    <div className="p-0">
      {/* Controls Bar */}
      <div className="bg-card border border-border p-4">
        <div className="flex items-center justify-between">
          {showEntries && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Show</span>
              <Input
                type="number"
                value={entriesPerPage}
                onChange={(e) => onEntriesChange?.(Number(e.target.value))}
                className="w-16 h-9 text-center"
                min={1}
              />
              <span>entries</span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search..." className="w-64 h-9 pl-9" />
              </div>
            )}
            {showFilter && (
              <button className="bg-muted hover:bg-muted/80 p-2 h-9 w-9 flex items-center justify-center border border-border rounded">
                <Filter className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <div className="flex items-center justify-between">
                    {column.label}
                    {column.sortable !== false && (
                      <ChevronsUpDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
              ))}
              {renderActions && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, i) => (
              <TableRow
                key={i}
                className={`${i % 2 === 1 ? "bg-muted" : ""} ${
                  onRowClick ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""
                }`}
                onClick={() => onRowClick?.(row, i)}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} className={column.key === columns[0].key ? "font-medium" : ""}>
                    {renderCell
                      ? renderCell(column.key, row[column.key], row)
                      : defaultRenderCell(column.key, row[column.key], row)}
                  </TableCell>
                ))}
                {renderActions && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {renderActions(row, i)}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}