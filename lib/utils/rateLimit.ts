// Simple in-memory rate limiter for serverless environments (note: state resets on cold starts)
const rateLimitMap = new Map<string, { count: number, resetAt: number }>()

export function rateLimit(ip: string, maxRequests = 20, windowMs = 60000) {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: maxRequests - 1 }
  }

  if (record.count >= maxRequests) {
    return { success: false, remaining: 0 }
  }

  record.count += 1
  return { success: true, remaining: maxRequests - record.count }
}
