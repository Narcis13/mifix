import { Link, Outlet, useLocation } from "react-router-dom";
import { cn } from "./lib/utils";

const navItems = [
  { path: "/", label: "Acasa" },
  { path: "/mijloace-fixe", label: "Mijloace Fixe" },
  { path: "/gestiuni", label: "Gestiuni" },
  { path: "/surse-finantare", label: "Surse Finantare" },
  { path: "/locuri", label: "Locuri Folosinta" },
  { path: "/conturi", label: "Plan Conturi" },
  { path: "/clasificari", label: "Clasificari" },
];

function App() {
  const location = useLocation();

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
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default App;
