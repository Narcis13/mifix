import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Gestiune, LocFolosinta, Cont } from "shared";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface MijlocFixSearch {
  id: number;
  numarInventar: string;
  denumire: string;
  valoareInventar: string;
  gestiune?: { id: number; denumire: string };
  locFolosinta?: { id: number; denumire: string };
}

const formSchema = z.object({
  mijlocFixId: z.number().min(1, "Selectati un mijloc fix"),
  gestiuneDestinatieId: z.number().nullable(),
  locFolosintaDestinatieId: z.number().nullable(),
  contDestinatieId: z.number().nullable(),
  observatii: z.string().max(500).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddLinieTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operatiuneId: number;
  onSuccess: () => void;
}

export function AddLinieTransferDialog({
  open,
  onOpenChange,
  operatiuneId,
  onSuccess,
}: AddLinieTransferDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MijlocFixSearch[]>([]);
  const [selectedMF, setSelectedMF] = useState<MijlocFixSearch | null>(null);
  const [gestiuni, setGestiuni] = useState<Gestiune[]>([]);
  const [locuriDestinatie, setLocuriDestinatie] = useState<LocFolosinta[]>([]);
  const [conturi, setConturi] = useState<Cont[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mijlocFixId: 0,
      gestiuneDestinatieId: null,
      locFolosintaDestinatieId: null,
      contDestinatieId: null,
      observatii: "",
    },
  });

  const gestiuneDestinatieId = form.watch("gestiuneDestinatieId");

  // Load reference data
  useEffect(() => {
    if (!open) return;
    Promise.all([
      api.get<Gestiune[]>("/gestiuni"),
      api.get<Cont[]>("/conturi"),
    ]).then(([gRes, cRes]) => {
      if (gRes.success && gRes.data) setGestiuni(gRes.data.filter((g) => g.activ));
      if (cRes.success && cRes.data) setConturi(cRes.data.filter((c) => c.activ && !c.titlu));
    });

    form.reset({
      mijlocFixId: 0,
      gestiuneDestinatieId: null,
      locFolosintaDestinatieId: null,
      contDestinatieId: null,
      observatii: "",
    });
    setSearchQuery("");
    setSearchResults([]);
    setSelectedMF(null);
    setSubmitError(null);
  }, [open, form]);

  // Search MF
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    api
      .get<MijlocFixSearch[]>(
        `/mijloace-fixe/cautare?q=${encodeURIComponent(debouncedSearch)}&stare=activ&limit=10`
      )
      .then((res) => {
        if (res.success && res.data) setSearchResults(res.data);
      });
  }, [debouncedSearch]);

  // Load locuri when gestiune destinatie changes
  useEffect(() => {
    if (gestiuneDestinatieId && gestiuneDestinatieId > 0) {
      api.get<LocFolosinta[]>(`/locuri?gestiuneId=${gestiuneDestinatieId}`).then((res) => {
        if (res.success && res.data) setLocuriDestinatie(res.data.filter((l) => l.activ));
        else setLocuriDestinatie([]);
      });
    } else {
      setLocuriDestinatie([]);
    }
    form.setValue("locFolosintaDestinatieId", null);
  }, [gestiuneDestinatieId, form]);

  function selectMijlocFix(mf: MijlocFixSearch) {
    setSelectedMF(mf);
    form.setValue("mijlocFixId", mf.id);
    setSearchQuery("");
    setSearchResults([]);
  }

  function clearSelection() {
    setSelectedMF(null);
    form.setValue("mijlocFixId", 0);
  }

  async function onSubmit(data: FormData) {
    if (!data.gestiuneDestinatieId && !data.locFolosintaDestinatieId && !data.contDestinatieId) {
      setSubmitError("Trebuie sa selectati cel putin o destinatie (gestiune, loc sau cont)");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payload = {
      mijlocFixId: data.mijlocFixId,
      gestiuneDestinatieId: data.gestiuneDestinatieId || undefined,
      locFolosintaDestinatieId: data.locFolosintaDestinatieId || undefined,
      contDestinatieId: data.contDestinatieId || undefined,
      observatii: data.observatii || undefined,
    };

    const res = await api.post(`/operatiuni-acte/${operatiuneId}/linie-transfer`, payload);

    if (res.success) {
      toast.success("Linie de transfer adaugata");
      form.reset();
      onSuccess();
    } else {
      setSubmitError(res.message || "Eroare la adaugarea liniei");
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Adauga Linie - Transfer</DialogTitle>
          <DialogDescription>
            Cautati si selectati un mijloc fix existent pentru transfer.
          </DialogDescription>
        </DialogHeader>

        {submitError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {submitError}
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* MF Search */}
            <div>
              <label className="text-sm font-medium">Mijloc Fix *</label>
              {selectedMF ? (
                <div className="mt-1 flex items-center justify-between border rounded-md p-3 bg-muted/30">
                  <div>
                    <span className="font-mono text-sm">{selectedMF.numarInventar}</span>
                    {" - "}
                    <span className="font-medium">{selectedMF.denumire}</span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Gestiune: {selectedMF.gestiune?.denumire || "-"} | Valoare:{" "}
                      {parseFloat(selectedMF.valoareInventar).toLocaleString("ro-RO", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      RON
                    </div>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    Schimba
                  </Button>
                </div>
              ) : (
                <div className="mt-1 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cautati dupa nr. inventar sau denumire..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 border rounded-md bg-background shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((mf) => (
                        <button
                          key={mf.id}
                          type="button"
                          onClick={() => selectMijlocFix(mf)}
                          className="w-full text-left px-3 py-2 hover:bg-muted text-sm border-b last:border-b-0"
                        >
                          <span className="font-mono">{mf.numarInventar}</span>
                          {" - "}
                          {mf.denumire}
                          <span className="text-xs text-muted-foreground ml-2">
                            ({mf.gestiune?.denumire})
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {form.formState.errors.mijlocFixId && (
                <p className="text-sm text-destructive mt-1">
                  {form.formState.errors.mijlocFixId.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="gestiuneDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gestiune Destinatie</FormLabel>
                  <Select
                    value={field.value?.toString() ?? "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : parseInt(val))
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectati (daca transfer gestiune)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Fara --</SelectItem>
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
              name="locFolosintaDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loc Folosinta Destinatie</FormLabel>
                  <Select
                    value={field.value?.toString() ?? "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : parseInt(val))
                    }
                    disabled={!gestiuneDestinatieId || locuriDestinatie.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            !gestiuneDestinatieId
                              ? "Selectati gestiunea mai intai"
                              : locuriDestinatie.length === 0
                                ? "Nu exista locuri"
                                : "Selectati (optional)"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Fara --</SelectItem>
                      {locuriDestinatie.map((l) => (
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

            <FormField
              control={form.control}
              name="contDestinatieId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cont Destinatie</FormLabel>
                  <Select
                    value={field.value?.toString() ?? "none"}
                    onValueChange={(val) =>
                      field.onChange(val === "none" ? null : parseInt(val))
                    }
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selectati (daca transfer cont)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Fara --</SelectItem>
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
              name="observatii"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observatii</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observatii (optional)"
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
