import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { TipDocument, Operatiune } from "shared";
import { api } from "@/lib/api";
import { toast } from "sonner";
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

const formSchema = z.object({
  tipOperatie: z.enum(["intrare", "iesire", "transfer", "inventar", "ajustare"]),
  dataOperare: z.string().min(1, "Data operarii obligatorie"),
  tipDocumentId: z.number().nullable(),
  numarDocument: z.string().max(100).optional(),
  dataDocument: z.string().optional(),
  descriere: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateOperatiuneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (operatiune: Operatiune) => void;
}

export function CreateOperatiuneDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOperatiuneDialogProps) {
  const [tipuriDocument, setTipuriDocument] = useState<TipDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipOperatie: "transfer",
      dataOperare: today,
      tipDocumentId: null,
      numarDocument: "",
      dataDocument: "",
      descriere: "",
    },
  });

  useEffect(() => {
    if (open) {
      api.get<TipDocument[]>("/tipuri-document").then((res) => {
        if (res.success && res.data) {
          setTipuriDocument(res.data.filter((td) => td.activ));
        }
      });
      form.reset({
        tipOperatie: "transfer",
        dataOperare: today,
        tipDocumentId: null,
        numarDocument: "",
        dataDocument: "",
        descriere: "",
      });
      setSubmitError(null);
    }
  }, [open, form, today]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      tipOperatie: data.tipOperatie,
      dataOperare: data.dataOperare,
      tipDocumentId: data.tipDocumentId || undefined,
      numarDocument: data.numarDocument || undefined,
      dataDocument: data.dataDocument || undefined,
      descriere: data.descriere || undefined,
    };

    const res = await api.post<Operatiune>("/operatiuni-acte", payload);

    if (res.success && res.data) {
      toast.success(res.message || "Operatiune creata");
      form.reset();
      onOpenChange(false);
      onSuccess(res.data);
    } else {
      setSubmitError(res.message || "Eroare la crearea operatiunii");
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Operatiune Noua</DialogTitle>
          <DialogDescription>
            Creati o operatiune noua (act container) in care puteti adauga linii.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {submitError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipOperatie"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip Operatie *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectati tipul" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="intrare">Intrare (Receptie)</SelectItem>
                      <SelectItem value="iesire">Iesire (Casare/Scoatere)</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                      <SelectItem value="inventar">Inventar</SelectItem>
                      <SelectItem value="ajustare">Ajustare</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataOperare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Operarii *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipDocumentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip Document</FormLabel>
                  <Select
                    value={field.value?.toString() ?? "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : parseInt(val))
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectati tip document (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Fara --</SelectItem>
                      {tipuriDocument.map((td) => (
                        <SelectItem key={td.id} value={td.id.toString()}>
                          {td.cod} - {td.denumire}
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
              name="numarDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numar Document</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: PV-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dataDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Document</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descriere"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descriere operatiune (optional)"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se creeaza..." : "Creeaza Operatiune"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
