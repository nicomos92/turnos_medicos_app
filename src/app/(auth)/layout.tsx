export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg card-surface rounded-3xl p-8 md:p-10">
        {children}
      </div>
    </div>
  );
}
