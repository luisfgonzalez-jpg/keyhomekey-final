export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string | null
          full_name: string | null
          email: string
          phone: string
          role: 'OWNER' | 'TENANT' | 'PROVIDER' | 'ADMIN'
          created_at: string
        }
        Insert: {
          user_id?: string | null
          full_name?: string | null
          email: string
          phone: string
          role: 'OWNER' | 'TENANT' | 'PROVIDER' | 'ADMIN'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      // Agrega otras tablas si lo necesitas
    }
  }
}
