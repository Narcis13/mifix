import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { SituatieAmortizareResponse } from "shared";
import { Printer, ArrowLeft, Calculator } from "lucide-react";
import { Link } from "react-router-dom";

const romanianMonths = [
  "Ianuarie", "Februarie", "Martie", "Aprilie",
  "Mai", "Iunie", "Iulie", "August",
  "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
];

export function SituatieAmortizareReport() {
  const [data, setData] = useState<SituatieAmortizareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: data
      ? `Situatie_Amortizare_${romanianMonths[data.period.luna - 1]}_${data.period.an}`
      : "Situatie_Amortizare",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    if (!filters.an || !filters.luna) {
      setError("Selectati anul si luna");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("an", filters.an.toString());
      params.append("luna", filters.luna.toString());
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());

      const res = await api.get<SituatieAmortizareResponse>(`/rapoarte/amortizare?${params}`);

      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.message || "Eroare la generarea raportului");
        setData(null);
      }
    } catch {
      setError("Eroare de retea");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link to="/rapoarte">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              Situatie Amortizare
            </h1>
            <p className="text-muted-foreground">
              Amortizari calculate pe luna
            </p>
          </div>
        </div>
        {data && (
          <Button variant="outline" onClick={() => handlePrint()}>
            <Printer className="mr-2 h-4 w-4" />
            Printeaza
          </Button>
        )}
      </div>

      {/* Filters */}
      <ReportFilters
        onFilter={handleFilter}
        showYearMonth={true}
        showGestiune={true}
        isLoading={isLoading}
      />

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {data && (
        <div ref={contentRef}>
          <PrintLayout
            title="Situatie Amortizare Lunara"
            subtitle={`${romanianMonths[data.period.luna - 1]} ${data.period.an}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Amortizari ({data.rows.length} mijloace fixe)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista amortizari calculate pentru luna selectata
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Nr. Inventar</th>
                        <th className="text-left p-2">Denumire</th>
                        <th className="text-left p-2">Gestiune</th>
                        <th className="text-left p-2">Clasificare</th>
                        <th className="text-right p-2">Val. Inventar</th>
                        <th className="text-right p-2">Amort. Lunara</th>
                        <th className="text-right p-2">Cumulat</th>
                        <th className="text-right p-2">Ramasa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row) => (
                        <tr key={row.mijlocFixId}>
                          <td className="p-2 font-mono">{row.numarInventar}</td>
                          <td className="p-2">{row.denumire}</td>
                          <td className="p-2">{row.gestiuneCod}</td>
                          <td className="p-2">{row.clasificareCod}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareInventar)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareLunara)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareCumulata)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareRamasa)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-bold border-t-2">
                      <tr>
                        <td className="p-2" colSpan={4}>TOTAL</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareInventar)}</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareLunara)}</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareCumulata)}</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareRamasa)}</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </CardContent>
            </Card>
          </PrintLayout>
        </div>
      )}

      {!data && !error && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Selectati anul si luna, apoi apasati "Genereaza Raport" pentru a vizualiza situatia amortizarii
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
