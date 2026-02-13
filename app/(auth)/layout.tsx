export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Auth pages don't show the sidebar
  return <div className="min-h-screen">{children}</div>;
}
