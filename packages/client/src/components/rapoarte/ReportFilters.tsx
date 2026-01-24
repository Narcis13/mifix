import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Gestiune } from "shared";
import { FileText } from "lucide-react";

export interface ReportFiltersState {
  dataStart?: string;
  dataEnd?: string;
  gestiuneId?: number;
  stare?: string;
  an?: number;
  luna?: number;
}

interface ReportFiltersProps {
  onFilter: (filters: ReportFiltersState) => void;
  showPeriod?: boolean;
  showGestiune?: boolean;
  showStare?: boolean;
  showYearMonth?: boolean;
  isLoading?: boolean;
}

export function ReportFilters({
  onFilter,
  showPeriod = false,
  showGestiune = false,
  showStare = false,
  showYearMonth = false,
  isLoading = false,
}: ReportFiltersProps) {
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [filters, setFilters] = useState<ReportFiltersState>(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Default period to current month
    const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth, 0);

    return {
      dataStart: firstDayOfMonth.toISOString().split("T")[0],
      dataEnd: lastDayOfMonth.toISOString().split("T")[0],
      stare: "activ",
      an: currentYear,
      luna: currentMonth,
    };
  });

  useEffect(() => {
    if (showGestiune) {
      api.get<Gestiune[]>("/gestiuni").then((res) => {
        if (res.success && res.data) {
          setGestiuni(res.data.filter((g) => g.activ));
        }
      });
    }
  }, [showGestiune]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(filters);
  };

  const romanianMonths = [
    { value: 1, label: "Ianuarie" },
    { value: 2, label: "Februarie" },
    { value: 3, label: "Martie" },
    { value: 4, label: "Aprilie" },
    { value: 5, label: "Mai" },
    { value: 6, label: "Iunie" },
    { value: 7, label: "Iulie" },
    { value: 8, label: "August" },
    { value: 9, label: "Septembrie" },
    { value: 10, label: "Octombrie" },
    { value: 11, label: "Noiembrie" },
    { value: 12, label: "Decembrie" },
  ];

  return (
    <Card className="no-print">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
          {showPeriod && (
            <>
              <div className="space-y-2">
                <Label htmlFor="dataStart">De la</Label>
                <Input
                  id="dataStart"
                  type="date"
                  value={filters.dataStart || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dataStart: e.target.value })
                  }
                  className="w-[180px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataEnd">Pana la</Label>
                <Input
                  id="dataEnd"
                  type="date"
                  value={filters.dataEnd || ""}
                  onChange={(e) =>
                    setFilters({ ...filters, dataEnd: e.target.value })
                  }
                  className="w-[180px]"
                />
              </div>
            </>
          )}

          {showYearMonth && (
            <>
              <div className="space-y-2">
                <Label htmlFor="an">An</Label>
                <Input
                  id="an"
                  type="number"
                  value={filters.an || new Date().getFullYear()}
                  onChange={(e) =>
                    setFilters({ ...filters, an: parseInt(e.target.value) || undefined })
                  }
                  className="w-[100px]"
                  min={2000}
                  max={2100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="luna">Luna</Label>
                <Select
                  value={filters.luna?.toString() || ""}
                  onValueChange={(value) =>
                    setFilters({ ...filters, luna: parseInt(value) || undefined })
                  }
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Selecteaza luna" />
                  </SelectTrigger>
                  <SelectContent>
                    {romanianMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value.toString()}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {showGestiune && (
            <div className="space-y-2">
              <Label htmlFor="gestiune">Gestiune</Label>
              <Select
                value={filters.gestiuneId?.toString() || "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    gestiuneId: value === "all" ? undefined : parseInt(value),
                  })
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toate gestiunile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate gestiunile</SelectItem>
                  {gestiuni.map((gestiune) => (
                    <SelectItem key={gestiune.id} value={gestiune.id.toString()}>
                      {gestiune.cod} - {gestiune.denumire}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {showStare && (
            <div className="space-y-2">
              <Label htmlFor="stare">Stare</Label>
              <Select
                value={filters.stare || "activ"}
                onValueChange={(value) =>
                  setFilters({ ...filters, stare: value })
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Toate starile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activ">Activ</SelectItem>
                  <SelectItem value="conservare">Conservare</SelectItem>
                  <SelectItem value="casat">Casat</SelectItem>
                  <SelectItem value="transferat">Transferat</SelectItem>
                  <SelectItem value="vandut">Vandut</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" disabled={isLoading}>
            <FileText className="mr-2 h-4 w-4" />
            {isLoading ? "Se genereaza..." : "Genereaza Raport"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
