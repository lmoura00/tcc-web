"use server";
import { notFound } from "next/navigation";
import Link from "next/link";
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
import { deleteCompetition, shuffleMatches } from "../action";
import { TeamStatusDropdown } from "../../components/TeamStatusDropdown";
import { ShuffleMatchesButton } from "../../components/ShuffleMatchesButton";

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-");
  return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
};

const formatarData = (date: Date) => {
  const dateLocal = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return dateLocal.toLocaleDateString("pt-BR");
};

export default async function DetalhesCompeticaoPage({
  params,
}: {
  params: { id: string };
}) {
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
    .eq("competicao_id", params.id);

  const { data: jogadores } = await (await supabase)
    .from("jogadores")
    .select("*")
    .in("equipe_id", equipes?.map((e) => e.id) || []);

  const { data: partidas } = await (await supabase)
    .from("partidas")
    .select("*")
    .eq("competicao_id", params.id);
  
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

  return (
    <TooltipProvider>
      <div className="space-y-4 px-2 sm:px-4 md:px-6 lg:px-8 max-w-5xl mx-auto py-4">
        <Alert
          variant={
            status.competicaoFinalizada
              ? "destructive"
              : "default"
          }
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
                  <ShuffleMatchesButton action={shuffleMatches.bind(null, params.id)} />
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
                      <form
                        action={deleteCompetition.bind(null, params.id)}
                      >
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
                <Users className="h-5 w-5" /> Equipes ({equipes?.length || 0})
              </h2>
              {status.inscricoesAbertas && isCriador && (
                <Link
                  href={`/dashboard/competicoes/${params.id}/adicionar-equipe`}
                  className="w-full sm:w-auto"
                >
                  <Button variant="outline" className="w-full sm:w-auto">
                    Adicionar Equipe
                  </Button>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              {equipes?.length ? (
                equipes.map((equipe) => {
                  const membrosEquipe =
                    jogadores?.filter((j) => j.equipe_id === equipe.id) || [];

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
                          <div className="flex items-center gap-2">
                            <h3 className="text-base sm:text-lg font-semibold truncate">
                              {equipe.nome}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600">
                            {membrosEquipe.length} membro
                            {membrosEquipe.length !== 1 && "s"}
                          </p>
                          <details className="mt-1 sm:mt-2">
                            <summary className="text-blue-600 cursor-pointer text-sm sm:text-base">
                              Ver detalhes
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
                              <div>
                                <strong>Membros:</strong>
                                <ul className="list-disc ml-4 sm:ml-6">
                                  {membrosEquipe.map((m) => (
                                    <li key={m.id}>
                                      {m.nome} ({m.matricula}) - Turma:{" "}
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
                    Nenhuma equipe participando ainda
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}