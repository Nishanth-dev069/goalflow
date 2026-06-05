import webpush from 'web-push'
import { createAdminClient } from './supabase/server'

const NEXT_PUBLIC_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (NEXT_PUBLIC_VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@goalflow.in',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export async function sendPushNotification(
  userIds: string[], 
  notification: { title: string, body: string, url?: string, type?: string }
) {
  if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, skipping push notification')
    return { success: false, error: 'VAPID keys not configured' }
  }

  if (userIds.length === 0) return { success: true, sent: 0, failed: 0 }

  try {
    const supabase = await createAdminClient()
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (error || !subscriptions) {
      console.error('Error fetching subscriptions:', error)
      return { success: false, error: 'Failed to fetch subscriptions' }
    }

    let sent = 0
    let failed = 0
    const endpointsToDelete: string[] = []

    await Promise.all(subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }

      try {
        await webpush.sendNotification(pushSubscription, JSON.stringify(notification))
        sent++
      } catch (err: any) {
        console.error('Push send error:', err)
        if (err.statusCode === 410 || err.statusCode === 404) {
          // Subscription has expired or is no longer valid
          endpointsToDelete.push(sub.endpoint)
        }
        failed++
      }
    }))

    // Clean up dead subscriptions
    if (endpointsToDelete.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', endpointsToDelete)
    }

    return { success: true, sent, failed }
  } catch (error) {
    console.error('Push send endpoint error:', error)
    return { success: false, error: 'Internal server error' }
  }
}
