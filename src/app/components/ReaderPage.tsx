"use client";

interface ReaderPageProps {
  content: string;
}

export function ReaderPage({ content }: ReaderPageProps) {
  return (
    <div
      className="font-sanskrit text-[20px] leading-[2] text-ink-800 whitespace-pre-wrap select-text"
    >
      {content}
    </div>
  );
}
