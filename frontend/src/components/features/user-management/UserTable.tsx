import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Edit, Trash2, Users, Building } from "lucide-react";
import type { User } from "@/types/user";
import { useUserStore } from "@/store/userStore";

interface UserTableProps {
    data: User[];
    sortConfig: {
        key: string;
        direction: "asc" | "desc" | null;
    } | null;
    onSort: (key: string) => void;
    loading?: boolean;
    userRole: string | undefined;
}

export function UserTable({ data, sortConfig, onSort, loading, userRole }: UserTableProps) {
    const { deleteUser, deactivateUser } = useUserStore();

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        switch (sortConfig.direction) {
            case "asc":
                return <ChevronUp className="h-4 w-4" />;
            case "desc":
                return <ChevronDown className="h-4 w-4" />;
            case null:
            default:
                return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }
    };

    // Check if user can delete (only super_admin)
    const canDelete = userRole === "super_admin";

    const columnWidths = {
        email: "280px",
        role: "140px",
        center_name: "200px",
        status: "120px",
        actions: "100px",
    };

    const headers = [
        { key: "email", label: "Email", sortable: true, width: columnWidths.email },
        { key: "role", label: "Role", sortable: true, width: columnWidths.role },
        {
            key: "center_name",
            label: "Assigned Center",
            sortable: true,
            width: columnWidths.center_name,
        },
        { key: "status", label: "Status", sortable: true, width: columnWidths.status },
        { key: "actions", label: "Action", sortable: false, width: columnWidths.actions },
    ];

    const getRoleStyles = (role: string) => {
        switch (role.toLowerCase()) {
            case "super_admin":
                return "bg-purple-100 text-purple-700 border-purple-100 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-900";
            case "city_admin":
                return "bg-blue-100 text-blue-700 border-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-900";
            case "center_admin":
                return "bg-orange-100 text-orange-700 border-orange-100 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-900";
            case "volunteer":
                return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
            default:
                return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
        }
    };

    const getStatusStyles = (isActive: boolean) => {
        return isActive
            ? "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900"
            : "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getRoleIcon = (role: string) => {
        switch (role.toLowerCase()) {
            case "super_admin":
                return <Users className="h-3 w-3 mr-1" />;
            case "city_admin":
                return <Building className="h-3 w-3 mr-1" />;
            case "center_admin":
                return <Building className="h-3 w-3 mr-1" />;
            case "volunteer":
                return <Users className="h-3 w-3 mr-1" />;
            default:
                return <Users className="h-3 w-3 mr-1" />;
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            try {
                await deleteUser(id);
            } catch (error) {
                console.error("Failed to delete user:", error);
            }
        }
    };

    const handleDeactivate = async (id: number, isActive: boolean) => {
        const action = isActive ? "deactivate" : "activate";
        if (confirm(`Are you sure you want to ${action} this user?`)) {
            try {
                await deactivateUser(id);
            } catch (error) {
                console.error(`Failed to ${action} user:`, error);
            }
        }
    };

    return (
        <div className="w-full">
            <Table className="table-fixed w-full">
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {headers.map(header => (
                            <TableHead
                                key={header.key}
                                className={cn(
                                    header.sortable && "cursor-pointer hover:bg-muted",
                                    "font-semibold py-3 text-left"
                                )}
                                style={{ width: header.width }}
                                onClick={header.sortable ? () => onSort(header.key) : undefined}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="truncate block font-medium">
                                        {header.label}
                                    </span>
                                    {header.sortable && (
                                        <span className="flex-shrink-0 ml-2">
                                            {getSortIcon(header.key)}
                                        </span>
                                    )}
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 && !loading ? (
                        <TableRow>
                            <TableCell
                                colSpan={6}
                                className="h-32 text-center"
                                style={{ width: "100%" }}
                            >
                                <div className="text-muted-foreground flex flex-col items-center justify-center">
                                    <div className="text-lg font-medium mb-2">No users found</div>
                                    <div className="text-sm">
                                        Add your first user to get started
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((user, index) => (
                            <TableRow
                                key={user.user_id}
                                className={cn(
                                    "cursor-pointer hover:bg-muted/50 transition-colors",
                                    index % 2 === 1 ? "bg-muted/30" : ""
                                )}
                            >
                                <TableCell
                                    className="font-medium py-3 truncate align-top text-left"
                                    style={{ width: columnWidths.email }}
                                    title={user.email}
                                >
                                    {user.email}
                                </TableCell>
                                <TableCell
                                    className="py-3 align-top text-left"
                                    style={{ width: columnWidths.role }}
                                >
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            getRoleStyles(user.role),
                                            "truncate max-w-full inline-block capitalize"
                                        )}
                                    >
                                        <div className="flex items-center">
                                            {getRoleIcon(user.role)}
                                            {user.role.replace("_", " ")}
                                        </div>
                                    </Badge>
                                </TableCell>
                                <TableCell
                                    className="py-3 truncate align-top text-left"
                                    style={{ width: columnWidths.center_name }}
                                    title={user.center_name || "Not assigned"}
                                >
                                    {user.center_name || (
                                        <span className="text-muted-foreground italic">
                                            Not assigned
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell
                                    className="py-3 align-top text-left"
                                    style={{ width: columnWidths.status }}
                                >
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            getStatusStyles(user.is_active),
                                            "truncate max-w-full inline-block"
                                        )}
                                    >
                                        {user.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </TableCell>
                                <TableCell
                                    className="py-3 align-top text-left"
                                    style={{ width: columnWidths.actions }}
                                >
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                                <span className="sr-only">Open menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={() => console.log(`Edit ${user.user_id}`)}
                                            >
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit
                                            </DropdownMenuItem>
                                            {/*
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    handleDeactivate(user.user_id, user.is_active)
                                                }
                                            >
                                                <Users className="h-4 w-4 mr-2" />
                                                {user.is_active ? "Deactivate" : "Activate"}
                                            </DropdownMenuItem>
                                            */}
                                            {canDelete && ( // Only show delete button for super_admin
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(user.user_id)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
