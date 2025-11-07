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
import { ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface Column {
    key: string;
    label: string;
    sortable?: boolean;
    className?: string;
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
}: DataTableProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            case "Monitoring":
            case "Ongoing":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "Resolved":
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
        // If this column is not being sorted, show neutral icon
        if (sortColumn !== columnKey) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        // If this column is being sorted, show direction-specific icon
        if (sortDirection === "asc") {
            return <ChevronUp className="h-4 w-4 text-foreground" />;
        } else {
            return <ChevronDown className="h-4 w-4 text-foreground" />;
        }
    };

    return (
        <div className="border border-border border-t-0">
            {showTitle && title && (
                <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-base text-foreground">{title}</h3>
                </div>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map(column => (
                            <TableHead key={column.key} className={column.className || ""}>
                                <div
                                    className={`flex items-center justify-between ${
                                        column.sortable !== false && onSort
                                            ? "cursor-pointer hover:text-foreground"
                                            : ""
                                    }`}
                                    onClick={() =>
                                        column.sortable !== false && onSort?.(column.key)
                                    }
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
                        <TableRow></TableRow>
                    ) : (
                        data.map((row, i) => (
                            <TableRow
                                key={i}
                                className={`${i % 2 === 1 ? "bg-muted" : ""} ${
                                    onRowClick
                                        ? "cursor-pointer hover:bg-muted/50 transition-colors"
                                        : ""
                                }`}
                                onClick={() => onRowClick?.(row, i)}
                            >
                                {columns.map(column => (
                                    <TableCell
                                        key={column.key}
                                        className={`
                      ${column.key === columns[0].key ? "font-medium" : ""}
                      ${column.className || ""}
                    `}
                                        title={
                                            column.className?.includes("truncate")
                                                ? String(row[column.key])
                                                : undefined
                                        }
                                    >
                                        {renderCell
                                            ? renderCell(column.key, row[column.key], row)
                                            : defaultRenderCell(column.key, row[column.key], row)}
                                    </TableCell>
                                ))}
                                {renderActions && (
                                    <TableCell onClick={e => e.stopPropagation()}>
                                        {renderActions(row, i)}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
