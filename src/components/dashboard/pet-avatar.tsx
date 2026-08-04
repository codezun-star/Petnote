import { PawPrint } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type PetAvatarProps = {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
};

export function PetAvatar({ name, photoUrl, size = 48, className }: PetAvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-primary-soft",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt={`Photo of ${name}`}
          fill
          sizes={`${size}px`}
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-primary">
          <PawPrint style={{ width: size * 0.45, height: size * 0.45 }} />
        </div>
      )}
    </div>
  );
}
