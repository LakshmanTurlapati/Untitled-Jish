"use client";

interface DueCountBadgeProps {
  count: number;
}

export function DueCountBadge({ count }: DueCountBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="rounded-full bg-red-500 text-white text-sm font-bold min-w-[20px] h-5 flex items-center justify-center px-1">
      {count}
    </span>
  );
}
