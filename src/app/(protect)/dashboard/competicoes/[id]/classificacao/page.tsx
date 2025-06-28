import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function ClassificacaoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  
  const { data: competicao } = await (await supabase)
    .from("competicoes")
    .select("*")
    .eq("id", params.id)
    .single();
  
  if (!competicao) return notFound();
  
  // Obter classificação calculada (você pode criar uma view no Supabase para isso)
  const { data: classificacao } = await (await supabase)
    .from("classificacao_view")
    .select("*")
    .eq("competicao_id", params.id)
    .order("pontos", { ascending: false })
    .order("saldo_gols", { ascending: false });

  return (
    <div className="space-y-6 px-4 md:px-8 max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/competicoes/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Classificação - {competicao.nome}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipe</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">J</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">V</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">D</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GC</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SG</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classificacao?.map((equipe, index) => (
                <tr key={equipe.equipe_id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.nome_equipe}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{equipe.pontos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.jogos}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.vitorias}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.empates}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.derrotas}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.gols_pro}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.gols_contra}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{equipe.saldo_gols}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}