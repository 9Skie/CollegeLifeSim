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
  const { data: existingPublicRows, error: existingPublicError } = await supabase
    .from("room_public_events")
    .select("day")
    .eq("room_code", roomCode);

  if (existingPublicError) {
    throw existingPublicError;
  }

  const { data: existingPrivateRows, error: existingPrivateError } = await supabase
    .from("room_private_events")
    .select("day")
    .eq("room_code", roomCode);

  if (existingPrivateError) {
    throw existingPrivateError;
  }

  if ((existingPublicRows || []).length > 0 || (existingPrivateRows || []).length > 0) {
    return;
  }

  const { data: publicDefs, error: publicDefsError } = await supabase
    .from("public_event_defs")
    .select("id");

  if (publicDefsError || !publicDefs) {
    throw publicDefsError || new Error("Failed to load public event definitions");
  }

  const { data: privateDefs, error: privateDefsError } = await supabase
    .from("private_event_defs")
    .select("id");

  if (privateDefsError || !privateDefs) {
    throw privateDefsError || new Error("Failed to load private event definitions");
  }

  if (publicDefs.length < 30) {
    throw new Error(`Public event definitions incomplete: expected 30 rows, found ${publicDefs.length}`);
  }

  if (privateDefs.length < 30) {
    throw new Error(`Private event definitions incomplete: expected 30 rows, found ${privateDefs.length}`);
  }

  const publicCount = Math.min(PUBLIC_EVENT_COUNT, getEligibleEventDays().length);
  const privateCount = Math.min(PRIVATE_EVENT_COUNT, getEligibleEventDays().length);
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
      throw publicInsertError;
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
      throw privateInsertError;
    }
  }
}
