import { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { RaportActResponse } from "shared";
import { Printer, ArrowLeft, FileSearch, Search } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

export function RaportActReport() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<RaportActResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatiuneId, setOperatiuneId] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: data
      ? `Raport_Act_${data.operatiune.numarOperatie}_${data.operatiune.an}`
      : "Raport_Act",
  });

  const fetchReport = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<RaportActResponse>(`/rapoarte/act/${id}`);

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

  // Auto-load if operatiuneId is in URL params
  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const id = parseInt(idParam, 10);
      if (!isNaN(id)) {
        setOperatiuneId(idParam);
        fetchReport(id);
      }
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(operatiuneId, 10);
    if (isNaN(id)) {
      setError("Introduceti un ID de operatiune valid");
      return;
    }
    fetchReport(id);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO");
  };

  const formatCurrency = (value: string | null) => {
    if (!value) return "-";
    const num = parseFloat(value);
    if (num === 0) return "-";
    return num.toLocaleString("ro-RO", {
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
    "modernizare": "Modernizare",
    "reevaluare": "Reevaluare",
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
              <FileSearch className="h-6 w-6" />
              Raport Act Operat
            </h1>
            <p className="text-muted-foreground">
              Detalii complete pentru o operatiune specifica
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

      {/* Search form */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="operatiuneId">ID Operatiune</Label>
              <Input
                id="operatiuneId"
                type="number"
                value={operatiuneId}
                onChange={(e) => setOperatiuneId(e.target.value)}
                placeholder="Introduceti ID-ul operatiunii"
                className="w-[250px]"
                min={1}
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Se incarca..." : "Cauta Operatiune"}
            </Button>
          </form>
        </CardContent>
      </Card>

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
            title="Raport Act Operat"
            subtitle={`Operatiunea nr. ${data.operatiune.numarOperatie}/${data.operatiune.an} din ${formatDate(data.operatiune.dataOperare)}`}
          >
            {/* Operation header */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Detalii Operatiune</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nr. Operatie:</span>
                    <p className="font-mono font-semibold">{data.operatiune.numarOperatie}/{data.operatiune.an}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Operare:</span>
                    <p className="font-semibold">{formatDate(data.operatiune.dataOperare)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tip Document:</span>
                    <p className="font-semibold">{data.operatiune.tipDocumentDenumire || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nr. Document:</span>
                    <p className="font-semibold">{data.operatiune.numarDocument || "-"}</p>
                  </div>
                  {data.operatiune.dataDocument && (
                    <div>
                      <span className="text-muted-foreground">Data Document:</span>
                      <p className="font-semibold">{formatDate(data.operatiune.dataDocument)}</p>
                    </div>
                  )}
                  {data.operatiune.descriere && (
                    <div className="col-span-2 md:col-span-3">
                      <span className="text-muted-foreground">Descriere:</span>
                      <p className="font-semibold">{data.operatiune.descriere}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Transaction lines */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Tranzactii ({data.totals.numarTranzactii} linii)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista tranzactii pentru aceasta operatiune
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Crt.</th>
                        <th className="text-left p-2">Nr. Inventar</th>
                        <th className="text-left p-2">Denumire Mijloc Fix</th>
                        <th className="text-left p-2">Tip</th>
                        <th className="text-left p-2">Cont</th>
                        <th className="text-left p-2">Gestiune</th>
                        <th className="text-left p-2">Loc</th>
                        <th className="text-right p-2">Debit</th>
                        <th className="text-right p-2">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => {
                        const isDebit = ["intrare", "modernizare", "reevaluare"].includes(row.tip);
                        const isCredit = ["casare", "declasare", "iesire"].includes(row.tip);

                        // Show gestiune context (source -> destination for transfers)
                        const gestiuneDisplay = row.gestiuneSursaCod && row.gestiuneDestinatieCod
                          ? `${row.gestiuneSursaCod} → ${row.gestiuneDestinatieCod}`
                          : row.gestiuneDestinatieCod || row.gestiuneSursaCod || "-";

                        const locDisplay = row.locFolosintaSursaCod && row.locFolosintaDestinatieCod
                          ? `${row.locFolosintaSursaCod} → ${row.locFolosintaDestinatieCod}`
                          : row.locFolosintaDestinatieCod || row.locFolosintaSursaCod || "-";

                        return (
                          <tr key={row.tranzactieId} className="border-b">
                            <td className="p-2 text-muted-foreground">{idx + 1}</td>
                            <td className="p-2 font-mono">{row.numarInventar}</td>
                            <td className="p-2 max-w-48 truncate">{row.denumireMijlocFix}</td>
                            <td className="p-2">{tipOperatieLabels[row.tip] || row.tip}</td>
                            <td className="p-2 font-mono text-xs">{row.contSimbol || "-"}</td>
                            <td className="p-2">{gestiuneDisplay}</td>
                            <td className="p-2">{locDisplay}</td>
                            <td className="p-2 text-right">
                              {isDebit ? formatCurrency(row.valoareOperatie) : "-"}
                            </td>
                            <td className="p-2 text-right">
                              {isCredit ? formatCurrency(row.valoareOperatie) : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={7} className="p-2 text-right">TOTAL:</td>
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
              Introduceti ID-ul operatiunii sau accesati acest raport din Centralizator Acte
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
