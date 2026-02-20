import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { SituatieObiectResponse } from "shared";
import { Printer, ArrowLeft, Package } from "lucide-react";
import { Link } from "react-router-dom";

interface Props {
  durataDepasita?: boolean;
}

export function SituatieObiecteReport({ durataDepasita = false }: Props) {
  const [data, setData] = useState<SituatieObiectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const title = durataDepasita
    ? "Obiecte cu Durata Depasita"
    : "Situatia Obiectelor de Inventar";

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: durataDepasita ? "Obiecte_Durata_Depasita" : "Situatie_Obiecte",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());
      if (filters.contId) params.append("contId", filters.contId.toString());
      if (filters.stare) params.append("stare", filters.stare);
      if (durataDepasita) params.append("durataDepasita", "true");

      const res = await api.get<SituatieObiectResponse>(`/rapoarte/situatie-obiecte?${params}`);

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
              <Package className="h-6 w-6" />
              {title}
            </h1>
            <p className="text-muted-foreground">
              {durataDepasita
                ? "Obiecte cu procent de folosire >= 100%"
                : "Situatia curenta a tuturor obiectelor de inventar"}
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
          <PrintLayout title={title}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Obiecte ({data.totals.numarActive} active)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista obiecte{durataDepasita ? " cu durata depasita" : ""}
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Crt.</th>
                        <th className="text-left p-2">Nr. Inventar</th>
                        <th className="text-left p-2">Denumire</th>
                        <th className="text-left p-2">Cont</th>
                        <th className="text-left p-2">Gestiune</th>
                        <th className="text-left p-2">Loc</th>
                        <th className="text-left p-2">Data Achiz.</th>
                        <th className="text-left p-2">Durata</th>
                        <th className="text-right p-2">% Folosire</th>
                        <th className="text-right p-2">Val. Inventar</th>
                        <th className="text-right p-2">Amortizat</th>
                        <th className="text-right p-2">Ramas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <tr key={row.mijlocFixId} className="border-b">
                          <td className="p-2 text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 font-mono">{row.numarInventar}</td>
                          <td className="p-2 max-w-48 truncate">{row.denumire}</td>
                          <td className="p-2 font-mono text-xs">{row.contSimbol || "-"}</td>
                          <td className="p-2">{row.gestiuneCod}</td>
                          <td className="p-2">{row.locFolosintaCod || "-"}</td>
                          <td className="p-2">{formatDate(row.dataAchizitie)}</td>
                          <td className="p-2">{formatDuration(row.durataNormala)}</td>
                          <td className={`p-2 text-right ${row.procentFolosire >= 100 ? "text-destructive font-semibold" : ""}`}>
                            {row.procentFolosire.toFixed(1)}%
                          </td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareInventar)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareAmortizata)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareRamasa)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={9} className="p-2 text-right">TOTAL:</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareInventar)}</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareAmortizata)}</td>
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
              Apasati "Genereaza Raport" pentru a vizualiza situatia obiectelor
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
