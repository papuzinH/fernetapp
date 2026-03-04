// Tipos de la base de datos generados manualmente a partir de 001_initial_schema.sql
// Reemplazar corriendo: npx supabase gen types typescript --project-id TU_ID > src/lib/supabase/types.ts

export type Database = {
  public: {
    Tables: {
      players: {
        Row: {
          id: string;
          nickname: string;
          full_name: string | null;
          position: "ARQ" | "DEF" | "MED" | "DEL" | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nickname: string;
          full_name?: string | null;
          position?: "ARQ" | "DEF" | "MED" | "DEL" | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          full_name?: string | null;
          position?: "ARQ" | "DEF" | "MED" | "DEL" | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          year: number;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          year: number;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          year?: number;
          description?: string | null;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          date: string;
          tournament_id: string;
          opponent: string;
          goals_for: number;
          goals_against: number;
          result: string; // Computed: 'V' | 'E' | 'D'
          yellow_cards: number;
          red_cards: number;
          video_url: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          tournament_id: string;
          opponent: string;
          goals_for: number;
          goals_against: number;
          yellow_cards?: number;
          red_cards?: number;
          video_url?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          tournament_id?: string;
          opponent?: string;
          goals_for?: number;
          goals_against?: number;
          yellow_cards?: number;
          red_cards?: number;
          video_url?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            isOneToOne: false;
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
        ];
      };
      match_player_stats: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          played: boolean;
          goals: number;
          assists: number;
          yellow_cards: number;
          red_cards: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          played?: boolean;
          goals?: number;
          assists?: number;
          yellow_cards?: number;
          red_cards?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          played?: boolean;
          goals?: number;
          assists?: number;
          yellow_cards?: number;
          red_cards?: number;
        };
        Relationships: [
          {
            foreignKeyName: "match_player_stats_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_player_stats_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      v_player_career_stats: {
        Row: {
          player_id: string;
          nickname: string;
          full_name: string | null;
          position: string | null;
          is_active: boolean;
          matches_played: number;
          total_goals: number;
          total_assists: number;
          goal_contributions: number;
          goals_per_match: number;
          total_yellow_cards: number;
          total_red_cards: number;
        };
        Relationships: [];
      };
      v_player_tournament_stats: {
        Row: {
          player_id: string;
          nickname: string;
          tournament_id: string;
          tournament_name: string;
          tournament_year: number;
          matches_played: number;
          total_goals: number;
          total_assists: number;
          total_yellow_cards: number;
          total_red_cards: number;
        };
        Relationships: [];
      };
      v_team_summary: {
        Row: {
          total_matches: number;
          wins: number;
          draws: number;
          losses: number;
          win_percentage: number;
          total_goals_for: number;
          total_goals_against: number;
          goal_difference: number;
          total_yellow_cards: number;
          total_red_cards: number;
        };
        Relationships: [];
      };
      v_team_tournament_summary: {
        Row: {
          tournament_id: string;
          tournament_name: string;
          tournament_year: number;
          total_matches: number;
          wins: number;
          draws: number;
          losses: number;
          win_percentage: number;
          total_goals_for: number;
          total_goals_against: number;
          goal_difference: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};

// Helper types
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type PlayerInsert = Database["public"]["Tables"]["players"]["Insert"];
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentInsert = Database["public"]["Tables"]["tournaments"]["Insert"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
export type MatchPlayerStats = Database["public"]["Tables"]["match_player_stats"]["Row"];
export type MatchPlayerStatsInsert = Database["public"]["Tables"]["match_player_stats"]["Insert"];
export type PlayerCareerStats = Database["public"]["Views"]["v_player_career_stats"]["Row"];
export type TeamSummary = Database["public"]["Views"]["v_team_summary"]["Row"];
export type TeamTournamentSummary = Database["public"]["Views"]["v_team_tournament_summary"]["Row"];
