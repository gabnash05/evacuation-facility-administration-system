import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface HouseholdTableToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddHousehold: () => void;
    entriesPerPage: number; 
    onEntriesPerPageChange: (entries: number) => void; 
    loading?: boolean;
}

export function HouseholdTableToolbar({
    searchQuery,
    onSearchChange,
    onAddHousehold,
    entriesPerPage,
    onEntriesPerPageChange,
    loading = false,
}: HouseholdTableToolbarProps) {
    return (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-2 w-full md:w-auto">
                <Input
                    type="text"
                    placeholder="Search by name, head, address..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full md:w-64"
                />
                <Button onClick={onAddHousehold} disabled={loading}>
                    Add Household
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show</span>
                <Select
                    value={String(entriesPerPage)}
                    onValueChange={(val) => onEntriesPerPageChange(Number(val))}
                    disabled={loading}
                >
                    <SelectTrigger className="w-20">
                        <SelectValue placeholder="Entries" />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 15, 20, 50].map((count) => (
                            <SelectItem key={count} value={String(count)}>
                                {count}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">entries</span>
            </div>
        </div>
    );
}