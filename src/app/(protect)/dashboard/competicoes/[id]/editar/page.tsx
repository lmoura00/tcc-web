import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { handleSubmit } from "./action"


export default async function EditarCompeticaoPage(props: any) {
  const { params } = props;
  const { id } = params;
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  const { data: competicao } = await (await supabase)
    .from('competicoes')
    .select('*')
    .eq('id', id)
    .single()

  if (!competicao) {
    return notFound()
  }

  const { data: modalidades } = await (await supabase)
    .from('modalidades')
    .select('id, nome')
    .order('nome', { ascending: true })

  const { data: modalidadesSelecionadas } = await (await supabase)
    .from('competicoes_modalidades')
    .select('modalidade_id')
    .eq('competicao_id', id)

  const modalidadesSelecionadasIds = modalidadesSelecionadas?.map(m => m.modalidade_id) || []

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">Editar Competição</h1>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modalidades*
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {modalidades?.map((modalidade) => (
              <div key={modalidade.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`modalidade-${modalidade.id}`}
                  name="modalidades"
                  value={modalidade.id}
                  defaultChecked={modalidadesSelecionadasIds.includes(modalidade.id)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor={`modalidade-${modalidade.id}`} className="ml-2 block text-sm text-gray-700">
                  {modalidade.nome}
                </label>
              </div>
            ))}
          </div>
        </div>
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
  )
}