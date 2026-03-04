import Image from "next/image";
import { AdminNav } from "./admin-nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header con gradiente Deep Navy → Negro */}
      <div className="bg-header-gradient rounded-xl px-4 sm:px-6 py-4 sm:py-5 mb-6 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Image
            src="/Escudo Fernet 2023 PNG.png"
            alt="Escudo"
            width={32}
            height={32}
            className="object-contain drop-shadow shrink-0"
          />
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            Panel de Administración
          </h1>
        </div>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
