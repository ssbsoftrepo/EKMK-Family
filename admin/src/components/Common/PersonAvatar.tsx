import React, { useState } from 'react';

interface PersonAvatarProps {
  photoUrl?: string | null;
  name?: string;
  gender?: 'male' | 'female' | string;
  className?: string; // Container classes (e.g., "w-full h-full")
  imgClassName?: string;
  alt?: string;
  loading?: 'lazy' | 'eager';
}

/**
 * Modern, Minimalist Male Placeholder Avatar
 * Features a clean contemporary silhouette, sleek haircut, and natural soft-light studio background.
 */
export const ModernMalePlaceholder: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 100 125"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid slice"
    aria-label="Male avatar placeholder"
  >
    <defs>
      <linearGradient id="modernMaleBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F6F2EA" />
        <stop offset="100%" stopColor="#E6DDCF" />
      </linearGradient>
      <linearGradient id="modernMaleTorso" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="modernMaleSkin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#D5DCE5" />
        <stop offset="100%" stopColor="#BAC5D3" />
      </linearGradient>
      <linearGradient id="modernMaleHair" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
    </defs>

    {/* Modern soft neutral studio backdrop */}
    <rect width="100" height="125" fill="url(#modernMaleBg)" />

    {/* Ambient studio light glow */}
    <circle cx="50" cy="54" r="35" fill="#FFFFFF" fillOpacity="0.55" />

    {/* Modern Shoulders */}
    <path
      d="M17 125 C17 98 32 90 50 90 C68 90 83 98 83 125 Z"
      fill="url(#modernMaleTorso)"
    />

    {/* Neck */}
    <path d="M44 68 H56 V88 H44 Z" fill="url(#modernMaleSkin)" />

    {/* Clean Modern Crew / V-Neck collar notch */}
    <path d="M45 90 L50 97 L55 90 H45Z" fill="#F6F2EA" opacity="0.9" />

    {/* Head */}
    <ellipse cx="50" cy="52" rx="15.5" ry="17.5" fill="url(#modernMaleSkin)" />

    {/* Modern Short Styled Haircut */}
    <path
      d="M34.5 49 C33.5 36 40 28 50 28 C60 28 66.5 36 65.5 49 C63 42 57 38.5 50 38.5 C43 38.5 37 42 34.5 49 Z"
      fill="url(#modernMaleHair)"
    />

    {/* Clean side hair fades */}
    <path d="M34.5 48 L34.5 54 L37 51 Z" fill="url(#modernMaleHair)" />
    <path d="M65.5 48 L65.5 54 L63 51 Z" fill="url(#modernMaleHair)" />
  </svg>
);

/**
 * Modern, Minimalist Female Placeholder Avatar
 * Features a clean contemporary silhouette, sleek shoulder-length bob, and natural soft-light studio background.
 */
export const ModernFemalePlaceholder: React.FC<{ className?: string }> = ({ className = 'w-full h-full' }) => (
  <svg
    viewBox="0 0 100 125"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid slice"
    aria-label="Female avatar placeholder"
  >
    <defs>
      <linearGradient id="modernFemaleBg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F8F3ED" />
        <stop offset="100%" stopColor="#E9DFD4" />
      </linearGradient>
      <linearGradient id="modernFemaleTorso" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#5E4E54" />
        <stop offset="100%" stopColor="#45373C" />
      </linearGradient>
      <linearGradient id="modernFemaleSkin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#DED3D6" />
        <stop offset="100%" stopColor="#C6B5B9" />
      </linearGradient>
      <linearGradient id="modernFemaleHair" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#302428" />
        <stop offset="100%" stopColor="#1C1417" />
      </linearGradient>
    </defs>

    {/* Modern soft neutral studio backdrop */}
    <rect width="100" height="125" fill="url(#modernFemaleBg)" />

    {/* Ambient studio light glow */}
    <circle cx="50" cy="54" r="35" fill="#FFFFFF" fillOpacity="0.55" />

    {/* Soft hair contour behind shoulders */}
    <path
      d="M31 54 C30 70 33 84 36 92 C38 92 39 87 39 80 C36 72 35 62 35 54 Z"
      fill="url(#modernFemaleHair)"
    />
    <path
      d="M69 54 C70 70 67 84 64 92 C62 92 61 87 61 80 C64 72 65 62 65 54 Z"
      fill="url(#modernFemaleHair)"
    />

    {/* Graceful Modern Shoulders */}
    <path
      d="M19 125 C19 99 33 91 50 91 C67 91 81 99 81 125 Z"
      fill="url(#modernFemaleTorso)"
    />

    {/* Graceful Neck */}
    <path d="M44 68 H56 V89 H44 Z" fill="url(#modernFemaleSkin)" />

    {/* Modern Curved Scoop Neckline */}
    <path d="M43 91 C43 97 57 97 57 91 Z" fill="#F8F3ED" opacity="0.9" />

    {/* Head */}
    <ellipse cx="50" cy="52" rx="14.5" ry="17" fill="url(#modernFemaleSkin)" />

    {/* Modern Sleek Hairstyle (contemporary framed shoulder bob) */}
    <path
      d="M32.5 50 C31.5 35 38 27.5 50 27.5 C62 27.5 68.5 35 67.5 50 C65 42.5 58 37.5 50 37.5 C42 37.5 35 42.5 32.5 50 Z"
      fill="url(#modernFemaleHair)"
    />
    <path
      d="M32.5 48 C32.5 60 35 71 37.5 76 C38.5 76 39 72 38.5 67 C36 61 35 54 35 48 Z"
      fill="url(#modernFemaleHair)"
    />
    <path
      d="M67.5 48 C67.5 60 65 71 62.5 76 C61.5 76 61 72 61.5 67 C64 61 65 54 65 48 Z"
      fill="url(#modernFemaleHair)"
    />
  </svg>
);

// Aliases for backward compatibility
export const MaleLogo = ModernMalePlaceholder;
export const FemaleLogo = ModernFemalePlaceholder;

export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  photoUrl,
  name,
  gender,
  className = 'w-full h-full',
  imgClassName = 'w-full h-full object-cover object-top',
  alt,
  loading = 'lazy',
}) => {
  const [hasError, setHasError] = useState(false);
  const isFemale = gender?.toLowerCase() === 'female';

  if (photoUrl && !hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img
          src={photoUrl}
          alt={alt || name || 'Family member'}
          className={imgClassName}
          loading={loading}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-heritage-cream/40 ${className}`}>
      {isFemale ? (
        <ModernFemalePlaceholder className="w-full h-full" />
      ) : (
        <ModernMalePlaceholder className="w-full h-full" />
      )}
      <span className="sr-only">{isFemale ? 'Female' : 'Male'} placeholder</span>
    </div>
  );
};
