export function Header() {
  return (
    <>
      <div className="h-1 bg-brand" />
      <header className="flex h-16 items-center bg-surface px-6 shadow-sm">
        <img src="/pharo_logo.svg" alt="Pharo" className="h-8 w-auto" />
      </header>
    </>
  );
}
