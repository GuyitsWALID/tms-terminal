export default function ProfilePage() {
  return (
    <div className="ff-panel p-6">
      <h1 className="font-rajdhani text-3xl font-bold uppercase leading-none text-[var(--ink-primary)]">Profile</h1>
      <p className="mt-2 text-sm text-[var(--ink-muted)]">This is your profile page placeholder. Authentication actions will be wired next.</p>

      <div className="mt-5 flex flex-wrap gap-3">
        <button className="rounded-md border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--ink-primary)]">
          Login
        </button>
        <button className="rounded-md bg-[var(--brand-strong)] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
          Sign Up
        </button>
      </div>
    </div>
  );
}
