import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 

interface HouseholdTableProps {
  headers: string[]; 
  caption?: string;   
}

export function HouseholdTable({ headers, caption }: HouseholdTableProps) {
  return (
    <Table>
      {caption && <TableCaption>{caption}</TableCaption>}
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header} className="text-center">{header}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
      </TableBody>
    </Table>
  );
}

export default HouseholdTable;