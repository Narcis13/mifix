import { useState, useEffect, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { LocFolosinta, Gestiune } from "shared";
import { api } from "@/lib/api";
import { DataTable } from "@/components/data-table/DataTable";
import { LocuriForm } from "@/components/nomenclatoare/LocuriForm";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil } from "lucide-react";

// Column definitions for the DataTable
const columns: ColumnDef<LocFolosinta>[] = [
  {
    accessorKey: "cod",
    header: "Cod",
    cell: ({ row }) => <span className="font-medium">{row.getValue("cod")}</span>,
  },
  {
    accessorKey: "denumire",
    header: "Denumire",
  },
  {
    id: "gestiune",
    header: "Gestiune",
    accessorFn: (row) => row.gestiune?.denumire,
    cell: ({ row }) => {
      const gestiune = row.original.gestiune;
      return gestiune ? `${gestiune.cod} - ${gestiune.denumire}` : "-";
    },
  },
  {
    accessorKey: "activ",
    header: "Stare",
    cell: ({ row }) => {
      const activ = row.getValue("activ") as boolean;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            activ
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
          }`}
        >
          {activ ? "Activ" : "Inactiv"}
        </span>
      );
    },
  },
];

export function LocuriPage() {
  const [locuri, setLocuri] = useState<LocFolosinta[]>([]);
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [selectedGestiune, setSelectedGestiune] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<LocFolosinta | undefined>(undefined);

  // Load gestiuni for filter dropdown
  useEffect(() => {
    api.get<Gestiune[]>("/gestiuni").then((res) => {
      if (res.success && res.data) {
        setGestiuni(res.data);
      }
    });
  }, []);

  // Load locuri with optional filter
  const fetchLocuri = useCallback(async () => {
    setIsLoading(true);
    const params = selectedGestiune ? `?gestiuneId=${selectedGestiune}` : "";
    const response = await api.get<LocFolosinta[]>(`/locuri${params}`);
    if (response.success && response.data) {
      setLocuri(response.data);
    }
    setIsLoading(false);
  }, [selectedGestiune]);

  useEffect(() => {
    fetchLocuri();
  }, [fetchLocuri]);

  // Open dialog for creating new loc
  const handleCreate = () => {
    setEditingLoc(undefined);
    setDialogOpen(true);
  };

  // Open dialog for editing existing loc
  const handleEdit = (loc: LocFolosinta) => {
    setEditingLoc(loc);
    setDialogOpen(true);
  };

  // Refresh list after create/edit success
  const handleSuccess = () => {
    fetchLocuri();
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    // When "all" is selected, set to empty string (no filter)
    setSelectedGestiune(value === "all" ? "" : value);
  };

  // Add actions column dynamically
  const columnsWithActions: ColumnDef<LocFolosinta>[] = [
    ...columns,
    {
      id: "actions",
      header: "Actiuni",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(row.original)}
          className="h-8 w-8 p-0"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Editeaza</span>
        </Button>
      ),
      enableSorting: false,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Locuri de Folosinta</h1>
          <p className="text-muted-foreground">
            Administrare locuri de folosinta in cadrul gestiunilor
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Loc
        </Button>
      </div>

      {/* Filter by gestiune */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtreaza dupa gestiune:</span>
          <Select value={selectedGestiune || "all"} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Toate gestiunile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate gestiunile</SelectItem>
              {gestiuni.map((g) => (
                <SelectItem key={g.id} value={g.id.toString()}>
                  {g.cod} - {g.denumire}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={locuri}
        isLoading={isLoading}
        emptyMessage="Nu exista locuri de folosinta. Adaugati primul loc."
      />

      <LocuriForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        locFolosinta={editingLoc}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
