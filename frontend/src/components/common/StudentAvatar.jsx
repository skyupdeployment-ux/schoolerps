import { useState } from 'react';

// Photos are stored as "/uploads/students/xxx.jpg". In dev, Vite proxies /uploads to the backend.
// If the frontend is hosted separately in production, set VITE_ASSET_URL to the backend origin.
export const assetUrl = (p) =>
  !p ? null : /^https?:\/\//.test(p) ? p : `${import.meta.env.VITE_ASSET_URL || ''}${p}`;

// Works for students AND teachers:  <StudentAvatar student={{ firstName: teacher.name, photo: teacher.photo }} />
// fallbackClassName lets you match a colour, e.g. "bg-green-100 text-green-700"
export default function StudentAvatar({ student, size = 40, fallbackClassName = 'bg-blue-100 text-blue-700' }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const src = assetUrl(student?.photo);
  const dim = { width: size, height: size };

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt={`${student?.firstName || 'Photo'}`}
        style={dim}
        className="rounded-full object-cover bg-gray-100 shrink-0"
        onError={() => setFailedSrc(src)}
      />
    );
  }

  // Fallback: first letter of the name
  return (
    <div
      style={{ ...dim, fontSize: Math.round(size * 0.4) }}
      className={`rounded-full font-bold flex items-center justify-center shrink-0 ${fallbackClassName}`}
    >
      {student?.firstName?.[0]?.toUpperCase() || '?'}
    </div>
  );
}