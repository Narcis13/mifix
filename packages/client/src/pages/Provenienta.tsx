import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { ProvenientaForm } from "@/components/nomenclatoare/ProvenientaForm";
import { api } from "@/lib/api";
import type { Provenienta } from "shared";

export function ProvenientaPage() {
  const [items, setItems] = useState<Provenienta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<Provenienta | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const res = await api.get<Provenienta[]>("/provenienta");
    if (res.success && res.data) {
      setItems(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreate = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (item: Provenienta) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: {
    cod: string;
    denumire: string;
    activ: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await api.put<Provenienta>(
          `/provenienta/${editingItem.id}`,
          data
        );
        if (res.success) {
          setIsDialogOpen(false);
          await loadItems();
        }
      } else {
        const res = await api.post<Provenienta>("/provenienta", data);
        if (res.success) {
          setIsDialogOpen(false);
          await loadItems();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<Provenienta>[] = [
    {
      accessorKey: "cod",
      header: "Cod",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("cod")}</span>
      ),
    },
    {
      accessorKey: "denumire",
      header: "Denumire",
    },
    {
      accessorKey: "activ",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
            row.getValue("activ")
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {row.getValue("activ") ? "Activ" : "Inactiv"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleEdit(row.original)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Provenienta</h1>
          <p className="text-muted-foreground">
            Administrare surse de provenienta pentru mijloace fixe
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Provenienta
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="Nu exista surse de provenienta. Adaugati prima provenienta."
      />

      <ProvenientaForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        provenienta={editingItem}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
