import { newsData, getFillerArticles } from "@/data/news";
import NewsHeader from "@/components/NewsHeader";
import NewsCard from "@/components/NewsCard";
import NewsSidebar from "@/components/NewsSidebar";

const Index = () => {
  // Get main articles from each category
  const mainArticles = [
    newsData['zahranicni-politika'][0],
    newsData['ceska-politika'][0],
    newsData['zdravi'][0],
    newsData['priroda'][0]
  ].filter(Boolean);

  const fillerArticles = getFillerArticles().slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <NewsHeader />
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
          {/* Main story section */}
          <section>
            <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2">
              HLAVNÍ ZPRÁVA DNE
            </h2>
            <NewsCard article={mainArticles[0]} variant="main" />
          </section>

            {/* Top stories grid */}
            <section>
              <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2">
                HLAVNÍ ZPRÁVY
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mainArticles.slice(1, 3).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* More news */}
            <section>
              <h2 className="headline-secondary mb-6 text-primary border-b border-separator pb-2">
                DALŠÍ ZPRÁVY
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[mainArticles[3], ...fillerArticles].slice(0, 6).map((article) => (
                  <NewsCard key={article.id} article={article} />
                ))}
              </div>
            </section>

            {/* News ticker */}
            <section>
              <h2 className="headline-secondary mb-4 text-primary border-b border-separator pb-2">
                RYCHLÉ ZPRÁVY
              </h2>
              <div className="space-y-3">
                {fillerArticles.slice(6).map((article) => (
                  <div key={article.id} className="flex items-start space-x-3 py-3 border-b border-separator last:border-b-0">
                    <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1">
                      <h3 className="headline-tertiary mb-1">
                        {article.title}
                      </h3>
                      <div className="meta-text flex items-center space-x-4">
                        <span>{article.published}</span>
                        <span>{article.author}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <NewsSidebar />
        </div>
      </main>
    </div>
  );
};

export default Index;
