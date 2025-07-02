import Link from "next/link";
import { FiPlus, FiCalendar, FiClock, FiUsers } from "react-icons/fi";
import { createClient } from "@/lib/supabase/server";
import { TeamStatusDropdown } from "./components/TeamStatusDropdown";

type Competicao = {
  id: string;
  nome: string;
  periodo_inscricao_inicio: string;
  periodo_inscricao_fim: string;
  periodo_competicao_inicio: string;
  periodo_competicao_fim: string;
};

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await (await supabase).auth.getUser();

  let fullName = "";
  if (user) {
    const { data: profile } = await (await supabase)
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    fullName = (profile?.first_name || "") + " " + (profile?.last_name || "");
  }

  const { data: todasEquipes } = await (await supabase)
    .from("equipes")
    .select("*");

  const { data: competicoes } = await (await supabase)
    .from("competicoes")
    .select("*")
    .order("periodo_competicao_inicio", { ascending: false });

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  };

  const formatarData = (date: Date) => {
    return date.toLocaleDateString("pt-BR");
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

  const hoje = new Date();
  const { data: proximasPartidas } = await (await supabase)
    .from("partidas")
    .select(`
      *,
      equipe_a:equipes!equipe_a_id(nome),
      equipe_b:equipes!equipe_b_id(nome),
      competicao:competicoes(nome)
    `)
    .gt("data", hoje.toISOString())
    .order("data", { ascending: true })
    .limit(5);

  return (
    <div className="max-w-6xl mx-auto py-8 px-2">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          {fullName && (
            <p className="text-gray-500 mt-1 text-base">Bem-vindo, <span className="font-semibold">{fullName.trim()}</span></p>
          )}
        </div>
        <Link
          href="/dashboard/competicoes/nova"
          className="flex items-center px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
        >
          <FiPlus className="mr-2" /> Nova Competição
        </Link>
      </div>

      <section className="bg-white rounded-lg shadow-md p-6 mb-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Competições com equipes pendentes
        </h2>
        <div className="space-y-8">
          {(() => {
            const competicoesComPendentes = (competicoes || []).filter(
              (competicao) => {
                const equipesPendentes =
                  todasEquipes?.filter(
                    (equipe) =>
                      equipe.competicao_id === competicao.id &&
                      equipe.status === "pendente"
                  ) || [];
                return equipesPendentes.length > 0;
              }
            );

            if (competicoesComPendentes.length === 0) {
              return (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Nenhuma equipe pendente de aprovação no momento.
                  </p>
                </div>
              );
            }

            return competicoesComPendentes.map((competicao) => {
              const equipesPendentes =
                todasEquipes?.filter(
                  (equipe) =>
                    equipe.competicao_id === competicao.id &&
                    equipe.status === "pendente"
                ) || [];

              const diasRestantes = calcularDiasRestantes(
                competicao.periodo_inscricao_fim
              );
              const corPrazo =
                diasRestantes <= 3
                  ? "text-red-500"
                  : diasRestantes <= 7
                  ? "text-yellow-500"
                  : "text-green-500";

              return (
                <div
                  key={competicao.id}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
                    <div>
                      <h3 className="font-bold text-xl">{competicao.nome}</h3>
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <FiCalendar className="mr-1" />
                        <span>
                          Inscrições: {formatarData(parseDate(competicao.periodo_inscricao_inicio))} - {formatarData(parseDate(competicao.periodo_inscricao_fim))}
                        </span>
                      </div>
                    </div>
                    <div className={`flex items-center font-medium ${corPrazo}`}>
                      <FiClock className="mr-1" />
                      <span>
                        {inscricoesAbertas(
                          competicao.periodo_inscricao_inicio,
                          competicao.periodo_inscricao_fim
                        )
                          ? `${diasRestantes} dia${diasRestantes === 1 ? "" : "s"} para encerrar`
                          : "Inscrições encerradas"}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {equipesPendentes.map((equipe) => (
                      <div
                        key={equipe.id}
                        className="border-l-4 border-blue-500 bg-white pl-4 py-2 rounded flex flex-col md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <h4 className="font-semibold text-base">{equipe.nome}</h4>
                          <div className="flex flex-wrap gap-2 text-gray-600 text-sm mt-1">
                            <span>
                              {equipe.membros} membro{equipe.membros === 1 ? "" : "s"}
                            </span>
                            <span>•</span>
                            <span>
                              Criada em: {formatarData(parseDate(equipe.created_at))}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <TeamStatusDropdown
                            teamId={equipe.id}
                            currentStatus={equipe.status || "pendente"}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-md p-6 mb-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
          <FiClock className="text-blue-500" /> Próximas partidas
        </h2>
        {proximasPartidas && proximasPartidas.length > 0 ? (
          <ul className="flex flex-col gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
            {proximasPartidas.map((partida) => (
              <li
                key={partida.id}
                className="flex flex-col justify-between bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4 shadow-sm hover:shadow-md transition min-h-[120px]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-blue-700 text-lg">{partida.equipe_a?.nome}</span>
                      <span className="mx-1 text-gray-500 font-semibold">vs</span>
                      <span className="font-bold text-blue-700 text-lg">{partida.equipe_b?.nome}</span>
                    </div>
                    <span className="text-sm text-gray-500 mt-1">
                      {partida.competicao?.nome && (
                        <span className="italic">{partida.competicao.nome}</span>
                      )}
                    </span>
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-1">
                    <span className="flex items-center gap-1 text-base font-medium text-gray-700">
                      <FiCalendar className="inline-block text-blue-400" />
                      {partida.data
                        ? new Date(partida.data).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Data a definir"}
                    </span>
                    {partida.local && (
                      <span className="flex items-center gap-1 text-sm text-blue-600">
                        <FiUsers className="inline-block" />
                        {partida.local}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-gray-500 text-center py-4">
            Nenhuma partida futura agendada.
          </div>
        )}
      </section>

      <section className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Todas as Competições
        </h2>
        <div className="space-y-6">
          {(competicoes || []).map((competicao: Competicao) => {
            const equipesCompeticao =
              todasEquipes?.filter(
                (equipe) => equipe.competicao_id === competicao.id
              ) || [];

            const diasRestantes = calcularDiasRestantes(
              competicao.periodo_inscricao_fim
            );
            const estaAtiva = inscricoesAbertas(
              competicao.periodo_inscricao_inicio,
              competicao.periodo_inscricao_fim
            );
            const corPrazo =
              diasRestantes <= 3
                ? "text-red-500"
                : diasRestantes <= 7
                ? "text-yellow-500"
                : "text-green-500";

            return (
              <div
                key={competicao.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-gray-50"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{competicao.nome}</h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <FiCalendar className="mr-1" />
                        <span>
                          Inscrições: {formatarData(parseDate(competicao.periodo_inscricao_inicio))} - {formatarData(parseDate(competicao.periodo_inscricao_fim))}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="mr-1" />
                        <span>
                          Competição: {formatarData(parseDate(competicao.periodo_competicao_inicio))} - {formatarData(parseDate(competicao.periodo_competicao_fim))}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <FiUsers className="mr-1" />
                        <span>{equipesCompeticao.length} equipe{equipesCompeticao.length === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                    <div className={`flex items-center font-medium ${corPrazo}`}>
                      <FiClock className="mr-1" />
                      {estaAtiva ? (
                        <>
                          <span className="text-green-500">●</span>
                          <span className="ml-1">
                            Inscrições abertas ({diasRestantes} dia{diasRestantes === 1 ? "" : "s"} restantes)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-red-500">●</span>
                          <span className="ml-1">
                            Inscrições encerradas
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Link
                      href={`/dashboard/competicoes/${competicao.id}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                    >
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
