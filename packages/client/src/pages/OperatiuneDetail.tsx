import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Lock,
  Ban,
  Plus,
  Printer,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AddLinieIntrareDialog } from "@/components/operatiuni-acte/AddLinieIntrareDialog";
import { AddLinieTransferDialog } from "@/components/operatiuni-acte/AddLinieTransferDialog";
import { AddLinieIesireDialog } from "@/components/operatiuni-acte/AddLinieIesireDialog";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { Operatiune, Tranzactie } from "shared";

// ── Helpers ──────────────────────────────────────────────────────────────────

const tipOperatieLabels: Record<string, string> = {
  intrare: "Intrare",
  iesire: "Iesire",
  transfer: "Transfer",
  inventar: "Inventar",
  ajustare: "Ajustare",
};

const stareLabels: Record<string, string> = {
  deschisa: "Deschisa",
  finalizata: "Finalizata",
  anulata: "Anulata",
};

const stareBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  deschisa: "outline",
  finalizata: "default",
  anulata: "destructive",
};

const tipTranzactieLabels: Record<string, string> = {
  intrare: "Intrare",
  transfer: "Transfer",
  casare: "Casare",
  declasare: "Declasare",
  reevaluare: "Reevaluare",
  modernizare: "Modernizare",
  iesire: "Iesire",
};

function formatMoney(val?: string | null): string {
  if (!val) return "-";
  return parseFloat(val).toLocaleString("ro-RO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value || <span className="text-muted-foreground">-</span>}
      </dd>
    </div>
  );
}

// ── Tranzactie columns ───────────────────────────────────────────────────────

function makeLiniiColumns(
  isDeschisa: boolean,
  onDeleteLinie: (tranzactieId: number) => void
): ColumnDef<Tranzactie>[] {
  const cols: ColumnDef<Tranzactie>[] = [
    {
      id: "index",
      header: "#",
      cell: ({ row }) => row.index + 1,
    },
    {
      id: "numarInventar",
      header: "Nr. Inventar",
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {row.original.mijlocFix?.numarInventar || "-"}
        </span>
      ),
    },
    {
      id: "denumire",
      header: "Denumire",
      cell: ({ row }) => row.original.mijlocFix?.denumire || "-",
    },
    {
      accessorKey: "tip",
      header: "Tip",
      cell: ({ row }) => tipTranzactieLabels[row.original.tip] || row.original.tip,
    },
    {
      id: "deLa",
      header: "De la",
      cell: ({ row }) => {
        const t = row.original;
        if (t.gestiuneSursa) return t.gestiuneSursa.denumire;
        if (t.locFolosintaSursa) return t.locFolosintaSursa.denumire;
        return "-";
      },
    },
    {
      id: "catre",
      header: "Catre",
      cell: ({ row }) => {
        const t = row.original;
        if (t.gestiuneDestinatie) return t.gestiuneDestinatie.denumire;
        if (t.locFolosintaDestinatie) return t.locFolosintaDestinatie.denumire;
        return "-";
      },
    },
    {
      id: "valoare",
      header: "Valoare",
      cell: ({ row }) => {
        const t = row.original;
        return (
          <span className="font-mono text-sm">
            {formatMoney(t.valoareOperatie || t.mijlocFix?.valoareInventar)}
          </span>
        );
      },
    },
  ];

  if (isDeschisa) {
    cols.push({
      id: "actiuni",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDeleteLinie(row.original.id);
          }}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    });
  }

  return cols;
}

// ── Page component ───────────────────────────────────────────────────────────

