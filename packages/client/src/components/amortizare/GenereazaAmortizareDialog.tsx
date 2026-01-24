import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { genereazaAmortizare, getAmortizariVerificare } from "@/lib/api";
import type { AmortizareVerificare } from "shared";
import { toast } from "sonner";
import { Calculator, CheckCircle2, AlertCircle } from "lucide-react";

interface GenereazaAmortizareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const MONTH_NAMES = [
  "Ianuarie",
  "Februarie",
  "Martie",
  "Aprilie",
  "Mai",
  "Iunie",
  "Iulie",
  "August",
  "Septembrie",
  "Octombrie",
  "Noiembrie",
  "Decembrie",
];

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

const formSchema = z.object({
  an: z.string().min(1, "Selectati anul"),
  luna: z.string().min(1, "Selectati luna"),
});

type FormValues = z.infer<typeof formSchema>;

export function GenereazaAmortizareDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenereazaAmortizareDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificare, setVerificare] = useState<AmortizareVerificare[]>([]);
  const [loadingVerificare, setLoadingVerificare] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      an: currentYear.toString(),
      luna: currentMonth.toString(),
    },
  });

  const selectedAn = form.watch("an");
  const selectedLuna = form.watch("luna");

  // Load verification data when year changes
  useEffect(() => {
    if (!open || !selectedAn) return;

    async function loadVerificare() {
      try {
        setLoadingVerificare(true);
        const data = await getAmortizariVerificare(parseInt(selectedAn));
        setVerificare(data);
      } catch (err) {
        console.error("Failed to load verification:", err);
      } finally {
        setLoadingVerificare(false);
      }
    }
    loadVerificare();
  }, [open, selectedAn]);

  // Check if selected month is already processed
  const selectedMonthVerificare = verificare.find(
    (v) => v.luna === parseInt(selectedLuna || "0")
  );
  const isAlreadyProcessed = selectedMonthVerificare?.procesat ?? false;

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await genereazaAmortizare(
        parseInt(values.an),
        parseInt(values.luna)
      );

      if (result.processed === 0 && result.skipped > 0) {
        toast.info("Amortizarea pentru aceasta luna a fost deja generata", {
          description: `${result.skipped} active au fost sarite.`,
        });
      } else if (result.processed > 0) {
        toast.success("Amortizare generata cu succes", {
          description: `${result.processed} active procesate, ${result.skipped} sarite.`,
        });
      } else {
        toast.info("Nu exista active eligibile pentru amortizare", {
          description: "Verificati ca exista active active si amortizabile.",
        });
      }

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare la generare");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        an: currentYear.toString(),
        luna: currentMonth.toString(),
      });
      setError(null);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Genereaza Amortizare Lunara
          </DialogTitle>
          <DialogDescription>
            Selectati luna si anul pentru care doriti sa generati amortizarea
            pentru toate mijloacele fixe active.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="an"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>An</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectati anul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[currentYear - 1, currentYear, currentYear + 1].map(
                          (year) => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="luna"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Luna</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectati luna" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTH_NAMES.map((name, index) => {
                          const monthNum = index + 1;
                          const monthVerif = verificare.find(
                            (v) => v.luna === monthNum
                          );
                          const processed = monthVerif?.procesat ?? false;

                          return (
                            <SelectItem
                              key={monthNum}
                              value={monthNum.toString()}
                            >
                              <span className="flex items-center gap-2">
                                {name}
                                {processed && (
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                )}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isAlreadyProcessed && (
              <Alert>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription>
                  Amortizarea pentru {MONTH_NAMES[parseInt(selectedLuna) - 1]}{" "}
                  {selectedAn} a fost deja generata pentru{" "}
                  {selectedMonthVerificare?.numarActive} active.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting || loadingVerificare}>
                {isSubmitting ? "Se genereaza..." : "Genereaza"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
