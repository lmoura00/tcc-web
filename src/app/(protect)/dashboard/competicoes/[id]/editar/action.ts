"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function handleSubmit(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const competicaoId = formData.get("competicaoId") as string;
  const nome = formData.get("nome") as string;
  const periodoInscricaoInicio = formData.get("periodoInscricaoInicio") as string;
  const periodoInscricaoFim = formData.get("periodoInscricaoFim") as string;
  const periodoCompeticaoInicio = formData.get("periodoCompeticaoInicio") as string;
  const periodoCompeticaoFim = formData.get("periodoCompeticaoFim") as string;

  const modalidadesRaw = formData.getAll("modalidades") as string[];
  const modalidadesUnicas = Array.from(new Set(modalidadesRaw));

  try {
    const modalidadesJson = JSON.stringify(modalidadesUnicas);

    const { error: updateError } = await supabase
      .from("competicoes")
      .update({
        nome,
        periodo_inscricao_inicio: periodoInscricaoInicio,
        periodo_inscricao_fim: periodoInscricaoFim,
        periodo_competicao_inicio: periodoCompeticaoInicio,
        periodo_competicao_fim: periodoCompeticaoFim,
        modalidades_disponiveis: modalidadesJson,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", competicaoId);

    if (updateError) {
      console.error("Erro ao atualizar competição:", updateError);
      throw new Error(`Failed to update competition: ${updateError.message}`);
    }

    redirect(`/dashboard/competicoes/${competicaoId}`);
  } catch (error) {
    console.error("Erro durante a atualização:", error);
    throw error;
  }
}