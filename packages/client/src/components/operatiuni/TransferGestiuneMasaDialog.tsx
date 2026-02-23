import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Gestiune } from "shared";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

const formSchema = z.object({
  gestiuneSursaId: z.string().min(1, "Gestiunea sursa este obligatorie"),
  gestiuneDestinatieId: z.string().min(1, "Gestiunea destinatie este obligatorie"),
  numarInventar: z.string().optional(),
  dataOperare: z.string().min(1, "Data este obligatorie"),
  documentNumar: z.string().max(100).optional(),
  observatii: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransferGestiuneMasaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferGestiuneMasaDialog({
  open,
  onOpenChange,
  onSuccess,
}: TransferGestiuneMasaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);

  useEffect(() => {
    if (open) {
      api.get<Gestiune[]>("/gestiuni").then((res) => {
        if (res.success && res.data) {
          const items = (res.data as unknown as { items: Gestiune[] }).items ?? res.data;
          setGestiuni(items.filter((g: Gestiune) => g.activ));
        }
      });
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gestiuneSursaId: "",
      gestiuneDestinatieId: "",
      numarInventar: "",
      dataOperare: getTodayDate(),
      documentNumar: "",
      observatii: "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (data.gestiuneSursaId === data.gestiuneDestinatieId) {
      form.setError("gestiuneDestinatieId", { message: "Gestiunea destinatie trebuie sa fie diferita" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        gestiuneSursaId: parseInt(data.gestiuneSursaId),
        gestiuneDestinatieId: parseInt(data.gestiuneDestinatieId),
        numarInventar: data.numarInventar || undefined,
        dataOperare: data.dataOperare,
        documentNumar: data.documentNumar || undefined,
        observatii: data.observatii || undefined,
      };

      const response = await api.post<{ count: number }>("/operatiuni/transfer-gestiune-masa", payload);

      if (response.success) {
        toast.success(response.message || `${response.data?.count} mijloace fixe transferate`);
        form.reset();
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || "Eroare la transfer");
      }
    } catch {
      toast.error("Eroare de retea");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) form.reset();
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Gestiune (Masa)</DialogTitle>
          <DialogDescription>
            Muta toate mijloacele fixe dintr-o gestiune in alta. Locurile de folosinta
            vor fi resetate. Lasati "Nr. Inventar" gol pentru transfer total.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gestiuneSursaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestiune Sursa *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectati gestiunea sursa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gestiuni.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.cod} - {g.denumire}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gestiuneDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestiune Destinatie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectati gestiunea destinatie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gestiuni.map((g) => (
                        <SelectItem key={g.id} value={String(g.id)}>
                          {g.cod} - {g.denumire}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="numarInventar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nr. Inventar (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Gol = toate din gestiunea sursa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataOperare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Operare *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentNumar"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Nr.</FormLabel>
                  <FormControl>
                    <Input placeholder="Numar document" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observatii"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observatii</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observatii suplimentare..." className="min-h-[60px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se proceseaza..." : "Transfera"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
