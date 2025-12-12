// backend/routes/webhook.ts
import { Router } from 'express';
import { supabase } from '../supabase';

const router = Router();

router.post('/', async (req, res) => {
  const event = req.body;
  console.log('[Webhook] Received:', event.type);

  try {
    switch (event.type) {
      case 'miniapp_added':
        await handleMiniAppAdded(event);
        break;
      case 'notifications_enabled':
      case 'notification':
      case 'notifications':
        await handleNotification(event);
        break;
      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error('Webhook handler error', e);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleMiniAppAdded(event: any) {
  // Extract data support flexible payload structures just in case
  const { fid, username, walletAddress, pfpUrl } = event.data ?? event;

  if (!fid) {
    console.error('miniapp_added missing FID');
    return;
  }

  // Upsert user
  const { data: user, error } = await supabase
    .from('User')
    .upsert(
      {
        fid,
        username: username || `fisher_${fid}`,
        walletAddress,
        pfpUrl,
        premium: true, // Welcome bonus: premium trial? or just bonus coins
        coins: 150, // Welcome bonus
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'fid' }
    )
    .select()
    .single();

  if (error) {
    console.error('miniapp_added user upsert error', error);
    return;
  }

  // Log in AuditLog
  await supabase.from('AuditLog').insert({
    id: `miniapp_added_${fid}_${Date.now()}`,
    userId: fid,
    action: 'miniapp_added',
    details: event,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Growth] User ${fid} added app (Supabase REST)`);
}

async function handleNotification(event: any) {
  const { fid, type, payload } = event.data ?? event;

  // Store notification in AuditLog
  await supabase.from('AuditLog').insert({
    id: `notification_${fid ?? 'anon'}_${Date.now()}`,
    userId: fid ?? null,
    action: type ?? 'notification',
    details: payload ?? event,
    timestamp: new Date().toISOString(),
  });

  console.log(`[Notification] Logged for ${fid}`);
}

export default router;
