export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-midnight/60 shadow-sm">{label}</div>;
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-2xl bg-[#fde1db] px-4 py-5 text-sm text-[#7a2417] shadow-sm">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 font-semibold underline">
          Try again
        </button>
      )}
    </div>
  );
}
