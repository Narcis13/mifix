import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { ListaMaterialeResponse } from "shared";
import { Printer, ArrowLeft, List, Download } from "lucide-react";
import { exportCsv } from "@/lib/export-csv";
import { Link } from "react-router-dom";

export function ListaMaterialeReport() {
  const [data, setData] = useState<ListaMaterialeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Lista_Materiale",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());

      const res = await api.get<ListaMaterialeResponse>(`/rapoarte/lista-materiale?${params}`);

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

  const handleExport = () => {
    if (!data) return;
    exportCsv(
      "Lista_Materiale",
      ["Nr. Inventar", "Denumire", "Durata (luni)", "Data Achizitie", "Val. Inventar", "Stare"],
      data.rows.map((r) => [r.numarInventar, r.denumire, String(r.durataNormala), r.dataAchizitie, r.valoareInventar, r.stare])
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO");
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (num === 0) return "-";
    return num.toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON";
  };

  const formatDuration = (months: number) => {
    if (months <= 0) return "-";
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (years === 0) return `${remainingMonths} luni`;
    if (remainingMonths === 0) return `${years} ani`;
    return `${years}a ${remainingMonths}l`;
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
              <List className="h-6 w-6" />
              Lista Materiale
            </h1>
            <p className="text-muted-foreground">
              Catalogul materialelor cu denumiri si durate de folosinta
            </p>
          </div>
        </div>
        {data && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Printeaza
            </Button>
          </div>
        )}
      </div>

      <ReportFilters
        onFilter={handleFilter}
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

      {data && (
        <div ref={contentRef}>
          <PrintLayout title="Lista cu Denumirea si Duratele Obiectelor de Inventar">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Materiale ({data.totals.numarActive} pozitii)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista materiale active
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Crt.</th>
                        <th className="text-left p-2">Nr. Inventar</th>
                        <th className="text-left p-2">Denumire Material</th>
                        <th className="text-left p-2">Data Achizitie</th>
                        <th className="text-left p-2">Durata Normala</th>
                        <th className="text-right p-2">Valoare Inventar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <tr key={row.mijlocFixId} className="border-b">
                          <td className="p-2 text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 font-mono">{row.numarInventar}</td>
                          <td className="p-2">{row.denumire}</td>
                          <td className="p-2">{formatDate(row.dataAchizitie)}</td>
                          <td className="p-2">{formatDuration(row.durataNormala)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareInventar)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={5} className="p-2 text-right">TOTAL:</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareInventar)}</td>
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
              Apasati "Genereaza Raport" pentru a vizualiza lista de materiale
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
