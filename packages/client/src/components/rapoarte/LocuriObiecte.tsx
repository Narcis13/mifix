import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { LocuriObiectResponse } from "shared";
import { Printer, ArrowLeft, MapPin, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export function LocuriObiecteReport() {
  const [data, setData] = useState<LocuriObiectResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Locuri_Obiecte",
  });

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<LocuriObiectResponse>("/rapoarte/locuri-obiecte");

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
              <MapPin className="h-6 w-6" />
              Locuri cu Obiecte de Inventar
            </h1>
            <p className="text-muted-foreground">
              Situatia locurilor de dispunere unde se afla obiecte de inventar
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

      {/* No filters needed - just a generate button */}
      <Card className="no-print">
        <CardContent className="pt-6">
          <Button onClick={handleGenerate} disabled={isLoading}>
            <FileText className="mr-2 h-4 w-4" />
            {isLoading ? "Se genereaza..." : "Genereaza Raport"}
          </Button>
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
          <PrintLayout title="Locuri cu Obiecte de Inventar">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Locuri ({data.totals.numarLocuri} combinatii, {data.totals.numarActive} obiecte)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.rows.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nu exista locuri cu obiecte active
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Crt.</th>
                        <th className="text-left p-2">Gestiune</th>
                        <th className="text-left p-2">Loc de Dispunere</th>
                        <th className="text-right p-2">Nr. Obiecte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rows.map((row, idx) => (
                        <tr key={`${row.gestiuneCod}-${row.locFolosintaCod}`} className="border-b">
                          <td className="p-2 text-muted-foreground">{idx + 1}</td>
                          <td className="p-2">
                            <span className="font-mono">{row.gestiuneCod}</span>
                            {" - "}
                            {row.gestiuneDenumire}
                          </td>
                          <td className="p-2">
                            {row.locFolosintaCod ? (
                              <>
                                <span className="font-mono">{row.locFolosintaCod}</span>
                                {row.locFolosintaDenumire ? ` - ${row.locFolosintaDenumire}` : ""}
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-2 text-right font-semibold">{row.numarActive}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 font-bold">
                        <td colSpan={3} className="p-2 text-right">TOTAL:</td>
                        <td className="p-2 text-right">{data.totals.numarActive}</td>
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
              Apasati "Genereaza Raport" pentru a vizualiza locurile cu obiecte
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
