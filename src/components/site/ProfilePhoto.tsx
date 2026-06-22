import { useSignedPhotoUrl } from "@/hooks/useSignedPhotoUrl";

type ProfilePhotoProps = {
  path: string | null | undefined;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallbackInitial?: string;
};

export function ProfilePhoto({
  path,
  alt,
  className,
  fallbackClassName,
  fallbackInitial,
}: ProfilePhotoProps) {
  const url = useSignedPhotoUrl(path ?? null);

  if (!path) {
    return (
      <div className={fallbackClassName ?? className}>
        {fallbackInitial && (
          <span className="font-serif text-4xl text-ink/20">{fallbackInitial}</span>
        )}
      </div>
    );
  }

  if (!url) {
    return <div className={fallbackClassName ?? className} aria-hidden />;
  }

  return <img src={url} alt={alt} className={className} />;
}
