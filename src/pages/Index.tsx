import { newsData, getEmptyFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";

const Index = () => {
  const allArticles = [
    ...newsData['zahranicni-politika'],
    ...newsData['ceska-politika'],
    ...newsData['zdravi'],
    ...newsData['priroda'],
    ...getEmptyFillerArticles()
  ];

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="headline-primary mb-8">Hlavní zprávy</h2>
          <div>
            {allArticles.map((article) => (
              <NewsCard key={article.id} article={article} variant="minimal" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
