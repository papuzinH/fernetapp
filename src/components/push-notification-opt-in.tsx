"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export function PushNotificationOptIn() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  if (permission === "unsupported" || permission === "denied") {
    return null;
  }

  if (permission === "granted") {
    return (
      <Button variant="ghost" size="sm" className="gap-1.5 text-green-600" disabled>
        <Bell className="h-3.5 w-3.5" />
        <span className="text-xs hidden sm:inline">Notificaciones activas</span>
      </Button>
    );
  }

  async function handleSubscribe() {
    setSubscribing(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== "granted") {
        toast.error("Permiso de notificaciones denegado");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        toast.error("Configuración de push incompleta");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const json = subscription.toJSON();
      const supabase = createClient();

      await supabase.from("push_subscriptions").upsert(
        {
          endpoint: json.endpoint!,
          p256dh: json.keys!.p256dh,
          auth: json.keys!.auth,
        },
        { onConflict: "endpoint" }
      );

      toast.success("¡Notificaciones activadas! 🔔");
    } catch {
      toast.error("Error al activar notificaciones");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSubscribe}
      disabled={subscribing}
      className="gap-1.5"
    >
      <BellOff className="h-3.5 w-3.5" />
      <span className="text-xs hidden sm:inline">
        {subscribing ? "Activando..." : "Activar notificaciones"}
      </span>
    </Button>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
