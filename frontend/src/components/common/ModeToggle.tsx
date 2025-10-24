import { Moon, Sun, Settings } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/common/ThemeProvider";
import { cn } from "@/lib/utils";

export function ModeToggle({ children }: { children?: React.ReactNode }) {
    const { setTheme, theme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 w-full text-left cursor-pointer">
                    <div className="flex items-center justify-center w-4 h-4">
                        <Sun
                            className={cn(
                                "h-4 w-4 scale-100 rotate-0 transition-all",
                                theme === "dark" && "scale-0 -rotate-90"
                            )}
                        />
                        <Moon
                            className={cn(
                                "absolute h-4 w-4 scale-0 rotate-90 transition-all",
                                theme === "dark" && "scale-100 rotate-0"
                            )}
                        />
                    </div>
                    {children}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Settings className="h-4 w-4 mr-2" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
