import { NewsArticle, getFillerArticles } from "@/data/news";
import NewsCard from "./NewsCard";

interface NewsSidebarProps {
  excludeCategory?: string;
}

export default function NewsSidebar({ excludeCategory }: NewsSidebarProps) {
  const sidebarArticles = getFillerArticles(excludeCategory).slice(0, 6);
  
  return (
    <aside className="space-y-6">
      {/* Most read section */}
      <div className="bg-card border border-separator rounded-lg p-4">
        <h2 className="headline-tertiary mb-4 text-primary">
          NEJČTENĚJŠÍ
        </h2>
        <div className="space-y-1">
          {sidebarArticles.slice(0, 5).map((article, index) => (
            <div key={article.id} className="flex items-start space-x-3 py-2">
              <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded text-sm font-bold flex items-center justify-center">
                {index + 1}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-medium leading-snug hover:text-primary cursor-pointer line-clamp-3">
                  {article.title}
                </h3>
                <span className="meta-text text-xs">{article.published}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Latest news */}
      <div className="bg-card border border-separator rounded-lg p-4">
        <h2 className="headline-tertiary mb-4 text-primary">
          POSLEDNÍ ZPRÁVY
        </h2>
        <div className="space-y-4">
          {sidebarArticles.slice(0, 4).map((article) => (
            <NewsCard key={article.id} article={article} variant="compact" />
          ))}
        </div>
      </div>

      {/* Weather widget */}
      <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg p-4">
        <h2 className="font-bold mb-2">POČASÍ</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">18°C</div>
            <div className="text-sm opacity-90">Praha</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Polojasno</div>
            <div className="text-xs opacity-90">Vítr: 12 km/h</div>
          </div>
        </div>
      </div>

      {/* Advertisement placeholder */}
      <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
        <div className="text-gray-500 text-sm">
          REKLAMA
        </div>
        <div className="text-xs text-gray-400 mt-1">
          300x250px
        </div>
      </div>
    </aside>
  );
}