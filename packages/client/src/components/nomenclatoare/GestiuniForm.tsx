import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Gestiune } from "shared";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

// Validation schema matching server-side validation
const gestiuneFormSchema = z.object({
  cod: z.string().min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: z.string().min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
  responsabil: z.string().max(200, "Responsabil maxim 200 caractere").optional(),
  activ: z.boolean(),
});

type GestiuneFormValues = z.infer<typeof gestiuneFormSchema>;

interface GestiuniFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gestiune?: Gestiune;
  onSuccess: () => void;
}

export function GestiuniForm({
  open,
  onOpenChange,
  gestiune,
  onSuccess,
}: GestiuniFormProps) {
  const isEditing = !!gestiune;

  const form = useForm<GestiuneFormValues>({
    resolver: zodResolver(gestiuneFormSchema),
    defaultValues: {
      cod: "",
      denumire: "",
      responsabil: "",
      activ: true,
    },
  });

  // Reset form when dialog opens/closes or gestiune changes
  useEffect(() => {
    if (open) {
      if (gestiune) {
        form.reset({
          cod: gestiune.cod,
          denumire: gestiune.denumire,
          responsabil: gestiune.responsabil ?? "",
          activ: gestiune.activ,
        });
      } else {
        form.reset({
          cod: "",
          denumire: "",
          responsabil: "",
          activ: true,
        });
      }
    }
  }, [open, gestiune, form]);

  async function onSubmit(data: GestiuneFormValues) {
    const payload = {
      ...data,
      responsabil: data.responsabil || undefined,
    };

    let response;
    if (isEditing) {
      response = await api.put<Gestiune>(`/gestiuni/${gestiune.id}`, payload);
    } else {
      response = await api.post<Gestiune>("/gestiuni", payload);
    }

    if (response.success) {
      form.reset();
      onOpenChange(false);
      onSuccess();
    } else {
      // Handle validation errors from server
      if (response.errors) {
        Object.entries(response.errors).forEach(([field, messages]) => {
          form.setError(field as keyof GestiuneFormValues, {
            type: "server",
            message: messages[0],
          });
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editeaza Gestiune" : "Adauga Gestiune"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica datele gestiunii existente."
              : "Completeaza datele pentru noua gestiune."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cod *</FormLabel>
                  <FormControl>
                    <Input placeholder="G001" {...field} />
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
                    <Input placeholder="Gestiune principala" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsabil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsabil</FormLabel>
                  <FormControl>
                    <Input placeholder="Ion Popescu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="activ"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Activ</FormLabel>
                  </div>
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
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Se salveaza..." : "Salveaza"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
