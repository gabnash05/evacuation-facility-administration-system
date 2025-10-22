import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface TopbarProps {
    title: string;
}

export default function Topbar({ title }: TopbarProps) {
    return (
        <header
            className={cn(
                "h-14 w-full flex items-center justify-between",
                "px-6 border-border",
                "bg-background text-foreground"
            )}
        >
            <div className="flex items-center gap-4">
                <h1 className="text-base font-semibold tracking-tight">{title}</h1>
                <Separator orientation="vertical" className="h-6 bg-border" />
            </div>
        </header>
    );
}