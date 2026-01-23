import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { SurseFinantareForm } from "@/components/nomenclatoare/SurseFinantareForm";
import { api } from "@/lib/api";
import type { SursaFinantare } from "shared";

export function SurseFinantarePage() {
  const [surse, setSurse] = useState<SursaFinantare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSursa, setEditingSursa] = useState<SursaFinantare | null>(null);

  const loadSurse = useCallback(async () => {
    setIsLoading(true);
    const res = await api.get<SursaFinantare[]>("/surse-finantare");
    if (res.success && res.data) {
      setSurse(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSurse();
  }, [loadSurse]);

  const handleCreate = () => {
    setEditingSursa(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (sursa: SursaFinantare) => {
    setEditingSursa(sursa);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: {
    cod: string;
    denumire: string;
    activ: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingSursa) {
        // Update
        const res = await api.put<SursaFinantare>(
          `/surse-finantare/${editingSursa.id}`,
          data
        );
        if (res.success) {
          setIsDialogOpen(false);
          await loadSurse();
        }
      } else {
        // Create
        const res = await api.post<SursaFinantare>("/surse-finantare", data);
        if (res.success) {
          setIsDialogOpen(false);
          await loadSurse();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<SursaFinantare>[] = [
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
          <h1 className="text-2xl font-bold">Surse de Finantare</h1>
          <p className="text-muted-foreground">
            Administrare surse de finantare pentru mijloace fixe
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Sursa
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={surse}
        isLoading={isLoading}
        emptyMessage="Nu exista surse de finantare. Adaugati prima sursa."
      />

      <SurseFinantareForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        sursa={editingSursa}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
