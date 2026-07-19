import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { addDays, startOfDay } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Verify CRON_SECRET
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Initialize Service Role Supabase Client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase Service Role Key missing');
    return new NextResponse('Internal Server Error', { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // 3. Query all open shifts
  const { data: openShifts, error: fetchError } = await supabase
    .from('time_entries')
    .select('id, user_id, clock_in')
    .is('clock_out', null)
    .is('voided_at', null);

  if (fetchError || !openShifts) {
    console.error('Failed to fetch open shifts', fetchError);
    return new NextResponse('Failed to fetch open shifts', { status: 500 });
  }

  if (openShifts.length === 0) {
    return NextResponse.json({ success: true, message: 'No open shifts to close.' });
  }

  const closedEntryIds: string[] = [];

  // Fetch unique user_ids to get their time zones
  const userIds = Array.from(new Set(openShifts.map(s => s.user_id)));
  
  const { data: settings } = await supabase
    .from('contractor_settings')
    .select('user_id, time_zone, auto_clock_out_enabled')
    .in('user_id', userIds);

  const settingsMap = new Map(settings?.map(s => [s.user_id, s]));

  const nowUTC = new Date();

  // 4. Evaluate each shift
  for (const shift of openShifts) {
    const contractorSettings = settingsMap.get(shift.user_id);
    if (!contractorSettings || !contractorSettings.auto_clock_out_enabled) continue;

    const timeZone = contractorSettings.time_zone || 'UTC';
    
    // Get the local calendar date of the clock_in
    const clockInZoned = toZonedTime(new Date(shift.clock_in), timeZone);
    
    // The midnight boundary is the start of the *next* day in their local timezone
    const nextLocalDay = startOfDay(addDays(clockInZoned, 1));
    
    // Check if the current server time is past this midnight boundary
    const nowZoned = toZonedTime(nowUTC, timeZone);
    if (nowZoned >= nextLocalDay) {
      // It has crossed midnight. The exact UTC timestamp of that local midnight boundary is:
      // Note: nextLocalDay is a Date object representing the midnight instant in the given timezone.
      // Wait, startOfDay on a zoned time might behave weirdly. 
      // Safest way: string format and parse.
      
      const boundaryDateString = formatInTimeZone(clockInZoned, timeZone, 'yyyy-MM-dd');
      const midnightLocalStr = `${boundaryDateString}T23:59:59.999`;
      // Actually, plan says: "Use the next day's local 00:00:00 instant"
      const nextDayStr = formatInTimeZone(addDays(clockInZoned, 1), timeZone, 'yyyy-MM-dd');
      const exactMidnightLocalStr = `${nextDayStr}T00:00:00.000`;
      
      // Parse back to a UTC Date object representing that instant
      // We can use date-fns-tz parse string with timezone
      const { fromZonedTime } = require('date-fns-tz');
      const boundaryUTC = fromZonedTime(exactMidnightLocalStr, timeZone);

      // 5. Call Atomic Database RPC
      const { data: modified, error: rpcError } = await supabase.rpc('auto_close_time_entry', {
        p_entry_id: shift.id,
        p_boundary_time: boundaryUTC.toISOString()
      });

      if (rpcError) {
        console.error(`Failed to close shift ${shift.id}:`, rpcError);
      } else if (modified) {
        closedEntryIds.push(shift.id);
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: closedEntryIds.length,
    closed_ids: closedEntryIds
  });
}
