import { useParams } from "react-router-dom";
import { getNewsForCategory } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";

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

  const categoryArticles = getNewsForCategory(category);
  const categoryTitle = categoryTitles[category as keyof typeof categoryTitles];

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="headline-primary mb-8">{categoryTitle}</h2>
          <div>
            {categoryArticles.map((article) => (
              <NewsCard key={article.id} article={article} variant="minimal" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}