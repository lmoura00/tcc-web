import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const hoje = new Date();

  const { data: proximasPartidas } = await (await supabase)
    .from("partidas")
    .select(`
      id,
      data,
      local,
      equipe_a:equipes!equipe_a_id(nome),
      equipe_b:equipes!equipe_b_id(nome),
      competicao:competicoes(nome)
    `)
    .gt("data", hoje.toISOString())
    .order("data", { ascending: true })
    .limit(5);

  return NextResponse.json(proximasPartidas || []);
}