import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
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

// Validation schema
const formSchema = z.object({
  motivCasare: z
    .string()
    .min(1, "Motivul casarii este obligatoriu")
    .max(500, "Motivul poate avea maxim 500 caractere"),
  dataOperare: z.string().min(1, "Data este obligatorie"),
  documentNumar: z.string().max(100, "Numarul documentului poate avea maxim 100 caractere").optional(),
  observatii: z.string().max(500, "Observatiile pot avea maxim 500 caractere").optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CasareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlocFix: MijlocFix;
  onSuccess: () => void;
}

export function CasareDialog({
  open,
  onOpenChange,
  mijlocFix,
  onSuccess,
}: CasareDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      motivCasare: "",
      dataOperare: getTodayDate(),
      documentNumar: "",
      observatii: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);

    try {
      const payload = {
        mijlocFixId: mijlocFix.id,
        motivCasare: data.motivCasare,
        dataOperare: data.dataOperare,
        documentNumar: data.documentNumar || undefined,
        observatii: data.observatii || undefined,
      };

      const response = await api.post("/operatiuni/casare", payload);

      if (response.success) {
        toast.success("Casare efectuata cu succes");
        form.reset({
          motivCasare: "",
          dataOperare: getTodayDate(),
          documentNumar: "",
          observatii: "",
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast.error(response.message || "Eroare la efectuarea casarii");
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
        motivCasare: "",
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
          <DialogTitle>Casare Mijloc Fix</DialogTitle>
          <DialogDescription>
            {mijlocFix.numarInventar} - {mijlocFix.denumire}
          </DialogDescription>
        </DialogHeader>

        {/* Warning Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atentie</AlertTitle>
          <AlertDescription>
            Casarea marcheaza mijlocul fix ca scos din functiune. Aceasta
            operatie nu poate fi anulata.
          </AlertDescription>
        </Alert>

        {/* Asset Info */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border p-4 bg-muted/30">
          <div>
            <p className="text-sm text-muted-foreground">Valoare inventar</p>
            <p className="font-medium">{formatCurrency(mijlocFix.valoareInventar)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valoare ramasa</p>
            <p className="font-medium">{formatCurrency(mijlocFix.valoareRamasa)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Gestiune</p>
            <p className="font-medium">{mijlocFix.gestiune?.denumire || "-"}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="motivCasare"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motiv Casare *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrieti motivul casarii..."
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
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Se proceseaza..." : "Confirma Casare"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
