export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
        Tables: {
        cronofy_channels: {
          Row: {
            id: string
            owner_id: string | null
            venue_id: string | null
            channel_id: string
            callback_url: string
            expires_at: string | null
            created_at: string | null
          }
          Insert: {
            id?: string
            owner_id?: string | null
            venue_id?: string | null
            channel_id: string
            callback_url: string
            expires_at?: string | null
            created_at?: string | null
          }
          Update: {
            id?: string
            owner_id?: string | null
            venue_id?: string | null
            channel_id?: string
            callback_url?: string
            expires_at?: string | null
            created_at?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "cronofy_channels_owner_id_fkey"
              columns: ["owner_id"]
              isOneToOne: false
              referencedRelation: "users"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "cronofy_channels_venue_id_fkey"
              columns: ["venue_id"]
              isOneToOne: false
              referencedRelation: "venues"
              referencedColumns: ["id"]
            }
          ]
        }
        venue_calendar_events: {
          Row: {
            id: string
            venue_id: string | null
            cronofy_event_id: string | null
            event_uid: string | null
            title: string | null
            start_time: string
            end_time: string
            is_external: boolean | null
            is_booking: boolean | null
            is_blocked: boolean | null
            raw_data: Json | null
            created_at: string | null
          }
          Insert: {
            id?: string
            venue_id?: string | null
            cronofy_event_id?: string | null
            event_uid?: string | null
            title?: string | null
            start_time: string
            end_time: string
            is_external?: boolean | null
            is_booking?: boolean | null
            is_blocked?: boolean | null
            raw_data?: Json | null
            created_at?: string | null
          }
          Update: {
            id?: string
            venue_id?: string | null
            cronofy_event_id?: string | null
            event_uid?: string | null
            title?: string | null
            start_time?: string
            end_time?: string
            is_external?: boolean | null
            is_booking?: boolean | null
            is_blocked?: boolean | null
            raw_data?: Json | null
            created_at?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "venue_calendar_events_venue_id_fkey"
              columns: ["venue_id"]
              isOneToOne: false
              referencedRelation: "venues"
              referencedColumns: ["id"]
            }
          ]
        }
        venue_calendars: {
          Row: {
            id: string
            venue_id: string | null
            owner_id: string | null
            cronofy_calendar_id: string
            calendar_name: string
            provider: string | null
            created_at: string | null
          }
          Insert: {
            id?: string
            venue_id?: string | null
            owner_id?: string | null
            cronofy_calendar_id: string
            calendar_name: string
            provider?: string | null
            created_at?: string | null
          }
          Update: {
            id?: string
            venue_id?: string | null
            owner_id?: string | null
            cronofy_calendar_id?: string
            calendar_name?: string
            provider?: string | null
            created_at?: string | null
          }
          Relationships: [
            {
              foreignKeyName: "venue_calendars_owner_id_fkey"
              columns: ["owner_id"]
              isOneToOne: false
              referencedRelation: "users"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "venue_calendars_venue_id_fkey"
              columns: ["venue_id"]
              isOneToOne: false
              referencedRelation: "venues"
              referencedColumns: ["id"]
            }
          ]
        }
      bookings: {
        Row: {
          id: string
          venue_id: string
          rentee_id: string
          owner_id: string
          start_at: string
          end_at: string
          hourly_rate: number
          total_hours: number
          total_amount: number
          status: Database["public"]["Enums"]["booking_status"]
          cronofy_event_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          rentee_id: string
          owner_id: string
          start_at: string
          end_at: string
          hourly_rate: number
          status?: Database["public"]["Enums"]["booking_status"]
          cronofy_event_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          rentee_id?: string
          owner_id?: string
          start_at?: string
          end_at?: string
          hourly_rate?: number
          status?: Database["public"]["Enums"]["booking_status"]
          cronofy_event_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_rentee_id_fkey"
            columns: ["rentee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      addresses: {
        Row: {
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          formatted_address: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          place_id: string | null
          state: string
          street: string
          venue_id: string
          zip: string
        }
        Insert: {
          address_line_2?: string | null
          city: string
          country: string
          created_at?: string
          formatted_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          place_id?: string | null
          state: string
          street: string
          venue_id: string
          zip: string
        }
        Update: {
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string
          formatted_address?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          place_id?: string | null
          state?: string
          street?: string
          venue_id?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: true
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          lister_id: string
          rentee_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lister_id: string
          rentee_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lister_id?: string
          rentee_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lister_id_fkey"
            columns: ["lister_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_rentee_id_fkey"
            columns: ["rentee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cronofy_credentials: {
        Row: {
          access_token: string
          account_id: string | null
          expires_at: string | null
          refresh_token: string
          scope: string | null
          sub: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id?: string | null
          expires_at?: string | null
          refresh_token: string
          scope?: string | null
          sub: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string | null
          expires_at?: string | null
          refresh_token?: string
          scope?: string | null
          sub?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cronofy_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers_subscriptions: {
        Row: {
          customer_id: string
          id: number
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          customer_id: string
          id?: never
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          customer_id?: string
          id?: never
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: true
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      early_access: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          created_at: string
          height: number
          id: string
          is_featured: boolean
          sort_order: number
          storage_path: string | null
          url: string
          venue_id: string
          width: number
        }
        Insert: {
          created_at?: string
          height: number
          id?: string
          is_featured?: boolean
          sort_order?: number
          storage_path?: string | null
          url: string
          venue_id: string
          width: number
        }
        Update: {
          created_at?: string
          height?: number
          id?: string
          is_featured?: boolean
          sort_order?: number
          storage_path?: string | null
          url?: string
          venue_id?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "images_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_email_changes: {
        Row: {
          created_at: string
          current_email: string
          expires_at: string
          id: string
          new_email: string
          new_email_confirmed_at: string | null
          new_email_token: string
          old_email_confirmed_at: string | null
          old_email_token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_email: string
          expires_at: string
          id?: string
          new_email: string
          new_email_confirmed_at?: string | null
          new_email_token: string
          old_email_confirmed_at?: string | null
          old_email_token: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_email?: string
          expires_at?: string
          id?: string
          new_email?: string
          new_email_confirmed_at?: string | null
          new_email_token?: string
          old_email_confirmed_at?: string | null
          old_email_token?: string
          user_id?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          review: string
          user_id: string
          venue_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review: string
          user_id: string
          venue_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_venues: {
        Row: {
          id: string
          saved_on: string
          user_id: string
          venue_id: string
        }
        Insert: {
          id?: string
          saved_on?: string
          user_id: string
          venue_id: string
        }
        Update: {
          id?: string
          saved_on?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_venues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          currency: string | null
          id: string
          interval: string | null
          interval_count: number | null
          period_ends_at: string
          period_starts_at: string
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_starts_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end: boolean
          created_at: string
          currency?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at: string
          period_starts_at: string
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at?: string
          period_starts_at?: string
          price_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          display_name: string | null
          id: string
          photo_url: string | null
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          display_name?: string | null
          id: string
          photo_url?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          display_name?: string | null
          id?: string
          photo_url?: string | null
        }
        Relationships: []
      }
      venue_blocks: {
        Row: {
          created_at: string | null
          cronofy_event_id: string | null
          end_at: string
          id: string
          owner_id: string
          start_at: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          cronofy_event_id?: string | null
          end_at: string
          id?: string
          owner_id: string
          start_at: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          cronofy_event_id?: string | null
          end_at?: string
          id?: string
          owner_id?: string
          start_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_blocks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_blocks_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          accessibility: string[] | null
          amenities: string[] | null
          audio_system: string[] | null
          cancellation_policy: string | null
          capacity: number | null
          created_at: string | null
          description: string | null
          event_types: string[] | null
          hourly_rate: number | null
          hours_of_operation: string | null
          id: string
          indoor_outdoor: Database["public"]["Enums"]["indoor_outdoor"] | null
          instabook: boolean
          is_active: boolean | null
          calendar_sync: Database["public"]["Enums"]["calendar_sync"]
          min_hours: number | null
          name: string
          owner_id: string | null
          parking: string[] | null
          phone: string[] | null
          rating: number | null
          rules: string[] | null
          slug: string | null
          social_media_links: string[] | null
          square_footage: number | null
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Insert: {
          accessibility?: string[] | null
          amenities?: string[] | null
          audio_system?: string[] | null
          cancellation_policy?: string | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          event_types?: string[] | null
          hourly_rate?: number | null
          hours_of_operation?: string | null
          id?: string
          indoor_outdoor?: Database["public"]["Enums"]["indoor_outdoor"] | null
          instabook?: boolean
          is_active?: boolean | null
          calendar_sync?: Database["public"]["Enums"]["calendar_sync"]
          min_hours?: number | null
          name: string
          owner_id?: string | null
          parking?: string[] | null
          phone?: string[] | null
          rating?: number | null
          rules?: string[] | null
          slug?: string | null
          social_media_links?: string[] | null
          square_footage?: number | null
          venue_type: Database["public"]["Enums"]["venue_type"]
        }
        Update: {
          accessibility?: string[] | null
          amenities?: string[] | null
          audio_system?: string[] | null
          cancellation_policy?: string | null
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          event_types?: string[] | null
          hourly_rate?: number | null
          hours_of_operation?: string | null
          id?: string
          indoor_outdoor?: Database["public"]["Enums"]["indoor_outdoor"] | null
          instabook?: boolean
          is_active?: boolean | null
          calendar_sync?: Database["public"]["Enums"]["calendar_sync"]
          min_hours?: number | null
          name?: string
          owner_id?: string | null
          parking?: string[] | null
          phone?: string[] | null
          rating?: number | null
          rules?: string[] | null
          slug?: string | null
          social_media_links?: string[] | null
          square_footage?: number | null
          venue_type?: Database["public"]["Enums"]["venue_type"]
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_address_coords: {
        Args: { p_venue_id: string }
        Returns: {
          formatted_address: string
          lat: number
          lng: number
        }[]
      }
      upsert_venue_address: {
        Args: {
          p_address_line_2: string
          p_city: string
          p_country: string
          p_formatted_address: string
          p_lat: number
          p_lng: number
          p_place_id: string
          p_state: string
          p_street: string
          p_venue_id: string
          p_zip: string
        }
        Returns: {
          address_line_2: string | null
          city: string
          country: string
          created_at: string
          formatted_address: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          place_id: string | null
          state: string
          street: string
          venue_id: string
          zip: string
        }
        SetofOptions: {
          from: "*"
          to: "addresses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      account_type: "venue_owner" | "rentee"
      booking_status: "pending" | "confirmed" | "cancelled_by_guest" | "cancelled_by_owner"
      calendar_sync: "not_connected" | "connected"
      indoor_outdoor: "indoor" | "outdoor" | "both"
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
      venue_type:
        | "banquet_hall"
        | "conference_center"
        | "hotel_resort"
        | "restaurant_cafe"
        | "bar_nightclub"
        | "event_space_studio"
        | "ballroom"
        | "country_club"
        | "garden_outdoor_space"
        | "art_gallery_museum"
        | "historic_building_landmark"
        | "warehouse_industrial_space"
        | "theater_auditorium"
        | "vineyard_winery"
        | "loft_rooftop"
        | "beachfront_waterfront"
        | "barn_farm"
        | "private_estate_mansion"
        | "community_center"
        | "sports_facility_gym"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["venue_owner", "rentee"],
      booking_status: ["pending", "confirmed", "cancelled_by_guest", "cancelled_by_owner"],
      indoor_outdoor: ["indoor", "outdoor", "both"],
      subscription_status: [
        "active",
        "trialing",
        "past_due",
        "canceled",
        "unpaid",
        "incomplete",
        "incomplete_expired",
        "paused",
      ],
      venue_type: [
        "banquet_hall",
        "conference_center",
        "hotel_resort",
        "restaurant_cafe",
        "bar_nightclub",
        "event_space_studio",
        "ballroom",
        "country_club",
        "garden_outdoor_space",
        "art_gallery_museum",
        "historic_building_landmark",
        "warehouse_industrial_space",
        "theater_auditorium",
        "vineyard_winery",
        "loft_rooftop",
        "beachfront_waterfront",
        "barn_farm",
        "private_estate_mansion",
        "community_center",
        "sports_facility_gym",
      ],
    },
  },
} as const

