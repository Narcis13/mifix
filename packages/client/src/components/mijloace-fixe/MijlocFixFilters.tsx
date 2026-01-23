import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Gestiune } from "shared";

export interface MijlocFixFiltersState {
  search?: string;
  gestiuneId?: number;
  stare?: string;
}

interface MijlocFixFiltersProps {
  gestiuni: Gestiune[];
  filters: MijlocFixFiltersState;
  onFiltersChange: (filters: MijlocFixFiltersState) => void;
}

export function MijlocFixFilters({
  gestiuni,
  filters,
  onFiltersChange,
}: MijlocFixFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({
      ...filters,
      search: value || undefined,
    });
  };

  const handleGestiuneChange = (value: string) => {
    onFiltersChange({
      ...filters,
      gestiuneId: value === "all" ? undefined : Number(value),
    });
  };

  const handleStareChange = (value: string) => {
    onFiltersChange({
      ...filters,
      stare: value === "all" ? undefined : value,
    });
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Search input */}
      <div className="relative flex-1 min-w-[250px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cauta dupa nr. inventar sau denumire..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Gestiune Select */}
      <Select
        value={filters.gestiuneId?.toString() || "all"}
        onValueChange={handleGestiuneChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Toate gestiunile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate gestiunile</SelectItem>
          {gestiuni
            .filter((g) => g.activ)
            .map((gestiune) => (
              <SelectItem key={gestiune.id} value={gestiune.id.toString()}>
                {gestiune.cod} - {gestiune.denumire}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {/* Stare Select */}
      <Select
        value={filters.stare || "all"}
        onValueChange={handleStareChange}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Toate starile" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toate starile</SelectItem>
          <SelectItem value="activ">Activ</SelectItem>
          <SelectItem value="conservare">Conservare</SelectItem>
          <SelectItem value="casat">Casat</SelectItem>
          <SelectItem value="transferat">Transferat</SelectItem>
          <SelectItem value="vandut">Vandut</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
