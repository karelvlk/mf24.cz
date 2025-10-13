import { useParams } from "react-router-dom";
import { getNewsForCategory, getMainArticle, getEmptyFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";
import NewsSidebar from "@/components/NewsSidebar";
import ArticleRating from "@/components/ArticleRating";

const categoryTitles = {
  'zdravi': 'Zdraví',
  'ceska-politika': 'Z domova',
  'priroda': 'Příroda',
  'zahranicni-politika': 'Ze světa',
  'pohady': 'Pohádky'
};

const categoryAccentColors = {
  'zdravi': 'hsl(var(--category-health))',
  'priroda': 'hsl(var(--category-nature))',
  'ceska-politika': 'hsl(var(--category-politics))',
  'zahranicni-politika': 'hsl(var(--category-world))',
  'pohady': 'hsl(var(--category-fairy-tales))'
};

const validCategories = ['zdravi', 'priroda', 'ceska-politika', 'zahranicni-politika', 'pohady'];

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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
          <div className="flex flex-col gap-12">
            <section>
              <div className="mb-8">
                <NewsCard article={mainArticle} variant="main" />
              </div>
              {category !== 'pohady' && <ArticleRating
                articleId={mainArticle?.id}
                onRatingChange={(rating) => console.log(`${category} main article rated:`, rating)}
              />}
            </section>

            {categoryArticles.length > 0 && (
              <section className="border-t border-separator pt-8">
                <div className="space-y-6">
                  {categoryArticles.slice(0, 3).map((article) => (
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