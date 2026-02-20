import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportFilters, type ReportFiltersState } from "./ReportFilters";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { CentralizatorActResponse } from "shared";
import { Printer, ArrowLeft, ClipboardList, Download } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { exportCsv } from "@/lib/export-csv";

export function CentralizatorActeReport() {
  const navigate = useNavigate();
  const [data, setData] = useState<CentralizatorActResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Centralizator_Acte",
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
      if (filters.contId) params.append("contId", filters.contId.toString());

      const res = await api.get<CentralizatorActResponse>(`/rapoarte/centralizator?${params}`);

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
      "Centralizator_Acte",
      ["Nr. Operatie", "An", "Data Operare", "Tip Document", "Nr. Document", "Descriere", "Valoare Debit", "Valoare Credit"],
      data.rows.map((r) => [String(r.numarOperatie), String(r.an), r.dataOperare, r.tipDocumentDenumire || "", r.numarDocument || "", r.descriere || "", r.valoareDebit, r.valoareCredit])
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
              Centralizator Acte Operate
            </h1>
            <p className="text-muted-foreground">
              Situatie sintetica a documentelor operate pe perioada
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
        showPeriod={true}
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
          <PrintLayout
            title="Centralizator Acte Operate"
            subtitle={`Perioada: ${formatDate(data.filters.dataStart)} - ${formatDate(data.filters.dataEnd)}`}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Operatiuni ({data.rows.length} documente)
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
                      <tr className="border-b">
                        <th className="text-left p-2">Crt.</th>
                        <th className="text-left p-2">Nr. Op.</th>
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Tip Act</th>
                        <th className="text-left p-2">Nr. Act</th>
                        <th className="text-left p-2">Descriere</th>
                        <th className="text-right p-2">Debit</th>
                        <th className="text-right p-2">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <tr
                          key={row.operatiuneId}
                          className="border-b cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/rapoarte/act?id=${row.operatiuneId}`)}
                          title="Click pentru detalii operatiune"
                        >
                          <td className="p-2 text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 font-mono text-primary underline">{row.numarOperatie}</td>
                          <td className="p-2">{formatDate(row.dataOperare)}</td>
                          <td className="p-2">{row.tipDocumentDenumire || "-"}</td>
                          <td className="p-2">{row.numarDocument || "-"}</td>
                          <td className="p-2 max-w-48 truncate">{row.descriere || "-"}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareDebit)}</td>
                          <td className="p-2 text-right">{formatCurrency(row.valoareCredit)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={6} className="p-2 text-right">TOTAL:</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareDebit)}</td>
                        <td className="p-2 text-right">{formatCurrency(data.totals.valoareCredit)}</td>
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
              Selectati perioada si apasati "Genereaza Raport" pentru a vizualiza centralizatorul
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
