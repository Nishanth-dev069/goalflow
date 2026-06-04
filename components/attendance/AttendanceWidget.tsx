'use client'

import React, { useState, useEffect } from 'react'
import { logAttendance } from '@/lib/actions/attendance'
import { Button } from '@/components/ui/button'
import { MapPin, Clock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceWidgetProps {
  lastAction: 'clock_in' | 'clock_out' | null;
  lastTimestamp: string | null;
}

export function AttendanceWidget({ lastAction, lastTimestamp }: AttendanceWidgetProps) {
  const [loading, setLoading] = useState(false)
  const [isClockedIn, setIsClockedIn] = useState(lastAction === 'clock_in')
  
  const handleLogAttendance = async (action: 'clock_in' | 'clock_out') => {
    setLoading(true)
    
    try {
      let lat: number | null = null
      let lng: number | null = null
      
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
          })
          lat = position.coords.latitude
          lng = position.coords.longitude
        } catch (geoError) {
          console.warn('Geolocation failed or denied', geoError)
          toast.warning('Could not get your location, logging without it.')
        }
      }
      
      await logAttendance(action, lat, lng)
      setIsClockedIn(action === 'clock_in')
      toast.success(`Successfully clocked ${action === 'clock_in' ? 'in' : 'out'}!`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to log attendance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#1a1c23] border border-neutral-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-400" />
          Attendance
        </h2>
        {isClockedIn ? (
          <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
            Clocked In
          </span>
        ) : (
          <span className="bg-neutral-800 text-neutral-400 text-xs px-2.5 py-1 rounded-full font-medium border border-neutral-700">
            Clocked Out
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-400">
          {isClockedIn 
            ? "You are currently clocked in. Don't forget to clock out when you're done!"
            : "Ready to start working? Clock in to log your hours."}
        </p>

        <Button 
          onClick={() => handleLogAttendance(isClockedIn ? 'clock_out' : 'clock_in')}
          disabled={loading}
          className={`w-full font-medium ${isClockedIn ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
        >
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MapPin className="w-4 h-4 mr-2" />}
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
      </div>
    </div>
  )
}
