import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ClasificarePicker } from "./ClasificarePicker";
import type {
  MijlocFix,
  Gestiune,
  LocFolosinta,
  SursaFinantare,
  Cont,
  TipDocument,
  Clasificare,
} from "shared";

// Zod schema for form validation (client-side, mirrors server validation)
const mijlocFixFormSchema = z.object({
  numarInventar: z
    .string()
    .min(1, "Numar inventar obligatoriu")
    .max(50, "Maxim 50 caractere"),
  denumire: z
    .string()
    .min(1, "Denumire obligatorie")
    .max(255, "Maxim 255 caractere"),
  descriere: z.string().max(1000, "Maxim 1000 caractere").optional(),
  clasificareCod: z.string().min(1, "Clasificare obligatorie"),
  tipDocumentId: z.number().optional().nullable(),
  documentAchizitie: z.string().max(100, "Maxim 100 caractere").optional(),
  dataDocument: z.string().optional(),
  furnizor: z.string().max(200, "Maxim 200 caractere").optional(),
  gestiuneId: z.number().min(1, "Gestiune obligatorie"),
  locFolosintaId: z.number().optional().nullable(),
  contId: z.number().optional().nullable(),
  sursaFinantareId: z.number().optional().nullable(),
  valoareInventar: z
    .string()
    .min(1, "Valoare obligatorie")
    .regex(/^\d+(\.\d{1,2})?$/, "Format invalid (ex: 1234.56)"),
  dataAchizitie: z.string().min(1, "Data achizitie obligatorie"),
  durataNormala: z.number().min(1, "Durata normala obligatorie"),
  eAmortizabil: z.boolean(),
});

type MijlocFixFormData = z.infer<typeof mijlocFixFormSchema>;

interface MijlocFixFormProps {
  mijlocFix?: MijlocFix; // Undefined = create mode, defined = edit mode
  onSuccess: () => void;
  onCancel: () => void;
}

