import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { MijlocFix, LocFolosinta } from "shared";
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

// Form validation schema
const formSchema = z.object({
  locFolosintaDestinatieId: z.number().min(1, "Selectati locul de folosinta"),
  dataOperare: z.string().min(1, "Data obligatorie"),
  documentNumar: z.string().max(100, "Maxim 100 caractere").optional(),
  observatii: z.string().max(500, "Maxim 500 caractere").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TransferLocDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlocFix: MijlocFix;
  onSuccess: () => void;
}

export function TransferLocDialog({
  open,
  onOpenChange,
  mijlocFix,
  onSuccess,
}: TransferLocDialogProps) {
  const [locuri, setLocuri] = useState<LocFolosinta[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      locFolosintaDestinatieId: 0,
      dataOperare: today,
      documentNumar: "",
      observatii: "",
    },
  });

  // Load locuri for current gestiune on mount (exclude current loc)
  useEffect(() => {
    async function loadLocuri() {
      if (mijlocFix.gestiuneId) {
        const res = await api.get<LocFolosinta[]>(
          `/locuri?gestiuneId=${mijlocFix.gestiuneId}`
        );
        if (res.success && res.data) {
          // Filter to active locuri, excluding current loc folosinta
          const filtered = res.data.filter(
            (l) => l.activ && l.id !== mijlocFix.locFolosintaId
          );
          setLocuri(filtered);
        } else {
          setLocuri([]);
        }
      } else {
        setLocuri([]);
      }
    }
    if (open) {
      loadLocuri();
    }
  }, [open, mijlocFix.gestiuneId, mijlocFix.locFolosintaId]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        locFolosintaDestinatieId: 0,
        dataOperare: today,
        documentNumar: "",
        observatii: "",
      });
      setSubmitError(null);
    }
  }, [open, form, today]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      mijlocFixId: mijlocFix.id,
      locFolosintaDestinatieId: data.locFolosintaDestinatieId,
      dataOperare: data.dataOperare,
      documentNumar: data.documentNumar || undefined,
      observatii: data.observatii || undefined,
    };

    const res = await api.post("/operatiuni/transfer-loc", payload);

    if (res.success) {
      form.reset();
      onOpenChange(false);
      onSuccess();
    } else {
      setSubmitError(res.message || "Eroare la efectuarea transferului");
      // Handle validation errors from server
      if (res.errors) {
        Object.entries(res.errors).forEach(([field, messages]) => {
          form.setError(field as keyof FormData, {
            type: "server",
            message: messages[0],
          });
        });
      }
    }

    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Transfer Loc Folosinta</DialogTitle>
          <DialogDescription>
            {mijlocFix.numarInventar} - {mijlocFix.denumire}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4 space-y-1">
          <div>
            Gestiune:{" "}
            <span className="font-medium text-foreground">
              {mijlocFix.gestiune?.denumire || "Nespecificata"}
            </span>
          </div>
          <div>
            Loc curent:{" "}
            <span className="font-medium text-foreground">
              {mijlocFix.locFolosinta?.denumire || "Nespecificat"}
            </span>
          </div>
        </div>

        {submitError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
            {submitError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="locFolosintaDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loc Folosinta Destinatie *</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) =>
                      field.onChange(val ? parseInt(val) : 0)
                    }
                    disabled={locuri.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            locuri.length === 0
                              ? "Nu exista alte locuri in aceasta gestiune"
                              : "Selectati locul de folosinta destinatie"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locuri.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.cod} - {loc.denumire}
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
                    <Input placeholder="ex: PV-001" {...field} />
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
                    <Textarea
                      placeholder="Observatii suplimentare (optional)"
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
              <Button type="submit" disabled={isSubmitting || locuri.length === 0}>
                {isSubmitting ? "Se proceseaza..." : "Transfera"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
