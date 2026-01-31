import { NewsArticle } from "@/data/news";
import { calculateReadingTime, cn, formatReadingTimeLabel } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'main' | 'secondary' | 'compact' | 'minimal';
  disabled?: boolean;
  muted?: boolean;
  orderLabel?: string;
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

export default function NewsCard({
  article,
  variant = 'secondary',
  disabled = false,
  muted = false,
  orderLabel,
}: NewsCardProps) {
  const navigate = useNavigate();
  const readingTimeLabel = formatReadingTimeLabel(
    calculateReadingTime(article.perex)
  );
  const contextBadges = [
    article.dezinformative ? { id: 'dezinformace', label: 'Dezinformace', className: 'badge badge-critical' } : null,
    article.manipulative ? { id: 'manipulace', label: 'Manipulativní tón', className: 'badge badge-warning' } : null,
    !article.dezinformative && !article.manipulative
      ? { id: 'verified', label: 'Ověřeno redakcí', className: 'badge badge-neutral' }
      : null
  ].filter(Boolean) as { id: string; label: string; className: string }[];

  const handleClick = () => {
    if (disabled) {
      return;
    }

    navigate(`/article/${article.id}`);
  };

  if (variant === 'minimal') {
    return (
      <article
        data-article-id={article.id}
        data-card-variant="minimal"
        data-card-interactive={!disabled}
        data-card-muted={muted}
        onClick={handleClick}
        aria-disabled={disabled}
        className={cn(
          "py-5 border-b border-separator last:border-b-0 transition-colors",
          disabled ? "cursor-not-allowed pointer-events-none" : "cursor-pointer hover:bg-muted/40",
          muted && "opacity-20 grayscale blur-sm select-none"
        )}
      >
        <h3 className="headline-secondary mb-2">
          {article.title}
        </h3>
        <p className="body-text text-sm text-muted-foreground line-clamp-1">
          {article.perex}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3 meta-text text-xs text-muted-foreground">
          <span>{article.published}</span>
          <span className="mx-1">•</span>
          <span>{readingTimeLabel}</span>
          <span className="mx-1">•</span>
          <span>{article.author}</span>
        </div>
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
        <div className="flex flex-wrap items-center gap-2 mt-6 meta-text text-sm">
          <span>{article.published}</span>
          <span className="mx-1">•</span>
          <span>{readingTimeLabel}</span>
          <span className="mx-1">•</span>
          <span>{article.author}</span>
        </div>
        {contextBadges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {contextBadges.map((badge) => (
              <span key={badge.id} className={badge.className}>
                {badge.label}
              </span>
            ))}
          </div>
        )}
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
        <span>{readingTimeLabel}</span>
        <span className="mx-2">•</span>
        <span>{article.author}</span>
      </div>
      {contextBadges.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {contextBadges.map((badge) => (
            <span key={badge.id} className={badge.className}>
              {badge.label}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
