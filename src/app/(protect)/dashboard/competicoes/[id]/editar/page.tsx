"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { handleSubmit } from "./action";
import { CompetitionModalitiesForm } from "@/app/(protect)/dashboard/components/CompetitionModalitiesForm";

export default async function EditarCompeticaoPage(props: any) {
  const { params } = props;
  const { id } = params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: competicao, error: fetchError } = await supabase
    .from("competicoes")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Erro ao buscar competição:", fetchError);
    return notFound();
  }

  if (!competicao) {
    return notFound();
  }

  // Parse the JSON string from modalidades_disponiveis back into an array
  let initialSelectedModalities: string[] = [];
  if (competicao.modalidades_disponiveis) {
    try {
      initialSelectedModalities = JSON.parse(competicao.modalidades_disponiveis);
      // Ensure it's an array of strings, even if JSON.parse returns something else
      if (!Array.isArray(initialSelectedModalities) || !initialSelectedModalities.every(item => typeof item === 'string')) {
        console.warn("Parsed modalities_disponiveis is not an array of strings. Resetting to empty array.");
        initialSelectedModalities = [];
      }
    } catch (parseError) {
      console.error("Erro ao parsear modalidades_disponiveis:", parseError);
      initialSelectedModalities = []; // Fallback to empty array on parse error
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        Editar Competição
      </h1>
      <form action={handleSubmit} className="max-w-lg space-y-4">
        <input type="hidden" name="competicaoId" value={id} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Competição*
          </label>
          <input
            type="text"
            name="nome"
            defaultValue={competicao.nome}
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
              defaultValue={competicao.periodo_inscricao_inicio}
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
              defaultValue={competicao.periodo_inscricao_fim}
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
              defaultValue={competicao.periodo_competicao_inicio}
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
              defaultValue={competicao.periodo_competicao_fim}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
        </div>


        <CompetitionModalitiesForm
          initialModalidades={initialSelectedModalities}
        />

        <div className="flex space-x-3 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Salvar Alterações
          </button>
          <Link
            href={`/dashboard/competicoes/${id}`}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
