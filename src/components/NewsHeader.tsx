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
    <header className="bg-white border-b border-separator">
      {/* Main header */}
      <div className="border-b border-separator">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-tight text-foreground">
              MF24.CZ
            </Link>
            <div className="text-xs text-meta-text">
              Nezávislé zpravodajství
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
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
                className={`py-3 text-sm transition-colors ${
                  location.pathname === category.path
                    ? 'text-primary font-medium'
                    : 'text-foreground hover:text-primary'
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