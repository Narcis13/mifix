import { useEffect, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { SituatieAmortizareResponse } from "shared";
import { Printer, Download } from "lucide-react";
import { exportCsv } from "@/lib/export-csv";

const MONTH_NAMES = [
  "Ianuarie", "Februarie", "Martie", "Aprilie",
  "Mai", "Iunie", "Iulie", "August",
  "Septembrie", "Octombrie", "Noiembrie", "Decembrie",
];

interface AmortizareDetaliatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  an: number;
  luna: number;
}

function formatCurrency(value: string) {
  return parseFloat(value).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function AmortizareDetaliatDialog({
  open,
  onOpenChange,
  an,
  luna,
}: AmortizareDetaliatDialogProps) {
  const [data, setData] = useState<SituatieAmortizareResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const periodLabel = `${MONTH_NAMES[luna - 1]} ${an}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Amortizare_Lunara_${MONTH_NAMES[luna - 1]}_${an}`,
  });

  useEffect(() => {
    if (!open) return;
    setIsLoading(true);
    setError(null);
    setData(null);

    const params = new URLSearchParams({ an: an.toString(), luna: luna.toString() });
    api
      .get<SituatieAmortizareResponse>(`/rapoarte/amortizare?${params}`)
      .then((res) => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || "Eroare la incarcarea datelor");
        }
      })
      .catch(() => setError("Eroare de retea"))
      .finally(() => setIsLoading(false));
  }, [open, an, luna]);

  const handleExport = () => {
    if (!data) return;
    exportCsv(
      `Amortizare_${MONTH_NAMES[luna - 1]}_${an}`,
      ["Nr. Inventar", "Denumire", "Gestiune", "Clasificare", "Val. Inventar", "Amort. Lunara", "Cumulat", "Ramasa"],
      data.rows.map((r) => [
        r.numarInventar,
        r.denumire,
        r.gestiuneCod,
        r.clasificareCod,
        r.valoareInventar,
        r.valoareLunara,
        r.valoareCumulata,
        r.valoareRamasa,
      ])
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Wide dialog: 95vw so the table has room, capped at 1400px */}
      <DialogContent className="w-[95vw] max-w-[1400px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg">
              Detaliu Amortizare — {periodLabel}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrint()} disabled={!data}>
                <Printer className="mr-2 h-4 w-4" />
                Printeaza
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-auto flex-1 min-h-0">
          {isLoading && (
            <p className="text-muted-foreground text-sm py-8 text-center">Se incarca...</p>
          )}
          {error && (
            <p className="text-destructive text-sm py-8 text-center">{error}</p>
          )}
          {data && (
            <div ref={printRef}>
              {/* Landscape + margins injected inside the print content — most reliable approach */}
              <style>{`
                @page { size: A4 landscape; margin: 12mm; }
                @media print {
                  body { font-size: 9pt; }
                  .print-header { margin-bottom: 8mm; }
                }
              `}</style>

              {/* Header visible only when printing */}
              <div className="print-header hidden print:block mb-4">
                <h1 style={{ fontSize: "14pt", fontWeight: "bold", marginBottom: 2 }}>
                  Situatie Amortizare Lunara
                </h1>
                <p style={{ fontSize: "11pt" }}>{periodLabel}</p>
                <p style={{ fontSize: "8pt", color: "#666" }}>
                  Generat la:{" "}
                  {new Date().toLocaleDateString("ro-RO", {
                    year: "numeric", month: "long", day: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>

              {data.rows.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nu exista amortizari calculate pentru aceasta luna.
                </p>
              ) : (
                <table
                  style={{ width: "100%", borderCollapse: "collapse", fontSize: "inherit" }}
                >
                  <colgroup>
                    {/* Nr. Inventar — fixed narrow */}
                    <col style={{ width: "110px" }} />
                    {/* Denumire — stretches to fill available space */}
                    <col style={{ width: "auto" }} />
                    {/* Gestiune */}
                    <col style={{ width: "90px" }} />
                    {/* Clasificare */}
                    <col style={{ width: "100px" }} />
                    {/* 4 numeric columns — equal width */}
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "120px" }} />
                  </colgroup>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #e2e8f0", background: "#f8fafc" }}>
                      <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Nr. Inventar
                      </th>
                      <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem" }}>
                        Denumire
                      </th>
                      <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Gestiune
                      </th>
                      <th style={{ textAlign: "left", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Clasificare
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Val. Inventar
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Amort. Lunara
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Val. Cumulata
                      </th>
                      <th style={{ textAlign: "right", padding: "8px 6px", fontWeight: 600, fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        Val. Ramasa
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, idx) => (
                      <tr
                        key={row.mijlocFixId}
                        style={{ background: idx % 2 === 0 ? "transparent" : "#f9fafb", borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "6px 6px", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {row.numarInventar}
                        </td>
                        <td style={{ padding: "6px 6px", fontSize: "0.85rem" }}>
                          {row.denumire}
                        </td>
                        <td style={{ padding: "6px 6px", fontSize: "0.8rem" }}>
                          {row.gestiuneCod}
                        </td>
                        <td style={{ padding: "6px 6px", fontSize: "0.8rem" }}>
                          {row.clasificareCod}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {formatCurrency(row.valoareInventar)}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                          {formatCurrency(row.valoareLunara)}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {formatCurrency(row.valoareCumulata)}
                        </td>
                        <td style={{ padding: "6px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          {formatCurrency(row.valoareRamasa)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: "2px solid #1e293b", fontWeight: 700, background: "#f1f5f9" }}>
                      <td style={{ padding: "8px 6px" }} colSpan={4}>
                        TOTAL ({data.rows.length} mijloace fixe)
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {formatCurrency(data.totals.valoareInventar)}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {formatCurrency(data.totals.valoareLunara)}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {formatCurrency(data.totals.valoareCumulata)}
                      </td>
                      <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: "monospace", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                        {formatCurrency(data.totals.valoareRamasa)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
