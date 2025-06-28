import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Clock, Check, X } from "lucide-react";
import { updateMatchResult } from "./action"; 
import { MatchEditForm } from "./MatchEditForm";
import { DeleteMatchButton } from "./DeleteMatchButton";

export default async function PartidasCompeticaoPage({
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
  
  const { data: partidas } = await (await supabase)
    .from("partidas")
    .select(`
      *,
      equipe_a:equipes!equipe_a_id(nome, responsavel_email, responsavel_nome),
      equipe_b:equipes!equipe_b_id(nome, responsavel_email, responsavel_nome)
    `)
    .eq("competicao_id", params.id)
    .order("data", { ascending: true });

  return (
    <div className="space-y-6 px-4 md:px-8 max-w-5xl mx-auto py-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/competicoes/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ChevronLeft className="h-4 w-4" /> Voltar
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          Partidas - {competicao.nome}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {partidas?.length ? (
          <div className="space-y-4">
            {partidas.map((partida) => (
              <div key={partida.id} className="border rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex-1 text-center">
                    <p className="font-semibold">{partida.equipe_a?.nome}</p>
                    {partida.placar_casa !== null && (
                      <p className="text-2xl font-bold">{partida.placar_casa}</p>
                    )}
                  </div>
                  
                  <div className="px-4 flex flex-col items-center">
                    <span className="text-gray-600">vs</span>
                    <span className="text-xs text-gray-500 mt-1">
                      {partida.fase}
                    </span>
                  </div>
                  
                  <div className="flex-1 text-center">
                    <p className="font-semibold">{partida.equipe_b?.nome}</p>
                    {partida.placar_fora !== null && (
                      <p className="text-2xl font-bold">{partida.placar_fora}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm text-gray-600">
                    <MatchEditForm partida={partida} />
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    {partida.status === 'pendente' && (
                      <span className="flex items-center text-yellow-600 text-sm">
                        <Clock className="h-4 w-4 mr-1" /> Pendente
                      </span>
                    )}
                    {partida.status === 'concluida' && (
                      <span className="flex items-center text-green-600 text-sm">
                        <Check className="h-4 w-4 mr-1" /> Concluída
                      </span>
                    )}
                    {partida.status === 'cancelada' && (
                      <span className="flex items-center text-red-600 text-sm">
                        <X className="h-4 w-4 mr-1" /> Cancelada
                      </span>
                    )}
                    <DeleteMatchButton matchId={partida.id} />
                  </div>
                </div>
                
                {/* Formulário para atualizar resultado */}
                {partida.status === 'pendente' && (
                  <form 
                    action={updateMatchResult}
                    className="mt-4 flex gap-2 items-center"
                  >
                    <input type="hidden" name="id" value={partida.id} />
                    <input
                      type="number"
                      name="homeScore"
                      min="0"
                      className="w-16 px-2 py-1 border rounded"
                      placeholder="0"
                      required
                    />
                    <span className="text-gray-500">x</span>
                    <input
                      type="number"
                      name="awayScore"
                      min="0"
                      className="w-16 px-2 py-1 border rounded"
                      placeholder="0"
                      required
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Salvar
                    </Button>
                  </form>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-gray-500">Nenhuma partida cadastrada ainda</p>
            <Link href={`/dashboard/competicoes/${params.id}`}>
              <Button variant="outline" className="mt-4">
                Voltar para a competição
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}