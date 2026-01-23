import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Cont, TipCont } from "shared";

// Validation schema with conditional validation for contAmortizare
const contFormSchema = z.object({
  simbol: z.string().min(1, "Simbol obligatoriu").max(20, "Simbol maxim 20 caractere"),
  denumire: z.string().min(1, "Denumire obligatorie").max(300, "Denumire maxim 300 caractere"),
  tip: z.enum(["activ", "pasiv", "bifunctional"]),
  amortizabil: z.boolean(),
  contAmortizare: z.string().max(20, "Cont amortizare maxim 20 caractere").optional().nullable(),
  activ: z.boolean(),
}).refine((data) => {
  // If amortizabil is checked, contAmortizare is required
  if (data.amortizabil && !data.contAmortizare) return false;
  return true;
}, {
  message: "Contul de amortizare este obligatoriu pentru conturile amortizabile",
  path: ["contAmortizare"],
});

type ContFormData = z.infer<typeof contFormSchema>;

interface ConturiFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cont?: Cont | null;
  onSubmit: (data: ContFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function ConturiForm({
  open,
  onOpenChange,
  cont,
  onSubmit,
  isSubmitting = false,
}: ConturiFormProps) {
  const isEditing = !!cont;

  const form = useForm<ContFormData>({
    resolver: zodResolver(contFormSchema),
    defaultValues: {
      simbol: cont?.simbol ?? "",
      denumire: cont?.denumire ?? "",
      tip: cont?.tip ?? "activ",
      amortizabil: cont?.amortizabil ?? false,
      contAmortizare: cont?.contAmortizare ?? "",
      activ: cont?.activ ?? true,
    },
  });

  // Watch amortizabil to show/hide contAmortizare field
  const amortizabil = form.watch("amortizabil");

  // Reset form when cont changes or dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({
        simbol: cont?.simbol ?? "",
        denumire: cont?.denumire ?? "",
        tip: cont?.tip ?? "activ",
        amortizabil: cont?.amortizabil ?? false,
        contAmortizare: cont?.contAmortizare ?? "",
        activ: cont?.activ ?? true,
      });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (data: ContFormData) => {
    // Clear contAmortizare if not amortizabil
    const payload = {
      ...data,
      contAmortizare: data.amortizabil ? data.contAmortizare : null,
    };
    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editeaza Cont" : "Adauga Cont"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica datele contului existent."
              : "Completeaza datele pentru noul cont."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="simbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Simbol *</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: 2131" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="denumire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denumire *</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: Echipamente tehnologice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteaza tip" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="activ">Activ</SelectItem>
                      <SelectItem value="pasiv">Pasiv</SelectItem>
                      <SelectItem value="bifunctional">Bifunctional</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amortizabil"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Amortizabil</FormLabel>
                </FormItem>
              )}
            />
            {amortizabil && (
              <FormField
                control={form.control}
                name="contAmortizare"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cont Amortizare *</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: 2811" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="activ"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Activ</FormLabel>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se salveaza..." : isEditing ? "Salveaza" : "Adauga"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
