"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronsUpDown } from "lucide-react";

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DataTableProps {
  title?: string;
  columns: Column[];
  data: any[];
  onRowClick?: (row: any, index: number) => void;
  onSort?: (column: string) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  renderCell?: (key: string, value: any, row: any) => React.ReactNode;
  renderActions?: (row: any, index: number) => React.ReactNode;
  showTitle?: boolean;
  fixedHeight?: boolean; 
}

export function DataTable({
  title,
  columns,
  data,
  onRowClick,
  onSort,
  sortColumn,
  sortDirection,
  renderCell,
  renderActions,
  showTitle = true,
  fixedHeight = true, 
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

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === "asc" ? (
      <ChevronsUpDown className="h-4 w-4 text-foreground" />
    ) : (
      <ChevronsUpDown className="h-4 w-4 text-foreground" />
    );
  };

  return (
    <div className="border-t-0">
      {showTitle && title && (
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-base text-foreground">{title}</h3>
        </div>
      )}
      <div className={fixedHeight ? "min-h-[273px]" : ""}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>
                  <div 
                    className={`flex items-center justify-between ${
                      column.sortable !== false && onSort ? "cursor-pointer hover:text-foreground" : ""
                    }`}
                    onClick={() => column.sortable !== false && onSort?.(column.key)}
                  >
                    {column.label}
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
              {renderActions && <TableHead>Action</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (renderActions ? 1 : 0)} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}