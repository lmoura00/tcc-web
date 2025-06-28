'use server';

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface ActionResult {
  error?: string;
  success?: string;
}

interface MatchResult {
  homeScore: number;
  awayScore: number;
}

export async function deleteCompetition(competitionId: string) {
  const supabase = createClient();
  const { error } = await (await supabase)
    .from("competicoes")
    .delete()
    .eq("id", competitionId);
  if (error) throw error;
  redirect("/dashboard/competicoes");
}

export async function shuffleMatches(competitionId: string): Promise<ActionResult | void> {
  const supabase = createClient();
  let error = null;
  let teams = [];
  try {
    const { data: competition } = await (await supabase)
      .from("competicoes")
      .select("*")
      .eq("id", competitionId)
      .single();

    if (!competition) {
      return { error: "Competição não encontrada" };
    }

    const { data: existingMatches } = await (await supabase)
      .from("partidas")
      .select("*")
      .eq("competicao_id", competitionId);

    if (existingMatches && existingMatches.length > 0) {
      return { error: "Já existem partidas cadastradas para esta competição." };
    }

    const teamsResult = await (await supabase)
      .from("equipes")
      .select("*")
      .eq("competicao_id", competitionId);

    teams = teamsResult.data ?? [];

    if (!teams || teams.length < 2) {
      return { error: "É necessário pelo menos 2 equipes para sortear as partidas" };
    }

    const startDate = new Date(competition.periodo_competicao_inicio);
    const endDate = new Date(competition.periodo_competicao_fim);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) {
      return { error: "Período da competição inválido" };
    }
    const matchesPerDay = Math.max(1, Math.floor(teams.length / 2));

    const matches = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          competicao_id: competitionId,
          equipe_a_id: teams[i].id,
          equipe_b_id: teams[j].id,
          data: null,
          local: null,
          criado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString()
        });

        if (matches.length % matchesPerDay === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    console.log("matches gerados:", matches);

    const insertResult = await (await supabase)
      .from("partidas")
      .insert(matches);

    error = insertResult.error;

    if (error) {
      console.error("Erro Supabase:", error);
      return { error: error.message || "Erro ao salvar as partidas no banco de dados" };
    }

    await notifyTeamsAboutMatches(competitionId, teams);

  } catch (err) {
    console.error("Erro ao sortear partidas:", err);
    return { error: "Ocorreu um erro ao sortear as partidas" };
  }

  // O redirect deve estar FORA do try/catch!
  redirect(`/dashboard/competicoes/${competitionId}/partidas`);
}

export async function updateMatchResult(matchId: string, result: MatchResult) {
  const supabase = createClient();
  
  const { data: match, error: matchError } = await (await supabase)
    .from("partidas")
    .update({
      placar_casa: result.homeScore,
      placar_fora: result.awayScore,
      status: "concluida",
      atualizado_em: new Date().toISOString()
    })
    .eq("id", matchId)
    .select("*, equipe_a:equipes!equipe_a_id(*), equipe_b:equipes!equipe_b_id(*)")
    .single();

  if (matchError) throw matchError;

  await updateStandings(match.competicao_id);
  return match;
}

async function updateStandings(competitionId: string) {
  const supabase = createClient();
  
  const { data: matches } = await (await supabase)
    .from("partidas")
    .select("*")
    .eq("competicao_id", competitionId)
    .eq("status", "concluida");
}

async function notifyTeamsAboutMatches(competitionId: string, teams: any[]) {
  try {
    const supabase = createClient();
    const { data: competition } = await (await supabase)
      .from("competicoes")
      .select("nome")
      .eq("id", competitionId)
      .single();

    for (const team of teams) {
      await resend.emails.send({
        from: 'no-reply@seusistema.com',
        to: team.responsavel_email,
        subject: `Partidas da competição ${competition?.nome} foram sorteadas`,
        html: `<p>Olá ${team.responsavel_nome},</p>
              <p>As partidas da competição ${competition?.nome} foram agendadas.</p>
              <p>Acesse o sistema para ver os detalhes.</p>`
      });
    }
  } catch (error) {
    console.error("Erro ao enviar notificações:", error);
  }
}

export async function updateTeamStatus(
  teamId: string, 
  status: 'aprovado' | 'reprovado' | 'pendente'
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
        text: "Sua equipe foi aprovada para participar da competição."
      },
      reprovado: {
        subject: "❌ Status da equipe alterado",
        text: "Sua equipe foi reprovada na competição."
      },
      pendente: {
        subject: "🔄 Status da equipe alterado",
        text: "Sua equipe está com status pendente."
      }
    };

    await resend.emails.send({
      from: 'notificacoes@seusistema.com',
      to: team.responsavel_email,
      subject: messages[status].subject,
      html: `
        <p>Olá ${team.responsavel_nome},</p>
        <p>${messages[status].text}</p>
        <p><strong>Equipe:</strong> ${team.nome}</p>
        <p><strong>Status:</strong> ${status}</p>
      `
    });
  } catch (emailError) {
    console.error("Erro ao enviar e-mail:", emailError);
  }

  return data;
}