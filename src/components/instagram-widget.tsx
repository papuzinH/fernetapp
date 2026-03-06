"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, Play } from "lucide-react";
import type { InstagramPost } from "@/app/api/instagram/route";

const INSTAGRAM_USERNAME = "fernetfc";

export function InstagramWidget() {
  const profileUrl = `https://www.instagram.com/${INSTAGRAM_USERNAME}/`;
  const [post, setPost] = useState<InstagramPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((data) => setPost(data ?? null))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, []);

  const imageUrl =
    post?.media_type === "VIDEO" ? post.thumbnail_url : post?.media_url;
  const postUrl = post?.permalink ?? profileUrl;
  const caption = post?.caption?.replace(/\n/g, " ").trimStart();

  return (
    <Card className="overflow-hidden bg-linear-to-br from-purple-600 via-pink-500 to-orange-400 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <Instagram className="h-6 w-6 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight">@{INSTAGRAM_USERNAME}</p>
          <p className="text-xs text-white/80">Última publicación</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0 text-xs"
          asChild
        >
          <a href={profileUrl} target="_blank" rel="noopener noreferrer">
            Seguir
          </a>
        </Button>
      </div>

      {/* Post preview */}
      {loading ? (
        <div className="mx-4 mb-4 aspect-square rounded-lg bg-white/20 animate-pulse" />
      ) : imageUrl ? (
        <a
          href={postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mx-4 mb-3 rounded-lg overflow-hidden relative aspect-square"
        >
          <Image
            src={imageUrl}
            alt={caption?.slice(0, 120) ?? "Instagram post"}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 400px"
            unoptimized
          />
          {post?.media_type === "VIDEO" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="h-10 w-10 text-white fill-white" />
            </div>
          )}
        </a>
      ) : null}

      {/* Caption */}
      {post?.caption && (
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-xs text-white/90 line-clamp-2">{caption}</p>
        </CardContent>
      )}
    </Card>
  );
}
