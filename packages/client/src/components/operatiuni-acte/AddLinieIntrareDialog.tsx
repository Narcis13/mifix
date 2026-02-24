import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Gestiune, LocFolosinta, Cont, Clasificare, SursaFinantare } from "shared";
import { api } from "@/lib/api";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const formSchema = z.object({
  numarInventar: z.string().min(1, "Numar inventar obligatoriu").max(50),
  denumire: z.string().min(1, "Denumire obligatorie").max(255),
  clasificareCod: z.string().min(1, "Clasificare obligatorie"),
  gestiuneId: z.number().min(1, "Gestiune obligatorie"),
  locFolosintaId: z.number().nullable(),
  sursaFinantareId: z.number().nullable(),
  contId: z.number().min(1, "Cont obligatoriu"),
  valoareInventar: z.string().min(1, "Valoare inventar obligatorie"),
  durataNormala: z.number().min(1, "Durata normala obligatorie"),
  eAmortizabil: z.boolean(),
  descriere: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddLinieIntrareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatiuneId: number;
  onSuccess: () => void;
}

export function AddLinieIntrareDialog({
  open,
  onOpenChange,
  operatiuneId,
  onSuccess,
}: AddLinieIntrareDialogProps) {
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [locuri, setLocuri] = useState<LocFolosinta[]>([]);
  const [conturi, setConturi] = useState<Cont[]>([]);
  const [clasificari, setClasificari] = useState<Clasificare[]>([]);
  const [surse, setSurse] = useState<SursaFinantare[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numarInventar: "",
      denumire: "",
      clasificareCod: "",
      gestiuneId: 0,
      locFolosintaId: null,
      sursaFinantareId: null,
      contId: 0,
      valoareInventar: "",
      durataNormala: 0,
      eAmortizabil: true,
      descriere: "",
    },
  });

  const gestiuneId = form.watch("gestiuneId");

  // Load reference data
  useEffect(() => {
    if (!open) return;

    Promise.all([
      api.get<Gestiune[]>("/gestiuni"),
      api.get<Cont[]>("/conturi"),
      api.get<Clasificare[]>("/clasificari"),
      api.get<SursaFinantare[]>("/surse-finantare"),
    ]).then(([gRes, cRes, clRes, sfRes]) => {
      if (gRes.success && gRes.data) setGestiuni(gRes.data.filter((g) => g.activ));
      if (cRes.success && cRes.data) setConturi(cRes.data.filter((c) => c.activ && !c.titlu));
      if (clRes.success && clRes.data) setClasificari(clRes.data);
      if (sfRes.success && sfRes.data) setSurse(sfRes.data.filter((s) => s.activ));
    });

    form.reset({
      numarInventar: "",
      denumire: "",
      clasificareCod: "",
      gestiuneId: 0,
      locFolosintaId: null,
      sursaFinantareId: null,
      contId: 0,
      valoareInventar: "",
      durataNormala: 0,
      eAmortizabil: true,
      descriere: "",
    });
    setSubmitError(null);
  }, [open, form]);

  // Load locuri when gestiune changes
  useEffect(() => {
    if (gestiuneId && gestiuneId > 0) {
      api.get<LocFolosinta[]>(`/locuri?gestiuneId=${gestiuneId}`).then((res) => {
        if (res.success && res.data) setLocuri(res.data.filter((l) => l.activ));
        else setLocuri([]);
      });
    } else {
      setLocuri([]);
    }
    form.setValue("locFolosintaId", null);
  }, [gestiuneId, form]);

  async function onSubmit(data: FormData) {
    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      numarInventar: data.numarInventar,
      denumire: data.denumire,
      clasificareCod: data.clasificareCod,
      gestiuneId: data.gestiuneId,
      locFolosintaId: data.locFolosintaId || undefined,
      sursaFinantareId: data.sursaFinantareId || undefined,
      contId: data.contId,
      valoareInventar: data.valoareInventar,
      durataNormala: data.durataNormala,
      eAmortizabil: data.eAmortizabil,
      descriere: data.descriere || undefined,
    };

    const res = await api.post(`/operatiuni-acte/${operatiuneId}/linie-intrare`, payload);

    if (res.success) {
      toast.success("Linie de intrare adaugata");
      form.reset();
      onSuccess();
    } else {
      setSubmitError(res.message || "Eroare la adaugarea liniei");
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adauga Linie - Intrare Mijloc Fix</DialogTitle>
          <DialogDescription>
            Creati un mijloc fix nou care va fi adaugat ca linie in aceasta operatiune.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {submitError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numarInventar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nr. Inventar *</FormLabel>
                    <FormControl>
                      <Input placeholder="MF-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valoareInventar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valoare Inventar (RON) *</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="denumire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Denumire *</FormLabel>
                  <FormControl>
                    <Input placeholder="Denumire mijloc fix" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clasificareCod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Clasificare *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectati clasificarea" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clasificari.map((cl) => (
                        <SelectItem key={cl.cod} value={cl.cod}>
                          {cl.cod} - {cl.denumire}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gestiuneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestiune *</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(val) => field.onChange(parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selectati gestiunea" />
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
                name="locFolosintaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loc Folosinta</FormLabel>
                    <Select
                      value={field.value?.toString() ?? "none"}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : parseInt(val))
                      }
                      disabled={!gestiuneId || locuri.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !gestiuneId
                                ? "Selectati gestiunea"
                                : locuri.length === 0
                                  ? "Nu exista locuri"
                                  : "Selectati (optional)"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">-- Fara --</SelectItem>
                        {locuri.map((l) => (
                          <SelectItem key={l.id} value={l.id.toString()}>
                            {l.cod} - {l.denumire}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cont *</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(val) => field.onChange(parseInt(val))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selectati contul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conturi.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.simbol} - {c.denumire}
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
                name="sursaFinantareId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sursa Finantare</FormLabel>
                    <Select
                      value={field.value?.toString() ?? "none"}
                      onValueChange={(val) =>
                        field.onChange(val === "none" ? null : parseInt(val))
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selectati (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">-- Fara --</SelectItem>
                        {surse.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.cod} - {s.denumire}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="durataNormala"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Durata Normala (luni) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="ex: 60"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eAmortizabil"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-3 space-y-0 pt-6">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Amortizabil</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descriere"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descriere</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descriere (optional)"
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
                onClick={() => onOpenChange(false)}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Se adauga..." : "Adauga Linie"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
