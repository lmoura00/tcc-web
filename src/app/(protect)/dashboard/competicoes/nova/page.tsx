import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function NovaCompeticaoPage() {

  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  
  if (!user) {
    redirect("/login")
  }

  async function handleSubmit(formData: FormData) {
    "use server"
    
    const supabase = createClient()
    
    const { data: { user } } = await (await supabase).auth.getUser()
    
    if (!user) {
      throw new Error("Não autorizado")
    }
    
    const nome = formData.get('nome') as string
    const periodoInscricaoInicio = formData.get('periodoInscricaoInicio') as string
    const periodoInscricaoFim = formData.get('periodoInscricaoFim') as string
    const periodoCompeticaoInicio = formData.get('periodoCompeticaoInicio') as string
    const periodoCompeticaoFim = formData.get('periodoCompeticaoFim') as string
    const modalidades = formData.getAll('modalidades') as string[]
    
    // Validação das modalidades
    if (modalidades.length === 0) {
      throw new Error("Selecione pelo menos uma modalidade")
    }

    const { error } = await (await supabase)
      .from('competicoes')
      .insert([{ 
        nome, 
        data_inicio: periodoCompeticaoInicio,
        periodo_inscricao_inicio: periodoInscricaoInicio,
        periodo_inscricao_fim: periodoInscricaoFim,
        periodo_competicao_inicio: periodoCompeticaoInicio,
        periodo_competicao_fim: periodoCompeticaoFim,
        modalidades_disponiveis: modalidades, 
        criado_por: user.id 
      }])
    
    if (error) {
      console.error('Erro ao criar competição:', error)
      throw error
    }
    
    redirect('/dashboard/competicoes')
  }

  // Lista de modalidades disponíveis
  const modalidadesDisponiveis = [
    "Futsal Masculino",
    "Futsal Feminino",
  ]

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

        {/* Seção de Modalidades */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modalidades Disponíveis*
          </label>
          <div className="space-y-2">
            {modalidadesDisponiveis.map((modalidade) => (
              <div key={modalidade} className="flex items-center">
                <input
                  type="checkbox"
                  id={`modalidade-${modalidade}`}
                  name="modalidades"
                  value={modalidade}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`modalidade-${modalidade}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {modalidade}
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
  )
}