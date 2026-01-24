import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, FileSpreadsheet, BookOpen, Calculator } from "lucide-react";

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

// Placeholder pages for routes - will be replaced in Task 3
export function FisaMijlocFixPage() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">In dezvoltare...</p>
    </div>
  );
}

export function BalantaVerificarePage() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">In dezvoltare...</p>
    </div>
  );
}

export function JurnalActePage() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">In dezvoltare...</p>
    </div>
  );
}

export function SituatieAmortizarePage() {
  return (
    <div className="flex items-center justify-center p-8">
      <p className="text-muted-foreground">In dezvoltare...</p>
    </div>
  );
}
