import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface TransferReasonSelectProps {
    value: string;
    onChange: (value: string) => void;
}

const transferReasons = [
    { value: "medical_emergency", label: "Medical Emergency" },
    { value: "family_request", label: "Family Request" },
    { value: "center_capacity", label: "Center Capacity" },
    { value: "relocation", label: "Relocation" },
    { value: "safety_concerns", label: "Safety Concerns" },
    { value: "special_needs", label: "Special Needs" },
    { value: "other", label: "Other" },
];

export function TransferReasonSelect({ value, onChange }: TransferReasonSelectProps) {
    return (
        <div className="max-w-md">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose all that applies" />
                </SelectTrigger>
                <SelectContent>
                    {transferReasons.map(reason => (
                        <SelectItem key={reason.value} value={reason.value}>
                            {reason.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}