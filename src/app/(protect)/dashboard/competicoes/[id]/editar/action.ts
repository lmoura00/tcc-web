"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function handleSubmit(formData: FormData) {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get the competition ID from form data
  const competicaoId = formData.get("competicaoId") as string;
  const nome = formData.get("nome") as string;
  const periodoInscricaoInicio = formData.get("periodoInscricaoInicio") as string;
  const periodoInscricaoFim = formData.get("periodoInscricaoFim") as string;
  const periodoCompeticaoInicio = formData.get("periodoCompeticaoInicio") as string;
  const periodoCompeticaoFim = formData.get("periodoCompeticaoFim") as string;
  const modalidades = formData.getAll("modalidades") as string[];

  try {
    const { error } = await (await supabase)
      .from("competicoes")
      .update({
        nome,
        periodo_inscricao_inicio: periodoInscricaoInicio,
        periodo_inscricao_fim: periodoInscricaoFim,
        periodo_competicao_inicio: periodoCompeticaoInicio,
        periodo_competicao_fim: periodoCompeticaoFim,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", competicaoId);

    if (error) {
      console.error("Erro ao atualizar competição:", error);
      throw error;
    }

    await (await supabase)
      .from("competicoes_modalidades")
      .delete()
      .eq("competicao_id", competicaoId);


    if (modalidades.length > 0) {
      const modalidadesParaInserir = modalidades.map((modalidade_id) => ({
        competicao_id: competicaoId,
        modalidade_id,
      }));

      const { error: errorModalidades } = await (await supabase)
        .from("competicoes_modalidades")
        .insert(modalidadesParaInserir);

      if (errorModalidades) {
        console.error("Erro ao atualizar modalidades:", errorModalidades);
        throw errorModalidades;
      }
    }

    redirect(`/dashboard/competicoes/${competicaoId}`);
  } catch (error) {
    console.error("Erro durante a atualização:", error);
    throw error;
  }
}