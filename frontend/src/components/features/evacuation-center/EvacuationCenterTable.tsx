import { ChevronUp, ChevronDown, ChevronsUpDown, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Edit, Trash2 } from "lucide-react";

interface EvacuationCenter {
  id: number;
  name: string;
  barangay: string;
  status: 'Active' | 'Inactive';
  capacity: number;
  currentOccupancy: number;
  usage: number;
}

interface EvacuationCenterTableProps {
  data: EvacuationCenter[];
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc' | null; // Added null for unsorted state
  } | null;
  onSort: (key: string) => void;
}

export function EvacuationCenterTable({ data, sortConfig, onSort }: EvacuationCenterTableProps) {
  const getSortIcon = (key: string) => {
    // If no sort config or different column, show neutral icon
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    
    // If same column, show appropriate icon based on direction
    switch (sortConfig.direction) {
      case 'asc':
        return <ChevronUp className="h-4 w-4" />;
      case 'desc':
        return <ChevronDown className="h-4 w-4" />;
      case null:
      default:
        return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Adjusted pixel widths to prevent header cutoff
  const columnWidths = {
    name: '280px',
    barangay: '150px',
    status: '120px',
    capacity: '130px',
    currentOccupancy: '180px', // Increased to prevent cutoff
    usage: '140px',
    actions: '100px'
  };

  const headers = [
    { key: 'name', label: 'Center Name', sortable: true, width: columnWidths.name },
    { key: 'barangay', label: 'Barangay', sortable: true, width: columnWidths.barangay },
    { key: 'status', label: 'Status', sortable: true, width: columnWidths.status },
    { key: 'capacity', label: 'Capacity', sortable: true, width: columnWidths.capacity },
    { key: 'currentOccupancy', label: 'Current Occupancy', sortable: true, width: columnWidths.currentOccupancy },
    { key: 'usage', label: 'Usage', sortable: true, width: columnWidths.usage },
    { key: 'actions', label: 'Action', sortable: false, width: columnWidths.actions }
  ];

  const getStatusStyles = (status: 'Active' | 'Inactive') => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700 border-green-100 dark:bg-green-900 dark:text-green-200 dark:border-green-900";
      case "Inactive":
        return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
      default:
        return "bg-gray-100 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800";
    }
  };

  return (
    <div className="w-full">
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((header) => (
              <TableHead 
                key={header.key}
                className={cn(
                  header.sortable && "cursor-pointer hover:bg-muted",
                  "font-semibold py-3 text-left" // Added text-left for headers
                )}
                style={{ width: header.width }}
                onClick={header.sortable ? () => onSort(header.key) : undefined}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate block font-medium">{header.label}</span>
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
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={7} 
                className="h-32 text-center"
                style={{ width: '100%' }}
              >
                <div className="text-muted-foreground flex flex-col items-center justify-center">
                  <div className="text-lg font-medium mb-2">No evacuation centers found</div>
                  <div className="text-sm">Add your first evacuation center to get started</div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            data.map((center, index) => (
              <TableRow 
                key={center.id} 
                className={cn(
                  "cursor-pointer hover:bg-muted/50 transition-colors",
                  index % 2 === 1 ? "bg-muted/30" : ""
                )}
              >
                <TableCell 
                  className="font-medium py-3 truncate align-top text-left"
                  style={{ width: columnWidths.name }}
                  title={center.name}
                >
                  {center.name}
                </TableCell>
                <TableCell 
                  className="py-3 truncate align-top text-left"
                  style={{ width: columnWidths.barangay }}
                  title={center.barangay}
                >
                  {center.barangay}
                </TableCell>
                <TableCell 
                  className="py-3 align-top text-left"
                  style={{ width: columnWidths.status }}
                >
                  <Badge 
                    variant="secondary"
                    className={cn(getStatusStyles(center.status), "truncate max-w-full inline-block")}
                  >
                    {center.status}
                  </Badge>
                </TableCell>
                <TableCell 
                  className="py-3 align-top text-left" // Changed from text-right to text-left
                  style={{ width: columnWidths.capacity }}
                >
                  {center.capacity.toLocaleString()}
                </TableCell>
                <TableCell 
                  className="py-3 align-top text-left" // Changed from text-right to text-left
                  style={{ width: columnWidths.currentOccupancy }}
                >
                  {center.currentOccupancy.toLocaleString()}
                </TableCell>
                <TableCell 
                  className="py-3 align-top text-left"
                  style={{ width: columnWidths.usage }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-secondary rounded-full h-2 flex-shrink-0">
                      <div 
                        className={cn(
                          "h-2 rounded-full",
                          center.usage >= 80 ? "bg-red-500" :
                          center.usage >= 60 ? "bg-yellow-500" : "bg-green-500"
                        )} 
                        style={{ width: `${center.usage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium whitespace-nowrap">
                      {center.usage}%
                    </span>
                  </div>
                </TableCell>
                <TableCell 
                  className="py-3 align-top text-left" // Changed from text-center to text-left
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
                      <DropdownMenuItem onClick={() => console.log(`Edit ${center.id}`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => console.log(`Delete ${center.id}`)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
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