import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fernet con Guaymallén",
    short_name: "FernetApp",
    description:
      "Dashboard y gestión del historial futbolero de Fernet con Guaymallén",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0A192F",
    theme_color: "#0A192F",
    orientation: "portrait",
    categories: ["sports"],
    icons: [
      {
        src: "/Escudo Fernet 2023 PNG.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
