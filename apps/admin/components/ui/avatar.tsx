import Image from "next/image";

type AvatarProps = {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function Avatar({
  src,
  alt,
  size = "md",
  className = "",
}: AvatarProps) {
  const sizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  const initials = alt
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/20 bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.15)] ${sizes[size]} ${className}`}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <span className="text-[40%] font-bold text-text-muted">{initials}</span>
      )}
    </div>
  );
}
