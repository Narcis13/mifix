import { useState, useEffect, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { DataTable } from "@/components/data-table/DataTable";
import { Button } from "@/components/ui/button";
import { ConturiForm } from "@/components/nomenclatoare/ConturiForm";
import { api } from "@/lib/api";
import type { Cont, TipCont } from "shared";

// Tip labels for display
const tipLabels: Record<TipCont, string> = {
  activ: "Activ",
  pasiv: "Pasiv",
  bifunctional: "Bifunctional",
};

export function ConturiPage() {
  const [conturi, setConturi] = useState<Cont[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCont, setEditingCont] = useState<Cont | null>(null);

  const loadConturi = useCallback(async () => {
    setIsLoading(true);
    const res = await api.get<Cont[]>("/conturi");
    if (res.success && res.data) {
      setConturi(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConturi();
  }, [loadConturi]);

  const handleCreate = () => {
    setEditingCont(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (cont: Cont) => {
    setEditingCont(cont);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: {
    simbol: string;
    denumire: string;
    tip: TipCont;
    amortizabil: boolean;
    contAmortizare?: string | null;
    activ: boolean;
  }) => {
    setIsSubmitting(true);
    try {
      if (editingCont) {
        // Update
        const res = await api.put<Cont>(`/conturi/${editingCont.id}`, data);
        if (res.success) {
          setIsDialogOpen(false);
          await loadConturi();
        }
      } else {
        // Create
        const res = await api.post<Cont>("/conturi", data);
        if (res.success) {
          setIsDialogOpen(false);
          await loadConturi();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: ColumnDef<Cont>[] = [
    {
      accessorKey: "simbol",
      header: "Simbol",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("simbol")}</span>
      ),
    },
    {
      accessorKey: "denumire",
      header: "Denumire",
    },
    {
      accessorKey: "tip",
      header: "Tip",
      cell: ({ row }) => {
        const tip = row.original.tip;
        return tipLabels[tip] || tip;
      },
    },
    {
      accessorKey: "amortizabil",
      header: "Amortizabil",
      cell: ({ row }) => row.original.amortizabil ? "Da" : "Nu",
    },
    {
      accessorKey: "contAmortizare",
      header: "Cont Amortizare",
      cell: ({ row }) => row.original.contAmortizare || "-",
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
          <h1 className="text-2xl font-bold">Plan de Conturi</h1>
          <p className="text-muted-foreground">
            Administrare plan de conturi pentru mijloace fixe
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Adauga Cont
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={conturi}
        isLoading={isLoading}
        emptyMessage="Nu exista conturi. Adaugati primul cont."
      />

      <ConturiForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        cont={editingCont}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
