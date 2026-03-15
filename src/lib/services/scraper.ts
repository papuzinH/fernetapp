import * as cheerio from "cheerio";

export type StandingsRow = {
  position: number;
  team: string;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export type StandingsData = {
  standings: StandingsRow[];
  fernetIndex: number;
  fernetRow: StandingsRow | null;
  updatedAt: string;
};

const TIFA_URL = "https://tifa.com.ar/cuarta-division/";

export async function fetchStandings(): Promise<StandingsData | null> {
  try {
    const res = await fetch(TIFA_URL, {
      next: { revalidate: 3600 },
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; FernetApp/1.0; +https://fernetapp.vercel.app)",
      },
    });

    if (!res.ok) {
      console.warn(`[scraper] TIFA responded with status ${res.status}`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const table = $("table.sp-league-table");
    if (table.length === 0) {
      console.warn("[scraper] No standings table found on TIFA page");
      return null;
    }

    const standings: StandingsRow[] = [];

    table.find("tbody tr").each((_, row) => {
      const $row = $(row);

      const position = parseInt($row.find(".data-rank").text().trim(), 10);
      const teamLink = $row.find(".data-name a");
      const team = teamLink.length
        ? teamLink.contents().not("span").text().trim()
        : $row.find(".data-name").text().trim();
      const points = parseInt($row.find(".data-pts").text().trim(), 10);
      const played = parseInt($row.find(".data-p").text().trim(), 10);
      const won = parseInt($row.find(".data-w").text().trim(), 10);
      const drawn = parseInt($row.find(".data-d").text().trim(), 10);
      const lost = parseInt($row.find(".data-l").text().trim(), 10);
      const goalsFor = parseInt($row.find(".data-f").text().trim(), 10);
      const goalsAgainst = parseInt($row.find(".data-a").text().trim(), 10);
      const goalDifference = parseInt($row.find(".data-gd").text().trim(), 10);

      if (!isNaN(position) && team) {
        standings.push({
          position,
          team,
          points,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          goalDifference,
        });
      }
    });

    if (standings.length === 0) {
      console.warn("[scraper] Table found but no rows could be parsed");
      return null;
    }

    const fernetIndex = standings.findIndex((r) =>
      r.team.toLowerCase().includes("fernet")
    );

    return {
      standings,
      fernetIndex,
      fernetRow: fernetIndex >= 0 ? standings[fernetIndex] : null,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("[scraper] Failed to fetch standings:", error);
    return null;
  }
}
