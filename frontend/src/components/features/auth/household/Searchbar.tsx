import * as React from "react";
import { Search as SearchIcon } from "lucide-react"; 
import { cn } from "@/lib/utils"; 
import { Input } from "@/components/ui/input"; 


export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}


export function SearchBar({ className, ...props }: SearchBarProps) {
  return (

    <div className={cn("relative", className)}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        className="pl-10"
        {...props}
      />
    </div>
  );
}