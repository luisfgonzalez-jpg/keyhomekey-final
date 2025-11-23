export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          role: 'OWNER' | 'TENANT' | 'PROVIDER'
          created_at: string
        }
        Insert: {
          user_id: string
          name: string
          email: string
          phone: string
          role: 'OWNER' | 'TENANT' | 'PROVIDER'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['users_profiles']['Insert']>
      }
      // Agrega otras tablas si lo necesitas
    }
  }
}
