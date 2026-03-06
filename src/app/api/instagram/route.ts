import { NextResponse } from "next/server";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID;

export interface InstagramPost {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  caption?: string;
  permalink: string;
  timestamp: string;
}

// Revalidar cada hora
export const revalidate = 3600;

export async function GET() {
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const userId = INSTAGRAM_USER_ID ?? "me";
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url = `https://graph.instagram.com/${userId}/media?fields=${fields}&limit=1&access_token=${INSTAGRAM_ACCESS_TOKEN}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.error("Instagram API error:", await res.text());
      return NextResponse.json(null, { status: 200 });
    }

    const data = await res.json();
    const post: InstagramPost | undefined = data?.data?.[0];

    if (!post) {
      return NextResponse.json(null, { status: 200 });
    }

    return NextResponse.json(post, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err) {
    console.error("Error fetching Instagram post:", err);
    return NextResponse.json(null, { status: 200 });
  }
}
