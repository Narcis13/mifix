import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransferContDialog } from "@/components/operatiuni/TransferContDialog";
import { TransferGestiuneMasaDialog } from "@/components/operatiuni/TransferGestiuneMasaDialog";
import { TransferLocMasaDialog } from "@/components/operatiuni/TransferLocMasaDialog";
import { ArrowRightLeft, BookOpenText, MapPin } from "lucide-react";

export function OperatiuniMasaPage() {
  const [transferContOpen, setTransferContOpen] = useState(false);
  const [transferGestiuneOpen, setTransferGestiuneOpen] = useState(false);
  const [transferLocOpen, setTransferLocOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Operatiuni in Masa</h1>
        <p className="text-muted-foreground">
          Transferuri de grup pentru mijloace fixe - mutare intre conturi, gestiuni sau locuri de folosinta.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpenText className="h-5 w-5" />
              Transfer Cont
            </CardTitle>
            <CardDescription>
              Muta mijloacele fixe de la un cont contabil la altul.
              Echivalentul legacy: MOD_CONT.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setTransferContOpen(true)} className="w-full">
              Deschide Transfer Cont
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Transfer Gestiune
            </CardTitle>
            <CardDescription>
              Muta mijloacele fixe dintr-o gestiune in alta.
              Locurile de folosinta se reseteaza. Echivalentul legacy: MOD_GEST.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setTransferGestiuneOpen(true)} className="w-full">
              Deschide Transfer Gestiune
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Transfer Loc Folosinta
            </CardTitle>
            <CardDescription>
              Muta mijloacele fixe dintr-un loc de folosinta in altul,
              in cadrul aceleiasi gestiuni. Echivalentul legacy: MOD_DISP.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setTransferLocOpen(true)} className="w-full">
              Deschide Transfer Loc
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <TransferContDialog
        open={transferContOpen}
        onOpenChange={setTransferContOpen}
        onSuccess={() => {}}
      />
      <TransferGestiuneMasaDialog
        open={transferGestiuneOpen}
        onOpenChange={setTransferGestiuneOpen}
        onSuccess={() => {}}
      />
      <TransferLocMasaDialog
        open={transferLocOpen}
        onOpenChange={setTransferLocOpen}
        onSuccess={() => {}}
      />
    </div>
  );
}
