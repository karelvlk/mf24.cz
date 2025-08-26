import { newsData, getEmptyFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";
import NewsSidebar from "@/components/NewsSidebar";
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

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col h-full max-h-screen gap-8">
          <section className="flex flex-col flex-1 min-h-0">
            <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2 flex-shrink-0">
              ZPRÁVA DNE
            </h2>
                        <div className="flex-1">
              <NewsCard article={mainArticles[0]} variant="main" />
            </div>
            <ArticleRating
              articleId={mainArticles[0]?.id}
              onRatingChange={(rating) => console.log('Main article rated:', rating)}
            />
          </section>
            <section>
              <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2">
                DNEŠNÍ ZPRÁVY
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...emptyFillers.slice(0, 2)].map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>
          </div>
          <NewsSidebar />
        </div>
      </main>
    </div>
  );
};

export default Index;
