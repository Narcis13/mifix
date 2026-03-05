import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, ExternalLink, AlertTriangle, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { DispozitivMedical, MentenantaDispozitiv, IncidentAdvers } from "shared";

// ── Labels ────────────────────────────────────────────────────────────────────

const stareDMLabels: Record<string, string> = {
  activ: "Activ",
  mentenanta: "In mentenanta",
  retras: "Retras",
  carantinat: "Carantinat",
  defect: "Defect",
  arhivat: "Arhivat",
};

const stareDMVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  activ: "default",
  mentenanta: "secondary",
  retras: "destructive",
  carantinat: "destructive",
  defect: "destructive",
  arhivat: "outline",
};

const clasaRiscVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  I: "outline",
  IIa: "secondary",
  IIb: "secondary",
  III: "destructive",
};

const tipMentenantaLabels: Record<string, string> = {
  preventiva: "Preventiva",
  corectiva: "Corectiva",
  calibrare: "Calibrare",
  verificare: "Verificare",
  actualizare: "Actualizare SW",
};

const rezultatLabels: Record<string, string> = {
  ok: "OK — Apt utilizare",
  conditionat: "Conditionat",
  defect: "Defect",
  retras: "Retras din serviciu",
};

const rezultatVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ok: "default",
  conditionat: "secondary",
  defect: "destructive",
  retras: "destructive",
};

const tipIncidentLabels: Record<string, string> = {
  incident_sever: "Incident Sever",
  incident_nonsever: "Incident Non-Sever",
  near_miss: "Near Miss",
  reclamatie_user: "Reclamatie Utilizator",
  malfunctionare: "Malfunctionare",
  alerta_teren: "Alerta Teren (FSCA)",
};

const stareIncidentVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  deschis: "outline",
  investigatie: "secondary",
  raportat: "secondary",
  inchis: "default",
};

// ── Detail field helper ───────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-0.5">{typeof value === "boolean" ? (value ? "Da" : "Nu") : value}</dd>
    </div>
  );
}

// ── Add Mentenanta Dialog ─────────────────────────────────────────────────────

interface AddMentenantaDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dispozitivId: number;
  onSuccess: (m: MentenantaDispozitiv) => void;
}

