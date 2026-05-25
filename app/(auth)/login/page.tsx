'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Target, CheckSquare, BarChart3, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormInputs = z.infer<typeof LoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loginError, setLoginError] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginFormInputs) => {
    setLoginError(false)
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      setLoginError(true)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side */}
      <div className="hidden lg:flex flex-1 flex-col justify-between bg-black p-12">
        <div className="font-bold text-white text-2xl tracking-tight">GoalFlow</div>
        
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold text-white mb-8">
            Your team's goals, organized.
          </h1>
          
          <div className="space-y-6">
            <div className="flex items-center text-sm text-neutral-400">
              <Target className="w-4 h-4 text-indigo-500 mr-3 shrink-0" />
              <span>Set weekly, monthly, and long-term goals</span>
            </div>
            <div className="flex items-center text-sm text-neutral-400">
              <CheckSquare className="w-4 h-4 text-indigo-500 mr-3 shrink-0" />
              <span>Assign and track daily tasks</span>
            </div>
            <div className="flex items-center text-sm text-neutral-400">
              <BarChart3 className="w-4 h-4 text-indigo-500 mr-3 shrink-0" />
              <span>Measure team performance with analytics</span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-neutral-600">
          &copy; {new Date().getFullYear()} GoalFlow. All rights reserved.
        </div>
      </div>

      {/* Right side */}
      <div className="flex flex-1 items-center justify-center bg-[#0a0a0a] p-6">
        <div className="w-full max-w-sm bg-[#111111] border border-[#2a2a2a] rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-1">Sign in</h2>
          <p className="text-sm text-neutral-400 mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@company.com"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
              {errors.email && (
                <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 uppercase tracking-wide mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg h-10 px-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition-colors"
              />
              {errors.password && (
                <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center h-10 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors mt-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {loginError && (
            <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-sm text-rose-400">
              Invalid email or password. Please try again.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
