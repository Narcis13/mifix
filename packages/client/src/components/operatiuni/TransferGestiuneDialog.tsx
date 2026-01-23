import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { MijlocFix, Gestiune, LocFolosinta } from "shared";
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
  gestiuneDestinatieId: z.number().min(1, "Selectati gestiunea destinatie"),
  locFolosintaDestinatieId: z.number().nullable(),
  dataOperare: z.string().min(1, "Data obligatorie"),
  documentNumar: z.string().max(100, "Maxim 100 caractere").optional(),
  observatii: z.string().max(500, "Maxim 500 caractere").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TransferGestiuneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlocFix: MijlocFix;
  onSuccess: () => void;
}

export function TransferGestiuneDialog({
  open,
  onOpenChange,
  mijlocFix,
  onSuccess,
}: TransferGestiuneDialogProps) {
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [locuriDestinatie, setLocuriDestinatie] = useState<LocFolosinta[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gestiuneDestinatieId: 0,
      locFolosintaDestinatieId: null,
      dataOperare: today,
      documentNumar: "",
      observatii: "",
    },
  });

  // Watch gestiuneDestinatieId to load locuri for that gestiune
  const gestiuneDestinatieId = useWatch({
    control: form.control,
    name: "gestiuneDestinatieId",
  });

  // Load all active gestiuni on mount (exclude current gestiune)
  useEffect(() => {
    async function loadGestiuni() {
      const res = await api.get<Gestiune[]>("/gestiuni");
      if (res.success && res.data) {
        // Filter to active gestiuni, excluding current gestiune
        const filtered = res.data.filter(
          (g) => g.activ && g.id !== mijlocFix.gestiuneId
        );
        setGestiuni(filtered);
      }
    }
    if (open) {
      loadGestiuni();
    }
  }, [open, mijlocFix.gestiuneId]);

  // Load locuri when destination gestiune changes
  useEffect(() => {
    async function loadLocuri() {
      if (gestiuneDestinatieId && gestiuneDestinatieId > 0) {
        const res = await api.get<LocFolosinta[]>(
          `/locuri?gestiuneId=${gestiuneDestinatieId}`
        );
        if (res.success && res.data) {
          setLocuriDestinatie(res.data.filter((l) => l.activ));
        } else {
          setLocuriDestinatie([]);
        }
      } else {
        setLocuriDestinatie([]);
      }
      // Clear loc folosinta when gestiune changes
      form.setValue("locFolosintaDestinatieId", null);
    }
    loadLocuri();
  }, [gestiuneDestinatieId, form]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        gestiuneDestinatieId: 0,
        locFolosintaDestinatieId: null,
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
      gestiuneDestinatieId: data.gestiuneDestinatieId,
      locFolosintaDestinatieId: data.locFolosintaDestinatieId,
      dataOperare: data.dataOperare,
      documentNumar: data.documentNumar || undefined,
      observatii: data.observatii || undefined,
    };

    const res = await api.post("/operatiuni/transfer-gestiune", payload);

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
          <DialogTitle>Transfer Gestiune</DialogTitle>
          <DialogDescription>
            {mijlocFix.numarInventar} - {mijlocFix.denumire}
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-4">
          Gestiune curenta:{" "}
          <span className="font-medium text-foreground">
            {mijlocFix.gestiune?.denumire || "Nespecificata"}
          </span>
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
              name="gestiuneDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestiune Destinatie *</FormLabel>
                  <Select
                    value={field.value ? field.value.toString() : ""}
                    onValueChange={(val) =>
                      field.onChange(val ? parseInt(val) : 0)
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectati gestiunea destinatie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gestiuni.map((gestiune) => (
                        <SelectItem
                          key={gestiune.id}
                          value={gestiune.id.toString()}
                        >
                          {gestiune.cod} - {gestiune.denumire}
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
                  <FormLabel>Loc Folosinta Destinatie</FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(val) =>
                      field.onChange(val ? parseInt(val) : null)
                    }
                    disabled={!gestiuneDestinatieId || locuriDestinatie.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !gestiuneDestinatieId
                              ? "Selectati mai intai gestiunea"
                              : locuriDestinatie.length === 0
                                ? "Nu exista locuri pentru aceasta gestiune"
                                : "Selectati locul de folosinta (optional)"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {locuriDestinatie.map((loc) => (
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
