import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Clasificare, PaginatedResponse } from "shared";

// Debounce hook for search input
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const columns: ColumnDef<Clasificare>[] = [
  {
    accessorKey: "cod",
    header: "Cod",
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue("cod")}</span>
    ),
  },
  {
    accessorKey: "denumire",
    header: "Denumire",
    cell: ({ row }) => (
      <span className="max-w-[400px] truncate block" title={row.getValue("denumire")}>
        {row.getValue("denumire")}
      </span>
    ),
  },
  {
    accessorKey: "grupa",
    header: "Grupa",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
        {row.getValue("grupa")}
      </span>
    ),
  },
  {
    accessorKey: "durataNormalaMin",
    header: "Durata Min",
    cell: ({ row }) => (
      <span className="text-right block">{row.getValue("durataNormalaMin")} ani</span>
    ),
  },
  {
    accessorKey: "durataNormalaMax",
    header: "Durata Max",
    cell: ({ row }) => (
      <span className="text-right block">{row.getValue("durataNormalaMax")} ani</span>
    ),
  },
];

export function ClasificariPage() {
  const [search, setSearch] = useState("");
  const [grupa, setGrupa] = useState<string>("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<Clasificare> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const debouncedSearch = useDebounce(search, 300);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (grupa && grupa !== "all") params.set("grupa", grupa);
    params.set("page", page.toString());
    params.set("pageSize", "20");

    const res = await api.get<PaginatedResponse<Clasificare>>(
      `/clasificari?${params}`
    );
    if (res.success && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  }, [debouncedSearch, grupa, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, grupa]);

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (data && page < data.totalPages) {
      setPage((p) => p + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Clasificari HG 2139/2004</h1>
        <p className="text-muted-foreground">
          Catalogul de clasificari pentru mijloace fixe conform HG 2139/2004
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cauta dupa cod sau denumire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={grupa} onValueChange={setGrupa}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Toate grupele" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate grupele</SelectItem>
            <SelectItem value="I">Grupa I</SelectItem>
            <SelectItem value="II">Grupa II</SelectItem>
            <SelectItem value="III">Grupa III</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        isLoading={isLoading}
        emptyMessage={
          search || grupa
            ? "Nu s-au gasit clasificari pentru criteriile selectate."
            : "Nu exista clasificari in catalog."
        }
      />

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            Afisare {((page - 1) * data.pageSize) + 1}-
            {Math.min(page * data.pageSize, data.total)} din {data.total}{" "}
            clasificari
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
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
              onClick={handleNextPage}
              disabled={page >= data.totalPages}
            >
              Urmator
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
