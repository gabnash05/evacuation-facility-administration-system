import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EvacuationCenterTableToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddCenter: () => void;
  entriesPerPage: number;
  onEntriesPerPageChange: (entries: number) => void;
}

export function EvacuationCenterTableToolbar({
  searchQuery,
  onSearchChange,
  onAddCenter,
  entriesPerPage,
  onEntriesPerPageChange,
}: EvacuationCenterTableToolbarProps) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <Input
          type="number"
          value={entriesPerPage}
          onChange={(e) => onEntriesPerPageChange(Number(e.target.value))}
          className="w-16 h-9 text-center"
          min={1}
        />
        <span>Entries</span>
      </div>

      <div className="flex items-center gap-2 flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-64 h-9 pl-9"
          />
        </div>
      </div>
      
      <Button onClick={onAddCenter} className="flex items-center gap-2 h-9">
        <Plus className="h-4 w-4" />
        Add Center
      </Button>
    </div>
  );
}