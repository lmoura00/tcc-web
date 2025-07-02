import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { teamId } = req.body;
  const supabase = createClient();

  // Busca o responsável da equipe
  const { data: equipe } = await (await supabase)
    .from("equipes")
    .select("responsavel_id, nome")
    .eq("id", teamId)
    .single();

  if (!equipe) return res.status(404).json({ error: "Equipe não encontrada" });

  // Busca o e-mail do responsável
  const { data: responsavel } = await (await supabase)
    .from("profiles")
    .select("email, first_name")
    .eq("id", equipe.responsavel_id)
    .single();

  if (!responsavel) return res.status(404).json({ error: "Responsável não encontrado" });

  // Envia o e-mail


  res.status(200).json({ ok: true });
}