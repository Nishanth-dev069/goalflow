'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }

    // Check existing subscription
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription)
        })
      })
    }
  }, [])

  const checkPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }

  const subscribe = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return { error: 'Service workers not supported' }
    }

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        return { error: 'denied' }
      }

      const registration = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!vapidKey) {
        throw new Error('VAPID public key not found')
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
      })

      const subData = JSON.parse(JSON.stringify(subscription))
      
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: subData.keys,
          deviceInfo: {
            userAgent: navigator.userAgent
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription to server')
      }

      setIsSubscribed(true)
      return { success: true }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return { error }
    }
  }

  const unsubscribe = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()
        
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(subscription.endpoint)}`, {
          method: 'DELETE'
        })
        
        setIsSubscribed(false)
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
    }
  }

  const isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window

  return {
    isSupported,
    isSubscribed,
    permission,
    checkPermission,
    subscribe,
    unsubscribe
  }
}
