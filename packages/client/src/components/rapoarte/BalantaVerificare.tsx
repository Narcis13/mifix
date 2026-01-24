import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { BalantaResponse } from "shared";
import { Printer, ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";

export function BalantaVerificareReport() {
  const [data, setData] = useState<BalantaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Balanta_Verificare",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.stare) params.append("stare", filters.stare);

      const res = await api.get<BalantaResponse>(`/rapoarte/balanta?${params}`);

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
              <FileSpreadsheet className="h-6 w-6" />
              Balanta de Verificare
            </h1>
            <p className="text-muted-foreground">
              Situatie cantitativ-valorica pe gestiuni
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
        showStare={true}
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
            title="Balanta de Verificare Cantitativ-Valorica"
            subtitle={`Stare: ${data.filters.stare || "Toate"}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Situatie pe Gestiuni</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2">Cod</th>
                      <th className="text-left p-2">Gestiune</th>
                      <th className="text-right p-2">Nr. Active</th>
                      <th className="text-right p-2">Valoare Inventar</th>
                      <th className="text-right p-2">Amortizat</th>
                      <th className="text-right p-2">Ramasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.gestiuneId}>
                        <td className="p-2 font-mono">{row.gestiuneCod}</td>
                        <td className="p-2">{row.gestiuneDenumire}</td>
                        <td className="p-2 text-right">{row.numarActive}</td>
                        <td className="p-2 text-right">{formatCurrency(row.valoareInventar)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.valoareAmortizata)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.valoareRamasa)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold border-t-2">
                    <tr>
                      <td className="p-2" colSpan={2}>TOTAL</td>
                      <td className="p-2 text-right">{data.totals.numarActive}</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.valoareInventar)}</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.valoareAmortizata)}</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.valoareRamasa)}</td>
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          </PrintLayout>
        </div>
      )}

      {!data && !error && !isLoading && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              Selectati filtrele si apasati "Genereaza Raport" pentru a vizualiza balanta de verificare
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
