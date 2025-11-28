/**
 * Auth Layout
 * Minimal layout for authentication pages (login, reset password, etc.)
 * No navigation or complex UI elements
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}

