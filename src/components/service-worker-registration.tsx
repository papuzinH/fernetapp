"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => console.log("[SW] Registrado correctamente"))
        .catch((err) => console.error("[SW] Error al registrar:", err));
    }
  }, []);

  return null;
}
