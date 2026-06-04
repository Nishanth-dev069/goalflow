import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import webpush from 'web-push'

const NEXT_PUBLIC_VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

if (NEXT_PUBLIC_VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@goalflow.in',
    NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
}

export async function POST(req: Request) {
  try {
    // This endpoint should ideally be protected so only authorized servers/admins can send push
    // For now we check if keys exist
    if (!NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return NextResponse.json({ error: 'VAPID keys not configured' }, { status: 501 })
    }

    const body = await req.json()
    const { userIds, notification } = body

    if (!userIds || !Array.isArray(userIds) || !notification) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Use service role to bypass RLS and fetch subscriptions for the given users
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (error || !subscriptions) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
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

    return NextResponse.json({ success: true, sent, failed })
  } catch (error) {
    console.error('Push send endpoint error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
