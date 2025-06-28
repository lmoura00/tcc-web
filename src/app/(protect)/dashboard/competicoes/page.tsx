import { createClient } from "@/lib/supabase/server";
import { FiPlus, FiCalendar, FiUsers, FiSearch } from "react-icons/fi";
import { TeamStatusDropdown } from "../components/TeamStatusDropdown";
import { Team } from "@/types";
import Link from "next/link";

export default async function CompeticoesPage({ searchParams }: { searchParams?: { termo?: string; status?: string } }) {
  const supabase = createClient();

  const { data: competicoes } = await (await supabase)
    .from("competicoes")
    .select(
      `
      *,
      equipes (
        *,
        jogadores (count)
      )
      `
    )
    .order("periodo_competicao_inicio", { ascending: false });

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  };

  const formatarData = (date: Date) => {
    const dateLocal = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return dateLocal.toLocaleDateString("pt-BR");
  };

  const calcularDiasRestantes = (dataFim: string) => {
    const hoje = new Date();
    const fimInscricoes = parseDate(dataFim);
    fimInscricoes.setUTCHours(23, 59, 59, 999);
    const diffTime = fimInscricoes.getTime() - hoje.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const inscricoesAbertas = (inicio: string, fim: string) => {
    const hoje = new Date();
    const inicioInscricoes = parseDate(inicio);
    const fimInscricoes = parseDate(fim);
    inicioInscricoes.setUTCHours(0, 0, 0, 0);
    fimInscricoes.setUTCHours(23, 59, 59, 999);
    return hoje >= inicioInscricoes && hoje <= fimInscricoes;
  };

  const termoBusca = (searchParams?.termo || "").toLowerCase();
  const statusBusca = searchParams?.status || "";

  const competicoesFiltradas = (competicoes || []).filter((competicao) => {
    const nomeCompeticao = (competicao.nome || "").toLowerCase();
    const statusCompeticao = inscricoesAbertas(competicao.periodo_inscricao_inicio, competicao.periodo_inscricao_fim)
      ? "aberta"
      : "encerrada";
    const equipesFiltradas = (competicao.equipes || []).filter((equipe: Team) => {
      const nomeEquipe = (equipe.nome || "").toLowerCase();
      return (
        !termoBusca ||
        nomeCompeticao.includes(termoBusca) ||
        nomeEquipe.includes(termoBusca)
      );
    });
    return (
      (!statusBusca || statusCompeticao === statusBusca) &&
      (!termoBusca || nomeCompeticao.includes(termoBusca) || equipesFiltradas.length > 0)
    );
  }).map((competicao) => ({
    ...competicao,
    equipes: (competicao.equipes || []).filter((equipe: Team) => {
      const nomeEquipe = (equipe.nome || "").toLowerCase();
      const nomeCompeticao = (competicao.nome || "").toLowerCase();
      return (
        !termoBusca ||
        nomeCompeticao.includes(termoBusca) ||
        nomeEquipe.includes(termoBusca)
      );
    }),
  }));

  const totalCompeticoes = competicoesFiltradas.length;
  let totalJogadoresInscritos = 0;
  competicoesFiltradas.forEach((competicao) => {
    competicao.equipes?.forEach((equipe: Team) => {
      const playerCount = equipe.jogadores?.[0]?.count || 0;
      totalJogadoresInscritos += playerCount;
    });
  });

  return (
    <div>
      <section className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-700">Todas as Competições</h1>
          </div>
          <Link
            href="/dashboard/competicoes/nova"
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <FiPlus className="mr-2" /> Nova Competição
          </Link>
        </div>

        <form method="get" className="mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-72">
            <input
              type="text"
              name="termo"
              defaultValue={termoBusca}
              placeholder="Buscar por competição ou equipe..."
              className="border rounded-md px-3 py-2 w-full pl-10 text-gray-700 bg-white"
            />
            <FiSearch className="absolute left-2 top-3 text-gray-400" />
          </div>
          <select
            name="status"
            defaultValue={statusBusca}
            className="border rounded-md px-3 py-2 text-gray-700 bg-white"
          >
            <option value="">Todas</option>
            <option value="aberta">Inscrições Abertas</option>
            <option value="encerrada">Inscrições Encerradas</option>
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
          >
            Filtrar
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Competições</p>
              <p className="text-2xl font-bold text-blue-700">{totalCompeticoes}</p>
            </div>
            <FiCalendar className="text-blue-500 text-4xl" />
          </div>
          <div className="bg-green-50 p-4 rounded-lg flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Jogadores Inscritos</p>
              <p className="text-2xl font-bold text-green-700">{totalJogadoresInscritos}</p>
            </div>
            <FiUsers className="text-green-500 text-4xl" />
          </div>
        </div>

        <div className="space-y-4">
          {competicoesFiltradas.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              Nenhuma competição encontrada.
            </div>
          )}
          {competicoesFiltradas.map((competicao) => {
            const diasRestantes = calcularDiasRestantes(competicao.periodo_inscricao_fim);
            const estaAtiva = inscricoesAbertas(
              competicao.periodo_inscricao_inicio,
              competicao.periodo_inscricao_fim
            );
            let jogadoresNestaCompeticao = 0;
            competicao.equipes?.forEach((equipe: Team) => {
              const playerCount = equipe.jogadores?.[0]?.count || 0;
              jogadoresNestaCompeticao += playerCount;
            });

            return (
              <div key={competicao.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-medium text-lg">{competicao.nome}</h3>
                    <p className="text-sm text-gray-500">
                      {formatarData(parseDate(competicao.periodo_inscricao_inicio))} - {formatarData(parseDate(competicao.periodo_inscricao_fim))}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <FiUsers className="mr-1" /> Jogadores na Competição: <span className="font-semibold ml-1">{jogadoresNestaCompeticao}</span>
                    </p>
                    <p className="text-xs mt-1">
                      {estaAtiva ? (
                        <span className="text-green-600 font-semibold">Inscrições abertas ({diasRestantes} dia{diasRestantes === 1 ? "" : "s"} restantes)</span>
                      ) : (
                        <span className="text-red-600 font-semibold">Inscrições encerradas</span>
                      )}
                    </p>
                  </div>
                  <a
                    href={`/dashboard/competicoes/${competicao.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver Detalhes
                  </a>
                </div>
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center">
                    <FiUsers className="mr-2" /> Equipes Participantes ({competicao.equipes?.length || 0})
                  </h4>
                  {competicao.equipes?.length > 0 ? (
                    <div className="space-y-3">
                      {competicao.equipes.map((equipe: Team) => {
                        const teamPlayerCount = equipe.jogadores?.[0]?.count || 0;
                        return (
                          <div key={equipe.id} className="flex justify-between items-center p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{equipe.nome}</p>
                              <p className="text-sm text-gray-500">{equipe.responsavel_nome} ({equipe.responsavel_turma})</p>
                              {teamPlayerCount > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  <span className="font-semibold">{teamPlayerCount}</span> jogadores
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <TeamStatusDropdown
                                teamId={equipe.id}
                                currentStatus={equipe.status || "pendente"}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma equipe inscrita ainda</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}