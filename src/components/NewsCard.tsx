import { NewsArticle } from "@/data/news";

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'main' | 'secondary' | 'compact';
}

const categoryColors = {
  'zdravi': 'bg-category-health',
  'priroda': 'bg-category-nature',
  'ceska-politika': 'bg-category-politics',
  'zahranicni-politika': 'bg-category-world'
};

const categoryLabels = {
  'zdravi': 'ZDRAVÍ',
  'priroda': 'PŘÍRODA',
  'ceska-politika': 'ČESKÁ POLITIKA',
  'zahranicni-politika': 'ZAHRANIČNÍ POLITIKA'
};

export default function NewsCard({ article, variant = 'secondary' }: NewsCardProps) {
  if (variant === 'main') {
    return (
      <article className="bg-card rounded-lg overflow-hidden">
        {article.image && (
          <div className="aspect-video bg-gray-200 relative">
            <img 
              src={article.image} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
            {article.isBreaking && (
              <div className="absolute top-3 left-3">
                <span className="breaking-badge">BREAKING</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3">
              <span className={`category-badge text-white ${categoryColors[article.category]}`}>
                {categoryLabels[article.category]}
              </span>
            </div>
          </div>
        )}
        <div className="p-6">
          <h1 className="headline-primary mb-4">
            {article.title}
          </h1>
          <p className="body-text text-lg leading-relaxed mb-4">
            {article.perex}
          </p>
          <div className="flex items-center justify-between meta-text">
            <span>{article.author}</span>
            <span>{article.published}</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="flex space-x-3 py-3 border-b border-separator last:border-b-0">
        <div className="flex-1">
          <h3 className="headline-tertiary mb-1 line-clamp-2">
            {article.title}
          </h3>
          <div className="flex items-center space-x-2 meta-text">
            <span className={`category-badge text-white text-xs ${categoryColors[article.category]}`}>
              {categoryLabels[article.category]}
            </span>
            <span>{article.published}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-card border border-separator rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {article.image && (
        <div className="aspect-video bg-gray-200 relative">
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          {article.isBreaking && (
            <div className="absolute top-2 left-2">
              <span className="breaking-badge text-xs">BREAKING</span>
            </div>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <span className={`category-badge text-white ${categoryColors[article.category]}`}>
            {categoryLabels[article.category]}
          </span>
          <span className="meta-text">{article.published}</span>
        </div>
        <h2 className="headline-secondary mb-2 line-clamp-3">
          {article.title}
        </h2>
        <p className="body-text text-sm line-clamp-3 mb-3">
          {article.perex}
        </p>
        <div className="meta-text">
          {article.author}
        </div>
      </div>
    </article>
  );
}