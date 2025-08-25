import { useParams } from "react-router-dom";
import { getNewsForCategory, getMainArticle, getEmptyFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";
import NewsSidebar from "@/components/NewsSidebar";

const categoryTitles = {
  'zdravi': 'Zdraví',
  'ceska-politika': 'Z domova',
  'priroda': 'Příroda',
  'zahranicni-politika': 'Ze světa'
};

const categoryAccentColors = {
  'zdravi': 'hsl(var(--category-health))',
  'priroda': 'hsl(var(--category-nature))',
  'ceska-politika': 'hsl(var(--category-politics))',
  'zahranicni-politika': 'hsl(var(--category-world))'
};

const validCategories = ['zdravi', 'priroda', 'ceska-politika', 'zahranicni-politika'];

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();

  // Check if category is valid
  if (!category || !validCategories.includes(category)) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader />
        <main className="container mx-auto px-4 py-8">
          <h1 className="headline-primary text-center">
            Kategorie nenalezena
          </h1>
        </main>
      </div>
    );
  }

  const mainArticle = getMainArticle(category);
  const categoryArticles = getNewsForCategory(category).slice(1);
  const categoryTitle = categoryTitles[category as keyof typeof categoryTitles];
  const accentColor = categoryAccentColors[category as keyof typeof categoryAccentColors];
  const emptyFillers = getEmptyFillerArticles();

  if (!mainArticle) {
    return (
      <div className="min-h-screen bg-background">
        <NewsHeader />
        <main className="container mx-auto px-4 py-8">
          <h1 className="headline-primary text-center">
            Kategorie nenalezena
          </h1>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col h-full max-h-screen gap-8">
            <section className="flex flex-col flex-1 min-h-0">
              <h2 className="headline-secondary mb-6 border-b border-separator pb-2 flex-shrink-0" style={{ color: accentColor }}>
                HLAVNÍ ZPRÁVA RUBRIKY
              </h2>
              <div className="flex-1">
                <NewsCard article={mainArticle} variant="main" />
              </div>
            </section>

            {/* Secondary articles */}
            {categoryArticles.length > 0 && (
              <section>
                <h2 className="headline-secondary mb-6 border-b border-separator pb-2" style={{ color: accentColor }}>
                  DALŠÍ ZPRÁVY RUBRIKY
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryArticles.slice(0, 2).map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              </section>
            )}


          </div>

          <NewsSidebar excludeCategory={category} />
        </div>
      </main>
    </div>
  );
}