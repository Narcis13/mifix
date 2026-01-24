import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { FisaMijlocFix } from "shared";
import { Printer, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export function FisaMijlocFixReport() {
  const [numarInventar, setNumarInventar] = useState("");
  const [data, setData] = useState<FisaMijlocFix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: data ? `Fisa_${data.numarInventar}` : "Fisa_Mijloc_Fix",
  });

  const handleSearch = async () => {
    if (!numarInventar.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // First search for the asset by numarInventar
      const searchRes = await api.get<{ data: { id: number }[] }>(
        `/mijloace-fixe?search=${encodeURIComponent(numarInventar)}&limit=1`
      );

      if (!searchRes.success || !searchRes.data?.data?.[0]) {
        setError("Mijlocul fix nu a fost gasit");
        setData(null);
        setIsLoading(false);
        return;
      }

      const assetId = searchRes.data.data[0].id;

      // Now fetch the fisa report
      const fisaRes = await api.get<FisaMijlocFix>(`/rapoarte/fisa/${assetId}`);

      if (fisaRes.success && fisaRes.data) {
        setData(fisaRes.data);
        setError(null);
      } else {
        setError(fisaRes.message || "Eroare la generarea fisei");
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

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
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
            <h1 className="text-2xl font-bold">Fisa Mijlocului Fix</h1>
            <p className="text-muted-foreground">
              Raport complet pentru un mijloc fix
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

      {/* Search Card */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1 max-w-sm space-y-2">
              <Label htmlFor="numarInventar">Numar Inventar</Label>
              <Input
                id="numarInventar"
                placeholder="Introduceti numarul de inventar..."
                value={numarInventar}
                onChange={(e) => setNumarInventar(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Se cauta..." : "Cauta"}
            </Button>
          </div>
          {error && (
            <p className="text-destructive text-sm mt-2">{error}</p>
          )}
        </CardContent>
      </Card>

      {/* Report Content */}
      {data && (
        <div ref={contentRef}>
          <PrintLayout
            title="Fisa Mijlocului Fix"
            subtitle={`${data.numarInventar} - ${data.denumire}`}
          >
            {/* Identificare Section */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Date Identificare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Numar Inventar:</span>{" "}
                    <strong className="font-mono">{data.numarInventar}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Denumire:</span>{" "}
                    <strong>{data.denumire}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Clasificare:</span>{" "}
                    <strong>{data.clasificareCod} - {data.clasificareDenumire}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Grupa:</span>{" "}
                    <strong>{data.clasificareGrupa}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stare:</span>{" "}
                    <strong className="capitalize">{data.stare}</strong>
                  </div>
                  {data.descriere && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Descriere:</span>{" "}
                      <span>{data.descriere}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Localizare Section */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Localizare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Gestiune:</span>{" "}
                    <strong>{data.gestiuneCod} - {data.gestiuneDenumire}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Loc Folosinta:</span>{" "}
                    <strong>{data.locFolosintaDenumire || "-"}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Achizitie Section */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Document Achizitie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tip Document:</span>{" "}
                    <strong>{data.tipDocumentDenumire || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nr. Document:</span>{" "}
                    <strong>{data.documentAchizitie || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Furnizor:</span>{" "}
                    <strong>{data.furnizor || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Achizitie:</span>{" "}
                    <strong>{formatDate(data.dataAchizitie)}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Financiare Section */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Date Financiare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sursa Finantare:</span>{" "}
                    <strong>{data.sursaFinantareDenumire || "-"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cont:</span>{" "}
                    <strong>{data.contSimbol ? `${data.contSimbol} - ${data.contDenumire}` : "-"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valoare Initiala:</span>{" "}
                    <strong>{formatCurrency(data.valoareInitiala)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valoare Inventar:</span>{" "}
                    <strong>{formatCurrency(data.valoareInventar)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valoare Amortizata:</span>{" "}
                    <strong>{formatCurrency(data.valoareAmortizata)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Valoare Ramasa:</span>{" "}
                    <strong>{formatCurrency(data.valoareRamasa)}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amortizare Section */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Amortizare</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Amortizabil:</span>{" "}
                    <strong>{data.eAmortizabil ? "Da" : "Nu"}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Durata Normala:</span>{" "}
                    <strong>{data.durataNormala} luni</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Durata Ramasa:</span>{" "}
                    <strong>{data.durataRamasa} luni</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cota Lunara:</span>{" "}
                    <strong>{formatCurrency(data.cotaAmortizareLunara)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Incepere:</span>{" "}
                    <strong>{formatDate(data.dataIncepereAmortizare)}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Finalizare:</span>{" "}
                    <strong>{formatDate(data.dataFinalizareAmortizare)}</strong>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tranzactii Table */}
            {data.tranzactii.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Istoric Tranzactii</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Data</th>
                        <th className="text-left p-2">Tip</th>
                        <th className="text-left p-2">Document</th>
                        <th className="text-left p-2">Sursa</th>
                        <th className="text-left p-2">Destinatie</th>
                        <th className="text-right p-2">Valoare</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.tranzactii.map((t) => (
                        <tr key={t.id}>
                          <td className="p-2">{formatDate(t.dataOperare)}</td>
                          <td className="p-2 capitalize">{t.tip.replace("-", " ")}</td>
                          <td className="p-2">{t.documentNumar || "-"}</td>
                          <td className="p-2">{t.gestiuneSursaCod || t.locFolosintaSursaCod || "-"}</td>
                          <td className="p-2">{t.gestiuneDestinatieCod || t.locFolosintaDestinatieCod || "-"}</td>
                          <td className="p-2 text-right">{t.valoareOperatie ? formatCurrency(t.valoareOperatie) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {/* Amortizari Table */}
            {data.amortizari.length > 0 && (
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Istoric Amortizare</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left p-2">Perioada</th>
                        <th className="text-right p-2">Amortizare Lunara</th>
                        <th className="text-right p-2">Cumulat</th>
                        <th className="text-right p-2">Ramasa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.amortizari.map((a) => (
                        <tr key={a.id}>
                          <td className="p-2">{a.luna}/{a.an}</td>
                          <td className="p-2 text-right">{formatCurrency(a.valoareLunara)}</td>
                          <td className="p-2 text-right">{formatCurrency(a.valoareCumulata)}</td>
                          <td className="p-2 text-right">{formatCurrency(a.valoareRamasa)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
          </PrintLayout>
        </div>
      )}
    </div>
  );
}
