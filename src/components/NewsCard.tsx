import { NewsArticle } from "@/data/news";
import { useNavigate } from "react-router-dom";

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'main' | 'secondary' | 'compact' | 'minimal';
}

const categoryColors = {
  'zdravi': 'bg-category-health',
  'priroda': 'bg-category-nature',
  'ceska-politika': 'bg-category-politics',
  'zahranicni-politika': 'bg-category-world',
  'pohady': 'bg-category-fairyTales'
};

const categoryLabels = {
  'zdravi': 'ZDRAVÍ',
  'priroda': 'PŘÍRODA',
  'ceska-politika': 'Z DOMOVA',
  'zahranicni-politika': 'ZE SVĚTA',
  'pohady': 'POHÁDKY'
};

export default function NewsCard({ article, variant = 'secondary' }: NewsCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/article/${article.id}`);
  };

  if (variant === 'minimal') {
    return (
      <article 
        onClick={handleClick}
        className="py-4 border-b border-separator last:border-b-0 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <h3 className="headline-secondary mb-2">
          {article.title}
        </h3>
        <p className="body-text text-sm text-muted-foreground">
          {article.perex}
        </p>
      </article>
    );
  }
  if (variant === 'main') {
    return (
      <article className="bg-white">
        <div className="mb-4">
          <span className="category-badge">
            {categoryLabels[article.category]}
          </span>
        </div>
        <h1 className="headline-primary mb-6">
          {article.title}
        </h1>
        <p className="body-text text-lg leading-relaxed">
          {article.perex}
        </p>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="py-3 border-b border-separator last:border-b-0">
        <h3 className="headline-tertiary mb-2 hover:text-primary cursor-pointer transition-colors">
          {article.title}
        </h3>
        <div className="flex items-center space-x-2 meta-text text-xs">
          <span>{article.published}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white pb-4 mb-4 border-b border-separator last:border-b-0">
      <div className="mb-2">
        <span className="category-badge text-xs">
          {categoryLabels[article.category]}
        </span>
      </div>
      <h2 className="headline-secondary mb-3 hover:text-primary cursor-pointer transition-colors">
        {article.title}
      </h2>
      <p className="body-text leading-relaxed mb-2">
        {article.perex}
      </p>
      <div className="meta-text text-xs">
        <span>{article.published}</span>
        <span className="mx-2">•</span>
        <span>4 min čtení</span>
      </div>
    </article>
  );
}