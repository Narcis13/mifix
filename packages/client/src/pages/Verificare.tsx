import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintLayout } from "@/components/rapoarte/PrintLayout";
import { api } from "@/lib/api";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  RefreshCcw,
  Printer,
  ChevronDown,
  ChevronUp,
  Database,
  Scale,
  Calculator,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

interface VerificationDetail {
  id: number;
  numarInventar?: string;
  denumire?: string;
  detaliu: string;
}

interface VerificationCheck {
  id: string;
  categorie: "integritate" | "balante" | "amortizari";
  nume: string;
  descriere: string;
  status: "ok" | "atentie" | "eroare";
  numar: number;
  detalii: VerificationDetail[];
}

interface VerificationResult {
  timestamp: string;
  durata: number;
  sumar: { total: number; ok: number; atentie: number; eroare: number };
  verificari: VerificationCheck[];
}

// ── Category config ──────────────────────────────────────────────────────

const categories = [
  { key: "integritate" as const, label: "Integritate Date", icon: Database },
  { key: "balante" as const, label: "Verificare Balante", icon: Scale },
  { key: "amortizari" as const, label: "Consistenta Amortizari", icon: Calculator },
];

// ── Status badge ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: VerificationCheck["status"] }) {
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
        <ShieldCheck className="h-3 w-3" /> OK
      </span>
    );
  }
  if (status === "atentie") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
        <ShieldAlert className="h-3 w-3" /> Atentie
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
      <ShieldX className="h-3 w-3" /> Eroare
    </span>
  );
}

// ── Expandable check row ─────────────────────────────────────────────────

function CheckRow({ check }: { check: VerificationCheck }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b last:border-b-0">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => check.numar > 0 && setExpanded(!expanded)}
        disabled={check.numar === 0}
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={check.status} />
          <div>
            <span className="font-medium text-sm">{check.nume}</span>
            <p className="text-xs text-muted-foreground">{check.descriere}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {check.numar > 0 && (
            <span className="text-sm font-mono text-muted-foreground">
              {check.numar} {check.numar === 1 ? "problema" : "probleme"}
            </span>
          )}
          {check.numar > 0 &&
            (expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ))}
        </div>
      </button>
      {expanded && check.detalii.length > 0 && (
        <div className="bg-muted/30 px-4 py-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-1 pr-4">ID</th>
                <th className="pb-1 pr-4">Nr. Inventar</th>
                <th className="pb-1">Detaliu</th>
              </tr>
            </thead>
            <tbody>
              {check.detalii.map((d, i) => (
                <tr key={i} className="border-t border-muted">
                  <td className="py-1.5 pr-4 font-mono text-xs">{d.id}</td>
                  <td className="py-1.5 pr-4 font-mono text-xs">
                    {d.numarInventar || "-"}
                  </td>
                  <td className="py-1.5 text-xs">{d.detaliu}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {check.numar > check.detalii.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              ... si inca {check.numar - check.detalii.length} probleme
              (se afiseaza maxim 50)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────

export function VerificarePage() {
  const [data, setData] = useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: "Verificare_Integritate",
  });

  const runVerification = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await api.get<VerificationResult>("/verificare");

      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.message || "Eroare la verificare");
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
      {/* Header */}
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            Verificare Integritate Date
          </h1>
          <p className="text-muted-foreground">
            Verificari automate de integritate, balante si consistenta amortizari
            (echivalent VERIFIC.PRG)
          </p>
        </div>
        <div className="flex gap-2">
          {data && (
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Printeaza
            </Button>
          )}
          <Button onClick={runVerification} disabled={isLoading}>
            <RefreshCcw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            {isLoading ? "Se verifica..." : "Ruleaza Verificarea"}
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {data && (
        <div ref={contentRef}>
          <PrintLayout
            title="Verificare Integritate Date"
            subtitle={`Executata la ${new Date(data.timestamp).toLocaleString("ro-RO")} (durata: ${data.durata}ms)`}
          >
            {/* Summary cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6 no-print">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Verificari</CardDescription>
                  <CardTitle className="text-2xl">{data.sumar.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardDescription>OK</CardDescription>
                  <CardTitle className="text-2xl text-green-600">
                    {data.sumar.ok}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-yellow-200">
                <CardHeader className="pb-2">
                  <CardDescription>Atentie</CardDescription>
                  <CardTitle className="text-2xl text-yellow-600">
                    {data.sumar.atentie}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardDescription>Erori</CardDescription>
                  <CardTitle className="text-2xl text-red-600">
                    {data.sumar.eroare}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* Print-only summary */}
            <div className="hidden print:block mb-4">
              <p className="text-sm">
                <strong>Sumar:</strong> {data.sumar.total} verificari — {data.sumar.ok} OK, {data.sumar.atentie} atentie, {data.sumar.eroare} erori
              </p>
            </div>

            {/* Check categories */}
            {categories.map((cat) => {
              const checks = data.verificari.filter(
                (v) => v.categorie === cat.key
              );
              if (checks.length === 0) return null;

              const Icon = cat.icon;
              const hasIssues = checks.some((c) => c.status !== "ok");

              return (
                <Card key={cat.key} className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {cat.label}
                      {!hasIssues && (
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {checks.map((check) => (
                      <CheckRow key={check.id} check={check} />
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </PrintLayout>
        </div>
      )}

      {/* Initial state - no data yet */}
      {!data && !error && !isLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Verificare Integritate Date
            </h3>
            <p className="text-muted-foreground mb-4">
              Apasati butonul &quot;Ruleaza Verificarea&quot; pentru a rula toate
              verificarile de integritate a datelor, balante si consistenta
              amortizarilor.
            </p>
            <p className="text-xs text-muted-foreground">
              Echivalent: VERIFIC.PRG din aplicatia legacy FoxPro
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
