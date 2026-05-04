import type { SupabaseClient } from "@supabase/supabase-js";

const PUBLIC_EVENT_COUNT = 12;
const PRIVATE_EVENT_COUNT = 12;
const EXCLUDED_EVENT_DAYS = new Set([12, 19, 20, 21]);

type EventDefinition = {
  id: string;
};

function shuffle<T>(items: T[]) {
  const output = [...items];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output;
}

function getEligibleEventDays() {
  const days: number[] = [];

  for (let day = 1; day <= 21; day += 1) {
    if (!EXCLUDED_EVENT_DAYS.has(day)) {
      days.push(day);
    }
  }

  return days;
}

function pickUniqueDays(count: number) {
  return shuffle(getEligibleEventDays()).slice(0, count);
}

export async function initializeRoomEventSelections({
  supabase,
  roomCode,
}: {
  supabase: SupabaseClient;
  roomCode: string;
}) {
  try {
    const { data: existingPublicRows, error: existingPublicError } = await supabase
      .from("room_public_events")
      .select("day")
      .eq("room_code", roomCode);

    if (existingPublicError) {
      console.warn("initializeRoomEventSelections: room_public_events query failed, table may not exist yet:", existingPublicError.message);
      return;
    }

    const { data: existingPrivateRows, error: existingPrivateError } = await supabase
      .from("room_private_events")
      .select("day")
      .eq("room_code", roomCode);

    if (existingPrivateError) {
      console.warn("initializeRoomEventSelections: room_private_events query failed, table may not exist yet:", existingPrivateError.message);
      return;
    }

    if ((existingPublicRows || []).length > 0 || (existingPrivateRows || []).length > 0) {
      return;
    }

    const { data: publicDefs, error: publicDefsError } = await supabase
      .from("public_event_defs")
      .select("id");

    if (publicDefsError || !publicDefs) {
      console.warn("initializeRoomEventSelections: public_event_defs query failed, table may not exist yet:", publicDefsError?.message);
      return;
    }

    const { data: privateDefs, error: privateDefsError } = await supabase
      .from("private_event_defs")
      .select("id");

    if (privateDefsError || !privateDefs) {
      console.warn("initializeRoomEventSelections: private_event_defs query failed, table may not exist yet:", privateDefsError?.message);
      return;
    }

    const publicCount = Math.min(PUBLIC_EVENT_COUNT, publicDefs.length, getEligibleEventDays().length);
    const privateCount = Math.min(PRIVATE_EVENT_COUNT, privateDefs.length, getEligibleEventDays().length);
    const publicDays = pickUniqueDays(publicCount);
    const privateDays = pickUniqueDays(privateCount);
    const selectedPublicDefs = shuffle(publicDefs as EventDefinition[]).slice(0, publicCount);
    const selectedPrivateDefs = shuffle(privateDefs as EventDefinition[]).slice(0, privateCount);

    if (publicCount > 0) {
      const { error: publicInsertError } = await supabase.from("room_public_events").insert(
        publicDays.map((day, index) => ({
          room_code: roomCode,
          day,
          public_event_id: selectedPublicDefs[index].id,
        }))
      );

      if (publicInsertError) {
        console.warn("initializeRoomEventSelections: room_public_events insert failed, table may not exist yet:", publicInsertError.message);
        return;
      }
    }

    if (privateCount > 0) {
      const { error: privateInsertError } = await supabase.from("room_private_events").insert(
        privateDays.map((day, index) => ({
          room_code: roomCode,
          day,
          private_event_id: selectedPrivateDefs[index].id,
        }))
      );

      if (privateInsertError) {
        console.warn("initializeRoomEventSelections: room_private_events insert failed, table may not exist yet:", privateInsertError.message);
        return;
      }
    }
  } catch (err) {
    console.warn("initializeRoomEventSelections: unexpected error, tables may not exist yet:", err instanceof Error ? err.message : err);
    return;
  }
}
