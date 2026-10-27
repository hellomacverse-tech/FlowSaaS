-- FlowSaaS — 0002_book_slot_function.sql
-- Atomically reserves a booking slot: increments `booked` only if the slot
-- still has capacity, in a single statement, so two people who click
-- "Confirm" on the same slot at the same moment can't both win it. The
-- route handler calls this via `supabase.rpc('book_slot', ...)` instead of
-- doing a read-then-write from application code, which would have exactly
-- that race condition (Section 9.4: "Race condition → message 'That time
-- was just booked. Please pick another slot.'").

create or replace function book_slot(p_slot_id uuid)
returns table (slot_id uuid, ok boolean) as $$
declare
  v_updated uuid;
begin
  update booking_slots
  set booked = booked + 1
  where id = p_slot_id
    and booked < capacity
  returning id into v_updated;

  if v_updated is null then
    return query select p_slot_id, false;
  else
    return query select v_updated, true;
  end if;
end;
$$ language plpgsql security definer set search_path = public;

-- Only the service role calls this (via the /api/bookings route handler);
-- no RLS policy grants it to anon/authenticated roles directly since the
-- function runs with definer rights.
revoke execute on function book_slot(uuid) from public, anon, authenticated;
