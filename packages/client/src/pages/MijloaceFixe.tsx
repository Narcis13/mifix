import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import {
  MijlocFixFilters,
  type MijlocFixFiltersState,
} from "@/components/mijloace-fixe/MijlocFixFilters";
import { mijlocFixColumns } from "@/components/mijloace-fixe/MijlocFixColumns";
import { useDebounce } from "@/hooks/useDebounce";
import { api } from "@/lib/api";
import type { Gestiune, MijlocFix, PaginatedResponse } from "shared";

export function MijloaceFixePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Parse initial filters from URL
  const initialFilters: MijlocFixFiltersState = {
    search: searchParams.get("search") || undefined,
    gestiuneId: searchParams.get("gestiuneId")
      ? Number(searchParams.get("gestiuneId"))
      : undefined,
    stare: searchParams.get("stare") || undefined,
  };
  const initialPage = Number(searchParams.get("page")) || 1;

  // State
  const [filters, setFilters] = useState<MijlocFixFiltersState>(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [data, setData] = useState<PaginatedResponse<MijlocFix> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(filters.search || "", 300);

  // Fetch gestiuni for filter dropdown
  useEffect(() => {
    const fetchGestiuni = async () => {
      const response = await api.get<Gestiune[]>("/gestiuni");
      if (response.success && response.data) {
        setGestiuni(response.data);
      }
    };
    fetchGestiuni();
  }, []);

  // Fetch mijloace fixe when filters or page change
  const fetchMijloaceFixe = useCallback(async () => {
    setIsLoading(true);
    const params = new URLSearchParams();

    if (debouncedSearch) params.set("search", debouncedSearch);
    if (filters.gestiuneId) params.set("gestiuneId", filters.gestiuneId.toString());
    if (filters.stare) params.set("stare", filters.stare);
    params.set("page", page.toString());
    params.set("pageSize", "20");

    const response = await api.get<PaginatedResponse<MijlocFix>>(
      `/mijloace-fixe?${params}`
    );

    if (response.success && response.data) {
      setData(response.data);
    }
    setIsLoading(false);
  }, [debouncedSearch, filters.gestiuneId, filters.stare, page]);

  useEffect(() => {
    fetchMijloaceFixe();
  }, [fetchMijloaceFixe]);

  // Sync filters to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set("search", filters.search);
    if (filters.gestiuneId) params.set("gestiuneId", filters.gestiuneId.toString());
    if (filters.stare) params.set("stare", filters.stare);
    if (page > 1) params.set("page", page.toString());

    setSearchParams(params, { replace: true });
  }, [filters, page, setSearchParams]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.gestiuneId, filters.stare]);

  // Handlers
  const handleFiltersChange = (newFilters: MijlocFixFiltersState) => {
    setFilters(newFilters);
  };

  const handleRowClick = (mijlocFix: MijlocFix) => {
    navigate(`/mijloace-fixe/${mijlocFix.id}`);
  };

  const handleCreate = () => {
    navigate("/mijloace-fixe/nou");
  };

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

  // Determine empty message based on filters
  const hasFilters = filters.search || filters.gestiuneId || filters.stare;
  const emptyMessage = hasFilters
    ? "Nu s-au gasit mijloace fixe pentru criteriile selectate."
    : "Nu exista mijloace fixe. Adaugati primul mijloc fix.";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mijloace Fixe</h1>
          <p className="text-muted-foreground">
            Administrare mijloace fixe si inventar
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Mijloc Fix
        </Button>
      </div>

      {/* Filters */}
      <MijlocFixFilters
        gestiuni={gestiuni}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Table */}
      <DataTable
        columns={mijlocFixColumns}
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
            {Math.min(page * data.pageSize, data.total)} din {data.total}{" "}
            mijloace fixe
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
