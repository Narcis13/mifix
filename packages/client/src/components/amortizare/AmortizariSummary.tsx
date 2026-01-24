import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AmortizareSumar } from "shared";

interface AmortizariSummaryProps {
  data: AmortizareSumar[];
  isLoading: boolean;
}

const MONTH_NAMES = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

function formatMoney(value: string): string {
  const num = parseFloat(value);
  return num.toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AmortizariSummary({ data, isLoading }: AmortizariSummaryProps) {
  if (isLoading) {
    return <p className="text-muted-foreground text-sm py-4">Se incarca...</p>;
  }

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4 text-center">
        Nu exista inregistrari de amortizare.
      </p>
    );
  }

  // Calculate yearly totals
  const yearlyTotals = data.reduce(
    (acc, item) => {
      if (!acc[item.an]) {
        acc[item.an] = { total: 0, count: 0 };
      }
      acc[item.an].total += parseFloat(item.totalLunar);
      acc[item.an].count += item.numarActive;
      return acc;
    },
    {} as Record<number, { total: number; count: number }>
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Perioada</TableHead>
          <TableHead className="text-right">Total Amortizare</TableHead>
          <TableHead className="text-right">Nr. Active</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={`${item.an}-${item.luna}`}>
            <TableCell className="font-medium">
              {MONTH_NAMES[item.luna - 1]} {item.an}
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatMoney(item.totalLunar)} RON
            </TableCell>
            <TableCell className="text-right">{item.numarActive}</TableCell>
          </TableRow>
        ))}
        {/* Show yearly totals as footer rows */}
        {Object.entries(yearlyTotals)
          .sort(([a], [b]) => parseInt(b) - parseInt(a))
          .map(([year, totals]) => (
            <TableRow
              key={`total-${year}`}
              className="bg-muted/50 font-semibold"
            >
              <TableCell>Total {year}</TableCell>
              <TableCell className="text-right font-mono">
                {formatMoney(totals.total.toFixed(2))} RON
              </TableCell>
              <TableCell className="text-right">-</TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
}
