import { Link, useLocation } from "react-router-dom";

const categories = [
  { id: 'zdravi', label: 'Zdraví', path: '/zdravi' },
  { id: 'priroda', label: 'Příroda', path: '/priroda' },
  { id: 'ceska-politika', label: 'Česká politika', path: '/ceska-politika' },
  { id: 'zahranicni-politika', label: 'Zahraniční politika', path: '/zahranicni-politika' }
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
      {/* Breaking news ticker */}
      <div className="bg-breaking text-breaking-foreground">
        <div className="container mx-auto px-4 py-1">
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold uppercase tracking-wider">BREAKING</span>
            <div className="overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-sm">
                EU schvaluje nové sankce • Rekordní úhyn ryb v řece Moravě vyvolává obavy ekologů
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="border-b border-separator">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-2xl font-bold">
              ČeskéZprávy.cz
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