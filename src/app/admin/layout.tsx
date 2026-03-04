import Link from "next/link";
import { Separator } from "@/components/ui/separator";

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
      <div className="flex items-center gap-2 mb-2">
        <h1 className="text-xl font-bold">Panel de Administración</h1>
      </div>
      <nav className="flex items-center gap-4 text-sm mb-4">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <Separator className="mb-6" />
      {children}
    </div>
  );
}
