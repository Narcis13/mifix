import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { JurnalResponse } from "shared";
import { Printer, ArrowLeft, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export function JurnalActeReport() {
  const [data, setData] = useState<JurnalResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Jurnal_Acte_Operate",
  });

  const handleFilter = async (filters: ReportFiltersState) => {
    if (!filters.dataStart || !filters.dataEnd) {
      setError("Selectati perioada (de la - pana la)");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("dataStart", filters.dataStart);
      params.append("dataEnd", filters.dataEnd);
      if (filters.gestiuneId) params.append("gestiuneId", filters.gestiuneId.toString());

      const res = await api.get<JurnalResponse>(`/rapoarte/jurnal?${params}`);

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

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    return parseFloat(value).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON";
  };

  const tipOperatieLabels: Record<string, string> = {
    "intrare": "Intrare",
    "transfer-gestiune": "Transfer Gestiune",
    "transfer-loc": "Transfer Loc",
    "declasare": "Declasare",
    "casare": "Casare",
    "iesire": "Iesire",
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
              <BookOpen className="h-6 w-6" />
              Jurnal Acte Operate
            </h1>
            <p className="text-muted-foreground">
              Istoric operatiuni pe perioada
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
        showPeriod={true}
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
            title="Jurnal Acte Operate"
            subtitle={`Perioada: ${formatDate(data.filters.dataStart!)} - ${formatDate(data.filters.dataEnd!)}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Operatiuni ({data.totals.numarOperatii} inregistrari)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista operatiuni in perioada selectata
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Nr. Inventar</th>
                        <th className="text-left p-2">Denumire</th>
                        <th className="text-left p-2">Tip Operatie</th>
                        <th className="text-left p-2">Document</th>
                        <th className="text-left p-2">Sursa</th>
                        <th className="text-left p-2">Dest.</th>
                        <th className="text-right p-2">Valoare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row) => (
                        <tr key={row.id}>
                          <td className="p-2">{formatDate(row.dataOperare)}</td>
                          <td className="p-2 font-mono">{row.numarInventar}</td>
                          <td className="p-2">{row.denumireMijlocFix}</td>
                          <td className="p-2">{tipOperatieLabels[row.tip] || row.tip}</td>
                          <td className="p-2">{row.documentNumar || "-"}</td>
                          <td className="p-2">{row.gestiuneSursaCod || "-"}</td>
                          <td className="p-2">{row.gestiuneDestinatieCod || "-"}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareOperatie)}</td>
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
              Selectati perioada si apasati "Genereaza Raport" pentru a vizualiza jurnalul de acte
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
