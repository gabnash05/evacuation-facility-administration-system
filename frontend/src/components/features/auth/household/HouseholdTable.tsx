import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type TableHeader = {
  key: string;
  text: string;
  className?: string;
};

interface HouseholdTableProps<TData> {
  headers: TableHeader[];
  data: TData[];
}

export function HouseholdTable<TData extends { [key: string]: any }>({
  headers,
  data,
}: HouseholdTableProps<TData>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((header) => (
            <TableHead key={header.key} className={header.className}>
              {header.text}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map((row, rowIndex) => (
            <TableRow key={`row-${rowIndex}`}>
              {headers.map((header) => (
                <TableCell key={`cell-${rowIndex}-${header.key}`}>
                  {row[header.key]}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={headers.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default HouseholdTable;