"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram } from "lucide-react";

const INSTAGRAM_USERNAME = "fernetfcok";

export function InstagramWidget() {
  const webUrl = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white">
      <CardContent className="flex items-center gap-4 p-4">
        <Instagram className="h-8 w-8 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">@{INSTAGRAM_USERNAME}</p>
          <p className="text-xs text-white/80">Seguinos en Instagram</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          asChild
        >
          <a
            href={webUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Seguir
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
