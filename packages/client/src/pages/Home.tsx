export function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">MiFix - Evidenta Mijloacelor Fixe</h1>
      <p className="text-muted-foreground">
        Aplicatie pentru gestiunea mijloacelor fixe si calculul amortizarii.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Nomenclatoare</h2>
          <p className="text-sm text-muted-foreground">
            Administreaza gestiunile, sursele de finantare, locurile de folosinta si planul de conturi.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Mijloace Fixe</h2>
          <p className="text-sm text-muted-foreground">
            Inregistreaza si gestioneaza mijloacele fixe ale institutiei.
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="font-semibold">Amortizare</h2>
          <p className="text-sm text-muted-foreground">
            Calculeaza amortizarea lunara pentru toate mijloacele fixe active.
          </p>
        </div>
      </div>
    </div>
  );
}
