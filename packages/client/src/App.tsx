import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "./lib/utils";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { useAuth } from "./components/auth/AuthContext";

const navItems = [
  { path: "/", label: "Acasa" },
  { path: "/mijloace-fixe", label: "Mijloace Fixe" },
  { path: "/amortizare", label: "Amortizare" },
  { path: "/rapoarte", label: "Rapoarte" },
  { path: "/gestiuni", label: "Gestiuni" },
  { path: "/surse-finantare", label: "Surse Finantare" },
  { path: "/locuri", label: "Locuri Folosinta" },
  { path: "/conturi", label: "Plan Conturi" },
  { path: "/clasificari", label: "Clasificari" },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex h-14 items-center justify-between">
            <Link to="/" className="text-lg font-semibold">
              MiFix
            </Link>
            <div className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(item.path);

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <div className="ml-4 flex items-center gap-2 border-l pl-4">
                {user && (
                  <span className="text-sm text-muted-foreground">
                    {user.username}
                  </span>
                )}
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Iesire
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Toast notifications */}
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