function AddMentenantaDialog({ open, onOpenChange, dispozitivId, onSuccess }: AddMentenantaDialogProps) {
  const { register, handleSubmit, setValue, reset, watch } = useForm<{
    tipMentenanta: string;
    dataPlanificata?: string;
    dataEfectuata?: string;
    efectuatDe?: string;
    autorizatDe?: string;
    descriere?: string;
    rezultat: string;
    numarRaport?: string;
    dataMentenantaUrmatoare?: string;
    observatii?: string;
  }>({ defaultValues: { tipMentenanta: "preventiva", rezultat: "ok" } });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const tipMentenanta = watch("tipMentenanta");
  const rezultat = watch("rezultat");

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    const response = await api.post<MentenantaDispozitiv>(
      `/dispozitive-medicale/${dispozitivId}/mentenante`,
      data
    );
    setIsSubmitting(false);
    if (response.success && response.data) {
      toast.success("Mentenanta inregistrata");
      onSuccess(response.data);
      reset();
      onOpenChange(false);
    } else {
      toast.error(response.message || "Eroare la salvare");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adauga Mentenanta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tip mentenanta *</Label>
              <Select value={tipMentenanta} onValueChange={(v) => setValue("tipMentenanta", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipMentenantaLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Rezultat *</Label>
              <Select value={rezultat} onValueChange={(v) => setValue("rezultat", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(rezultatLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Data planificata</Label>
              <Input type="date" {...register("dataPlanificata")} />
            </div>
            <div className="space-y-1">
              <Label>Data efectuata</Label>
              <Input type="date" {...register("dataEfectuata")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Efectuat de</Label>
              <Input {...register("efectuatDe")} placeholder="Firma/Persoana" />
            </div>
            <div className="space-y-1">
              <Label>Autorizat de</Label>
              <Input {...register("autorizatDe")} placeholder="Responsabil" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descriere</Label>
            <Textarea {...register("descriere")} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nr. raport</Label>
              <Input {...register("numarRaport")} />
            </div>
            <div className="space-y-1">
              <Label>Data mentenanta urmatoare</Label>
              <Input type="date" {...register("dataMentenantaUrmatoare")} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuleaza</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Se salveaza..." : "Salveaza"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Add Incident Dialog ───────────────────────────────────────────────────────

interface AddIncidentDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dispozitivId: number;
  onSuccess: (i: IncidentAdvers) => void;
}

function AddIncidentDialog({ open, onOpenChange, dispozitivId, onSuccess }: AddIncidentDialogProps) {
  const { register, handleSubmit, setValue, reset, watch } = useForm<{
    tipIncident: string;
    dataIncident: string;
    dataSesizare?: string;
    descriere: string;
    raportatANMDM: boolean;
    numarRaportANMDM?: string;
    actiuneCorectiva?: string;
    observatii?: string;
  }>({ defaultValues: { tipIncident: "malfunctionare", raportatANMDM: false, dataIncident: new Date().toISOString().split("T")[0] } });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const tipIncident = watch("tipIncident");

  async function onSubmit(data: any) {
    setIsSubmitting(true);
    const response = await api.post<IncidentAdvers>(
      `/dispozitive-medicale/${dispozitivId}/incidente`,
      data
    );
    setIsSubmitting(false);
    if (response.success && response.data) {
      toast.success("Incident inregistrat");
      onSuccess(response.data);
      reset();
      onOpenChange(false);
    } else {
      toast.error(response.message || "Eroare la salvare");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Inregistreaza Incident Advers</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tip incident *</Label>
              <Select value={tipIncident} onValueChange={(v) => setValue("tipIncident", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipIncidentLabels).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data incident *</Label>
              <Input type="date" {...register("dataIncident", { required: true })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descriere *</Label>
            <Textarea {...register("descriere", { required: true })} rows={3} placeholder="Descrieti incidentul..." />
          </div>
          <div className="space-y-1">
            <Label>Actiune corectiva</Label>
            <Textarea {...register("actiuneCorectiva")} rows={2} />
          </div>
          <div className="space-y-1">
            <Label>Nr. raport ANMDM (daca s-a raportat)</Label>
            <Input {...register("numarRaportANMDM")} placeholder="RV-XXXX/YYYY" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Anuleaza</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Se salveaza..." : "Salveaza"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function DispozitivMedicalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dm, setDm] = useState<DispozitivMedical | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addMentenantaOpen, setAddMentenantaOpen] = useState(false);
  const [addIncidentOpen, setAddIncidentOpen] = useState(false);

  async function fetchDm() {
    setIsLoading(true);
    const response = await api.get<DispozitivMedical>(`/dispozitive-medicale/${id}`);
    if (response.success && response.data) setDm(response.data);
    else toast.error("Eroare la incarcarea dispozitivului");
    setIsLoading(false);
  }

  useEffect(() => { if (id) fetchDm(); }, [id]);

  if (isLoading) return <div className="text-muted-foreground p-4">Se incarca...</div>;
  if (!dm) return <div className="text-muted-foreground p-4">Dispozitiv negasit.</div>;

  const mentenante = dm.mentenante ?? [];
  const incidente = dm.incidente ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dispozitive-medicale")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Inapoi
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">
              {dm.mijlocFix?.numarInventar} — {dm.mijlocFix?.denumire ?? "Dispozitiv Medical"}
            </h1>
            <Badge variant={clasaRiscVariant[dm.clasaRisc] || "outline"}>
              Clasa {dm.clasaRisc}
            </Badge>
            <Badge variant={stareDMVariant[dm.stareDM] || "secondary"}>
              {stareDMLabels[dm.stareDM]}
            </Badge>
          </div>
          {dm.mijlocFix && (
            <Link
              to={`/mijloace-fixe/${dm.mijlocFix.id}`}
              className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mt-0.5"
            >
              <ExternalLink className="h-3 w-3" /> Deschide Mijloc Fix
            </Link>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Producator & Identificare */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Producator & Identificare</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Field label="Producator" value={dm.producator} />
              <Field label="Tara producator" value={dm.taraProducator} />
              <Field label="Importator" value={dm.importator} />
              <Field label="Repr. autorizat UE" value={dm.reprezentantAutorizatUE} />
              <Field label="Model" value={dm.model} />
              <Field label="Referinta catalog" value={dm.referintaCatalog} />
              <Field label="Nr. serie" value={dm.numarSerie} />
              <Field label="Nr. lot" value={dm.numarLot} />
              <Field label="Data fabricatie" value={dm.dataFabricatie} />
              <Field label="Data expirare" value={dm.dataExpirare} />
            </dl>
          </CardContent>
        </Card>

        {/* UDI & Inregistrari */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">UDI & Inregistrari</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Field label="UDI-DI (Device Identifier)" value={dm.udiDI} />
              <Field label="UDI-PI (Production Identifier)" value={dm.udiPI} />
              <Field label="Nr. EUDAMED" value={dm.numarEudamed} />
              <Field label="Nr. inregistrare ANMDM" value={dm.numarInregistrareANMDM} />
              <Field label="Data inregistrare ANMDM" value={dm.dataInregistrareANMDM} />
              <div className="pt-1">
                <dt className="text-xs font-medium text-muted-foreground">Marcare CE</dt>
                <dd className="flex items-center gap-1 text-sm mt-0.5">
                  {dm.marcaCE ? (
                    <><CheckCircle className="h-3 w-3 text-green-600" /> Da</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 text-amber-500" /> Nu</>
                  )}
                </dd>
              </div>
              <Field label="Organism notificat" value={dm.organismNotificat} />
              <Field label="Nr. certificat CE" value={dm.numarCertificatCE} />
              <Field label="Expira certificat CE" value={dm.dataExpiraCertificatCE} />
            </dl>
          </CardContent>
        </Card>

        {/* Mentenanta & Utilizare */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Mentenanta & Utilizare</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <Field label="Destinatie utilizare" value={dm.destinatieUtilizare} />
              <Field label="Conditii stocare" value={dm.conditiiStocare} />
              <Field label="Interval mentenanta (luni)" value={dm.intervalMentenantaLuni} />
              <Field label="Urmatoarea mentenanta" value={dm.dataMentenantaUrmatoare} />
              <Field label="Observatii" value={dm.observatii} />
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mentenanta">
        <TabsList>
          <TabsTrigger value="mentenanta">
            Mentenanta ({mentenante.length})
          </TabsTrigger>
          <TabsTrigger value="incidente">
            Incidente Adverse ({incidente.length})
          </TabsTrigger>
        </TabsList>

        {/* ── Tab Mentenanta ── */}
        <TabsContent value="mentenanta" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">Registru mentenanta / calibrare</p>
            <Button size="sm" onClick={() => setAddMentenantaOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Adauga
            </Button>
          </div>
          {mentenante.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nu exista inregistrari de mentenanta.</p>
          ) : (
            <div className="space-y-2">
              {mentenante.map((m) => (
                <Card key={m.id} className="border">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tipMentenantaLabels[m.tipMentenanta]}</span>
                          <Badge variant={rezultatVariant[m.rezultat] || "secondary"} className="text-xs">
                            {rezultatLabels[m.rezultat]}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-x-3">
                          {m.dataEfectuata && <span>Efectuata: {new Date(m.dataEfectuata).toLocaleDateString("ro-RO")}</span>}
                          {m.efectuatDe && <span>De: {m.efectuatDe}</span>}
                          {m.numarRaport && <span>Raport: {m.numarRaport}</span>}
                        </div>
                        {m.descriere && <p className="text-xs text-muted-foreground">{m.descriere}</p>}
                        {m.dataMentenantaUrmatoare && (
                          <p className="text-xs text-blue-600">
                            Urmatoarea: {new Date(m.dataMentenantaUrmatoare).toLocaleDateString("ro-RO")}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(m.createdAt).toLocaleDateString("ro-RO")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Tab Incidente ── */}
        <TabsContent value="incidente" className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <p className="text-sm text-muted-foreground">
              Vigilenta dispozitiv — MDR Art. 87-92 + Ord. MS 912/2019
            </p>
            <Button size="sm" variant="destructive" onClick={() => setAddIncidentOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Raporteaza Incident
            </Button>
          </div>
          {incidente.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nu exista incidente adverse inregistrate.</p>
          ) : (
            <div className="space-y-2">
              {incidente.map((inc) => (
                <Card key={inc.id} className="border">
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{tipIncidentLabels[inc.tipIncident]}</span>
                          <Badge
                            variant={stareIncidentVariant[inc.stareIncident] || "secondary"}
                            className="text-xs"
                          >
                            {inc.stareIncident}
                          </Badge>
                          {inc.raportatANMDM && (
                            <Badge variant="outline" className="text-xs text-green-700 border-green-400">
                              Raportat ANMDM
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Data: {new Date(inc.dataIncident).toLocaleDateString("ro-RO")}
                          {inc.numarRaportANMDM && <> • Raport: {inc.numarRaportANMDM}</>}
                        </p>
                        <p className="text-sm">{inc.descriere}</p>
                        {inc.actiuneCorectiva && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Actiune corectiva:</span> {inc.actiuneCorectiva}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(inc.createdAt).toLocaleDateString("ro-RO")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddMentenantaDialog
        open={addMentenantaOpen}
        onOpenChange={setAddMentenantaOpen}
        dispozitivId={dm.id}
        onSuccess={(m) => setDm((prev) => prev ? { ...prev, mentenante: [m, ...(prev.mentenante ?? [])] } : prev)}
      />
      <AddIncidentDialog
        open={addIncidentOpen}
        onOpenChange={setAddIncidentOpen}
        dispozitivId={dm.id}
        onSuccess={(i) => setDm((prev) => prev ? { ...prev, incidente: [i, ...(prev.incidente ?? [])] } : prev)}
      />
    </div>
  );
}
