import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, BookOpen, Calculator, BarChart3, ClipboardList } from "lucide-react";
import { FisaMijlocFixReport } from "@/components/rapoarte/FisaMijlocFix";
import { BalantaVerificareReport } from "@/components/rapoarte/BalantaVerificare";
import { BalantaAnaliticaReport } from "@/components/rapoarte/BalantaAnalitica";
import { JurnalActeReport } from "@/components/rapoarte/JurnalActe";
import { SituatieAmortizareReport } from "@/components/rapoarte/SituatieAmortizare";
import { CentralizatorActeReport } from "@/components/rapoarte/CentralizatorActe";

const reports = [
  {
    path: "/rapoarte/fisa",
    title: "Fisa Mijlocului Fix",
    description: "Raport complet pentru un mijloc fix, incluzand toate detaliile, tranzactiile si istoricul amortizarii",
    icon: FileText,
  },
  {
    path: "/rapoarte/balanta",
    title: "Balanta de Verificare",
    description: "Situatie cantitativ-valorica pe gestiuni, cu valori de inventar, amortizate si ramase",
    icon: FileSpreadsheet,
  },
  {
    path: "/rapoarte/jurnal",
    title: "Jurnal Acte Operate",
    description: "Istoric operatiuni pe perioada selectata, cu filtrare dupa gestiune si tip operatie",
    icon: BookOpen,
  },
  {
    path: "/rapoarte/amortizare",
    title: "Situatie Amortizare",
    description: "Amortizari calculate pe luna, cu totaluri si filtrare dupa gestiune",
    icon: Calculator,
  },
  {
    path: "/rapoarte/balanta-analitica",
    title: "Balanta Analitica",
    description: "Balanta analitica pe obiect de inventar: sold initial, intrari, iesiri, sold final",
    icon: BarChart3,
  },
  {
    path: "/rapoarte/centralizator",
    title: "Centralizator Acte",
    description: "Situatie sintetica a documentelor operate pe perioada, cu totaluri debit/credit",
    icon: ClipboardList,
  },
];

export function RapoartePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Rapoarte
        </h1>
        <p className="text-muted-foreground">
          Genereaza si printeaza rapoarte contabile pentru mijloacele fixe
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.path} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <report.icon className="h-5 w-5 text-primary" />
                {report.title}
              </CardTitle>
              <CardDescription>{report.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={report.path}>
                <Button className="w-full">
                  Deschide Raport
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Report page wrappers
export function FisaMijlocFixPage() {
  return <FisaMijlocFixReport />;
}

export function BalantaVerificarePage() {
  return <BalantaVerificareReport />;
}

export function JurnalActePage() {
  return <JurnalActeReport />;
}

export function SituatieAmortizarePage() {
  return <SituatieAmortizareReport />;
}

export function BalantaAnaliticaPage() {
  return <BalantaAnaliticaReport />;
}

export function CentralizatorActePage() {
  return <CentralizatorActeReport />;
}
