import { Link, useLocation } from "react-router-dom";
import { useExperimentMode } from "@/context/ExperimentModeContext";
import { cn } from "@/lib/utils";

const categories = [
  { id: 'ceska-politika', label: 'Z domova', path: '/ceska-politika' },
  { id: 'zahranicni-politika', label: 'Ze světa', path: '/zahranicni-politika' },
  { id: 'zdravi', label: 'Zdraví', path: '/zdravi' },
  { id: 'priroda', label: 'Příroda', path: '/priroda' },
  { id: 'pohady', label: 'Pohádky', path: '/pohady' },
];

export default function NewsHeader() {
  const location = useLocation();
  const { isActive: experimentActive } = useExperimentMode();
  const currentTime = new Date().toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-white border-b border-separator">
      {/* Main header */}
      <div className="border-b border-separator">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
              ZPRAVY24.cz
            </Link>
            <div className="text-xs text-meta-text">
              Nezávislé zpravodajství
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      {!location.pathname.startsWith("/article") && (
        <nav>
          <div className="container mx-auto px-4">
            <div className="flex space-x-6">
              <Link
                to="/"
                className={`py-3 text-sm transition-colors ${
                  location.pathname === '/'
                    ? 'text-primary font-medium'
                    : 'text-foreground hover:text-primary'
                }`}
              >
                Domov
              </Link>
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={category.path}
                  aria-disabled={experimentActive}
                  tabIndex={experimentActive ? -1 : 0}
                  onClick={experimentActive ? (event) => event.preventDefault() : undefined}
                  className={cn(
                    "py-3 text-sm transition-colors",
                    location.pathname === category.path
                      ? 'text-primary font-medium'
                      : 'text-foreground hover:text-primary',
                    experimentActive && "cursor-not-allowed pointer-events-none text-muted-foreground/70 hover:text-muted-foreground/70"
                  )}
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
