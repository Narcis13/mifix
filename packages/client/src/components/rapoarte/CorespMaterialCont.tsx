import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { CorespMaterialContResponse } from "shared";
import { Printer, ArrowLeft, Link2, Download } from "lucide-react";
import { exportCsv } from "@/lib/export-csv";
import { Link } from "react-router-dom";

export function CorespMaterialContReport() {
  const [data, setData] = useState<CorespMaterialContResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Corespondenta_Material_Cont",
  });

  const handleExport = () => {
    if (!data) return;
    exportCsv(
      "Coresp_Material_Cont",
      ["Nr. Inventar", "Denumire", "Simbol Cont", "Denumire Cont"],
      data.rows.map((r) => [r.numarInventar, r.denumire, r.contSimbol || "", r.contDenumire || ""])
    );
  };

  const handleFilter = async (filters: ReportFiltersState) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());

      const res = await api.get<CorespMaterialContResponse>(`/rapoarte/corespondenta-material-cont?${params}`);

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

  // Group rows by cont for visual clarity
  const groupedByCont = data?.rows.reduce((acc, row) => {
    const key = row.contSimbol || "(fara cont)";
    if (!acc[key]) {
      acc[key] = { contSimbol: row.contSimbol, contDenumire: row.contDenumire, items: [] };
    }
    acc[key].items.push(row);
    return acc;
  }, {} as Record<string, { contSimbol: string | null; contDenumire: string | null; items: typeof data.rows }>) ?? {};

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
              <Link2 className="h-6 w-6" />
              Corespondenta Material-Cont
            </h1>
            <p className="text-muted-foreground">
              Corespondenta intre obiectele de inventar si conturile contabile
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
          <PrintLayout title="Corespondenta Material-Cont">
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
                        <th className="text-left p-2">Simbol Cont</th>
                        <th className="text-left p-2">Denumire Cont</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(groupedByCont).map(([key, group]) => (
                        <>
                          <tr key={`header-${key}`} className="bg-muted/50">
                            <td colSpan={5} className="p-2 font-semibold">
                              Cont: {group.contSimbol || "-"} - {group.contDenumire || "Fara cont"}
                              {" "}({group.items.length} obiecte)
                            </td>
                          </tr>
                          {group.items.map((row, idx) => (
                            <tr key={row.mijlocFixId} className="border-b">
                              <td className="p-2 text-muted-foreground">{idx + 1}</td>
                              <td className="p-2 font-mono">{row.numarInventar}</td>
                              <td className="p-2">{row.denumire}</td>
                              <td className="p-2 font-mono text-xs">{row.contSimbol || "-"}</td>
                              <td className="p-2">{row.contDenumire || "-"}</td>
                            </tr>
                          ))}
                        </>
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
              Apasati "Genereaza Raport" pentru a vizualiza corespondenta material-cont
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
