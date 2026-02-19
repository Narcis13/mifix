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
import type { TipStoc } from "shared";

const tipStocFormSchema = z.object({
  cod: z.string().min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: z.string().min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
  activ: z.boolean(),
});

type TipStocFormData = z.infer<typeof tipStocFormSchema>;

interface TipuriStocFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipStoc?: TipStoc | null;
  onSubmit: (data: TipStocFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function TipuriStocForm({
  open,
  onOpenChange,
  tipStoc,
  onSubmit,
  isSubmitting = false,
}: TipuriStocFormProps) {
  const isEditing = !!tipStoc;

  const form = useForm<TipStocFormData>({
    resolver: zodResolver(tipStocFormSchema),
    defaultValues: {
      cod: tipStoc?.cod ?? "",
      denumire: tipStoc?.denumire ?? "",
      activ: tipStoc?.activ ?? true,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      form.reset({
        cod: tipStoc?.cod ?? "",
        denumire: tipStoc?.denumire ?? "",
        activ: tipStoc?.activ ?? true,
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editare Tip Stoc" : "Adaugare Tip Stoc"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cod</FormLabel>
                  <FormControl>
                    <Input placeholder="0" {...field} />
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
                    <Input placeholder="In folosinta" {...field} />
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
