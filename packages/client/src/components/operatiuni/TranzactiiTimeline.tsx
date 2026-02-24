import { useState, useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import type { Tranzactie, TipTranzactie } from "shared";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ArrowRightLeft,
  Ban,
  TrendingDown,
  RefreshCw,
  Wrench,
  LogOut,
  History,
  Trash2,
  FileText,
} from "lucide-react";

// Type labels in Romanian
const tipLabels: Record<TipTranzactie, string> = {
  intrare: "Intrare",
  transfer: "Transfer",
  casare: "Casare",
  declasare: "Declasare",
  reevaluare: "Reevaluare",
  modernizare: "Modernizare",
  iesire: "Iesire",
};

// Icons for each transaction type
const tipIcons: Record<TipTranzactie, ReactNode> = {
  intrare: <Plus className="h-4 w-4" />,
  transfer: <ArrowRightLeft className="h-4 w-4" />,
  casare: <Ban className="h-4 w-4" />,
  declasare: <TrendingDown className="h-4 w-4" />,
  reevaluare: <RefreshCw className="h-4 w-4" />,
  modernizare: <Wrench className="h-4 w-4" />,
  iesire: <LogOut className="h-4 w-4" />,
};

// Color classes for each type
const tipColors: Record<TipTranzactie, string> = {
  intrare: "bg-green-100 text-green-600 border-green-200",
  transfer: "bg-blue-100 text-blue-600 border-blue-200",
  casare: "bg-red-100 text-red-600 border-red-200",
  declasare: "bg-orange-100 text-orange-600 border-orange-200",
  reevaluare: "bg-purple-100 text-purple-600 border-purple-200",
  modernizare: "bg-cyan-100 text-cyan-600 border-cyan-200",
  iesire: "bg-gray-100 text-gray-600 border-gray-200",
};

interface TranzactiiTimelineProps {
  mijlocFixId: number;
  onTransactionDeleted?: () => void;
}

export function TranzactiiTimeline({ mijlocFixId, onTransactionDeleted }: TranzactiiTimelineProps) {
  const navigate = useNavigate();
  const [tranzactii, setTranzactii] = useState<Tranzactie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTranzactii = () => {
    setIsLoading(true);
    api
      .get<Tranzactie[]>(`/operatiuni/istoric/${mijlocFixId}`)
      .then((res) => {
        if (res.success && res.data) {
          setTranzactii(res.data);
        }
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchTranzactii();
  }, [mijlocFixId]);

  async function handleDeleteTransaction(tranzactieId: number) {
    if (!confirm("Sigur doriti stergerea acestei tranzactii? Efectele vor fi inversate.")) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await api.post("/operatiuni/stergere-tranzactie", { tranzactieId });
      if (res.success) {
        toast.success("Tranzactia a fost stearsa");
        fetchTranzactii();
        onTransactionDeleted?.();
      } else {
        toast.error(res.message || "Eroare la stergere");
      }
    } catch {
      toast.error("Eroare de retea");
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Se incarca istoricul...</div>
      </div>
    );
  }

  if (tranzactii.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mb-4 opacity-50" />
        <p>Nu exista tranzactii inregistrate</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (value: string) => {
    return (
      parseFloat(value).toLocaleString("ro-RO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " RON"
    );
  };

  const getTransactionDetails = (tranzactie: Tranzactie): string | null => {
    switch (tranzactie.tip) {
      case "transfer":
        // Check if it's a gestiune transfer or loc transfer
        if (tranzactie.gestiuneSursa && tranzactie.gestiuneDestinatie) {
          return `De la ${tranzactie.gestiuneSursa.denumire} la ${tranzactie.gestiuneDestinatie.denumire}`;
        }
        if (tranzactie.locFolosintaSursa && tranzactie.locFolosintaDestinatie) {
          return `De la ${tranzactie.locFolosintaSursa.denumire} la ${tranzactie.locFolosintaDestinatie.denumire}`;
        }
        return tranzactie.descriere || null;

      case "casare":
        return tranzactie.descriere || "Mijloc fix casat";

      case "declasare":
        if (tranzactie.valoareOperatie) {
          return `Reducere: ${formatCurrency(tranzactie.valoareOperatie)}${tranzactie.descriere ? ` - ${tranzactie.descriere}` : ""}`;
        }
        return tranzactie.descriere || null;

      case "reevaluare":
        if (tranzactie.valoareOperatie && tranzactie.valoareDupa) {
          return `Noua valoare: ${formatCurrency(tranzactie.valoareDupa)}`;
        }
        return tranzactie.descriere || null;

      case "modernizare":
        if (tranzactie.valoareOperatie) {
          return `Valoare modernizare: ${formatCurrency(tranzactie.valoareOperatie)}`;
        }
        return tranzactie.descriere || null;

      default:
        return tranzactie.descriere || tranzactie.observatii || null;
    }
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {tranzactii.map((tranzactie, index) => {
          const details = getTransactionDetails(tranzactie);
          const colorClass = tipColors[tranzactie.tip];
          // Only the most recent (first in list) non-intrare transaction can be deleted
          const canDelete = index === 0 && tranzactie.tip !== "intrare";

          return (
            <div key={tranzactie.id} className="relative pl-12">
              {/* Icon circle */}
              <div
                className={`absolute left-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${colorClass}`}
              >
                {tipIcons[tranzactie.tip]}
              </div>

              {/* Content card */}
              <div className="rounded-lg border bg-card p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{tipLabels[tranzactie.tip]}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(tranzactie.dataOperare)}
                    </span>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteTransaction(tranzactie.id)}
                        disabled={isDeleting}
                        title="Sterge tranzactia"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Details */}
                {details && (
                  <p className="text-sm text-muted-foreground mb-2">{details}</p>
                )}

                {/* Value changes for declasare */}
                {tranzactie.tip === "declasare" &&
                  tranzactie.valoareInainte &&
                  tranzactie.valoareDupa && (
                    <div className="text-xs text-muted-foreground">
                      Valoare ramasa: {formatCurrency(tranzactie.valoareInainte)} →{" "}
                      {formatCurrency(tranzactie.valoareDupa)}
                    </div>
                  )}

                {/* Document number if present */}
                {tranzactie.documentNumar && (
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    Document: {tranzactie.documentNumar}
                  </div>
                )}

                {/* Operatiune link */}
                {tranzactie.operatiuneId && tranzactie.operatiune && (
                  <div className={`text-xs text-muted-foreground ${tranzactie.documentNumar ? "mt-1" : "mt-2 pt-2 border-t"}`}>
                    <Button
                      variant="link"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onClick={() => navigate(`/operatiuni-acte/${tranzactie.operatiuneId}`)}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      OP-{tranzactie.operatiune.numarOperatie}/{tranzactie.operatiune.an}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
