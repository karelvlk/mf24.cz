import { useParams } from "react-router-dom";
import { getNewsForCategory, getMainArticle, getFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";
import NewsSidebar from "@/components/NewsSidebar";

const categoryTitles = {
  'zdravi': 'Zdraví',
  'priroda': 'Příroda',
  'ceska-politika': 'Česká politika',
  'zahranicni-politika': 'Zahraniční politika'
};

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const mainArticle = getMainArticle(category || '');
  const categoryArticles = getNewsForCategory(category || '').slice(1);
  const fillerArticles = getFillerArticles(category).slice(0, 8);
  const categoryTitle = categoryTitles[category as keyof typeof categoryTitles] || 'Zprávy';

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
        <div className="mb-6">
          <h1 className="headline-primary text-primary mb-2">
            {categoryTitle.toUpperCase()}
          </h1>
          <div className="w-16 h-1 bg-secondary"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Main article */}
            <NewsCard article={mainArticle} variant="main" />

            {/* Secondary articles grid */}
            <section>
              <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2">
                DALŠÍ ZPRÁVY
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...categoryArticles, ...fillerArticles].slice(0, 6).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* More articles list */}
            <section>
              <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2">
                STARŠÍ ČLÁNKY
              </h2>
              <div className="space-y-4">
                {fillerArticles.slice(6).map((article) => (
                  <div key={article.id} className="flex space-x-4 py-4 border-b border-separator last:border-b-0">
                    <div className="flex-1">
                      <h3 className="headline-tertiary mb-2">
                        {article.title}
                      </h3>
                      <p className="body-text text-sm mb-2 line-clamp-2">
                        {article.perex}
                      </p>
                      <div className="meta-text flex items-center space-x-4">
                        <span>{article.author}</span>
                        <span>{article.published}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <NewsSidebar excludeCategory={category} />
        </div>
      </main>
    </div>
  );
}