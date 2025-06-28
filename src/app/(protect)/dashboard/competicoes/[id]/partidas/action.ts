'use server';
import { createClient } from "@/lib/supabase/server";

export async function deleteMatch(formData: FormData) {
  const supabase = createClient();
  const matchId = formData.get("id") as string;
  if (matchId) {
    await (await supabase)
      .from("partidas")
      .delete()
      .eq("id", matchId);
  }
}

export async function updateMatchResult(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  const homeScore = formData.get("homeScore");
  const awayScore = formData.get("awayScore");

  if (id && homeScore !== null && awayScore !== null) {
    await (await supabase)
      .from("partidas")
      .update({
        placar_casa: Number(homeScore),
        placar_fora: Number(awayScore),
        status: "concluida",
        atualizado_em: new Date().toISOString()
      })
      .eq("id", id);
  }
}

export async function updateMatchDateAndLocal(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  const data = formData.get("data");
  const local = formData.get("local");

  if (id) {
    await (await supabase)
      .from("partidas")
      .update({
        data: data || null,
        local: local || null,
        atualizado_em: new Date().toISOString()
      })
      .eq("id", id);
  }
}