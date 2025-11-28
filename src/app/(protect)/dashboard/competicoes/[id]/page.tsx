
"use server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  Edit,
  CalendarCheck,
  CalendarX,
  Users,
  Shuffle,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/server";
import { deleteCompetition } from "../action";
import { TeamStatusDropdown } from "../../components/TeamStatusDropdown";
import { ShuffleMatchesButton } from "../../components/ShuffleMatchesButton";
import { Trophy, FileText } from "lucide-react";
import Link from "next/link";

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

interface Partida {
  id: string;
  competicao_id: string;
  equipe_a_id: string;
  equipe_b_id: string;
  data: string | null;
  local: string | null;
  criado_em: string;
  atualizado_em: string;
  modalidade: string | null;
  placar_casa: number | null;
  placar_fora: number | null;
  status: string | null;
  fase: string | null;
  equipe_a: {
    nome: string;
    responsavel_email: string;
    responsavel_nome: string;
    modalidade: string;
  } | null;
  equipe_b: {
    nome: string;
    responsavel_email: string;
    responsavel_nome: string;
    modalidade: string;
  } | null;
}

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-");
  return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
};

const formatarData = (date: Date) => {
  const dateLocal = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return dateLocal.toLocaleDateString("pt-BR");
};

export default async function DetalhesCompeticaoPage(props: any) {
  const { params } = props;
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  const { data: competicao } = await (await supabase)
    .from("competicoes")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!competicao) return notFound();

  const isCriador = user?.id === competicao.criado_por;

  const { data: equipes } = await (await supabase)
    .from("equipes")
    .select("*")
    .eq("competicao_id", params.id) as { data: Team[] | null };

  const { data: jogadores } = await (await supabase)
    .from("jogadores")
    .select("*")
    .in("equipe_id", equipes?.map((e) => e.id) || []);

  const { data: partidas } = await (await supabase)
    .from("partidas")
    .select("*")
    .eq("competicao_id", params.id) as { data: Partida[] | null };

  const hoje = new Date();
  const inicioInscricoes = parseDate(competicao.periodo_inscricao_inicio);
  const fimInscricoes = parseDate(competicao.periodo_inscricao_fim);
  const inicioCompeticao = parseDate(competicao.periodo_competicao_inicio);
  const fimCompeticao = parseDate(competicao.periodo_competicao_fim);

  inicioInscricoes.setUTCHours(0, 0, 0, 0);
  fimInscricoes.setUTCHours(23, 59, 59, 999);
  inicioCompeticao.setUTCHours(0, 0, 0, 0);
  fimCompeticao.setUTCHours(23, 59, 59, 999);

  const status = {
    inscricoesAbertas: hoje >= inicioInscricoes && hoje <= fimInscricoes,
    inscricoesFechadas: hoje > fimInscricoes && hoje < inicioCompeticao,
    competicaoEmAndamento: hoje >= inicioCompeticao && hoje <= fimCompeticao,
    competicaoFinalizada: hoje > fimCompeticao,
    inscricoesFuturas: hoje < inicioInscricoes,
  };

  const calcularDiasRestantes = (dataFim: Date) => {
    const diffTime = dataFim.getTime() - hoje.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const equipesPorModalidade = equipes?.reduce((acc, equipe) => {
    const modalidade = equipe.modalidade || "Sem modalidade";
    if (!acc[modalidade]) acc[modalidade] = [];
    acc[modalidade].push(equipe);
    return acc;
  }, {} as Record<string, Team[]>);

  const sumulasCompeticao = await (await supabase)
    .from("sumulas")
    .select("equipe_a_id, equipe_b_id, gols_equipe_a, gols_equipe_b, partida_id")
    .in("partida_id", partidas?.map((p) => p.id) || []);

  const calcularClassificacaoPorModalidade = (
    modalidadeEquipes: Team[],
    allSumulas: typeof sumulasCompeticao.data
  ) => {
    const tabela: Record<string, any> = {};
    modalidadeEquipes?.forEach((eq) => {
      tabela[eq.id] = {
        nome: eq.nome,
        modalidade: eq.modalidade,
        pontos: 0,
        vitorias: 0,
        empates: 0,
        derrotas: 0,
        gp: 0,
        gc: 0,
        saldo: 0,
      };
    });

    const modalidadePartidas = partidas?.filter((p: Partida) =>
      modalidadeEquipes?.some((eq: Team) => eq.id === p.equipe_a_id) ||
      modalidadeEquipes?.some((eq: Team) => eq.id === p.equipe_b_id)
    );

    const sumulasModalidade = allSumulas?.filter(s =>
      modalidadePartidas?.some(p => p.id === s.partida_id)
    );

    sumulasModalidade?.forEach((s) => {
      if (s.gols_equipe_a == null || s.gols_equipe_b == null) return;

      if (tabela[s.equipe_a_id]) {
        tabela[s.equipe_a_id].gp += s.gols_equipe_a;
        tabela[s.equipe_a_id].gc += s.gols_equipe_b;
        tabela[s.equipe_a_id].saldo += s.gols_equipe_a - s.gols_equipe_b;
      }
      if (tabela[s.equipe_b_id]) {
        tabela[s.equipe_b_id].gp += s.gols_equipe_b;
        tabela[s.equipe_b_id].gc += s.gols_equipe_a;
        tabela[s.equipe_b_id].saldo += s.gols_equipe_b - s.gols_equipe_a;
      }

      if (s.gols_equipe_a > s.gols_equipe_b) {
        if (tabela[s.equipe_a_id]) {
          tabela[s.equipe_a_id].vitorias += 1;
          tabela[s.equipe_a_id].pontos += 3;
        }
        if (tabela[s.equipe_b_id]) {
          tabela[s.equipe_b_id].derrotas += 1;
        }
      } else if (s.gols_equipe_a < s.gols_equipe_b) {
        if (tabela[s.equipe_b_id]) {
          tabela[s.equipe_b_id].vitorias += 1;
          tabela[s.equipe_b_id].pontos += 3;
        }
        if (tabela[s.equipe_a_id]) {
          tabela[s.equipe_a_id].derrotas += 1;
        }
      } else {
        if (tabela[s.equipe_a_id]) {
          tabela[s.equipe_a_id].empates += 1;
          tabela[s.equipe_a_id].pontos += 1;
        }
        if (tabela[s.equipe_b_id]) {
          tabela[s.equipe_b_id].empates += 1;
          tabela[s.equipe_b_id].pontos += 1;
        }
      }
    });

    return Object.values(tabela).sort(
      (a, b) => b.pontos - a.pontos || b.saldo - a.saldo || b.gp - a.gp
    );
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 px-2 sm:px-4 md:px-6 lg:px-8 max-w-5xl mx-auto py-4">
        <Alert
          variant={status.competicaoFinalizada ? "destructive" : "default"}
          className="mx-2 sm:mx-0"
        >
          {status.competicaoFinalizada ? (
            <>
              <CalendarX className="h-4 w-4" />
              <AlertTitle>Competição Finalizada</AlertTitle>
              <AlertDescription>
                Encerrada em {formatarData(fimCompeticao)}
              </AlertDescription>
            </>
          ) : status.competicaoEmAndamento ? (
            <>
              <CalendarCheck className="h-4 w-4" />
              <AlertTitle>Em Andamento</AlertTitle>
              <AlertDescription>
                Até {formatarData(fimCompeticao)} (
                {calcularDiasRestantes(fimCompeticao)} dias restantes)
              </AlertDescription>
            </>
          ) : status.inscricoesAbertas ? (
            <>
              <CalendarCheck className="h-4 w-4" />
              <AlertTitle>Inscrições Abertas</AlertTitle>
              <AlertDescription>
                Até {formatarData(fimInscricoes)} (
                {calcularDiasRestantes(fimInscricoes)} dias restantes)
              </AlertDescription>
            </>
          ) : (
            <>
              <CalendarX className="h-4 w-4" />
              <AlertTitle>Inscrições Futuras</AlertTitle>
              <AlertDescription>
                Abrirão em {formatarData(inicioInscricoes)} (
                {calcularDiasRestantes(inicioInscricoes)} dias restantes)
              </AlertDescription>
            </>
          )}
        </Alert>

        <section className="bg-white rounded-lg shadow-md p-4 sm:p-6 mx-2 sm:mx-0">
          <div className="flex flex-col gap-4 mb-4 sm:mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {competicao.nome}
              </h1>

              <div className="grid grid-cols-1 gap-3 mt-3 sm:gap-4 sm:grid-cols-2 sm:mt-4">
                <div className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-700 text-sm sm:text-base">
                    Período de Inscrições
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {formatarData(inicioInscricoes)} a{" "}
                    {formatarData(fimInscricoes)}
                  </p>
                  {status.inscricoesAbertas && (
                    <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        Aberto
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600">
                        {calcularDiasRestantes(fimInscricoes)} dias restantes
                      </span>
                    </div>
                  )}
                </div>
                <div className="border rounded-lg p-3 sm:p-4">
                  <h3 className="font-semibold text-gray-700 text-sm sm:text-base">
                    Período da Competição
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {formatarData(inicioCompeticao)} a{" "}
                    {formatarData(fimCompeticao)}
                  </p>
                  {status.competicaoEmAndamento && (
                    <div className="mt-1 sm:mt-2 flex items-center gap-1 sm:gap-2">
                      <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                        Em Andamento
                      </span>
                      <span className="text-xs sm:text-sm text-gray-600">
                        {calcularDiasRestantes(fimCompeticao)} dias restantes
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 justify-between items-stretch sm:items-center">
              <Link href="/dashboard/competicoes">
                <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                  Voltar
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row gap-2">
                <Link href={`/dashboard/competicoes/${params.id}/editar`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" /> Editar
                  </Button>
                </Link>

                {partidas && partidas.length > 0 ? (
                  <Link href={`/dashboard/competicoes/${params.id}/partidas`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Shuffle className="h-4 w-4" /> Ver Partidas
                    </Button>
                  </Link>
                ) : (
                  <ShuffleMatchesButton id={params.id} />
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" /> Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação não poderá ser desfeita. Isso excluirá a
                        competição permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <form action={deleteCompetition.bind(null, params.id)}>
                        <AlertDialogAction asChild>
                          <Button type="submit" variant="destructive">
                            Confirmar
                          </Button>
                        </AlertDialogAction>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Users className="h-5 w-5" /> Equipes ({equipes?.length || 0})
            </h2>
  

            {Object.entries(equipesPorModalidade || {}).map(([modalidade, listaEquipes]: [string, Team[]]) => ( // Safely access equipesPorModalidade
              <div key={modalidade} className="space-y-3 mb-6">
                <h3 className="text-lg font-bold text-gray-700 border-b pb-1">
                  {modalidade}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {listaEquipes.length > 0 ? (
                    listaEquipes.map((equipe) => {
                      const membrosEquipe =
                        jogadores?.filter((j:any) => j.equipe_id === equipe.id) || [];

                      const statusEquipe = {
                        aprovado: equipe.status === "Aprovado",
                        reprovado: equipe.status === "Reprovado",
                        pendente: equipe.status === "Pendente" || !equipe.status,
                      };

                      return (
                        <div
                          key={equipe.id}
                          className={`border rounded-lg p-3 sm:p-4 hover:shadow-sm transition ${
                            statusEquipe.aprovado
                              ? "border-green-200 bg-green-50"
                              : statusEquipe.reprovado
                              ? "border-red-200 bg-red-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <details className="mt-1 sm:mt-2">
                                <summary className="text-blue-600 cursor-pointer text-sm sm:text-base">
                                  {equipe.nome} – Ver detalhes (
                                  {membrosEquipe.length} membro
                                  {membrosEquipe.length !== 1 && "s"})
                                </summary>
                                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700 space-y-1 sm:space-y-2">
                                  <p>
                                    <strong>Responsável:</strong>{" "}
                                    {equipe.responsavel_nome} (
                                    {equipe.responsavel_email})
                                  </p>
                                  <p>
                                    <strong>Turma:</strong>{" "}
                                    {equipe.responsavel_turma}
                                  </p>
                                  <p>
                                    <strong>Status:</strong>{" "}
                                    {equipe.status || "Pendente"}
                                  </p>
                                  <p>
                                    <strong>Modalidade:</strong>{" "}
                                    {equipe.modalidade}
                                  </p>
                                  <div>
                                    <strong>Membros:</strong>
                                    <ul className="list-disc ml-4 sm:ml-6">
                                      {membrosEquipe.map((m) => (
                                        <li key={m.id}>
                                          {m.nome} ({m.matricula}) – Turma:{" "}
                                          {m.turma}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </details>
                            </div>
                            <div className="flex gap-1 sm:gap-2">
                              {isCriador && (
                                <>
                                  <TeamStatusDropdown
                                    teamId={equipe.id}
                                    currentStatus={equipe.status || "pendente"}
                                  />

                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 h-8 w-8 p-0"
                                      >
                                        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Excluir equipe (em breve)
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg col-span-full">
                      <p className="text-gray-500 text-sm sm:text-base">
                        Nenhuma equipe participando nesta modalidade ainda.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          ---

          <div className="mt-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <Trophy className="h-5 w-5" /> Classificação
            </h2>
            {Object.entries(equipesPorModalidade || {}).map(([modalidade, listaEquipes]: [string, Team[]]) => { // Safely access equipesPorModalidade
              const classificacaoModalidade = calcularClassificacaoPorModalidade(listaEquipes, sumulasCompeticao.data);
              return (
                <div key={modalidade} className="space-y-3 mb-6">
                  <h3 className="text-lg font-bold text-gray-700 border-b pb-1">
                    {modalidade}
                  </h3>
                  {classificacaoModalidade.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1">Equipe</th>
                            <th className="border px-2 py-1">Pontos</th>
                            <th className="border px-2 py-1">Vitórias</th>
                            <th className="border px-2 py-1">Empates</th>
                            <th className="border px-2 py-1">Derrotas</th>
                            <th className="border px-2 py-1">GP</th>
                            <th className="border px-2 py-1">GC</th>
                            <th className="border px-2 py-1">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classificacaoModalidade.map((eq, i) => (
                            <tr key={i}>
                              <td className="border px-2 py-1">{eq.nome}</td>
                              <td className="border px-2 py-1">{eq.pontos}</td>
                              <td className="border px-2 py-1">{eq.vitorias}</td>
                              <td className="border px-2 py-1">{eq.empates}</td>
                              <td className="border px-2 py-1">{eq.derrotas}</td>
                              <td className="border px-2 py-1">{eq.gp}</td>
                              <td className="border px-2 py-1">{eq.gc}</td>
                              <td className="border px-2 py-1">{eq.saldo}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg col-span-full">
                      <p className="text-gray-500 text-sm sm:text-base">
                        Nenhuma partida registrada para esta modalidade ainda.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          ---

          <div className="mt-10">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5" /> Resultados das Partidas
            </h2>
            {Object.entries(equipesPorModalidade || {}).map(([modalidade, listaEquipes]: [string, Team[]]) => { // Safely access equipesPorModalidade
              const modalidadePartidas = partidas?.filter((p: Partida) =>
                listaEquipes?.some((eq: Team) => eq.id === p.equipe_a_id) ||
                listaEquipes?.some((eq: Team) => eq.id === p.equipe_b_id)
              ) || [];

              return (
                <div key={modalidade} className="space-y-3 mb-6">
                  <h3 className="text-lg font-bold text-gray-700 border-b pb-1">
                    {modalidade}
                  </h3>
                  {modalidadePartidas.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr>
                            <th className="border px-2 py-1">Data</th>
                            <th className="border px-2 py-1">Equipe A</th>
                            <th className="border px-2 py-1">Placar</th>
                            <th className="border px-2 py-1">Equipe B</th>
                            <th className="border px-2 py-1">Súmula</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modalidadePartidas.map((partida: Partida) => {
                            const sumula = sumulasCompeticao.data?.find(s => s.partida_id === partida.id);
                            const equipeA = equipes?.find(
                              (e) => e.id === partida.equipe_a_id
                            );
                            const equipeB = equipes?.find(
                              (e) => e.id === partida.equipe_b_id
                            );
                            return (
                              <tr key={partida.id}>
                                <td className="border px-2 py-1">
                                  {partida.data
                                    ? new Date(partida.data).toLocaleDateString("pt-BR")
                                    : "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {equipeA?.nome || "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {sumula
                                    ? `${sumula.gols_equipe_a} x ${sumula.gols_equipe_b}`
                                    : "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {equipeB?.nome || "-"}
                                </td>
                                <td className="border px-2 py-1">
                                  {sumula ? (
                                    <Link
                                      href={`/dashboard/sumula/${partida.id}`}
                                      className="text-blue-600 underline"
                                    >
                                      Ver Súmula
                                    </Link>
                                  ) : (
                                    "-"
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg col-span-full">
                      <p className="text-gray-500 text-sm sm:text-base">
                        Nenhuma partida registrada para esta modalidade ainda.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}