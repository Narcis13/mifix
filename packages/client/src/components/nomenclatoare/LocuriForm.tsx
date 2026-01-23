import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LocFolosinta, Gestiune } from "shared";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validation schema matching server-side validation
const locFolosintaFormSchema = z.object({
  gestiuneId: z.number().min(1, "Gestiune obligatorie"),
  cod: z.string().min(1, "Cod obligatoriu").max(20, "Cod maxim 20 caractere"),
  denumire: z.string().min(1, "Denumire obligatorie").max(200, "Denumire maxim 200 caractere"),
  activ: z.boolean(),
});

type LocFolosintaFormValues = z.infer<typeof locFolosintaFormSchema>;

interface LocuriFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locFolosinta?: LocFolosinta;
  onSuccess: () => void;
}

export function LocuriForm({
  open,
  onOpenChange,
  locFolosinta,
  onSuccess,
}: LocuriFormProps) {
  const isEditing = !!locFolosinta;
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [isLoadingGestiuni, setIsLoadingGestiuni] = useState(false);

  const form = useForm<LocFolosintaFormValues>({
    resolver: zodResolver(locFolosintaFormSchema),
    defaultValues: {
      gestiuneId: undefined,
      cod: "",
      denumire: "",
      activ: true,
    },
  });

  // Fetch gestiuni when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingGestiuni(true);
      api.get<Gestiune[]>("/gestiuni").then((res) => {
        if (res.success && res.data) {
          // Filter only active gestiuni for the dropdown
          setGestiuni(res.data.filter((g) => g.activ));
        }
        setIsLoadingGestiuni(false);
      });
    }
  }, [open]);

  // Reset form when dialog opens/closes or locFolosinta changes
  useEffect(() => {
    if (open) {
      if (locFolosinta) {
        form.reset({
          gestiuneId: locFolosinta.gestiuneId,
          cod: locFolosinta.cod,
          denumire: locFolosinta.denumire,
          activ: locFolosinta.activ,
        });
      } else {
        form.reset({
          gestiuneId: undefined,
          cod: "",
          denumire: "",
          activ: true,
        });
      }
    }
  }, [open, locFolosinta, form]);

  async function onSubmit(data: LocFolosintaFormValues) {
    let response;
    if (isEditing) {
      response = await api.put<LocFolosinta>(`/locuri/${locFolosinta.id}`, data);
    } else {
      response = await api.post<LocFolosinta>("/locuri", data);
    }

    if (response.success) {
      form.reset();
      onOpenChange(false);
      onSuccess();
    } else {
      // Handle validation errors from server
      if (response.errors) {
        Object.entries(response.errors).forEach(([field, messages]) => {
          form.setError(field as keyof LocFolosintaFormValues, {
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
            {isEditing ? "Editeaza Loc de Folosinta" : "Adauga Loc de Folosinta"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica datele locului de folosinta existent."
              : "Completeaza datele pentru noul loc de folosinta."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="gestiuneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestiune *</FormLabel>
                  <Select
                    value={field.value?.toString()}
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    disabled={isLoadingGestiuni}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={isLoadingGestiuni ? "Se incarca..." : "Selecteaza gestiunea"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gestiuni.map((g) => (
                        <SelectItem key={g.id} value={g.id.toString()}>
                          {g.cod} - {g.denumire}
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
              name="cod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cod *</FormLabel>
                  <FormControl>
                    <Input placeholder="L001" {...field} />
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
                    <Input placeholder="Birou Director" {...field} />
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
