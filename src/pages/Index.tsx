import { newsData, getEmptyFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";
import ArticleRating from "@/components/ArticleRating";

const Index = () => {
  const mainArticles = [
    newsData['zahranicni-politika'][0],
    newsData['ceska-politika'][0],
    newsData['zdravi'][0],
    newsData['priroda'][0]
  ].filter(Boolean);

  const emptyFillers = getEmptyFillerArticles();

  console.log('emptyFillers', emptyFillers)

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <section>
            <div className="mb-8">
              <NewsCard article={mainArticles[0]} variant="main" />
            </div>
            <ArticleRating
              articleId={mainArticles[0]?.id}
              onRatingChange={(rating) => console.log('Main article rated:', rating)}
            />
          </section>
          
          <section className="border-t border-separator pt-8 mt-12">
            <div className="space-y-6">
              {[...emptyFillers.slice(0, 3)].map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Index;
