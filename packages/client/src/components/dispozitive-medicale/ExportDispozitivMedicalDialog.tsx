import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Stethoscope, ExternalLink } from "lucide-react";
import type { MijlocFix } from "shared";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

// ── Form Schema ───────────────────────────────────────────────────────────────

const formSchema = z.object({
  // Required
  producator: z.string().min(1, "Producatorul este obligatoriu").max(300),
  clasaRisc: z.enum(["I", "IIa", "IIb", "III"], {
    error: "Clasa de risc este obligatorie",
  }),
  // Identification
  model: z.string().max(200).optional(),
  numarSerie: z.string().max(100).optional(),
  numarLot: z.string().max(100).optional(),
  referintaCatalog: z.string().max(100).optional(),
  // Traceability
  udiDI: z.string().max(100).optional(),
  // Fabrication
  taraProducator: z.string().max(100).optional(),
  dataFabricatie: z.string().optional(),
  dataExpirare: z.string().optional(),
  // Certification
  marcaCE: z.boolean(),
  numarEudamed: z.string().max(100).optional(),
  organismNotificat: z.string().max(100).optional(),
  numarCertificatCE: z.string().max(100).optional(),
  dataExpiraCertificatCE: z.string().optional(),
  // ANMDM
  numarInregistrareANMDM: z.string().max(100).optional(),
  dataInregistrareANMDM: z.string().optional(),
  // Usage
  destinatieUtilizare: z.string().max(500).optional(),
  conditiiStocare: z.string().max(300).optional(),
  intervalMentenantaLuni: z.number().int().positive().optional(),
  dataMentenantaUrmatoare: z.string().optional(),
  // State
  stareDM: z.enum(["activ", "mentenanta", "retras", "carantinat", "defect", "arhivat"]),
  observatii: z.string().max(1000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

// ── Props ─────────────────────────────────────────────────────────────────────

interface ExportDispozitivMedicalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mijlocFix: MijlocFix;
  onSuccess?: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExportDispozitivMedicalDialog({
  open,
  onOpenChange,
  mijlocFix,
  onSuccess,
}: ExportDispozitivMedicalDialogProps) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [conflictDmId, setConflictDmId] = useState<number | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      producator: "",
      clasaRisc: undefined,
      model: "",
      numarSerie: "",
      numarLot: "",
      referintaCatalog: "",
      udiDI: "",
      taraProducator: "",
      dataFabricatie: "",
      dataExpirare: "",
      marcaCE: true,
      numarEudamed: "",
      organismNotificat: "",
      numarCertificatCE: "",
      dataExpiraCertificatCE: "",
      numarInregistrareANMDM: "",
      dataInregistrareANMDM: "",
      destinatieUtilizare: "",
      conditiiStocare: "",
      intervalMentenantaLuni: undefined,
      dataMentenantaUrmatoare: "",
      stareDM: "activ",
      observatii: "",
    },
  });

  async function onSubmit(data: FormValues) {
    setIsSubmitting(true);
    setConflictDmId(null);

    // Build payload — strip empty optional strings
    const payload: Record<string, unknown> = {
      mijlocFixId: mijlocFix.id,
      producator: data.producator,
      clasaRisc: data.clasaRisc,
      marcaCE: data.marcaCE,
      stareDM: data.stareDM,
    };

    const optStr = (key: keyof FormValues) => {
      const v = data[key];
      if (typeof v === "string" && v.trim() !== "") payload[key] = v;
    };
    const optNum = (key: keyof FormValues) => {
      const v = data[key];
      if (typeof v === "number" && !isNaN(v)) payload[key] = v;
    };

    optStr("model");
    optStr("numarSerie");
    optStr("numarLot");
    optStr("referintaCatalog");
    optStr("udiDI");
    optStr("taraProducator");
    optStr("dataFabricatie");
    optStr("dataExpirare");
    optStr("numarEudamed");
    optStr("organismNotificat");
    optStr("numarCertificatCE");
    optStr("dataExpiraCertificatCE");
    optStr("numarInregistrareANMDM");
    optStr("dataInregistrareANMDM");
    optStr("destinatieUtilizare");
    optStr("conditiiStocare");
    optStr("dataMentenantaUrmatoare");
    optStr("observatii");
    optNum("intervalMentenantaLuni");

    try {
      const response = await api.post<{ id: number }>("/dispozitive-medicale", payload);

      if (response.success && response.data) {
        toast.success("Dispozitiv medical inregistrat cu succes");
        onOpenChange(false);
        onSuccess?.();
        navigate(`/dispozitive-medicale/${response.data.id}`);
      } else if ((response as any).status === 409 || response.message?.includes("deja")) {
        // Conflict — already linked; try to find the existing DM
        toast.error("Mijlocul fix are deja un dispozitiv medical inregistrat");
        fetchExistingDm();
      } else {
        toast.error(response.message || "Eroare la inregistrare");
      }
    } catch {
      toast.error("Eroare de retea");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function fetchExistingDm() {
    const res = await api.get<{ items: Array<{ id: number; mijlocFixId: number }> }>(
      `/dispozitive-medicale?page=1&pageSize=100`
    );
    if (res.success && res.data) {
      const found = res.data.items.find((dm: any) => dm.mijlocFixId === mijlocFix.id);
      if (found) setConflictDmId(found.id);
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      form.reset();
      setConflictDmId(null);
    }
    onOpenChange(newOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Export ca Dispozitiv Medical
          </DialogTitle>
          <DialogDescription>
            {mijlocFix.numarInventar} — {mijlocFix.denumire}
          </DialogDescription>
        </DialogHeader>

        {/* Conflict warning */}
        {conflictDmId && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Acest mijloc fix este deja inregistrat ca dispozitiv medical.</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-2"
                onClick={() => {
                  handleOpenChange(false);
                  navigate(`/dispozitive-medicale/${conflictDmId}`);
                }}
              >
                Deschide <ExternalLink className="ml-1 h-3 w-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* ── Informatii Principale ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Informatii Principale
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="producator"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Producator *</FormLabel>
                      <FormControl>
                        <Input placeholder="Denumire producator" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="clasaRisc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clasa Risc *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteaza clasa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="I">Clasa I</SelectItem>
                          <SelectItem value="IIa">Clasa IIa</SelectItem>
                          <SelectItem value="IIb">Clasa IIb</SelectItem>
                          <SelectItem value="III">Clasa III</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stareDM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stare</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="activ">Activ</SelectItem>
                          <SelectItem value="mentenanta">Mentenanta</SelectItem>
                          <SelectItem value="retras">Retras</SelectItem>
                          <SelectItem value="carantinat">Carantinat</SelectItem>
                          <SelectItem value="defect">Defect</SelectItem>
                          <SelectItem value="arhivat">Arhivat</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ── Identificare Produs ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Identificare Produs
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl><Input placeholder="Model / tip" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="referintaCatalog"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referinta Catalog</FormLabel>
                      <FormControl><Input placeholder="REF / catalog nr." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numarSerie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. Serie</FormLabel>
                      <FormControl><Input placeholder="Serial number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numarLot"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. Lot</FormLabel>
                      <FormControl><Input placeholder="Lot / batch" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="udiDI"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>UDI-DI</FormLabel>
                      <FormControl><Input placeholder="Unique Device Identifier — Device Identifier" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ── Fabricatie ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Fabricatie
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="taraProducator"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tara Producator</FormLabel>
                      <FormControl><Input placeholder="ex. Germany" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div />
                <FormField
                  control={form.control}
                  name="dataFabricatie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fabricatie</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataExpirare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Expirare</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ── Certificare MDR ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Certificare MDR EU 2017/745
              </h3>
              <FormField
                control={form.control}
                name="marcaCE"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Marca CE aplicata</FormLabel>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numarEudamed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. EUDAMED</FormLabel>
                      <FormControl><Input placeholder="SRN / EUDAMED nr." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organismNotificat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organism Notificat</FormLabel>
                      <FormControl><Input placeholder="Notified Body nr." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numarCertificatCE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. Certificat CE</FormLabel>
                      <FormControl><Input placeholder="Nr. certificat" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataExpiraCertificatCE"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expira Certificat CE</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ── Inregistrare ANMDM ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Inregistrare ANMDM
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numarInregistrareANMDM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nr. Inregistrare ANMDM</FormLabel>
                      <FormControl><Input placeholder="Nr. inregistrare" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataInregistrareANMDM"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Inregistrare ANMDM</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ── Mentenanta & Utilizare ── */}
            <section className="space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Mentenanta & Utilizare
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="intervalMentenantaLuni"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval Mentenanta (luni)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="ex. 12"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dataMentenantaUrmatoare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Mentenanta Urmatoare</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destinatieUtilizare"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Destinatie Utilizare</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descriere destinatie / indicatii de utilizare"
                          className="min-h-[60px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="conditiiStocare"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Conditii Stocare</FormLabel>
                      <FormControl>
                        <Input placeholder="ex. 2-8°C, ferit de lumina" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />

            {/* ── Observatii ── */}
            <FormField
              control={form.control}
              name="observatii"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observatii</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observatii suplimentare..."
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
                onClick={() => handleOpenChange(false)}
              >
                Anuleaza
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Stethoscope className="mr-2 h-4 w-4" />
                {isSubmitting ? "Se inregistreaza..." : "Inregistreaza Dispozitiv"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
