"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface ActionResult {
  error?: string;
  success?: string;
  message?: string;
  redirectTo?: string;
  warnings?: string[];
}

interface MatchResult {
  homeScore: number;
  awayScore: number;
}

interface Team {
  id: string;
  nome: string;
  modalidade: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_turma: string;
  created_at: string;
  status: string;
  competicao_id: string;
}

export interface ShuffleState {
  success: boolean;
  message?: string;
  error?: string;
}

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

export async function deleteCompetition(competitionId: string) {
  const supabase = await createClient(); 

  try {

    const { data: matches, error: matchesError } = await supabase
      .from("partidas")
      .select("id")
      .eq("competicao_id", competitionId);

    if (matchesError) throw new Error(`Failed to fetch matches: ${matchesError.message}`);

    const matchIds = matches?.map(m => m.id) || [];

    if (matchIds.length > 0) {
      const { error: sumulasDeleteError } = await supabase
        .from("sumulas")
        .delete()
        .in("partida_id", matchIds);

      if (sumulasDeleteError) throw new Error(`Failed to delete sumulas: ${sumulasDeleteError.message}`);
    }


    const { data: teams, error: teamsError } = await supabase
      .from("equipes")
      .select("id")
      .eq("competicao_id", competitionId);

    if (teamsError) throw new Error(`Failed to fetch teams: ${teamsError.message}`);

    const teamIds = teams?.map(t => t.id) || [];

    if (teamIds.length > 0) {
      const { error: jogadoresDeleteError } = await supabase
        .from("jogadores")
        .delete()
        .in("equipe_id", teamIds);

      if (jogadoresDeleteError) throw new Error(`Failed to delete jogadores: ${jogadoresDeleteError.message}`);
    }


    if (matchIds.length > 0) {
      const { error: partidasDeleteError } = await supabase
        .from("partidas")
        .delete()
        .in("id", matchIds);

      if (partidasDeleteError) throw new Error(`Failed to delete partidas: ${partidasDeleteError.message}`);
    }


    if (teamIds.length > 0) {
      const { error: equipesDeleteError } = await supabase
        .from("equipes")
        .delete()
        .in("id", teamIds);

      if (equipesDeleteError) throw new Error(`Failed to delete equipes: ${equipesDeleteError.message}`);
    }


    const { error: competitionDeleteError } = await supabase
      .from("competicoes")
      .delete()
      .eq("id", competitionId);

    if (competitionDeleteError) throw new Error(`Failed to delete competition: ${competitionDeleteError.message}`);

    redirect("/dashboard/competicoes");
  } catch (error) {
    console.error("Error during competition deletion:", error);
    
    throw error;
  }
}

