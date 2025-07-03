import { createClient } from "@/lib/supabase/server";
import { FiUsers, FiCalendar, FiMail, FiSearch } from "react-icons/fi";

type JogadorCount = { count: number };

type EquipeFromDb = {
  id: string;
  nome: string;
  modalidade: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_turma: string;
  created_at: string;
  status: string;
  jogadores: JogadorCount[];
};

type CompeticaoFromDb = {
  id: string;
  nome: string;
  periodo_competicao_inicio: string;
  periodo_competicao_fim: string;
  equipes: EquipeFromDb[];
};



export default async function EquipeDetailsPage(props:any) {
  console.log("EquipesPage props:", props);
  const supabase = createClient();

  const { data: competicoes, error } = await (await supabase)
    .from('competicoes')
    .select(`
      id,
      nome,
      periodo_competicao_inicio,
      periodo_competicao_fim,
      equipes (
        id,
        nome,
        modalidade,
        responsavel_nome,
        responsavel_email,
        responsavel_turma,
        created_at,
        status,
        jogadores (
          count
        )
      )
    `)
    .order('periodo_competicao_inicio', { ascending: false });

  if (error) {
    return <div className="text-red-500 p-4">Erro ao carregar as competições e equipes.</div>;
  }

  const formatarData = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const dateLocal = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return dateLocal.toLocaleDateString("pt-BR");
  };

  const statusColor = (status: string) => {
    if (status === "aprovado") return "bg-green-100 text-green-700";
    if (status === "pendente") return "bg-yellow-100 text-yellow-700";
    if (status === "reprovado") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const totalEquipes = (competicoes as CompeticaoFromDb[] | null)?.reduce((acc, c) => acc + (c.equipes?.length || 0), 0) || 0;
  const totalCompeticoes = (competicoes as CompeticaoFromDb[] | null)?.length || 0;
  const totalPendentes = (competicoes as CompeticaoFromDb[] | null)?.reduce(
    (acc, c) => acc + (c.equipes?.filter((e: EquipeFromDb) => e.status === "pendente").length || 0), 0
  ) || 0;

  const searchParams = props.searchParams || {};
  const anoSelecionado = searchParams?.ano || "";
  const termoBusca = (searchParams?.termo || "").toLowerCase();

  const competicoesFiltradas = ((competicoes as CompeticaoFromDb[]) || []).filter((competicao) => {
    const anoCompeticao = competicao.periodo_competicao_inicio?.slice(0, 4);
    const nomeCompeticao = (competicao.nome || "").toLowerCase();
    const equipesFiltradas = (competicao.equipes || []).filter((equipe) => {
      const nomeEquipe = (equipe.nome || "").toLowerCase();
      return (
        !termoBusca ||
        nomeCompeticao.includes(termoBusca) ||
        nomeEquipe.includes(termoBusca)
      );
    });
    return (
      (!anoSelecionado || anoCompeticao === anoSelecionado) &&
      (termoBusca === "" || nomeCompeticao.includes(termoBusca) || equipesFiltradas.length > 0)
    );
  }).map((competicao) => ({
    ...competicao,
    equipes: (competicao.equipes || []).filter((equipe) => {
      const nomeEquipe = (equipe.nome || "").toLowerCase();
      const nomeCompeticao = (competicao.nome || "").toLowerCase();
      return (
        !termoBusca ||
        nomeCompeticao.includes(termoBusca) ||
        nomeEquipe.includes(termoBusca)
      );
    }),
  }));

  const anosDisponiveis = Array.from(
    new Set(((competicoes as CompeticaoFromDb[]) || []).map(c => c.periodo_competicao_inicio?.slice(0, 4)).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-6xl mx-auto px-2 md:px-6 py-6">
      <form
        method="get"
        className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between"
      >
        <div className="flex gap-2 w-full md:w-auto">
          <select
            name="ano"
            defaultValue={anoSelecionado}
            className="border rounded-md px-3 py-2 text-gray-700 bg-white"
          >
            <option value="">Todos os anos</option>
            {anosDisponiveis.map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <input
              type="text"
              name="termo"
              defaultValue={termoBusca}
              placeholder="Buscar competição ou equipe..."
              className="border rounded-md px-3 py-2 w-full pl-10 text-gray-700 bg-white"
            />
            <FiSearch className="absolute left-2 top-3 text-gray-400" />
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition-colors"
        >
          Filtrar
        </button>
      </form>

      <section className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center py-6">
          <span className="text-3xl font-bold text-blue-700">{totalCompeticoes}</span>
          <span className="text-gray-600 mt-1">Competições</span>
        </div>
        <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center py-6">
          <span className="text-3xl font-bold text-green-700">{totalEquipes}</span>
          <span className="text-gray-600 mt-1">Equipes</span>
        </div>
        <div className="bg-white rounded-lg shadow flex flex-col items-center justify-center py-6">
          <span className="text-3xl font-bold text-yellow-600">{totalPendentes}</span>
          <span className="text-gray-600 mt-1">Equipes Pendentes</span>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow-md p-4 md:p-6">
        <h1 className="text-2xl font-semibold text-gray-700 mb-6 text-center md:text-left">Equipes por Competição</h1>
        {competicoesFiltradas && competicoesFiltradas.length > 0 ? (
          <div className="space-y-10">
            {competicoesFiltradas.map(competicao => (
              <div key={competicao.id} className="border border-gray-100 rounded-lg p-4 md:p-6 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-blue-600" size={22} />
                    <span className="text-xl font-bold text-gray-800">{competicao.nome}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {formatarData(competicao.periodo_competicao_inicio as string)} - {formatarData(competicao.periodo_competicao_fim as string)}
                  </span>
                  <a
                    href={`/dashboard/competicoes/${competicao.id}`}
                    className="mt-2 md:mt-0 inline-block text-center text-indigo-600 hover:text-indigo-800 text-sm font-medium py-1 px-3 rounded-md border border-indigo-600 hover:border-indigo-800 transition-colors"
                  >
                    Ver detalhes da competição
                  </a>
                </div>
                {competicao.equipes && competicao.equipes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {competicao.equipes.map((equipe) => {
                      const playerCount = equipe.jogadores?.[0]?.count || 0;
                      return (
                        <div key={equipe.id} className="border border-gray-200 rounded-lg p-4 bg-white flex flex-col justify-between hover:shadow transition">
                          <div>
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-lg text-gray-900">{equipe.nome}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColor(equipe.status)}`}>
                                {equipe.status}
                              </span>
                            </div>
                            <div className="text-sm text-gray-500 mb-2">{equipe.modalidade}</div>
                            <div className="flex items-center text-sm text-gray-700 mt-1">
                              <FiUsers className="mr-1 text-gray-500" /> {equipe.responsavel_nome} ({equipe.responsavel_turma})
                            </div>
                            <div className="flex items-center text-sm text-gray-700">
                              <FiMail className="mr-1 text-gray-500" /> {equipe.responsavel_email}
                            </div>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <FiUsers className="mr-1 text-gray-500" /> Jogadores: <span className="font-semibold ml-1">{playerCount}</span>
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Criada em: {formatarData(equipe.created_at)}
                            </div>
                          </div>
                          <a
                            href={`/dashboard/equipes/${equipe.id}`}
                            className="mt-4 inline-block text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-1 px-3 rounded-md border border-blue-600 hover:border-blue-800 transition-colors"
                          >
                            Ver Detalhes da Equipe
                          </a>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm italic mt-2">Nenhuma equipe inscrita nesta competição ainda.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-base text-center">Nenhuma competição encontrada.</p>
        )}
      </section>
    </div>
  );
}