import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { unauthorized, forbidden, serverError, apiError } from "@/lib/utils/errors";

export async function GET(request: Request) {

      try {

        const supabase = await createClient()
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session) {
          return unauthorized()
        }

        const { data: currentUser, error: userError } = await supabase
          .from('users')
          .select('id, role, department_id, is_active')
          .eq('id', session.user.id)
          .single()

        if (userError || !currentUser || !currentUser.is_active) {
          return unauthorized()
        }

        const { searchParams } = new URL(request.url)
const page = parseInt(searchParams.get('page') || '1', 10)
const userIdFilter = searchParams.get('user_id')
const dateFrom = searchParams.get('date_from')
const dateTo = searchParams.get('date_to')
const actionTypes = searchParams.get('action_types')
const per_page = 20
let query: any = supabase
        .from('activity_log')
        .select(`
      *,
      user:users!activity_log_user_id_fkey(id, full_name, avatar_url)
    `, { count: 'exact' })
if (currentUser.role === 'employee') {
        query = query.eq('user_id', currentUser.id)
      } else if (userIdFilter) {
        query = query.eq('user_id', userIdFilter)
      }
if (dateFrom) query = query.gte('created_at', dateFrom)
if (dateTo) query = query.lte('created_at', dateTo)
if (actionTypes) {
        query = query.in('action', actionTypes.split(','))
      }
const formatQuery = searchParams.get('format')
if (formatQuery === 'csv') {
        // For CSV, fetch up to 10000 records without pagination
        const { data: csvData, error: csvError } = await query.order('created_at', { ascending: false }).limit(10000)
        
        if (csvError) return NextResponse.json({ error: csvError.message }, { status: 500 })

        // Generate CSV string
        const headers = ['Date', 'User', 'Action', 'Entity Type', 'Entity Title', 'Details']
        const rows = (csvData || []).map((row: any) => [
          new Date(row.created_at).toISOString(),
          row.user?.full_name || 'Unknown',
          row.action,
          row.entity_type,
          row.entity_title || '',
          row.metadata?.note || ''
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map((r: any[]) => r.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n')

        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="activity_export_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      }
const from = (page - 1) * per_page
const to = from + per_page - 1
query = query.order('created_at', { ascending: false }).range(from, to)
const { data, error, count } = await query
if (error) return NextResponse.json({ error: error.message }, { status: 500 })
return NextResponse.json({
        data,
        total: count || 0,
        page,
        per_page,
        has_more: count ? (from + data.length) < count : false
      })
      } catch (err) {
        return serverError(err)
      }
}
