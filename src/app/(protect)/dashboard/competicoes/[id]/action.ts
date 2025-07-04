'use server';

import { createClient } from "@/lib/supabase/server";

export async function shuffleMatches(competicaoId: string) {
  const supabase = createClient();

  const { data: equipes, error: equipesError } = await (await supabase)
    .from("equipes")
    .select("id")
    .eq("competicao_id", competicaoId)
    .eq("status", "Aprovado");

  if (equipesError) {
    return { error: "Erro ao buscar equipes aprovadas." };
  }

  if (!equipes || equipes.length < 2) {
    return { error: "São necessárias pelo menos duas equipes aprovadas para sortear partidas." };
  }

  const shuffled = [...equipes].sort(() => Math.random() - 0.5);
  const partidas = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    if (i + 1 < shuffled.length) {
      partidas.push({
        competicao_id: competicaoId,
        equipe_a_id: shuffled[i].id,
        equipe_b_id: shuffled[i + 1].id,
        data: new Date().toISOString(), 
      });
    }
  }

  const { error: insertError } = await (await supabase).from("partidas").insert(partidas);

  if (insertError) {
    return { error: "Erro ao inserir partidas." };
  }

  return { success: "Partidas sorteadas com sucesso!" };
}
