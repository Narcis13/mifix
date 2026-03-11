import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PrintLayout } from "./PrintLayout";
import { api } from "@/lib/api";
import type { FisaMijlocFix } from "shared";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";

interface AssetOption {
  id: number;
  numarInventar: string;
  denumire: string;
  stare: string;
}

export function FisaMijlocFixReport() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AssetOption[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [data, setData] = useState<FisaMijlocFix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: data ? `Fisa_${data.numarInventar}` : "Fisa_Mijloc_Fix",
  });

  /** Search assets as user types (min 2 chars) */
  useEffect(() => {
    if (debouncedSearch.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    api
      .get<AssetOption[]>(
        `/mijloace-fixe/cautare?q=${encodeURIComponent(debouncedSearch)}&limit=15`
      )
      .then((res) => {
        if (res.success && res.data) {
          setSearchResults(res.data);
          setShowDropdown(true);
        }
      })
      .finally(() => setIsSearching(false));
  }, [debouncedSearch]);

  /** Close dropdown when clicking outside */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadFisa(assetId: number) {
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await api.get<FisaMijlocFix>(`/rapoarte/fisa/${assetId}`);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Eroare la generarea fisei");
      }
    } catch {
      setError("Eroare de retea");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectAsset(asset: AssetOption) {
    setSearchQuery(`${asset.numarInventar} — ${asset.denumire}`);
    setShowDropdown(false);
    setSearchResults([]);
    loadFisa(asset.id);
  }

  function handleInputChange(value: string) {
    setSearchQuery(value);
    setData(null);
    setError(null);
  }

  const formatCurrency = (value: string) =>
    parseFloat(value).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON";

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ro-RO");
  };

  const stareLabel: Record<string, string> = {
    activ: "Activ",
    casare: "Casare",
    declasare: "Declasare",
    transfer: "Transfer",
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
          <div className="max-w-lg space-y-2">
            <Label htmlFor="searchMF">Cauta mijloc fix</Label>
            <div className="relative" ref={containerRef}>
              <Input
                id="searchMF"
                placeholder="Numar inventar sau denumire..."
                value={searchQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                autoComplete="off"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {/* Dropdown results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                  <ul className="max-h-64 overflow-y-auto py-1">
                    {searchResults.map((asset) => (
                      <li key={asset.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent"
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent input blur before click
                            handleSelectAsset(asset);
                          }}
                        >
                          <span>
                            <span className="font-mono font-medium">
                              {asset.numarInventar}
                            </span>
                            <span className="mx-2 text-muted-foreground">—</span>
                            <span>{asset.denumire}</span>
                          </span>
                          {asset.stare !== "activ" && (
                            <span className="ml-2 rounded px-1.5 py-0.5 text-xs bg-muted text-muted-foreground">
                              {stareLabel[asset.stare] ?? asset.stare}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {showDropdown && searchResults.length === 0 && !isSearching && debouncedSearch.length >= 2 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-sm text-muted-foreground shadow-md">
                  Niciun mijloc fix gasit
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Tastati cel putin 2 caractere din numar inventar sau denumire
            </p>
          </div>

          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Se incarca fisa...
            </div>
          )}
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
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

            {/* Amortizare Section - starts on page 2 when printing */}
            <Card className="mb-4 print-page-break">
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
