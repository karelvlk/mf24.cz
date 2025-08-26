import { Link, useLocation } from "react-router-dom";

const categories = [
  { id: 'ceska-politika', label: 'Z domova', path: '/ceska-politika' },
  { id: 'zahranicni-politika', label: 'Ze světa', path: '/zahranicni-politika' },
  { id: 'zdravi', label: 'Zdraví', path: '/zdravi' },
  { id: 'priroda', label: 'Příroda', path: '/priroda' },
  { id: 'pohady', label: 'Pohádky', path: '/pohady' },
];

export default function NewsHeader() {
  const location = useLocation();
  const currentTime = new Date().toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <header className="bg-header text-header-foreground">
      {/* Main header */}
      <div className="border-b border-separator">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              MF24.cz
            </Link>
            <div className="text-sm text-header-foreground/80">
              {currentTime}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b border-separator">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`py-3 text-sm font-medium border-b-2 transition-colors ${
                location.pathname === '/'
                  ? 'border-secondary text-secondary'
                  : 'border-transparent hover:text-secondary'
              }`}
            >
              HLAVNÍ ZPRÁVY
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={category.path}
                className={`py-3 text-sm font-medium border-b-2 transition-colors uppercase ${
                  location.pathname === category.path
                    ? 'border-secondary text-secondary'
                    : 'border-transparent hover:text-secondary'
                }`}
              >
                {category.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}