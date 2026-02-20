import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { Cont } from "shared";
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
  contSursaId: z.string().min(1, "Contul sursa este obligatoriu"),
  contDestinatieId: z.string().min(1, "Contul destinatie este obligatoriu"),
  numarInventar: z.string().optional(),
  dataOperare: z.string().min(1, "Data este obligatorie"),
  documentNumar: z.string().max(100).optional(),
  observatii: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TransferContDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferContDialog({
  open,
  onOpenChange,
  onSuccess,
}: TransferContDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conturi, setConturi] = useState<Cont[]>([]);

  useEffect(() => {
    if (open) {
      api.get<Cont[]>("/conturi").then((res) => {
        if (res.success && res.data) {
          // Filter out title accounts - only detail accounts can be used
          setConturi((res.data as unknown as { items: Cont[] }).items?.filter((c: Cont) => !c.titlu) ?? res.data.filter((c: Cont) => !c.titlu));
        }
      });
    }
  }, [open]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      contSursaId: "",
      contDestinatieId: "",
      numarInventar: "",
      dataOperare: getTodayDate(),
      documentNumar: "",
      observatii: "",
    },
  });

  async function onSubmit(data: FormValues) {
    if (data.contSursaId === data.contDestinatieId) {
      form.setError("contDestinatieId", { message: "Contul destinatie trebuie sa fie diferit de cel sursa" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        contSursaId: parseInt(data.contSursaId),
        contDestinatieId: parseInt(data.contDestinatieId),
        numarInventar: data.numarInventar || undefined,
        dataOperare: data.dataOperare,
        documentNumar: data.documentNumar || undefined,
        observatii: data.observatii || undefined,
      };

      const response = await api.post<{ count: number }>("/operatiuni/transfer-cont", payload);

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
          <DialogTitle>Transfer Cont</DialogTitle>
          <DialogDescription>
            Muta mijloacele fixe de la un cont la altul. Lasati campul "Nr. Inventar"
            gol pentru a transfera toate mijloacele de la contul sursa.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contSursaId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cont Sursa *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectati contul sursa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conturi.map((cont) => (
                        <SelectItem key={cont.id} value={String(cont.id)}>
                          {cont.simbol} - {cont.denumire}
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
              name="contDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cont Destinatie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selectati contul destinatie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conturi.map((cont) => (
                        <SelectItem key={cont.id} value={String(cont.id)}>
                          {cont.simbol} - {cont.denumire}
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
                    <Input placeholder="Gol = toate de la contul sursa" {...field} />
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
