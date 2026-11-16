/** Shown while the session or the profile is being checked. */
export function LoadingView({ label = 'Loading…' }: { label?: string }) {
  return (
    <main>
      <p className="message" role="status">
        {label}
      </p>
    </main>
  );
}
