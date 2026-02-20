import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { ListaInventariereResponse } from "shared";
import { Printer, ArrowLeft, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

export function ListaInventariereReport() {
  const [data, setData] = useState<ListaInventariereResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Lista_Inventariere",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    if (!filters.dataInventar) {
      setError("Selectati data inventarierii");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("dataInventar", filters.dataInventar);
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());
      if (filters.contId) params.append("contId", filters.contId.toString());
      if (filters.stare) params.append("stare", filters.stare);

      const res = await api.get<ListaInventariereResponse>(`/rapoarte/lista-inventariere?${params}`);

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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO");
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
              <ClipboardList className="h-6 w-6" />
              Lista de Inventariere
            </h1>
            <p className="text-muted-foreground">
              Generare lista de inventariere la o data specificata
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
        showSingleDate={true}
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
            title="Lista de Inventariere"
            subtitle={`La data: ${formatDate(data.filters.dataInventar)}${data.filters.stare ? ` | Stare: ${data.filters.stare}` : ""}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Active inventariate ({data.totals.numarActive} pozitii)
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
                      <th className="text-left p-2">Loc Folosinta</th>
                      <th className="text-left p-2">Cont</th>
                      <th className="text-left p-2">Stare</th>
                      <th className="text-left p-2">Data Achizitie</th>
                      <th className="text-right p-2">Valoare Scriptică</th>
                      <th className="text-right p-2">Valoare Faptică</th>
                      <th className="text-right p-2">Diferente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, idx) => (
                      <tr key={row.mijlocFixId} className="border-b hover:bg-muted/50">
                        <td className="p-2 text-muted-foreground">{idx + 1}</td>
                        <td className="p-2 font-mono">{row.numarInventar}</td>
                        <td className="p-2">{row.denumire}</td>
                        <td className="p-2">{row.gestiuneCod}</td>
                        <td className="p-2">{row.locFolosintaCod || "-"}</td>
                        <td className="p-2 font-mono">{row.contSimbol || "-"}</td>
                        <td className="p-2">{row.stare}</td>
                        <td className="p-2">{row.dataAchizitie ? formatDate(row.dataAchizitie) : "-"}</td>
                        <td className="p-2 text-right">{formatCurrency(row.valoareInventar)}</td>
                        <td className="p-2 text-right text-muted-foreground">-</td>
                        <td className="p-2 text-right text-muted-foreground">-</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="font-bold border-t-2">
                    <tr>
                      <td className="p-2" colSpan={8}>TOTAL ({data.totals.numarActive} active)</td>
                      <td className="p-2 text-right">{formatCurrency(data.totals.valoareInventar)}</td>
                      <td className="p-2 text-right">-</td>
                      <td className="p-2 text-right">-</td>
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
              Selectati data inventarierii si apasati "Genereaza Raport" pentru a genera lista de inventariere
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
