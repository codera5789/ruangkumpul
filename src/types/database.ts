/**
 * Tipe database Supabase untuk RuangKumpul.
 * Disesuaikan dengan supabase/migrations/0001–0007 (schema, RPC, dan enum).
 * Regenerasi otomatis (opsional): npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website_url: string | null;
          location: string | null;
          is_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website_url?: string | null;
          location?: string | null;
          is_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          username?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website_url?: string | null;
          location?: string | null;
          is_verified?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          user_id?: string;
          role?: Database["public"]["Enums"]["user_role"];
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      communities: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          icon_url: string | null;
          cover_url: string | null;
          visibility: Database["public"]["Enums"]["community_visibility"];
          status: Database["public"]["Enums"]["community_status"];
          member_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          slug: string;
          description?: string | null;
          icon_url?: string | null;
          cover_url?: string | null;
          visibility?: Database["public"]["Enums"]["community_visibility"];
          status?: Database["public"]["Enums"]["community_status"];
          member_count?: number;
          created_at?: string;
        };
        Update: {
          owner_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          icon_url?: string | null;
          cover_url?: string | null;
          visibility?: Database["public"]["Enums"]["community_visibility"];
          status?: Database["public"]["Enums"]["community_status"];
        };
        Relationships: [
          {
            foreignKeyName: "communities_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      community_members: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          role: Database["public"]["Enums"]["community_member_role"];
          status: Database["public"]["Enums"]["community_member_status"];
          joined_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: Database["public"]["Enums"]["community_member_role"];
          status?: Database["public"]["Enums"]["community_member_status"];
          joined_at?: string;
        };
        Update: {
          role?: Database["public"]["Enums"]["community_member_role"];
          status?: Database["public"]["Enums"]["community_member_status"];
        };
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "community_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          community_id: string | null;
          author_id: string;
          title: string;
          slug: string;
          content: string;
          post_type: Database["public"]["Enums"]["post_type"];
          status: Database["public"]["Enums"]["post_status"];
          view_count: number;
          accepted_comment_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          community_id?: string | null;
          author_id: string;
          title: string;
          slug: string;
          content: string;
          post_type?: Database["public"]["Enums"]["post_type"];
          status?: Database["public"]["Enums"]["post_status"];
          view_count?: number;
          accepted_comment_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          community_id?: string | null;
          title?: string;
          slug?: string;
          content?: string;
          post_type?: Database["public"]["Enums"]["post_type"];
          status?: Database["public"]["Enums"]["post_status"];
          accepted_comment_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "posts_accepted_comment_id_fkey";
            columns: ["accepted_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_id: string | null;
          content: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_id?: string | null;
          content: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          content?: string;
          status?: string;
          parent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      article_comments: {
        Row: {
          id: string;
          article_id: string;
          author_id: string;
          parent_id: string | null;
          content: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          author_id: string;
          parent_id?: string | null;
          content: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          content?: string;
          status?: string;
          parent_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "article_comments_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_comments_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "article_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      reactions: {
        Row: {
          id: string;
          user_id: string;
          target_type: string;
          target_id: string;
          reaction_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          target_type: string;
          target_id: string;
          reaction_type?: string;
          created_at?: string;
        };
        Update: {
          reaction_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      article_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
        Relationships: [];
      };
      articles: {
        Row: {
          id: string;
          author_id: string;
          category_id: string | null;
          title: string;
          slug: string;
          excerpt: string | null;
          content: Json;
          featured_image: string | null;
          status: Database["public"]["Enums"]["article_status"];
          published_at: string | null;
          seo_title: string | null;
          seo_description: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          category_id?: string | null;
          title: string;
          slug: string;
          excerpt?: string | null;
          content?: Json;
          featured_image?: string | null;
          status?: Database["public"]["Enums"]["article_status"];
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string | null;
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: Json;
          featured_image?: string | null;
          status?: Database["public"]["Enums"]["article_status"];
          published_at?: string | null;
          seo_title?: string | null;
          seo_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "articles_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "article_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      article_tag_relations: {
        Row: {
          article_id: string;
          tag_id: string;
        };
        Insert: {
          article_id: string;
          tag_id: string;
        };
        Update: {
          article_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "article_tag_relations_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "article_tag_relations_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
        };
        Relationships: [];
      };
      tools: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          slug: string;
          description: string;
          icon: string | null;
          route: string;
          is_free: boolean;
          status: Database["public"]["Enums"]["tool_status"];
          seo_title: string | null;
          seo_description: string | null;
          usage_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          slug: string;
          description: string;
          icon?: string | null;
          route: string;
          is_free?: boolean;
          status?: Database["public"]["Enums"]["tool_status"];
          seo_title?: string | null;
          seo_description?: string | null;
          usage_count?: number;
          created_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          slug?: string;
          description?: string;
          icon?: string | null;
          route?: string;
          is_free?: boolean;
          status?: Database["public"]["Enums"]["tool_status"];
          seo_title?: string | null;
          seo_description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tools_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "tool_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_favorites: {
        Row: {
          id: string;
          user_id: string;
          tool_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tool_id: string;
          created_at?: string;
        };
        Update: {
          tool_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tool_favorites_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tool_favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tool_usage_logs: {
        Row: {
          id: string;
          tool_id: string;
          user_id: string | null;
          session_hash: string | null;
          used_at: string;
        };
        Insert: {
          id?: string;
          tool_id: string;
          user_id?: string | null;
          session_hash?: string | null;
          used_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "tool_usage_logs_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "tools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tool_usage_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: string;
          resource_id: string;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string | null;
          type: string;
          title: string;
          message: string | null;
          resource_type: string | null;
          resource_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id?: string | null;
          type: string;
          title: string;
          message?: string | null;
          resource_type?: string | null;
          resource_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          description: string | null;
          status: Database["public"]["Enums"]["report_status"];
          reviewed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: string;
          target_id: string;
          reason: string;
          description?: string | null;
          status?: Database["public"]["Enums"]["report_status"];
          reviewed_by?: string | null;
          created_at?: string;
        };
        Update: {
          status?: Database["public"]["Enums"]["report_status"];
          reviewed_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          key: string;
          value?: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          value?: Json;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey",
            columns: ["updated_by"],
            isOneToOne: false,
            referencedRelation: "profiles",
            referencedColumns: ["id"],
          },
        ];
      };
      user_settings: {
        Row: {
          user_id: string;
          notify_comments: boolean;
          notify_likes: boolean;
          notify_mentions: boolean;
          notify_product: boolean;
          theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          notify_comments?: boolean;
          notify_likes?: boolean;
          notify_mentions?: boolean;
          notify_product?: boolean;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          notify_comments?: boolean;
          notify_likes?: boolean;
          notify_mentions?: boolean;
          notify_product?: boolean;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limit_hits: {
        Row: {
          id: number;
          bucket: string;
          hit_at: string;
        };
        Insert: {
          id?: never;
          bucket: string;
          hit_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          slug: string;
          description: string;
          format: Enums["event_format"];
          location: string | null;
          online_url: string | null;
          starts_at: string;
          ends_at: string | null;
          category: string | null;
          cover_url: string | null;
          status: Enums["event_status"];
          max_participants: number | null;
          participant_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          slug: string;
          description: string;
          format?: Enums["event_format"];
          location?: string | null;
          online_url?: string | null;
          starts_at: string;
          ends_at?: string | null;
          category?: string | null;
          cover_url?: string | null;
          status?: Enums["event_status"];
          max_participants?: number | null;
          participant_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          format?: Enums["event_format"];
          location?: string | null;
          online_url?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          category?: string | null;
          cover_url?: string | null;
          status?: Enums["event_status"];
          max_participants?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey";
            columns: ["organizer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      event_registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          registered_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          registered_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      job_listings: {
        Row: {
          id: string;
          posted_by: string;
          company_name: string;
          title: string;
          slug: string;
          description: string;
          job_type: Enums["job_type"];
          location: string | null;
          is_remote: boolean;
          salary_min: number | null;
          salary_max: number | null;
          salary_period: string;
          apply_url: string;
          status: Enums["job_status"];
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          posted_by: string;
          company_name: string;
          title: string;
          slug: string;
          description: string;
          job_type?: Enums["job_type"];
          location?: string | null;
          is_remote?: boolean;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_period?: string;
          apply_url: string;
          status?: Enums["job_status"];
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          company_name?: string;
          title?: string;
          slug?: string;
          description?: string;
          job_type?: Enums["job_type"];
          location?: string | null;
          is_remote?: boolean;
          salary_min?: number | null;
          salary_max?: number | null;
          salary_period?: string;
          apply_url?: string;
          status?: Enums["job_status"];
          expires_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "job_listings_posted_by_fkey";
            columns: ["posted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          content?: string;
          pinned?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          status: Enums["task_status"];
          due_date: string | null;
          position: number;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          status?: Enums["task_status"];
          due_date?: string | null;
          position?: number;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          status?: Enums["task_status"];
          due_date?: string | null;
          position?: number;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          source: string;
          is_active: boolean;
          subscribed_at: string;
          unsubscribed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          source?: string;
          is_active?: boolean;
          subscribed_at?: string;
          unsubscribed_at?: string | null;
        };
        Update: {
          email?: string;
          source?: string;
          is_active?: boolean;
          unsubscribed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      has_any_role: {
        Args: { roles: Database["public"]["Enums"]["user_role"][] };
        Returns: boolean;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_moderator: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      increment_article_view: {
        Args: { article: string };
        Returns: undefined;
      };
      increment_post_view: {
        Args: { p_post: string };
        Returns: undefined;
      };
      increment_tool_usage: {
        Args: { p_tool: string };
        Returns: undefined;
      };
      check_rate_limit: {
        Args: { p_bucket: string; p_max_hits: number; p_window_seconds: number };
        Returns: boolean;
      };
      register_event: {
        Args: { p_event_id: string };
        Returns: string;
      };
      subscribe_newsletter: {
        Args: { p_email: string; p_source?: string };
        Returns: string;
      };
      set_accepted_answer: {
        Args: { p_post_id: string; p_comment_id: string | null };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: "user" | "contributor" | "moderator" | "admin" | "super_admin";
      community_visibility: "public" | "private";
      community_status: "active" | "suspended" | "archived";
      community_member_role: "owner" | "moderator" | "member";
      community_member_status: "pending" | "approved" | "banned";
      post_type: "discussion" | "question" | "announcement";
      post_status: "draft" | "published" | "hidden" | "deleted";
      article_status: "draft" | "review" | "published" | "archived";
      tool_status: "active" | "inactive";
      report_status: "pending" | "reviewing" | "resolved" | "rejected";
      event_format: "online" | "offline" | "hybrid";
      event_status: "published" | "cancelled" | "archived";
      job_type: "full_time" | "part_time" | "contract" | "freelance" | "internship";
      job_status: "published" | "closed";
      task_status: "todo" | "doing" | "done";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Enums = Database["public"]["Enums"];

/** Profil dengan role pengguna (hasil join) */
export type ProfileWithRoles = Tables<"profiles"> & {
  user_roles: Pick<Tables<"user_roles">, "role">[];
};
