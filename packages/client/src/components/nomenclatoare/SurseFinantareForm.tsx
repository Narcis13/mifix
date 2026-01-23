import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { SursaFinantare } from "shared";

// Client-side validation schema matching server-side
const sursaFinantareFormSchema = z.object({
  cod: z.string().min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: z.string().min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
  activ: z.boolean(),
});

type SursaFinantareFormData = z.infer<typeof sursaFinantareFormSchema>;

interface SurseFinantareFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sursa?: SursaFinantare | null;
  onSubmit: (data: SursaFinantareFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function SurseFinantareForm({
  open,
  onOpenChange,
  sursa,
  onSubmit,
  isSubmitting = false,
}: SurseFinantareFormProps) {
  const isEditing = !!sursa;

  const form = useForm<SursaFinantareFormData>({
    resolver: zodResolver(sursaFinantareFormSchema),
    defaultValues: {
      cod: sursa?.cod ?? "",
      denumire: sursa?.denumire ?? "",
      activ: sursa?.activ ?? true,
    },
  });

  // Reset form when sursa changes or dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({
        cod: sursa?.cod ?? "",
        denumire: sursa?.denumire ?? "",
        activ: sursa?.activ ?? true,
      });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async (data: SursaFinantareFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editare Sursa de Finantare" : "Adaugare Sursa de Finantare"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cod</FormLabel>
                  <FormControl>
                    <Input placeholder="BL" {...field} />
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
                  <FormLabel>Denumire</FormLabel>
                  <FormControl>
                    <Input placeholder="Buget Local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
