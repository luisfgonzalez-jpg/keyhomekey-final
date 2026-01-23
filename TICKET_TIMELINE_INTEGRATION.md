# Integrating TicketTimeline Component

## Example: Adding to a Ticket Detail Page

Here's how to integrate the `TicketTimeline` component into your ticket detail page:

```tsx
// Example: src/app/tickets/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import TicketTimeline from '@/components/TicketTimeline';

interface Ticket {
  id: string;
  category: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  // ... other fields
}

export default function TicketDetailPage({ params }: { params: { id: string } }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        setTicket(data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTicket();
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Cargando...</div>;
  }

  if (!ticket) {
    return <div className="p-6">Ticket no encontrado</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Ticket Details Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">Ticket #{ticket.id.substring(0, 8)}</h1>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-600">Categoría</p>
            <p className="font-semibold">{ticket.category}</p>
          </div>
          <div>
            <p className="text-gray-600">Estado</p>
            <p className="font-semibold">{ticket.status}</p>
          </div>
          <div>
            <p className="text-gray-600">Prioridad</p>
            <p className="font-semibold">{ticket.priority}</p>
          </div>
          <div>
            <p className="text-gray-600">Creado</p>
            <p className="font-semibold">
              {new Date(ticket.created_at).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-gray-600">Descripción</p>
          <p className="mt-2">{ticket.description}</p>
        </div>
      </div>

      {/* Timeline Section */}
      <TicketTimeline ticketId={ticket.id} />
    </div>
  );
}
```

## Alternative: Server Component Pattern

If you prefer using Server Components for the ticket data:

```tsx
// src/app/tickets/[id]/page.tsx (Server Component)
import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import TicketDetail from './TicketDetail';

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  // Fetch ticket
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !ticket) {
    return <div className="p-6">Ticket no encontrado</div>;
  }

  return <TicketDetail ticket={ticket} />;
}
```

```tsx
// src/app/tickets/[id]/TicketDetail.tsx (Client Component)
'use client';

import TicketTimeline from '@/components/TicketTimeline';

interface TicketDetailProps {
  ticket: {
    id: string;
    category: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    // ... other fields
  };
}

export default function TicketDetail({ ticket }: TicketDetailProps) {
  return (
    <div className="container mx-auto p-6">
      {/* Ticket header and details... */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">
          Ticket #{ticket.id.substring(0, 8)}
        </h1>
        {/* ... rest of ticket details ... */}
      </div>

      {/* Timeline Component */}
      <TicketTimeline ticketId={ticket.id} />
    </div>
  );
}
```

## Styling Customization

The component uses Tailwind CSS and can be customized by:

1. **Modifying wrapper styles**: Adjust the `max-w-4xl` and padding in the root div
2. **Changing colors**: Update color classes (e.g., `bg-blue-600` to `bg-indigo-600`)
3. **Adjusting spacing**: Modify gap and padding values
4. **Custom role badge colors**: Edit the `getRoleBadgeColor()` function

## Required Permissions

Ensure users have appropriate database permissions:
- `tickets` table: SELECT permission for accessible tickets
- `ticket_comments` table: Handled by RLS policies
- `tickets-media` storage: Upload and read permissions

## Troubleshooting

**Real-time updates not working:**
- Verify Supabase Realtime is enabled for your project
- Check that the `ticket_comments` table is added to the realtime publication
- Ensure the migration was applied correctly

**File uploads failing:**
- Verify the `tickets-media` storage bucket exists
- Check bucket permissions allow uploads
- Confirm environment variables are set correctly

**WhatsApp notifications not sent:**
- Verify `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set
- Check that `INTERNAL_API_KEY` matches between services
- Review logs for notification errors
