import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/matches", label: "Partidos" },
  { href: "/admin/players", label: "Jugadores" },
  { href: "/admin/tournaments", label: "Torneos" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header con gradiente Deep Navy → Negro */}
      <div className="bg-header-gradient rounded-xl px-6 py-5 mb-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-xl font-bold tracking-tight">Panel de Administración</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white/70 hover:text-accent transition-colors font-medium"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
