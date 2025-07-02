import { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@/lib/supabase/server";


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { teamId } = req.body;
  const supabase = createClient();

  const { data: equipe } = await (await supabase)
    .from("equipes")
    .select("responsavel_id, nome")
    .eq("id", teamId)
    .single();

  if (!equipe) return res.status(404).json({ error: "Equipe não encontrada" });


  const { data: responsavel } = await (await supabase)
    .from("profiles")
    .select("email, first_name")
    .eq("id", equipe.responsavel_id)
    .single();

  if (!responsavel) return res.status(404).json({ error: "Responsável não encontrado" });




  res.status(200).json({ ok: true });
}