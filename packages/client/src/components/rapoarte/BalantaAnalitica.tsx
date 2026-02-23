import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { BalantaAnaliticaResponse } from "shared";
import { Printer, ArrowLeft, BarChart3, Download } from "lucide-react";
import { exportCsv } from "@/lib/export-csv";
import { Link } from "react-router-dom";

export function BalantaAnaliticaReport() {
  const [data, setData] = useState<BalantaAnaliticaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Balanta_Analitica",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    if (!filters.dataStart || !filters.dataEnd) {
      setError("Selectati perioada (data inceput si data sfarsit)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("dataStart", filters.dataStart);
      params.append("dataEnd", filters.dataEnd);
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());
      if (filters.contId) params.append("contId", filters.contId.toString());
      if (filters.stare) params.append("stare", filters.stare);

      const res = await api.get<BalantaAnaliticaResponse>(`/rapoarte/balanta-analitica?${params}`);

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
      "Balanta_Analitica",
      ["Nr. Inventar", "Denumire", "Stare", "Gestiune", "Cont", "Sold Initial", "Debit", "Credit", "Sold Final"],
      data.rows.map((r) => [r.numarInventar, r.denumire, r.stare, r.gestiuneCod, r.contSimbol || "", r.soldInitial, r.debit, r.credit, r.soldFinal])
    );
  };

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON";
  };

  const formatPeriod = (dataStart: string, dataEnd: string) => {
    const start = new Date(dataStart).toLocaleDateString("ro-RO");
    const end = new Date(dataEnd).toLocaleDateString("ro-RO");
    return `${start} - ${end}`;
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
              <BarChart3 className="h-6 w-6" />
              Balanta Analitica
            </h1>
            <p className="text-muted-foreground">
              Balanta analitica a obiectelor de inventar pe perioada selectata
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

      {/* Filters */}
      <ReportFilters
        onFilter={handleFilter}
        showPeriod={true}
        showGestiune={true}
        showCont={true}
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
            title="Balanta Analitica a Obiectelor de Inventar"
            subtitle={`Perioada: ${formatPeriod(data.filters.dataStart, data.filters.dataEnd)}${data.filters.stare ? ` | Stare: ${data.filters.stare}` : ""}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Situatie pe mijloace fixe ({data.rows.length} pozitii)
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nr.</th>
                      <th className="text-left p-2">Nr. Inventar</th>
                      <th className="text-left p-2">Denumire</th>
                      <th className="text-left p-2">Gestiune</th>
                      <th className="text-left p-2">Cont</th>
                      <th className="text-left p-2">Stare</th>
                      <th className="text-right p-2">Sold Initial</th>
                      <th className="text-right p-2">Debit</th>
                      <th className="text-right p-2">Credit</th>
                      <th className="text-right p-2">Sold Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, idx) => (
                      <tr key={row.mijlocFixId} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-muted-foreground">{idx + 1}</td>
                        <td className="p-2 font-mono">{row.numarInventar}</td>
                        <td className="p-2">{row.denumire}</td>
                        <td className="p-2">{row.gestiuneCod}</td>
                        <td className="p-2 font-mono">{row.contSimbol || "-"}</td>
                        <td className="p-2">{row.stare}</td>
                        <td className="p-2 text-right">{formatCurrency(row.soldInitial)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.debit)}</td>
                        <td className="p-2 text-right">{formatCurrency(row.credit)}</td>
                        <td className="p-2 text-right font-semibold">{formatCurrency(row.soldFinal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold border-t-2">
                    <tr>
                      <td className="p-2" colSpan={6}>TOTAL</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.soldInitial)}</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.debit)}</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.credit)}</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.soldFinal)}</td>
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
              Selectati perioada si apasati "Genereaza Raport" pentru a vizualiza balanta analitica
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