export function OperatiuneDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [operatiune, setOperatiune] = useState<Operatiune | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [addLinieOpen, setAddLinieOpen] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [anuleazaConfirmOpen, setAnuleazaConfirmOpen] = useState(false);
  const [deletingLinieId, setDeletingLinieId] = useState<number | null>(null);
  const [anuleazaMotiv, setAnuleazaMotiv] = useState("");
  const [isActioning, setIsActioning] = useState(false);

  const fetchOperatiune = useCallback(async () => {
    if (!id) return;
    const res = await api.get<Operatiune>(`/operatiuni-acte/${id}`);
    if (res.success && res.data) {
      setOperatiune(res.data);
      setError(null);
    } else {
      setError(res.message || "Operatiunea nu a fost gasita");
    }
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchOperatiune();
  }, [fetchOperatiune]);

  // ── Actions ──────────────────────────────────────────────────────────────

  async function handleFinalize() {
    if (!operatiune) return;
    setIsActioning(true);
    const res = await api.post(`/operatiuni-acte/${operatiune.id}/finalizeaza`, {});
    if (res.success) {
      toast.success("Operatiunea a fost finalizata");
      setFinalizeConfirmOpen(false);
      fetchOperatiune();
    } else {
      toast.error(res.message || "Eroare la finalizare");
    }
    setIsActioning(false);
  }

  async function handleAnuleaza() {
    if (!operatiune || !anuleazaMotiv.trim()) return;
    setIsActioning(true);
    const res = await api.post(`/operatiuni-acte/${operatiune.id}/anuleaza`, {
      motiv: anuleazaMotiv.trim(),
    });
    if (res.success) {
      toast.success(res.message || "Operatiunea a fost anulata");
      setAnuleazaConfirmOpen(false);
      setAnuleazaMotiv("");
      fetchOperatiune();
    } else {
      toast.error(res.message || "Eroare la anulare");
    }
    setIsActioning(false);
  }

  async function handleDeleteLinie(tranzactieId: number) {
    if (!operatiune) return;
    setIsActioning(true);
    const res = await api.delete(
      `/operatiuni-acte/${operatiune.id}/linie/${tranzactieId}`
    );
    if (res.success) {
      toast.success("Linia a fost stearsa");
      setDeletingLinieId(null);
      fetchOperatiune();
    } else {
      toast.error(res.message || "Eroare la stergerea liniei");
    }
    setIsActioning(false);
  }

  // ── Loading / Error ────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Se incarca...</p>
      </div>
    );
  }

  if (error || !operatiune) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/operatiuni-acte")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Inapoi la lista
        </Button>
        <div className="text-destructive">{error || "Operatiunea nu a fost gasita"}</div>
      </div>
    );
  }

  const isDeschisa = operatiune.stare === "deschisa";
  const isFinalizata = operatiune.stare === "finalizata";
  const linii = operatiune.tranzactii || [];

  const liniiColumns = makeLiniiColumns(isDeschisa, (tranzactieId) =>
    setDeletingLinieId(tranzactieId)
  );

  // Determine which add-linie dialog to show based on tipOperatie
  const AddLinieDialog =
    operatiune.tipOperatie === "intrare"
      ? AddLinieIntrareDialog
      : operatiune.tipOperatie === "iesire"
        ? AddLinieIesireDialog
        : AddLinieTransferDialog;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/operatiuni-acte")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Inapoi
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Operatiune {operatiune.numarOperatie}/{operatiune.an}
            </h1>
            <p className="text-muted-foreground">
              {tipOperatieLabels[operatiune.tipOperatie]} -{" "}
              {new Date(operatiune.dataOperare).toLocaleDateString("ro-RO")}
            </p>
          </div>
          <Badge
            variant={stareBadgeVariant[operatiune.stare] || "secondary"}
            className="text-sm"
          >
            {stareLabels[operatiune.stare]}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {isDeschisa && (
            <>
              <Button onClick={() => setAddLinieOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adauga Linie
              </Button>
              <Button
                variant="secondary"
                onClick={() => setFinalizeConfirmOpen(true)}
                disabled={linii.length === 0}
              >
                <Lock className="mr-2 h-4 w-4" />
                Finalizeaza
              </Button>
            </>
          )}
          {(isDeschisa || isFinalizata) && (
            <Button
              variant="destructive"
              onClick={() => setAnuleazaConfirmOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Anuleaza
            </Button>
          )}
          {isFinalizata && (
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Tipareste
            </Button>
          )}
        </div>
      </div>

      {/* Operatiune Header Card */}
      <Card>
        <CardHeader>
          <CardTitle>Detalii Operatiune</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DetailField
            label="Nr. Operatie"
            value={`${operatiune.numarOperatie}/${operatiune.an}`}
            mono
          />
          <DetailField
            label="Data Operarii"
            value={new Date(operatiune.dataOperare).toLocaleDateString("ro-RO")}
          />
          <DetailField
            label="Tip Operatie"
            value={tipOperatieLabels[operatiune.tipOperatie]}
          />
          <DetailField
            label="Tip Document"
            value={
              operatiune.tipDocument
                ? `${operatiune.tipDocument.cod} - ${operatiune.tipDocument.denumire}`
                : undefined
            }
          />
          <DetailField label="Nr. Document" value={operatiune.numarDocument} />
          <DetailField
            label="Data Document"
            value={
              operatiune.dataDocument
                ? new Date(operatiune.dataDocument).toLocaleDateString("ro-RO")
                : undefined
            }
          />
          <div className="md:col-span-3">
            <DetailField label="Descriere" value={operatiune.descriere} />
          </div>
        </CardContent>
      </Card>

      {/* Linii (Tranzactii) Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Linii ({linii.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={liniiColumns}
            data={linii}
            emptyMessage={
              isDeschisa
                ? "Nicio linie adaugata. Apasati 'Adauga Linie' pentru a incepe."
                : "Aceasta operatiune nu are linii."
            }
          />
        </CardContent>
      </Card>

      {/* ── Confirm Dialogs ─────────────────────────────────────────────── */}

      {/* Finalize confirm */}
      <Dialog open={finalizeConfirmOpen} onOpenChange={setFinalizeConfirmOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Finalizare Operatiune</DialogTitle>
            <DialogDescription>
              Sunteti sigur ca doriti sa finalizati operatiunea {operatiune.numarOperatie}/
              {operatiune.an}? Dupa finalizare nu se mai pot adauga sau sterge linii.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFinalizeConfirmOpen(false)}
              disabled={isActioning}
            >
              Anuleaza
            </Button>
            <Button onClick={handleFinalize} disabled={isActioning}>
              {isActioning ? "Se finalizeaza..." : "Finalizeaza"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Anulare confirm */}
      <Dialog
        open={anuleazaConfirmOpen}
        onOpenChange={(open) => {
          setAnuleazaConfirmOpen(open);
          if (!open) setAnuleazaMotiv("");
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Anulare Operatiune</DialogTitle>
            <DialogDescription>
              Aceasta actiune va inversa toate tranzactiile din operatiune. Introduceti
              motivul anularii.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label htmlFor="motiv-anulare">Motiv anulare *</Label>
            <Textarea
              id="motiv-anulare"
              value={anuleazaMotiv}
              onChange={(e) => setAnuleazaMotiv(e.target.value)}
              placeholder="Motivul anularii operatiunii"
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isActioning}
              onClick={() => {
                setAnuleazaConfirmOpen(false);
                setAnuleazaMotiv("");
              }}
            >
              Renunta
            </Button>
            <Button
              variant="destructive"
              onClick={handleAnuleaza}
              disabled={isActioning || !anuleazaMotiv.trim()}
            >
              {isActioning ? "Se anuleaza..." : "Anuleaza Operatiunea"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Linie confirm */}
      <Dialog
        open={deletingLinieId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingLinieId(null);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Stergere Linie</DialogTitle>
            <DialogDescription>
              Sunteti sigur ca doriti sa stergeti aceasta linie? Efectul tranzactiei va
              fi inversat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={isActioning}
              onClick={() => setDeletingLinieId(null)}
            >
              Anuleaza
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingLinieId && handleDeleteLinie(deletingLinieId)}
              disabled={isActioning}
            >
              {isActioning ? "Se sterge..." : "Sterge Linia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Linie Dialogs ───────────────────────────────────────────── */}

      {isDeschisa && (
        <AddLinieDialog
          open={addLinieOpen}
          onOpenChange={setAddLinieOpen}
          operatiuneId={operatiune.id}
          onSuccess={() => {
            setAddLinieOpen(false);
            fetchOperatiune();
          }}
        />
      )}
    </div>
  );
}
