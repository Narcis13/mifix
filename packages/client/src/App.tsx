import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "./lib/utils";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { useAuth } from "./components/auth/AuthContext";
import { Separator } from "./components/ui/separator";
import { useAppVersion } from "./hooks/useAppVersion";

const mainNavItems = [
  { path: "/", label: "Acasa" },
  { path: "/mijloace-fixe", label: "Mijloace Fixe" },
  { path: "/amortizare", label: "Amortizare" },
  { path: "/rapoarte", label: "Rapoarte" },
  { path: "/operatiuni-acte", label: "Operatiuni" },
  { path: "/operatiuni-masa", label: "Op. in Masa" },
  { path: "/verificare", label: "Verificare" },
];

const nomenclatoareItems = [
  { path: "/gestiuni", label: "Gestiuni" },
  { path: "/surse-finantare", label: "Surse Finantare" },
  { path: "/locuri", label: "Locuri Folosinta" },
  { path: "/conturi", label: "Plan Conturi" },
  { path: "/clasificari", label: "Clasificari" },
  { path: "/provenienta", label: "Provenienta" },
  { path: "/tipuri-stoc", label: "Tipuri Stoc" },
  { path: "/unitati-masura", label: "Unitati Masura" },
];

const dispozitiveMedicaleItems = [
  { path: "/dispozitive-medicale", label: "Registru DM" },
];

function NavLink({ path, label, location }: { path: string; label: string; location: ReturnType<typeof useLocation> }) {
  const isActive =
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  return (
    <Link
      to={path}
      className={cn(
        "block px-3 py-1.5 text-sm rounded-md transition-colors",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      {label}
    </Link>
  );
}

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { version } = useAppVersion();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-52 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/" className="inline-flex items-baseline gap-2 text-lg font-bold tracking-tight">
            <span>MiFix</span>
            <span className="text-xs font-medium tracking-normal text-muted-foreground">
              v{version}
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {mainNavItems.map((item) => (
            <NavLink key={item.path} {...item} location={location} />
          ))}

          <Separator className="my-2" />

          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Nomenclatoare
          </p>

          {nomenclatoareItems.map((item) => (
            <NavLink key={item.path} {...item} location={location} />
          ))}

          <Separator className="my-2" />

          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
            Dispozitive Medicale
          </p>

          {dispozitiveMedicaleItems.map((item) => (
            <NavLink key={item.path} {...item} location={location} />
          ))}
        </nav>

        {/* User / Logout */}
        <div className="border-t p-3">
          {user && (
            <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
              {user.username}
            </p>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={handleLogout}
          >
            Iesire
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto px-6 py-6">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
