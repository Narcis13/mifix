import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Gestiune, LocFolosinta } from "shared";
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
  gestiuneId: z.string().min(1, "Gestiunea este obligatorie"),
  locFolosintaSursaId: z.string().min(1, "Locul sursa este obligatoriu"),
  locFolosintaDestinatieId: z.string().min(1, "Locul destinatie este obligatoriu"),
  numarInventar: z.string().optional(),
  dataOperare: z.string().min(1, "Data este obligatorie"),
  documentNumar: z.string().max(100).optional(),
  observatii: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransferLocMasaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferLocMasaDialog({
  open,
  onOpenChange,
  onSuccess,
}: TransferLocMasaDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [locuri, setLocuri] = useState<LocFolosinta[]>([]);

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
      gestiuneId: "",
      locFolosintaSursaId: "",
      locFolosintaDestinatieId: "",
      numarInventar: "",
      dataOperare: getTodayDate(),
      documentNumar: "",
      observatii: "",
    },
  });

  const selectedGestiuneId = form.watch("gestiuneId");

  useEffect(() => {
    if (selectedGestiuneId) {
      api.get<LocFolosinta[]>(`/locuri?gestiuneId=${selectedGestiuneId}`).then((res) => {
        if (res.success && res.data) {
          const items = (res.data as unknown as { items: LocFolosinta[] }).items ?? res.data;
          setLocuri(items.filter((l: LocFolosinta) => l.activ));
        }
      });
      // Reset loc selections when gestiune changes
      form.setValue("locFolosintaSursaId", "");
      form.setValue("locFolosintaDestinatieId", "");
    }
  }, [selectedGestiuneId, form]);

  async function onSubmit(data: FormValues) {
    if (data.locFolosintaSursaId === data.locFolosintaDestinatieId) {
      form.setError("locFolosintaDestinatieId", { message: "Locul destinatie trebuie sa fie diferit" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        gestiuneId: parseInt(data.gestiuneId),
        locFolosintaSursaId: parseInt(data.locFolosintaSursaId),
        locFolosintaDestinatieId: parseInt(data.locFolosintaDestinatieId),
        numarInventar: data.numarInventar || undefined,
        dataOperare: data.dataOperare,
        documentNumar: data.documentNumar || undefined,
        observatii: data.observatii || undefined,
      };

      const response = await api.post<{ count: number }>("/operatiuni/transfer-loc-masa", payload);

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
          <DialogTitle>Transfer Loc Folosinta (Masa)</DialogTitle>
          <DialogDescription>
            Muta mijloacele fixe dintr-un loc de folosinta in altul, in cadrul
            aceleiasi gestiuni. Lasati "Nr. Inventar" gol pentru transfer total.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gestiuneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestiune *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectati gestiunea" />
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
              name="locFolosintaSursaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loc Folosinta Sursa *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGestiuneId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedGestiuneId ? "Selectati locul sursa" : "Selectati mai intai gestiunea"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locuri.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.cod} - {l.denumire}
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
              name="locFolosintaDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loc Folosinta Destinatie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={!selectedGestiuneId}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={selectedGestiuneId ? "Selectati locul destinatie" : "Selectati mai intai gestiunea"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locuri.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.cod} - {l.denumire}
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
                    <Input placeholder="Gol = toate de la locul sursa" {...field} />
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
