'use client';

interface NotificationContentProps {
  title: string;
  body: string;
  tags?: string[];
}

export function NotificationContent({ title, body, tags }: NotificationContentProps) {
  return (
    <>
      <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-1">
        {title}
      </h4>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {body}
      </p>
      {tags && tags.length > 0 && (
        <div className="flex gap-1 flex-wrap mb-3">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-xs text-gray-500">+{tags.length - 2}</span>
          )}
        </div>
      )}
    </>
  );
}
