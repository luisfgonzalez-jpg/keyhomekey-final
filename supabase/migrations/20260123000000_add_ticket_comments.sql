-- Tabla principal de comentarios
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL, -- 'OWNER', 'TENANT', 'PROVIDER'
  comment_text TEXT NOT NULL,
  comment_type VARCHAR(50) DEFAULT 'comment', -- 'comment', 'status_change', 'provider_assigned', 'media_added'
  media_urls TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON ticket_comments(user_id);

-- Row Level Security
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Ver comentarios si eres parte del ticket
CREATE POLICY "Users can view comments on their tickets"
  ON ticket_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN providers prov ON t.assigned_provider_id = prov.id
      WHERE t.id = ticket_comments.ticket_id
      AND (
        p.owner_id = auth.uid() OR
        p.tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        prov.user_id = auth.uid()
      )
    )
  );

-- Policy: Crear comentarios si eres parte del ticket
CREATE POLICY "Users can create comments on their tickets"
  ON ticket_comments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets t
      LEFT JOIN properties p ON t.property_id = p.id
      LEFT JOIN providers prov ON t.assigned_provider_id = prov.id
      WHERE t.id = ticket_comments.ticket_id
      AND (
        p.owner_id = auth.uid() OR
        p.tenant_email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
        prov.user_id = auth.uid()
      )
    )
  );

-- Policy: Actualizar solo tus propios comentarios
CREATE POLICY "Users can update their own comments"
  ON ticket_comments FOR UPDATE
  USING (user_id = auth.uid());

-- Policy: Borrar solo tus propios comentarios
CREATE POLICY "Users can delete their own comments"
  ON ticket_comments FOR DELETE
  USING (user_id = auth.uid());

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_ticket_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ticket_comments_updated_at
  BEFORE UPDATE ON ticket_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_comments_updated_at();

-- Configurar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ticket_comments;