export function MijlocFixForm({
  mijlocFix,
  onSuccess,
  onCancel,
}: MijlocFixFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedClasificare, setSelectedClasificare] = useState<
    Clasificare | undefined
  >(mijlocFix?.clasificare);

  // Reference data
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [locuri, setLocuri] = useState<LocFolosinta[]>([]);
  const [surseFinantare, setSurseFinantare] = useState<SursaFinantare[]>([]);
  const [conturi, setConturi] = useState<Cont[]>([]);
  const [tipuriDocument, setTipuriDocument] = useState<TipDocument[]>([]);
  const [isLoadingRefs, setIsLoadingRefs] = useState(true);

  const isEditMode = !!mijlocFix;

  const form = useForm<MijlocFixFormData>({
    resolver: zodResolver(mijlocFixFormSchema),
    defaultValues: {
      numarInventar: mijlocFix?.numarInventar ?? "",
      denumire: mijlocFix?.denumire ?? "",
      descriere: mijlocFix?.descriere ?? "",
      clasificareCod: mijlocFix?.clasificareCod ?? "",
      tipDocumentId: mijlocFix?.tipDocumentId ?? null,
      documentAchizitie: mijlocFix?.documentAchizitie ?? "",
      dataDocument: mijlocFix?.dataDocumentAchizitie?.split("T")[0] ?? "",
      furnizor: mijlocFix?.furnizor ?? "",
      gestiuneId: mijlocFix?.gestiuneId ?? 0,
      locFolosintaId: mijlocFix?.locFolosintaId ?? null,
      contId: mijlocFix?.contId ?? null,
      sursaFinantareId: mijlocFix?.sursaFinantareId ?? null,
      valoareInventar: mijlocFix?.valoareInventar ?? "",
      dataAchizitie: mijlocFix?.dataAchizitie?.split("T")[0] ?? "",
      durataNormala: mijlocFix?.durataNormala ?? 0,
      eAmortizabil: mijlocFix?.eAmortizabil ?? true,
    },
  });

  // Watch gestiuneId to filter locuri
  const gestiuneId = useWatch({ control: form.control, name: "gestiuneId" });

  // Load reference data on mount
  useEffect(() => {
    async function loadReferenceData() {
      setIsLoadingRefs(true);
      const [gestiuniRes, surseRes, conturiRes, tipuriRes] = await Promise.all([
        api.get<Gestiune[]>("/gestiuni"),
        api.get<SursaFinantare[]>("/surse-finantare"),
        api.get<Cont[]>("/conturi"),
        api.get<TipDocument[]>("/tipuri-document"),
      ]);

      if (gestiuniRes.success && gestiuniRes.data) {
        setGestiuni(gestiuniRes.data.filter((g) => g.activ));
      }
      if (surseRes.success && surseRes.data) {
        setSurseFinantare(surseRes.data.filter((s) => s.activ));
      }
      if (conturiRes.success && conturiRes.data) {
        setConturi(conturiRes.data.filter((c) => c.activ));
      }
      if (tipuriRes.success && tipuriRes.data) {
        setTipuriDocument(tipuriRes.data.filter((t) => t.activ));
      }

      setIsLoadingRefs(false);
    }
    loadReferenceData();
  }, []);

  // Load locuri when gestiune changes
  useEffect(() => {
    async function loadLocuri() {
      if (gestiuneId) {
        const res = await api.get<LocFolosinta[]>(
          `/locuri?gestiuneId=${gestiuneId}`
        );
        if (res.success && res.data) {
          setLocuri(res.data.filter((l) => l.activ));
        } else {
          setLocuri([]);
        }
      } else {
        setLocuri([]);
      }
      // Reset locFolosintaId when gestiune changes (only if not initial load in edit mode)
      if (!mijlocFix || form.getValues("gestiuneId") !== mijlocFix.gestiuneId) {
        form.setValue("locFolosintaId", null);
      }
    }
    loadLocuri();
  }, [gestiuneId, form, mijlocFix]);

  // Handle classification selection
  const handleClasificareSelect = (clasificare: Clasificare) => {
    form.setValue("clasificareCod", clasificare.cod);
    form.setValue("durataNormala", clasificare.durataNormalaMin * 12);
    setSelectedClasificare(clasificare);
    form.clearErrors("clasificareCod");
    form.clearErrors("durataNormala");
  };

  // Submit handler
  const onSubmit = async (data: MijlocFixFormData) => {
    setIsSubmitting(true);

    // Compute derived fields for create
    const payload = {
      numarInventar: data.numarInventar,
      denumire: data.denumire,
      descriere: data.descriere || null,
      clasificareCod: data.clasificareCod,
      tipDocumentId: data.tipDocumentId || null,
      documentAchizitie: data.documentAchizitie || null,
      dataDocumentAchizitie: data.dataDocument || null,
      furnizor: data.furnizor || null,
      gestiuneId: data.gestiuneId,
      locFolosintaId: data.locFolosintaId || null,
      contId: data.contId || null,
      sursaFinantareId: data.sursaFinantareId || null,
      valoareInventar: data.valoareInventar,
      valoareAmortizata: isEditMode ? mijlocFix!.valoareAmortizata : "0.00",
      valoareRamasa: isEditMode ? mijlocFix!.valoareRamasa : data.valoareInventar,
      dataAchizitie: data.dataAchizitie,
      dataPIF: data.dataAchizitie, // Same as acquisition date by default
      durataNormala: data.durataNormala,
      metodaAmortizare: isEditMode ? mijlocFix!.metodaAmortizare : "liniara",
      amortizabil: true,
      eAmortizabil: data.eAmortizabil,
      stare: isEditMode ? mijlocFix!.stare : "activ",
    };

    const res = isEditMode
      ? await api.put<MijlocFix>(`/mijloace-fixe/${mijlocFix!.id}`, payload)
      : await api.post<MijlocFix>("/mijloace-fixe", payload);

    if (res.success) {
      onSuccess();
    } else if (res.errors) {
      // Set form errors from API response
      Object.entries(res.errors).forEach(([field, messages]) => {
        form.setError(field as keyof MijlocFixFormData, {
          message: messages[0],
        });
      });
    }

    setIsSubmitting(false);
  };

  if (isLoadingRefs) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Se incarca datele...</div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Date Identificare */}
        <Card>
          <CardHeader>
            <CardTitle>Date Identificare</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numarInventar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numar Inventar *</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: MF-001" {...field} />
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Clasificare (HG 2139/2004) *</FormLabel>
                    <FormControl>
                      <ClasificarePicker
                        value={field.value}
                        selectedClasificare={selectedClasificare}
                        onSelect={handleClasificareSelect}
                        error={!!form.formState.errors.clasificareCod}
                      />
                    </FormControl>
                    {selectedClasificare && (
                      <FormDescription>
                        {selectedClasificare.denumire}
                        <br />
                        Durata normala: {selectedClasificare.durataNormalaMin}-
                        {selectedClasificare.durataNormalaMax} ani conform HG
                        2139/2004
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descriere"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Descriere</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descriere detaliata (optional)"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Document Intrare */}
        <Card>
          <CardHeader>
            <CardTitle>Document Intrare</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipDocumentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tip Document</FormLabel>
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) =>
                        field.onChange(val ? parseInt(val) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecteaza tipul documentului" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tipuriDocument.map((tip) => (
                          <SelectItem key={tip.id} value={tip.id.toString()}>
                            {tip.cod} - {tip.denumire}
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
                name="documentAchizitie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numar Document</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: FA-12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Document</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="furnizor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Furnizor</FormLabel>
                    <FormControl>
                      <Input placeholder="Denumire furnizor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Date Contabile */}
        <Card>
          <CardHeader>
            <CardTitle>Date Contabile</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gestiuneId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestiune *</FormLabel>
                    <Select
                      value={field.value ? field.value.toString() : ""}
                      onValueChange={(val) =>
                        field.onChange(val ? parseInt(val) : 0)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecteaza gestiunea" />
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
                name="locFolosintaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loc Folosinta</FormLabel>
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) =>
                        field.onChange(val ? parseInt(val) : null)
                      }
                      disabled={!gestiuneId || locuri.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={
                              !gestiuneId
                                ? "Selectati mai intai gestiunea"
                                : locuri.length === 0
                                  ? "Nu exista locuri pentru aceasta gestiune"
                                  : "Selecteaza locul de folosinta"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locuri.map((loc) => (
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
                name="contId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cont Contabil</FormLabel>
                    <Select
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) =>
                        field.onChange(val ? parseInt(val) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecteaza contul" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {conturi.map((cont) => (
                          <SelectItem key={cont.id} value={cont.id.toString()}>
                            {cont.simbol} - {cont.denumire}
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
                      value={field.value?.toString() ?? ""}
                      onValueChange={(val) =>
                        field.onChange(val ? parseInt(val) : null)
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecteaza sursa de finantare" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {surseFinantare.map((sursa) => (
                          <SelectItem key={sursa.id} value={sursa.id.toString()}>
                            {sursa.cod} - {sursa.denumire}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Amortizare */}
        <Card>
          <CardHeader>
            <CardTitle>Amortizare</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valoareInventar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valoare Inventar (RON) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          className="pr-12"
                          {...field}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                          RON
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataAchizitie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Achizitie *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          field.onChange(
                            e.target.value ? parseInt(e.target.value) : 0
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {selectedClasificare
                        ? `Recomandat: ${selectedClasificare.durataNormalaMin * 12}-${selectedClasificare.durataNormalaMax * 12} luni`
                        : "Selectati clasificarea pentru a completa automat"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eAmortizabil"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Se amortizeaza</FormLabel>
                      <FormDescription>
                        Debifati pentru mijloace fixe care nu se amortizeaza
                        (ex: terenuri)
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Anuleaza
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Se salveaza..."
              : isEditMode
                ? "Salveaza"
                : "Adauga"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
