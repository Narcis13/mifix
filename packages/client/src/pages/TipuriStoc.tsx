import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { TipuriStocForm } from "@/components/nomenclatoare/TipuriStocForm";
import { api } from "@/lib/api";
import type { TipStoc } from "shared";

export function TipuriStocPage() {
  const [items, setItems] = useState<TipStoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<TipStoc | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const res = await api.get<TipStoc[]>("/tipuri-stoc");
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

  const handleEdit = (item: TipStoc) => {
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
        const res = await api.put<TipStoc>(
          `/tipuri-stoc/${editingItem.id}`,
          data
        );
        if (res.success) {
          setIsDialogOpen(false);
          await loadItems();
        }
      } else {
        const res = await api.post<TipStoc>("/tipuri-stoc", data);
        if (res.success) {
          setIsDialogOpen(false);
          await loadItems();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<TipStoc>[] = [
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
          <h1 className="text-2xl font-bold">Tipuri Stoc</h1>
          <p className="text-muted-foreground">
            Administrare tipuri stoc/utilizare (in folosinta, magazie, stoc)
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Tip Stoc
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        emptyMessage="Nu exista tipuri de stoc. Adaugati primul tip."
      />

      <TipuriStocForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        tipStoc={editingItem}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
