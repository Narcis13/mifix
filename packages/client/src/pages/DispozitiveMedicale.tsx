import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus, AlertTriangle, Clock } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { DispozitivMedical, PaginatedResponse } from "shared";

// ── Labels & variants ─────────────────────────────────────────────────────────

const stareDMLabels: Record<string, string> = {
  activ: "Activ",
  mentenanta: "Mentenanta",
  retras: "Retras",
  carantinat: "Carantinat",
  defect: "Defect",
  arhivat: "Arhivat",
};

const stareDMVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  activ: "default",
  mentenanta: "secondary",
  retras: "destructive",
  carantinat: "destructive",
  defect: "destructive",
  arhivat: "outline",
};

const clasaRiscVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  I: "outline",
  IIa: "secondary",
  IIb: "secondary",
  III: "destructive",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function isExpiringSoon(dateStr?: string, daysThreshold = 30): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= daysThreshold;
}

function isExpired(dateStr?: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

// ── Column definitions ────────────────────────────────────────────────────────

const columns: ColumnDef<DispozitivMedical>[] = [
  {
    id: "mijlocFix",
    header: "Nr. Inventar / Denumire",
    cell: ({ row }) => {
      const mf = row.original.mijlocFix;
      return mf ? (
        <div>
          <div className="font-mono font-medium text-sm">{mf.numarInventar}</div>
          <div className="text-muted-foreground text-xs truncate max-w-[200px]">{mf.denumire}</div>
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "clasaRisc",
    header: "Clasa Risc",
    cell: ({ row }) => (
      <Badge variant={clasaRiscVariant[row.original.clasaRisc] || "outline"}>
        {row.original.clasaRisc}
      </Badge>
    ),
  },
  {
    accessorKey: "producator",
    header: "Producator",
    cell: ({ row }) => (
      <span className="truncate max-w-[150px] block">{row.original.producator}</span>
    ),
  },
  {
    accessorKey: "model",
    header: "Model",
    cell: ({ row }) => row.original.model || <span className="text-muted-foreground">-</span>,
  },
  {
    accessorKey: "numarSerie",
    header: "Nr. Serie",
    cell: ({ row }) => (
      <span className="font-mono text-sm">{row.original.numarSerie || "-"}</span>
    ),
  },
  {
    accessorKey: "dataExpirare",
    header: "Expira",
    cell: ({ row }) => {
      const d = row.original.dataExpirare;
      if (!d) return <span className="text-muted-foreground">-</span>;
      const expired = isExpired(d);
      const soon = isExpiringSoon(d);
      return (
        <div className="flex items-center gap-1">
          {(expired || soon) && (
            <AlertTriangle className={`h-3 w-3 ${expired ? "text-destructive" : "text-amber-500"}`} />
          )}
          <span className={expired ? "text-destructive" : soon ? "text-amber-600" : ""}>
            {new Date(d).toLocaleDateString("ro-RO")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "dataMentenantaUrmatoare",
    header: "Mentenanta Urm.",
    cell: ({ row }) => {
      const d = row.original.dataMentenantaUrmatoare;
      if (!d) return <span className="text-muted-foreground">-</span>;
      const expired = isExpired(d);
      const soon = isExpiringSoon(d, 14);
      return (
        <div className="flex items-center gap-1">
          {(expired || soon) && (
            <Clock className={`h-3 w-3 ${expired ? "text-destructive" : "text-amber-500"}`} />
          )}
          <span className={expired ? "text-destructive" : soon ? "text-amber-600" : ""}>
            {new Date(d).toLocaleDateString("ro-RO")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "stareDM",
    header: "Stare",
    cell: ({ row }) => (
      <Badge variant={stareDMVariant[row.original.stareDM] || "secondary"}>
        {stareDMLabels[row.original.stareDM] || row.original.stareDM}
      </Badge>
    ),
  },
];

// ── Page component ────────────────────────────────────────────────────────────

interface Filters {
  stareDM?: string;
  clasaRisc?: string;
}

export function DispozitiveMedicalePage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<Filters>({});
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<DispozitivMedical> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filters.stareDM) params.set("stareDM", filters.stareDM);
    if (filters.clasaRisc) params.set("clasaRisc", filters.clasaRisc);
    params.set("page", page.toString());
    params.set("pageSize", "20");

    const response = await api.get<PaginatedResponse<DispozitivMedical>>(
      `/dispozitive-medicale?${params}`
    );
    if (response.success && response.data) setData(response.data);
    setIsLoading(false);
  }, [filters.stareDM, filters.clasaRisc, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setPage(1); }, [filters.stareDM, filters.clasaRisc]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispozitive Medicale</h1>
          <p className="text-muted-foreground text-sm">
            Registru dispozitive medicale — MDR EU 2017/745 + Legea 38/2023
          </p>
        </div>
        <Button onClick={() => navigate("/dispozitive-medicale/nou")}>
          <Plus className="mr-2 h-4 w-4" />
          Dispozitiv Nou
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={filters.stareDM || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, stareDM: val === "all" ? undefined : val }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stare DM" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate starile</SelectItem>
            <SelectItem value="activ">Activ</SelectItem>
            <SelectItem value="mentenanta">Mentenanta</SelectItem>
            <SelectItem value="retras">Retras</SelectItem>
            <SelectItem value="carantinat">Carantinat</SelectItem>
            <SelectItem value="defect">Defect</SelectItem>
            <SelectItem value="arhivat">Arhivat</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.clasaRisc || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, clasaRisc: val === "all" ? undefined : val }))
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Clasa Risc" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate clasele</SelectItem>
            <SelectItem value="I">Clasa I</SelectItem>
            <SelectItem value="IIa">Clasa IIa</SelectItem>
            <SelectItem value="IIb">Clasa IIb</SelectItem>
            <SelectItem value="III">Clasa III</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage="Nu exista dispozitive medicale inregistrate."
        onRowClick={(dm) => navigate(`/dispozitive-medicale/${dm.id}`)}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Afisare {(page - 1) * data.pageSize + 1}–
            {Math.min(page * data.pageSize, data.total)} din {data.total} dispozitive
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
            </Button>
            <span className="text-sm px-3">Pagina {page} din {data.totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= data.totalPages}>
              Urmator <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
