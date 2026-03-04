import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 text-center gap-6">
      <Image
        src="/Escudo Fernet 2023 PNG.png"
        alt="Escudo"
        width={80}
        height={80}
        className="object-contain opacity-60"
      />
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
          <WifiOff className="h-6 w-6" />
          <span className="text-lg font-semibold">Sin conexión</span>
        </div>
        <p className="text-muted-foreground max-w-xs">
          No hay conexión a internet. Algunas páginas pueden estar disponibles en
          caché.
        </p>
      </div>
      <Link href="/dashboard">
        <Button variant="outline">Intentar de nuevo</Button>
      </Link>
    </div>
  );
}
