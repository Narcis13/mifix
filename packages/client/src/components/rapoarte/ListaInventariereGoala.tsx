import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { ListaInventariereGoalaResponse } from "shared";
import { Printer, ArrowLeft, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

export function ListaInventariereGoalaReport() {
  const [data, setData] = useState<ListaInventariereGoalaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Lista_Inventariere_Goala",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());
      if (filters.contId) params.append("contId", filters.contId.toString());

      const res = await api.get<ListaInventariereGoalaResponse>(`/rapoarte/lista-inventariere-goala?${params}`);

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
              Lista de Inventariere (Goala)
            </h1>
            <p className="text-muted-foreground">
              Formular gol pentru inventar faptic - doar denumiri si numere de inventar
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

      <ReportFilters
        onFilter={handleFilter}
        showGestiune={true}
        showCont={true}
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
          <PrintLayout title="Lista de Inventariere (Goala)">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Obiecte ({data.totals.numarActive} pozitii)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista obiecte active
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 w-16">Nr. crt.</th>
                        <th className="text-left p-2 w-32">Nr. Inventar</th>
                        <th className="text-left p-2">Denumire Material</th>
                        <th className="text-left p-2 w-24">Gestiune</th>
                        <th className="text-center p-2 w-32">Inventar Faptic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <tr key={row.mijlocFixId} className="border-b">
                          <td className="p-2 text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 font-mono">{row.numarInventar}</td>
                          <td className="p-2">{row.denumire}</td>
                          <td className="p-2">{row.gestiuneCod}</td>
                          <td className="p-2 border-l border-dashed">&nbsp;</td>
                        </tr>
                      ))}
                    </tbody>
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
              Apasati "Genereaza Raport" pentru a genera lista goala de inventariere
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
