import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { MijlocFix } from "shared";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StareBadge } from "@/components/mijloace-fixe/StareBadge";
import { ArrowLeft, Pencil } from "lucide-react";

export function MijlocFixDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mijlocFix, setMijlocFix] = useState<MijlocFix | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    setIsLoading(true);
    api.get<MijlocFix>(`/mijloace-fixe/${id}`).then((res) => {
      if (res.success && res.data) {
        setMijlocFix(res.data);
      } else {
        setError(res.message || "Eroare la incarcarea datelor");
      }
      setIsLoading(false);
    });
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Se incarca...</div>
      </div>
    );
  }

  if (error || !mijlocFix) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-destructive">{error || "Mijlocul fix nu a fost gasit"}</div>
        <Button variant="outline" onClick={() => navigate("/mijloace-fixe")}>
          Inapoi la lista
        </Button>
      </div>
    );
  }

  const formatCurrency = (value: string) => {
    return parseFloat(value).toLocaleString("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RON";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ro-RO");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/mijloace-fixe")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{mijlocFix.denumire}</h1>
              <StareBadge stare={mijlocFix.stare} />
            </div>
            <p className="text-muted-foreground font-mono">{mijlocFix.numarInventar}</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/mijloace-fixe/${id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editeaza
        </Button>
      </div>

      {/* Section: Date Identificare */}
      <Card>
        <CardHeader>
          <CardTitle>Date Identificare</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField label="Numar Inventar" value={mijlocFix.numarInventar} mono />
          <DetailField label="Denumire" value={mijlocFix.denumire} />
          {mijlocFix.descriere && (
            <div className="md:col-span-2">
              <DetailField label="Descriere" value={mijlocFix.descriere} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section: Clasificare HG 2139/2004 */}
      <Card>
        <CardHeader>
          <CardTitle>Clasificare HG 2139/2004</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField label="Cod Clasificare" value={mijlocFix.clasificareCod} mono />
          <DetailField label="Grupa" value={mijlocFix.clasificare?.grupa || "-"} />
          {mijlocFix.clasificare && (
            <>
              <div className="md:col-span-2">
                <DetailField label="Denumire Clasificare" value={mijlocFix.clasificare.denumire} />
              </div>
              <DetailField
                label="Durata Normala (HG 2139)"
                value={`${mijlocFix.clasificare.durataNormalaMin} - ${mijlocFix.clasificare.durataNormalaMax} ani`}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Section: Document Intrare */}
      <Card>
        <CardHeader>
          <CardTitle>Document Intrare</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField label="Tip Document" value={mijlocFix.tipDocument?.denumire || "-"} />
          <DetailField label="Numar Document" value={mijlocFix.documentAchizitie || "-"} />
          <DetailField label="Furnizor" value={mijlocFix.furnizor || "-"} />
        </CardContent>
      </Card>

      {/* Section: Date Contabile */}
      <Card>
        <CardHeader>
          <CardTitle>Date Contabile</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField
            label="Gestiune"
            value={mijlocFix.gestiune ? `${mijlocFix.gestiune.cod} - ${mijlocFix.gestiune.denumire}` : "-"}
          />
          <DetailField
            label="Loc Folosinta"
            value={mijlocFix.locFolosinta?.denumire || "-"}
          />
          <DetailField
            label="Cont"
            value={mijlocFix.cont ? `${mijlocFix.cont.simbol} - ${mijlocFix.cont.denumire}` : "-"}
          />
          <DetailField
            label="Sursa Finantare"
            value={mijlocFix.sursaFinantare?.denumire || "-"}
          />
        </CardContent>
      </Card>

      {/* Section: Amortizare */}
      <Card>
        <CardHeader>
          <CardTitle>Amortizare</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailField label="Valoare Inventar" value={formatCurrency(mijlocFix.valoareInventar)} />
          <DetailField label="Valoare Amortizata" value={formatCurrency(mijlocFix.valoareAmortizata)} />
          <DetailField label="Valoare Ramasa" value={formatCurrency(mijlocFix.valoareRamasa)} />
          <DetailField label="Data Achizitie" value={formatDate(mijlocFix.dataAchizitie)} />
          <DetailField label="Durata Normala" value={`${mijlocFix.durataNormala} luni`} />
          <DetailField
            label="Amortizabil"
            value={mijlocFix.eAmortizabil === false ? "Nu" : "Da"}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Helper component for consistent field display
function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={`text-sm font-medium ${mono ? "font-mono" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
