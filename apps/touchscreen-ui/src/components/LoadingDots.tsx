export function LoadingDots() {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-lime [animation-delay:-0.3s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-lime [animation-delay:-0.15s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-lime" />
    </div>
  );
}
