"use client";

import { useState, useMemo } from "react";
import {
    SquarePen,
    Trash2,
    UserRoundCheck,
    Ambulance,
    HousePlus,
    HandHeart,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon,
    ChevronsUpDown,
    MoreVertical,
} from "lucide-react";
import { SearchBar } from "@/components/common/SearchBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Task {
    task: string;
    center: string;
    dateDeclared: string;
    endDate: string;
    status: "Active" | "Ongoing" | "Closed";
}

export function VolunteerDashboard() {
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(5);
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "asc" | "desc" | null;
    } | null>(null);

    const activeEventsData: Task[] = [
        {
            task: "Check-in evacuee",
            center: "Bagong Silang Barangay Hall/Gym",
            dateDeclared: "13/05/2022",
            endDate: "NA",
            status: "Active",
        },
        {
            task: "Distribute Relief",
            center: "Bagong Silang Barangay Hall/Gym",
            dateDeclared: "22/05/2022",
            endDate: "22/05/2022",
            status: "Ongoing",
        },
        {
            task: "Distribute Relief",
            center: "Bagong Silang Barangay Hall/Gym",
            dateDeclared: "15/06/2022",
            endDate: "15/06/2022",
            status: "Closed",
        },
        {
            task: "Distribute Relief",
            center: "Bagong Silang Barangay Hall/Gym",
            dateDeclared: "06/09/2022",
            endDate: "06/09/2022",
            status: "Closed",
        },
        {
            task: "Request Aid",
            center: "Bagong Silang Barangay Hall/Gym",
            dateDeclared: "25/09/2022",
            endDate: "25/09/2022",
            status: "Closed",
        },
        {
            task: "Check-in evacuee",
            center: "San Lorenzo Parish Church",
            dateDeclared: "10/06/2022",
            endDate: "NA",
            status: "Active",
        },
        {
            task: "Transfer Individual",
            center: "Don Juana Elementary School",
            dateDeclared: "18/07/2022",
            endDate: "18/07/2022",
            status: "Closed",
        },
        {
            task: "Register Household",
            center: "Tibanga Barangay Hall",
            dateDeclared: "02/08/2022",
            endDate: "02/08/2022",
            status: "Closed",
        },
        {
            task: "Distribute Relief",
            center: "Palao Community Center",
            dateDeclared: "15/09/2022",
            endDate: "NA",
            status: "Ongoing",
        },
        {
            task: "Request Aid",
            center: "Hinaplanon Evacuation Center",
            dateDeclared: "20/10/2022",
            endDate: "20/10/2022",
            status: "Closed",
        },
    ];

    const taskColumns = [
        { key: "task", label: "Task" },
        { key: "center", label: "Center" },
        { key: "dateDeclared", label: "Date Declared" },
        { key: "endDate", label: "End Date" },
        { key: "status", label: "Status" },
    ];

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (!current || current.key !== key) {
                return { key, direction: "asc" };
            }

            switch (current.direction) {
                case "asc":
                    return { key, direction: "desc" };
                case "desc":
                    return { key, direction: null };
                case null:
                default:
                    return { key, direction: "asc" };
            }
        });
        setCurrentPage(1);
    };

    const handleEntriesPerPageChange = (entries: number) => {
        setEntriesPerPage(entries);
        setCurrentPage(1);
    };

    const processedData = useMemo(() => {
        let filtered = activeEventsData.filter(row =>
            Object.values(row).some(value =>
                value.toString().toLowerCase().includes(searchQuery.toLowerCase())
            )
        );

        if (sortConfig && sortConfig.direction) {
            filtered = [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key as keyof typeof a];
                const bValue = b[sortConfig.key as keyof typeof b];

                if (typeof aValue === "string" && typeof bValue === "string") {
                    return sortConfig.direction === "asc"
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                if (typeof aValue === "number" && typeof bValue === "number") {
                    return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
                }

                return 0;
            });
        }

        return filtered;
    }, [searchQuery, sortConfig]);

    const totalPages = Math.ceil(processedData.length / entriesPerPage);
    const paginatedData = processedData.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );

    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        return sortConfig.direction ? (
            <ChevronsUpDown className="h-4 w-4 text-foreground" />
        ) : (
            <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200";
            case "Ongoing":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "Closed":
                return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200";
        }
    };

    const renderActions = (row: any, index: number) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log(`Edit task ${index}`)}>
                    <SquarePen className="h-4 w-4 mr-2" />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => console.log(`Delete task ${index}`)}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <div className="w-full min-w-0 bg-background flex flex-col">
            {/* Quick Action Section */}
            <div className="p-none mt-12">
                <h2 className="text-2xl font-semibold text-center mb-8">Quick Action</h2>

                <div className="flex justify-center gap-6 mb-12">
                    {[
                        { label: "Check-in Evacuee", color: "bg-blue-500", icon: UserRoundCheck },
                        { label: "Transfer Individual", color: "bg-red-500", icon: Ambulance },
                        { label: "Register Household", color: "bg-orange-500", icon: HousePlus },
                        { label: "Distribute Relief", color: "bg-green-500", icon: HandHeart },
                    ].map((action, i) => (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <div
                                className={`${action.color} w-20 h-20 rounded-lg flex items-center justify-center text-white shadow-md hover:shadow-lg transition-shadow cursor-pointer relative`}
                            >
                                <action.icon className="w-10 h-10" />
                            </div>
                            <p className="text-sm font-medium text-center">{action.label}</p>
                        </div>
                    ))}
                </div>

                {/* Active Events Section */}
                <div className="border border-border py-4 text-center mb-0">
                    <h2 className="text-2xl font-semibold">Active Events</h2>
                </div>

                {/* Controls Bar */}
                <div className="bg-card border border-border border-t-0 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Show</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={entriesPerPage}
                                    onChange={e => {
                                        const value = parseInt(e.target.value) || 1;
                                        handleEntriesPerPageChange(
                                            Math.max(1, Math.min(20, value))
                                        );
                                    }}
                                    className="w-16 h-9 px-2 border border-border rounded-lg bg-background 
                  text-foreground font-medium text-center [appearance:textfield]
                   [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none hover:[appearance:auto] 
                   hover:[&::-webkit-outer-spin-button]:appearance-auto hover:[&::-webkit-inner-spin-button]:appearance-auto"
                                />
                                <span>Entries</span>
                                <span className="ml-2 text-foreground font-medium">
                                    {processedData.length > 0
                                        ? `${(currentPage - 1) * entriesPerPage + 1}-${Math.min(currentPage * entriesPerPage, processedData.length)}`
                                        : "0-0"}
                                </span>
                                <span>of {processedData.length}</span>
                            </div>

                            <SearchBar
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={setSearchQuery}
                            />
                        </div>

                        {/* Simplified Pagination */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>

                            <div className="px-3 py-1 text-sm rounded bg-primary text-primary-foreground">
                                {currentPage}
                            </div>

                            <button
                                onClick={() =>
                                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                                }
                                disabled={currentPage === totalPages}
                                className="p-1 rounded border border-border hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Next page"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table Content with Fixed Height */}
                <div className="border border-border border-t-0">
                    <div className="min-h-[234px]">
                        {paginatedData.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[234px] text-muted-foreground">
                                <SearchIcon className="h-12 w-12 mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">No tasks found</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {taskColumns.map(column => (
                                            <TableHead key={column.key}>
                                                <div
                                                    className="flex items-center justify-between cursor-pointer hover:text-foreground"
                                                    onClick={() => handleSort(column.key)}
                                                >
                                                    {column.label}
                                                    {getSortIcon(column.key)}
                                                </div>
                                            </TableHead>
                                        ))}
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedData.map((row, i) => (
                                        <TableRow
                                            key={i}
                                            className={`${i % 2 === 1 ? "bg-muted" : ""}`}
                                        >
                                            {taskColumns.map(column => (
                                                <TableCell
                                                    key={column.key}
                                                    className={
                                                        column.key === taskColumns[0].key
                                                            ? "font-medium"
                                                            : ""
                                                    }
                                                >
                                                    {column.key === "status" ? (
                                                        <Badge
                                                            variant="secondary"
                                                            className={getStatusColor(
                                                                row[
                                                                    column.key as keyof Task
                                                                ] as string
                                                            )}
                                                        >
                                                            {row[column.key as keyof Task]}
                                                        </Badge>
                                                    ) : (
                                                        row[column.key as keyof Task]
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell onClick={e => e.stopPropagation()}>
                                                {renderActions(row, i)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
