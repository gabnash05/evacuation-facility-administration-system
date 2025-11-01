import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HouseholdTableToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddHousehold: () => void; // A function to handle adding a new household
    loading?: boolean;
}

export function HouseholdTableToolbar({
    searchQuery,
    onSearchChange,
    onAddHousehold,
    loading = false,
}: HouseholdTableToolbarProps) {
    return (
        <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1">
                <Input
                    type="text"
                    placeholder="Search by name, head, address..."
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                    className="w-full max-w-sm"
                />
            </div>

            {/* Add Household Button */}
            <Button onClick={onAddHousehold} disabled={loading}>
                Add Household
            </Button>
        </div>
    );
}
