import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateOperatiuneDialog } from "@/components/operatiuni-acte/CreateOperatiuneDialog";
import { api } from "@/lib/api";
import type { Operatiune, PaginatedResponse } from "shared";

// ── Column definitions ───────────────────────────────────────────────────────

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

const operatiuneColumns: ColumnDef<Operatiune>[] = [
  {
    accessorKey: "numarOperatie",
    header: "Nr. Operatie",
    cell: ({ row }) => (
      <span className="font-mono font-medium">
        {row.original.numarOperatie}/{row.original.an}
      </span>
    ),
  },
  {
    accessorKey: "dataOperare",
    header: "Data",
    cell: ({ row }) => new Date(row.original.dataOperare).toLocaleDateString("ro-RO"),
  },
  {
    accessorKey: "tipOperatie",
    header: "Tip",
    cell: ({ row }) => tipOperatieLabels[row.original.tipOperatie] || row.original.tipOperatie,
  },
  {
    id: "document",
    header: "Document",
    cell: ({ row }) => {
      const { tipDocument, numarDocument } = row.original;
      if (!tipDocument && !numarDocument) return <span className="text-muted-foreground">-</span>;
      const parts = [];
      if (tipDocument) parts.push(tipDocument.denumire);
      if (numarDocument) parts.push(`#${numarDocument}`);
      return parts.join(" ");
    },
  },
  {
    accessorKey: "numarLinii",
    header: "Linii",
    cell: ({ row }) => row.original.numarLinii ?? 0,
  },
  {
    accessorKey: "stare",
    header: "Stare",
    cell: ({ row }) => (
      <Badge variant={stareBadgeVariant[row.original.stare] || "secondary"}>
        {stareLabels[row.original.stare] || row.original.stare}
      </Badge>
    ),
  },
  {
    accessorKey: "descriere",
    header: "Descriere",
    cell: ({ row }) => (
      <span className="text-muted-foreground truncate max-w-[200px] block">
        {row.original.descriere || "-"}
      </span>
    ),
  },
];

// ── Filter state ─────────────────────────────────────────────────────────────

interface OperatiuniFiltersState {
  an?: number;
  tipOperatie?: string;
  stare?: string;
  dataStart?: string;
  dataEnd?: string;
}

// ── Page component ───────────────────────────────────────────────────────────

export function OperatiuniActePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentYear = new Date().getFullYear();

  const initialFilters: OperatiuniFiltersState = {
    an: searchParams.get("an") ? Number(searchParams.get("an")) : currentYear,
    tipOperatie: searchParams.get("tipOperatie") || undefined,
    stare: searchParams.get("stare") || undefined,
    dataStart: searchParams.get("dataStart") || undefined,
    dataEnd: searchParams.get("dataEnd") || undefined,
  };
  const initialPage = Number(searchParams.get("page")) || 1;

  const [filters, setFilters] = useState<OperatiuniFiltersState>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<PaginatedResponse<Operatiune> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Build available years for filter (from 2000 to current + 1)
  const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

  const fetchOperatiuni = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();

    if (filters.an) params.set("an", filters.an.toString());
    if (filters.tipOperatie) params.set("tipOperatie", filters.tipOperatie);
    if (filters.stare) params.set("stare", filters.stare);
    if (filters.dataStart) params.set("dataStart", filters.dataStart);
    if (filters.dataEnd) params.set("dataEnd", filters.dataEnd);
    params.set("page", page.toString());
    params.set("pageSize", "20");

    const response = await api.get<PaginatedResponse<Operatiune>>(
      `/operatiuni-acte?${params}`
    );

    if (response.success && response.data) {
      setData(response.data);
    }
    setIsLoading(false);
  }, [filters.an, filters.tipOperatie, filters.stare, filters.dataStart, filters.dataEnd, page]);

  useEffect(() => {
    fetchOperatiuni();
  }, [fetchOperatiuni]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.an) params.set("an", filters.an.toString());
    if (filters.tipOperatie) params.set("tipOperatie", filters.tipOperatie);
    if (filters.stare) params.set("stare", filters.stare);
    if (filters.dataStart) params.set("dataStart", filters.dataStart);
    if (filters.dataEnd) params.set("dataEnd", filters.dataEnd);
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params, { replace: true });
  }, [filters, page, setSearchParams]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [filters.an, filters.tipOperatie, filters.stare, filters.dataStart, filters.dataEnd]);

  const handleRowClick = (op: Operatiune) => {
    navigate(`/operatiuni-acte/${op.id}`);
  };

  const handleCreateSuccess = (operatiune: Operatiune) => {
    navigate(`/operatiuni-acte/${operatiune.id}`);
  };

  const hasFilters = filters.tipOperatie || filters.stare || filters.dataStart || filters.dataEnd;
  const emptyMessage = hasFilters
    ? "Nu s-au gasit operatiuni pentru criteriile selectate."
    : "Nu exista operatiuni. Creati prima operatiune.";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operatiuni</h1>
          <p className="text-muted-foreground">
            Gestionare acte si operatiuni document-container
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Operatiune Noua
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* An */}
        <Select
          value={filters.an?.toString() || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, an: val === "all" ? undefined : Number(val) }))
          }
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="An" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toti anii</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tip Operatie */}
        <Select
          value={filters.tipOperatie || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, tipOperatie: val === "all" ? undefined : val }))
          }
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tip operatie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate tipurile</SelectItem>
            <SelectItem value="intrare">Intrare</SelectItem>
            <SelectItem value="iesire">Iesire</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="inventar">Inventar</SelectItem>
            <SelectItem value="ajustare">Ajustare</SelectItem>
          </SelectContent>
        </Select>

        {/* Stare */}
        <Select
          value={filters.stare || "all"}
          onValueChange={(val) =>
            setFilters((f) => ({ ...f, stare: val === "all" ? undefined : val }))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Stare" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate starile</SelectItem>
            <SelectItem value="deschisa">Deschisa</SelectItem>
            <SelectItem value="finalizata">Finalizata</SelectItem>
            <SelectItem value="anulata">Anulata</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={filters.dataStart || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dataStart: e.target.value || undefined }))
            }
            className="w-[150px]"
            placeholder="De la"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="date"
            value={filters.dataEnd || ""}
            onChange={(e) =>
              setFilters((f) => ({ ...f, dataEnd: e.target.value || undefined }))
            }
            className="w-[150px]"
            placeholder="Pana la"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={operatiuneColumns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onRowClick={handleRowClick}
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Afisare {(page - 1) * data.pageSize + 1}-
            {Math.min(page * data.pageSize, data.total)} din {data.total} operatiuni
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm px-3">
              Pagina {page} din {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.totalPages}
            >
              Urmator
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      <CreateOperatiuneDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
