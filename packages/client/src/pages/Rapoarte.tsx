import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText, FileSpreadsheet, BookOpen, Calculator, BarChart3,
  ClipboardList, ClipboardCheck, FileSearch, Package, Timer,
  ClipboardPen, MapPin, Link2, List,
} from "lucide-react";
import { FisaMijlocFixReport } from "@/components/rapoarte/FisaMijlocFix";
import { BalantaVerificareReport } from "@/components/rapoarte/BalantaVerificare";
import { BalantaAnaliticaReport } from "@/components/rapoarte/BalantaAnalitica";
import { JurnalActeReport } from "@/components/rapoarte/JurnalActe";
import { SituatieAmortizareReport } from "@/components/rapoarte/SituatieAmortizare";
import { CentralizatorActeReport } from "@/components/rapoarte/CentralizatorActe";
import { ListaInventariereReport } from "@/components/rapoarte/ListaInventariere";
import { RaportActReport } from "@/components/rapoarte/RaportAct";
import { SituatieObiecteReport } from "@/components/rapoarte/SituatieObiecte";
import { ListaInventariereGoalaReport } from "@/components/rapoarte/ListaInventariereGoala";
import { LocuriObiecteReport } from "@/components/rapoarte/LocuriObiecte";
import { CorespMaterialContReport } from "@/components/rapoarte/CorespMaterialCont";
import { ListaMaterialeReport } from "@/components/rapoarte/ListaMateriale";

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
  {
    path: "/rapoarte/lista-inventariere",
    title: "Lista de Inventariere",
    description: "Generare lista de inventariere la o data specificata, cu valori scriptice si spatiu pentru inventar faptic",
    icon: ClipboardCheck,
  },
  {
    path: "/rapoarte/act",
    title: "Raport Act Operat",
    description: "Detalii complete pentru o operatiune specifica: toate tranzactiile cu conturi, gestiuni si valori",
    icon: FileSearch,
  },
  {
    path: "/rapoarte/situatie-obiecte",
    title: "Situatia Obiectelor",
    description: "Situatia curenta a tuturor obiectelor de inventar cu valori si procent de folosire",
    icon: Package,
  },
  {
    path: "/rapoarte/durata-depasita",
    title: "Obiecte cu Durata Depasita",
    description: "Obiecte de inventar cu procent de folosire >= 100% (termenul depasit)",
    icon: Timer,
  },
  {
    path: "/rapoarte/lista-inventariere-goala",
    title: "Lista Inventariere Goala",
    description: "Formular gol pentru inventar faptic - doar denumiri si numere de inventar",
    icon: ClipboardPen,
  },
  {
    path: "/rapoarte/locuri-obiecte",
    title: "Locuri cu Obiecte",
    description: "Situatia locurilor de dispunere unde se afla obiecte de inventar",
    icon: MapPin,
  },
  {
    path: "/rapoarte/corespondenta-material-cont",
    title: "Corespondenta Material-Cont",
    description: "Corespondenta intre obiectele de inventar si conturile contabile aferente",
    icon: Link2,
  },
  {
    path: "/rapoarte/lista-materiale",
    title: "Lista Materiale",
    description: "Catalogul materialelor cu denumiri, durate de folosinta si valori",
    icon: List,
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

export function ListaInventarierePage() {
  return <ListaInventariereReport />;
}

export function RaportActPage() {
  return <RaportActReport />;
}

export function SituatieObiectePage() {
  return <SituatieObiecteReport />;
}

export function DurataDepasitaPage() {
  return <SituatieObiecteReport durataDepasita />;
}

export function ListaInventariereGoalaPage() {
  return <ListaInventariereGoalaReport />;
}

export function LocuriObiectePage() {
  return <LocuriObiecteReport />;
}

export function CorespMaterialContPage() {
  return <CorespMaterialContReport />;
}

export function ListaMaterialePage() {
  return <ListaMaterialeReport />;
}
