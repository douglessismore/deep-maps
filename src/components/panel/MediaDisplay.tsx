import { useState } from 'react';
import type { StoryMedia } from '../../types';

interface MediaDisplayProps {
  media: StoryMedia[];
}

export function MediaDisplay({ media }: MediaDisplayProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {media.map((item, i) => (
        <MediaItem key={i} item={item} />
      ))}
    </div>
  );
}

function MediaItem({ item }: { item: StoryMedia }) {
  const [error, setError] = useState(false);

  if (item.type === 'youtube') {
    const videoId = extractYouTubeId(item.url);
    if (!videoId) return null;
    return (
      <div className="shrink-0 w-full aspect-video rounded overflow-hidden bg-[var(--bg-primary)]">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={item.caption || 'Video'}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="shrink-0 w-full aspect-[3/2] rounded bg-[var(--bg-primary)] flex items-center justify-center text-[var(--text-muted)] text-xs font-mono">
        Image unavailable
      </div>
    );
  }

  return (
    <div className="shrink-0 w-full">
      <img
        src={item.url}
        alt={item.caption || ''}
        className="w-full rounded object-cover max-h-48"
        onError={() => setError(true)}
      />
      {item.caption && (
        <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1">{item.caption}</p>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}
