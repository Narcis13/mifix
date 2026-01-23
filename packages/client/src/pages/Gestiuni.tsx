import { useState, useEffect, useCallback } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { Gestiune } from "shared";
import { api } from "@/lib/api";
import { DataTable } from "@/components/data-table/DataTable";
import { GestiuniForm } from "@/components/nomenclatoare/GestiuniForm";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

// Column definitions for the DataTable
const columns: ColumnDef<Gestiune>[] = [
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
    accessorKey: "responsabil",
    header: "Responsabil",
    cell: ({ row }) => row.getValue("responsabil") || "-",
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

export function GestiuniPage() {
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGestiune, setEditingGestiune] = useState<Gestiune | undefined>(undefined);

  const fetchGestiuni = useCallback(async () => {
    setIsLoading(true);
    const response = await api.get<Gestiune[]>("/gestiuni");
    if (response.success && response.data) {
      setGestiuni(response.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchGestiuni();
  }, [fetchGestiuni]);

  // Open dialog for creating new gestiune
  const handleCreate = () => {
    setEditingGestiune(undefined);
    setDialogOpen(true);
  };

  // Open dialog for editing existing gestiune
  const handleEdit = (gestiune: Gestiune) => {
    setEditingGestiune(gestiune);
    setDialogOpen(true);
  };

  // Refresh list after create/edit success
  const handleSuccess = () => {
    fetchGestiuni();
  };

  // Add actions column dynamically
  const columnsWithActions: ColumnDef<Gestiune>[] = [
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
          <h1 className="text-2xl font-bold">Gestiuni</h1>
          <p className="text-muted-foreground">
            Administrare gestiuni (custodie active)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Gestiune
        </Button>
      </div>

      <DataTable
        columns={columnsWithActions}
        data={gestiuni}
        isLoading={isLoading}
        emptyMessage="Nu exista gestiuni. Adaugati prima gestiune."
      />

      <GestiuniForm
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        gestiune={editingGestiune}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
