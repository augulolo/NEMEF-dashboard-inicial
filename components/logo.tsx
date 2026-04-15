export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/nemef-logo.svg" alt="NEMEF" className={className} />
  );
}
