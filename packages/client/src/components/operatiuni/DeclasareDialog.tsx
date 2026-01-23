import { useState, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Info } from "lucide-react";
import type { MijlocFix } from "shared";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Format currency for display
function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

// Get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

// Create validation schema with dynamic valoareRamasa check
function createFormSchema(valoareRamasa: string) {
  return z
    .object({
      valoareReducere: z.string().min(1, "Valoarea reducerii este obligatorie"),
      motivDeclasare: z
        .string()
        .min(1, "Motivul declasarii este obligatoriu")
        .max(500, "Motivul poate avea maxim 500 caractere"),
      dataOperare: z.string().min(1, "Data este obligatorie"),
      documentNumar: z
        .string()
        .max(100, "Numarul documentului poate avea maxim 100 caractere")
        .optional(),
      observatii: z.string().max(500, "Observatiile pot avea maxim 500 caractere").optional(),
    })
    .superRefine((data, ctx) => {
      const reducere = parseFloat(data.valoareReducere);
      const ramasa = parseFloat(valoareRamasa);

      if (isNaN(reducere) || reducere <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Introduceti o valoare pozitiva",
          path: ["valoareReducere"],
        });
        return;
      }

      if (reducere > ramasa) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Reducerea nu poate depasi valoarea ramasa (${formatCurrency(valoareRamasa)})`,
          path: ["valoareReducere"],
        });
      }
    });
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface DeclasareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlocFix: MijlocFix;
  onSuccess: () => void;
}

export function DeclasareDialog({
  open,
  onOpenChange,
  mijlocFix,
  onSuccess,
}: DeclasareDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize schema based on valoareRamasa
  const formSchema = useMemo(
    () => createFormSchema(mijlocFix.valoareRamasa),
    [mijlocFix.valoareRamasa]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valoareReducere: "",
      motivDeclasare: "",
      dataOperare: getTodayDate(),
      documentNumar: "",
      observatii: "",
    },
  });

  // Watch valoareReducere to show preview
  const valoareReducere = useWatch({
    control: form.control,
    name: "valoareReducere",
  });

  // Calculate new remaining value
  const novaValoareRamasa = useMemo(() => {
    const reducere = parseFloat(valoareReducere || "0");
    const ramasa = parseFloat(mijlocFix.valoareRamasa);
    if (isNaN(reducere) || reducere <= 0 || reducere > ramasa) {
      return null;
    }
    return ramasa - reducere;
  }, [valoareReducere, mijlocFix.valoareRamasa]);

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      const payload = {
        mijlocFixId: mijlocFix.id,
        valoareReducere: data.valoareReducere,
        motivDeclasare: data.motivDeclasare,
        dataOperare: data.dataOperare,
        documentNumar: data.documentNumar || undefined,
        observatii: data.observatii || undefined,
      };

      const response = await api.post("/operatiuni/declasare", payload);

      if (response.success) {
        toast.success("Declasare efectuata cu succes");
        form.reset({
          valoareReducere: "",
          motivDeclasare: "",
          dataOperare: getTodayDate(),
          documentNumar: "",
          observatii: "",
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || "Eroare la efectuarea declasarii");
        // Handle validation errors from server
        if (response.errors) {
          Object.entries(response.errors).forEach(([field, messages]) => {
            form.setError(field as keyof FormValues, {
              type: "server",
              message: messages[0],
            });
          });
        }
      }
    } catch {
      toast.error("Eroare de retea");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset({
        valoareReducere: "",
        motivDeclasare: "",
        dataOperare: getTodayDate(),
        documentNumar: "",
        observatii: "",
      });
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Declasare Mijloc Fix</DialogTitle>
          <DialogDescription>
            {mijlocFix.numarInventar} - {mijlocFix.denumire}
          </DialogDescription>
        </DialogHeader>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Informatie</AlertTitle>
          <AlertDescription>
            Declasarea reduce valoarea ramasa a mijlocului fix.
          </AlertDescription>
        </Alert>

        {/* Asset Info */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Valoare inventar</p>
            <p className="font-medium">{formatCurrency(mijlocFix.valoareInventar)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valoare ramasa curenta</p>
            <p className="font-medium">{formatCurrency(mijlocFix.valoareRamasa)}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="valoareReducere"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valoare Reducere (RON) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Preview of new remaining value */}
            {novaValoareRamasa !== null && (
              <div className="rounded-lg border border-dashed p-3 bg-muted/50">
                <p className="text-sm text-muted-foreground">
                  Valoare ramasa dupa reducere:
                </p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(novaValoareRamasa)}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="motivDeclasare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motiv Declasare *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrieti motivul declasarii..."
                      className="min-h-[80px]"
                      {...field}
                    />
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
                    <Textarea
                      placeholder="Observatii suplimentare..."
                      className="min-h-[60px]"
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
                onClick={() => handleOpenChange(false)}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se proceseaza..." : "Confirma Declasare"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
