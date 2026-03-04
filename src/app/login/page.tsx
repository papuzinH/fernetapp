"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Image from "next/image";
import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full gap-2">
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogIn className="h-4 w-4" />
      )}
      Ingresar
    </Button>
  );
}

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="min-h-screen bg-header-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Image
            src="/Escudo Fernet 2023 PNG.png"
            alt="Escudo Club Fernet con Guaymallén"
            width={72}
            height={72}
            className="object-contain drop-shadow-lg"
            priority
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Fernet<span className="text-accent">App</span>
            </h1>
            <p className="text-white/60 text-sm mt-1">Panel de Administración</p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/5 backdrop-blur">
          <CardHeader className="pb-4">
            <h2 className="text-lg font-semibold text-white text-center">Iniciar Sesión</h2>
          </CardHeader>
          <CardContent>
            <form action={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@ejemplo.com"
                  required
                  autoComplete="email"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-accent"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/80">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-accent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <SubmitButton />
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
