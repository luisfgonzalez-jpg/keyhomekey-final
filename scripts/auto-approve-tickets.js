const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

async function autoApproveTickets() {
  console.log('🤖 Starting auto-approval process...');
  console.log(`⏰ Current time: ${new Date().toISOString()}\n`);

  // Calculate date 3 days ago
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  console.log(`🔍 Looking for tickets completed before: ${threeDaysAgo.toISOString()}`);

  try {
    // Fetch tickets completed more than 3 days ago without approval
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('status', 'Completado')
      .lt('completed_at', threeDaysAgo.toISOString())
      .is('auto_approved', false);

    if (error) {
      console.error('❌ Error fetching tickets:', error);
      process.exit(1);
    }

    if (!tickets || tickets.length === 0) {
      console.log('✅ No tickets found for auto-approval');
      return;
    }

    console.log(`📋 Found ${tickets.length} ticket(s) for auto-approval\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const ticket of tickets) {
      console.log(`Processing ticket ${ticket.id.substring(0, 8)}...`);

      try {
        // Update ticket to Resuelto with auto_approved flag
        const { error: updateError } = await supabase
          .from('tickets')
          .update({
            status: 'Resuelto',
            auto_approved: true,
          })
          .eq('id', ticket.id);

        if (updateError) {
          console.error(`  ❌ Error updating ticket: ${updateError.message}`);
          errorCount++;
          continue;
        }

        // Add timeline event (use ticket provider's user_id or null for system events)
        const { error: timelineError } = await supabase
          .from('ticket_comments')
          .insert({
            ticket_id: ticket.id,
            user_id: ticket.providers?.user_id || null,
            user_name: 'Sistema',
            user_role: 'SYSTEM',
            comment_text: 'Ticket auto-aprobado después de 3 días sin respuesta',
            comment_type: 'auto_approved',
            metadata: {
              auto_approved: true,
              completed_at: ticket.completed_at,
              auto_approved_at: new Date().toISOString(),
            },
          });

        if (timelineError) {
          console.error(`  ⚠️  Warning: Could not add timeline event: ${timelineError.message}`);
        }

        console.log(`  ✅ Auto-approved: ${ticket.id.substring(0, 8)}`);
        successCount++;
      } catch (err) {
        console.error(`  ❌ Unexpected error: ${err}`);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  ✅ Successfully auto-approved: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);
    console.log(`  📝 Total processed: ${tickets.length}`);
    console.log('\n✅ Auto-approval process completed');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the function
autoApproveTickets()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
