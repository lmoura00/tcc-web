"use server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CompetitionModalitiesForm } from "@/app/(protect)/dashboard/components/CompetitionModalitiesForm";

export default async function NovaCompeticaoPage() {
  const supabase = createClient();
  const { data: { user } } = await (await supabase).auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function handleSubmit(formData: FormData) {
    "use server";

    const supabase = createClient();

    const { data: { user } } = await (await supabase).auth.getUser();

    if (!user) {
      throw new Error("Não autorizado");
    }

    const nome = formData.get('nome') as string;
    const periodoInscricaoInicio = formData.get('periodoInscricaoInicio') as string;
    const periodoInscricaoFim = formData.get('periodoInscricaoFim') as string;
    const periodoCompeticaoInicio = formData.get('periodoCompeticaoInicio') as string;
    const periodoCompeticaoFim = formData.get('periodoCompeticaoFim') as string;
    
    // Obtenha as modalidades do FormData
    const modalidadesRaw = formData.getAll('modalidades') as string[];
    // Garanta que as modalidades sejam únicas antes de salvar
    const modalidadesUnicas = Array.from(new Set(modalidadesRaw));

    if (modalidadesUnicas.length === 0) {
      throw new Error("Selecione pelo menos uma modalidade");
    }

    const modalidadesJson = JSON.stringify(modalidadesUnicas); // Converte o array único para JSON string

    const { error } = await (await supabase)
      .from('competicoes')
      .insert([{
        nome,
        data_inicio: periodoCompeticaoInicio,
        periodo_inscricao_inicio: periodoInscricaoInicio,
        periodo_inscricao_fim: periodoInscricaoFim,
        periodo_competicao_inicio: periodoCompeticaoInicio,
        periodo_competicao_fim: periodoCompeticaoFim,
        modalidades_disponiveis: modalidadesJson, // Salva como JSON string
        criado_por: user.id
      }]);

    if (error) {
      console.error('Erro ao criar competição:', error);
      throw error;
    }

    redirect('/dashboard/competicoes');
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Nova Competição</h1>

      <form action={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Competição*
          </label>
          <input
            type="text"
            name="nome"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Início das Inscrições*
            </label>
            <input
              type="date"
              name="periodoInscricaoInicio"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fim das Inscrições*
            </label>
            <input
              type="date"
              name="periodoInscricaoFim"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Início da Competição*
            </label>
            <input
              type="date"
              name="periodoCompeticaoInicio"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fim da Competição*
            </label>
            <input
              type="date"
              name="periodoCompeticaoFim"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <CompetitionModalitiesForm
          initialModalidades={[]}
        />

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Criar Competição
          </button>

          <Link
            href="/dashboard/competicoes"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
