import { createClient } from "@/lib/supabase/server";
import { FiUser, FiMail, FiHash, FiInfo, FiCalendar, FiCheckCircle } from "react-icons/fi";

interface Jogador {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  numero_camisa?: number;
}

interface CompeticaoNome {
  nome: string;
}

interface EquipeDetalhada {
  id: string;
  nome: string;
  modalidade: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_turma: string;
  created_at: string;
  status: 'aprovado' | 'reprovado' | 'pendente';
  competicao_id: string;
  competicoes: CompeticaoNome | null;
  jogadores: Jogador[];
}

export default async function EquipeDetailsPage(props:any) {
  const { params } = props;
  const supabase = createClient();
  const equipeId = params.id; 

  const { data: equipe, error } = await (await supabase)
    .from('equipes')
    .select(`
      *,
      competicoes (nome),
      jogadores (*)
    `)
    .eq('id', equipeId)
    .single();

  if (error || !equipe) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-500 text-lg p-4 text-center">
        <FiInfo className="mr-2 text-3xl mb-2" />
        <p>Erro ao carregar os detalhes da equipe.</p>
        {error && <p className="text-sm text-red-400 mt-2">Detalhes do erro: {error.message || JSON.stringify(error)}</p>}
        {!equipe && <p className="text-sm text-red-400">Equipe não encontrada.</p>}
      </div>
    );
  }

  const equipeData: EquipeDetalhada = equipe as unknown as EquipeDetalhada;

  return (
    <div className="container mx-auto p-6">
      <section className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{equipeData.nome}</h1>
        <p className="text-lg text-gray-600 mb-2">Modalidade: <span className="font-semibold">{equipeData.modalidade}</span></p>
        <p className="text-lg text-gray-600 mb-4 flex items-center">
          <FiCheckCircle className="mr-2 text-green-500" /> Status: <span className="font-semibold capitalize">{equipeData.status}</span>
        </p>
        {equipeData.competicoes && (
          <p className="text-gray-700 mb-6 flex items-center">
            <FiCalendar className="inline-block mr-2 text-gray-500" /> Competição: <span className="font-semibold">{equipeData.competicoes.nome}</span>
          </p>
        )}
        <div className="border-t pt-6 mt-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Informações do Responsável</h2>
          <p className="text-gray-700 mb-2 flex items-center">
            <FiUser className="mr-2 text-gray-500" /> Nome: <span className="font-semibold ml-1">{equipeData.responsavel_nome}</span>
          </p>
          <p className="text-gray-700 mb-2 flex items-center">
            <FiMail className="mr-2 text-gray-500" /> E-mail: <span className="font-semibold ml-1">{equipeData.responsavel_email}</span>
          </p>
          <p className="text-gray-700 mb-2 flex items-center">
            <FiHash className="mr-2 text-gray-500" /> Turma: <span className="font-semibold ml-1">{equipeData.responsavel_turma}</span>
          </p>
        </div>
        <div className="border-t pt-6 mt-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Jogadores ({equipeData.jogadores?.length || 0})</h2>
          {equipeData.jogadores && equipeData.jogadores.length > 0 ? (
            <div className="space-y-3">
              {equipeData.jogadores.map((jogador: Jogador) => (
                <div key={jogador.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 flex items-center">
                  <FiUser className="mr-3 text-blue-500 text-lg" />
                  <div>
                    <p className="font-medium">{jogador.nome}</p>
                    <p className="text-sm text-gray-600">Matrícula: {jogador.matricula} | Turma: {jogador.turma}</p>
                    {jogador.numero_camisa && (
                      <p className="text-xs text-gray-500">Número da Camisa: {jogador.numero_camisa}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">Nenhum jogador cadastrado para esta equipe ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}