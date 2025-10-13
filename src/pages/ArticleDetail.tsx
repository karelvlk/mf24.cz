import { useParams, useNavigate } from "react-router-dom";
import { newsData, emptyFillerArticles } from "@/data/news";
import { ArrowLeft } from "lucide-react";
import ArticleRating from "@/components/ArticleRating";

const categoryLabels = {
  'zdravi': 'ZDRAVÍ',
  'priroda': 'PŘÍRODA',
  'ceska-politika': 'Z DOMOVA',
  'zahranicni-politika': 'ZE SVĚTA',
  'pohady': 'POHÁDKY'
};

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Find article in all categories
  const allArticles = [
    ...Object.values(newsData).flat(),
    ...emptyFillerArticles
  ];
  
  const article = allArticles.find(a => a.id === id);

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft size={16} />
              Zpět
            </button>
            <h1 className="headline-primary text-center">Článek nenalezen</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Zpět
          </button>

          <article className="bg-white">
            <div className="mb-4">
              <span className="category-badge">
                {categoryLabels[article.category]}
              </span>
            </div>
            
            <h1 className="headline-primary mb-6">
              {article.title}
            </h1>
            
            <div className="meta-text text-sm mb-8">
              <span>{article.published}</span>
              <span className="mx-2">•</span>
              <span>{article.author}</span>
            </div>
            
            <div className="body-text text-lg leading-relaxed mb-12">
              {article.perex}
            </div>

            {article.category !== 'pohady' && (
              <div className="border-t border-separator pt-8">
                <ArticleRating
                  articleId={article.id}
                  onRatingChange={(rating) => console.log('Article rated:', rating)}
                />
              </div>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
