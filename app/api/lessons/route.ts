import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '30')
  const page = parseInt(searchParams.get('page') ?? '0')

  const { data, error } = await supabase
    .from('daily_lessons')
    .select('id, date, day_number, topic, category, title, intro, key_point')
    .order('date', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