export async function shuffleMatches(
  competitionId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const warnings: string[] = [];

  try {
    const { data: competition } = await supabase
      .from("competicoes")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (!competition) {
      return { error: "Competição não encontrada" };
    }

    const hoje = new Date();
    const fimCompeticao = new Date(competition.periodo_competicao_fim);
    fimCompeticao.setUTCHours(23, 59, 59, 999);

    if (hoje > fimCompeticao) {
      return { error: "Não é possível sortear partidas para uma competição já finalizada." };
    }

    const { data: existingMatches } = await supabase
      .from("partidas")
      .select("*")
      .eq("competicao_id", competitionId);

    if (existingMatches && existingMatches.length > 0) {
      return { error: "Já existem partidas cadastradas para esta competição." };
    }

    const { data: allTeams } = await supabase
      .from("equipes")
      .select("*")
      .eq("competicao_id", competitionId);

    const teams = allTeams ?? [];

    if (!teams || teams.length < 2) {
      return {
        error: "É necessário pelo menos 2 equipes para sortear as partidas",
      };
    }

    const startDate = new Date(competition.periodo_competicao_inicio);
    const endDate = new Date(competition.periodo_competicao_fim);
    const totalCompetitionDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    if (totalCompetitionDays <= 0) {
      return { error: "Período da competição inválido" };
    }

    const matchesToInsert: any[] = [];
    const teamsByModality: Record<string, Team[]> = teams.reduce((acc, team) => {
      const modality = team.modalidade || "Sem modalidade";
      if (!acc[modality]) {
        acc[modality] = [];
      }
      acc[modality].push(team);
      return acc;
    }, {});

    const currentMatchDate = new Date(startDate);
    currentMatchDate.setUTCHours(10, 0, 0, 0);

    for (const modality in teamsByModality) {
      const modalityTeams = teamsByModality[modality];

      if (modalityTeams.length < 2) {
        warnings.push(`Modalidade '${modality}' tem menos de 2 equipes e foi ignorada na geração de partidas.`);
        continue;
      }

      for (let i = 0; i < modalityTeams.length; i++) {
        for (let j = i + 1; j < modalityTeams.length; j++) {
          if (currentMatchDate > endDate) {
            return {
              error: "Não há dias suficientes no período da competição para todas as partidas.",
              warnings: warnings.length > 0 ? warnings : undefined,
            };
          }

          matchesToInsert.push({
            competicao_id: competitionId,
            equipe_a_id: modalityTeams[i].id,
            equipe_b_id: modalityTeams[j].id,
            data: currentMatchDate.toISOString(),
            local: "A definir",
            modalidade: modality,
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString(),
          });

          if (matchesToInsert.length % 2 === 0) {
            currentMatchDate.setDate(currentMatchDate.getDate() + 1);
            currentMatchDate.setUTCHours(10, 0, 0, 0);
          }
        }
      }
    }

    if (matchesToInsert.length === 0 && warnings.length === 0) {
      return { error: "Não foi possível gerar partidas. Verifique se há equipes suficientes e aprovadas em pelo menos uma modalidade." };
    } else if (matchesToInsert.length === 0 && warnings.length > 0) {
      return {
        error: "Nenhuma partida foi gerada. Verifique os avisos para mais detalhes.",
        warnings: warnings,
      };
    }

    const insertResult = await supabase
      .from("partidas")
      .insert(matchesToInsert);

    if (insertResult.error) {
      console.error("Erro Supabase:", insertResult.error);
      return {
        error: insertResult.error.message || "Erro ao salvar as partidas no banco de dados",
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    }

    await notifyTeamsAboutMatches(competitionId, teams);

    return {
      success: "Partidas sorteadas com sucesso!",
      redirectTo: `/dashboard/competicoes/${competitionId}/partidas`,
      warnings: warnings.length > 0 ? warnings : undefined,
    };

  } catch (err) {
    if (err && typeof err === 'object' && 'message' in err && (err as Error).message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error("Erro ao sortear partidas:", err);
    return {
      error: "Ocorreu um erro ao sortear as partidas",
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
}

export async function updateMatchResult(matchId: string, result: MatchResult) {
  const supabase = createClient();

  const { data: match, error: matchError } = await (await supabase)
    .from("partidas")
    .update({
      placar_casa: result.homeScore,
      placar_fora: result.awayScore,
      status: "concluida",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select(
      "*, equipe_a:equipes!equipe_a_id(nome, responsavel_email, responsavel_nome), equipe_b:equipes!equipe_b_id(nome, responsavel_email, responsavel_nome)"
    )
    .single();

  if (matchError) throw matchError;

  await updateStandings(match.competicao_id);
  return match;
}

async function updateStandings(competitionId: string) {
  const supabase = createClient();

  const { error } = await (await supabase)
    .from("partidas")
    .select("*")
    .eq("competicao_id", competitionId)
    .eq("status", "concluida");

  if (!error) {
    console.log("Classificação atualizada com sucesso (lógica de atualização pode precisar ser implementada)");
  } else {
    console.error("Erro ao tentar simular atualização de classificação:", error);
  }
}

async function notifyTeamsAboutMatches(competitionId: string, teams: Team[]) {
  try {
    const supabase = createClient();
    const { data: competition } = await (await supabase)
      .from("competicoes")
      .select("nome")
      .eq("id", competitionId)
      .single();

    for (const team of teams) {
      await resend.emails.send({
        from: "no-reply@seusistema.com",
        to: team.responsavel_email,
        subject: `Partidas da competição ${competition?.nome} foram sorteadas`,
        html: `<p>Olá ${team.responsavel_nome},</p>
               <p>As partidas da competição ${competition?.nome} foram agendadas.</p>
               <p>Acesse o sistema para ver os detalhes.</p>`,
      });
    }
  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
  }
}

export async function updateTeamStatus(
  teamId: string,
  status: "aprovado" | "reprovado" | "pendente"
) {
  const supabase = createClient();

  const { data: team } = await (await supabase)
    .from("equipes")
    .select("*")
    .eq("id", teamId)
    .single();

  if (!team) throw new Error("Equipe não encontrada");

  const { data, error } = await (await supabase)
    .from("equipes")
    .update({ status })
    .eq("id", teamId)
    .select();

  if (error) throw error;

  try {
    const messages = {
      aprovado: {
        subject: "✅ Sua equipe foi aprovada!",
        text: "Sua equipe foi aprovada para participar da competição.",
      },
      reprovado: {
        subject: "❌ Status da equipe alterado",
        text: "Sua equipe foi reprovada na competição.",
      },
      pendente: {
        subject: "🔄 Status da equipe alterado",
        text: "Sua equipe está com status pendente.",
      },
    };

    await resend.emails.send({
      from: "notificacoes@seusistema.com",
      to: team.responsavel_email,
      subject: messages[status].subject,
      html: `
        <p>Olá ${team.responsavel_nome},</p>
        <p>${messages[status].text}</p>
        <p><strong>Equipe:</strong> ${team.nome}</p>
        <p><strong>Status:</strong> ${status}</p>
      `,
    });
  } catch (emailError) {
    console.error("Erro ao enviar e-mail:", emailError);
  }

  return data;
}

export async function updateMatchResultFromForm(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  const homeScore = formData.get("homeScore");
  const awayScore = formData.get("awayScore");

  if (id && homeScore !== null && awayScore !== null) {
    const { data: match, error: updateError } = await (await supabase)
      .from("partidas")
      .update({
        placar_casa: Number(homeScore),
        placar_fora: Number(awayScore),
        status: "concluida",
        atualizado_em: new Date().toISOString()
      })
      .eq("id", id)
      .select("competicao_id")
      .single();

    if (updateError) {
      console.error("Erro ao atualizar resultado da partida:", updateError);
      return { error: "Erro ao atualizar resultado." };
    }

    if (match) {
      await updateStandings(match.competicao_id);
    }
    return { success: "Resultado atualizado." };
  }
  return { error: "Dados inválidos." };
}

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

export async function updateMatchDateAndLocal(formData: FormData) {
  const supabase = createClient();
  const id = formData.get("id") as string;
  const data = formData.get("data");
  const local = formData.get("local");

  if (id) {
    await (await supabase)
      .from("partidas")
      .update({
        data: data ? new Date(data as string).toISOString() : null,
        local: local || null,
        atualizado_em: new Date().toISOString()
      })
      .eq("id", id);
  }
}
