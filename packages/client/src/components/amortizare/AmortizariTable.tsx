import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAmortizariIstoric } from "@/lib/api";
import type { Amortizare } from "shared";
import { Calculator } from "lucide-react";

interface AmortizariTableProps {
  mijlocFixId: number;
  className?: string;
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

export function AmortizariTable({ mijlocFixId, className }: AmortizariTableProps) {
  const [amortizari, setAmortizari] = useState<Amortizare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getAmortizariIstoric(mijlocFixId);
        setAmortizari(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Eroare la incarcarea datelor");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [mijlocFixId]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Istoric Amortizare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Se incarca...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Istoric Amortizare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Istoric Amortizare
          {amortizari.length > 0 && (
            <span className="text-muted-foreground font-normal text-sm">
              ({amortizari.length} {amortizari.length === 1 ? "inregistrare" : "inregistrari"})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {amortizari.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            Nu exista inregistrari de amortizare pentru acest mijloc fix.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Perioada</TableHead>
                <TableHead className="text-right">Amortizare Lunara</TableHead>
                <TableHead className="text-right">Amortizare Cumulata</TableHead>
                <TableHead className="text-right">Valoare Ramasa</TableHead>
                <TableHead className="text-right">Durata Ramasa</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {amortizari.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {MONTH_NAMES[a.luna - 1]} {a.an}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(a.valoareLunara)} RON
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(a.valoareCumulata)} RON
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatMoney(a.valoareRamasa)} RON
                  </TableCell>
                  <TableCell className="text-right">{a.durataRamasa} luni</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
