import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GenereazaAmortizareDialog } from "@/components/amortizare/GenereazaAmortizareDialog";
import { AmortizariSummary } from "@/components/amortizare/AmortizariSummary";
import { getAmortizariSumar } from "@/lib/api";
import type { AmortizareSumar } from "shared";
import { Calculator, Plus, TrendingDown } from "lucide-react";

const currentYear = new Date().getFullYear();

export default function Amortizare() {
  const [summary, setSummary] = useState<AmortizareSumar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const year = selectedYear !== "all" ? parseInt(selectedYear) : undefined;
      const data = await getAmortizariSumar(year);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  // Calculate overall stats
  const totalAmortizare = summary.reduce(
    (sum, item) => sum + parseFloat(item.totalLunar),
    0
  );
  const totalLuni = summary.length;
  const avgPerMonth = totalLuni > 0 ? totalAmortizare / totalLuni : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingDown className="h-6 w-6" />
            Amortizare
          </h1>
          <p className="text-muted-foreground">
            Generare si vizualizare amortizare lunara
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Genereaza Amortizare
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Amortizare</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {totalAmortizare.toLocaleString("ro-RO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              RON
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Luni Procesate</CardDescription>
            <CardTitle className="text-2xl">{totalLuni}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Media Lunara</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {avgPerMonth.toLocaleString("ro-RO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              RON
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Summary Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Sumar Amortizari
              </CardTitle>
              <CardDescription>
                Amortizarea totala pe luna pentru toate mijloacele fixe
              </CardDescription>
            </div>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filtreaza an" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toti anii</SelectItem>
                {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <AmortizariSummary data={summary} isLoading={isLoading} />
        </CardContent>
      </Card>

      {/* Generation Dialog */}
      <GenereazaAmortizareDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={loadSummary}
      />
    </div>
  );
}
