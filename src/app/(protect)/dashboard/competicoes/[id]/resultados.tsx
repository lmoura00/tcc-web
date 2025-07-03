import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ResultadosPartidas({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: partidas } = await (await supabase)
    .from("partidas")
    .select(`
      id, data, local, 
      equipe_a_id, equipe_b_id, 
      equipes:equipe_a_id (nome), 
      equipes_b:equipe_b_id (nome)
    `)
    .eq("competicao_id", params.id);

  const { data: sumulas } = await (await supabase)
    .from("sumulas")
    .select("partida_id, gols_equipe_a, gols_equipe_b");

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Resultados das Partidas</h2>
      <table className="w-full border">
        <thead>
          <tr>
            <th>Data</th>
            <th>Local</th>
            <th>Equipe A</th>
            <th>Placar</th>
            <th>Equipe B</th>
            <th>Súmula</th>
          </tr>
        </thead>
        <tbody>
          {partidas?.map((partida) => {
            const sumula = sumulas?.find(s => s.partida_id === partida.id);
            return (
              <tr key={partida.id}>
                <td>{new Date(partida.data).toLocaleDateString("pt-BR")}</td>
                <td>{partida.local}</td>
                <td>{partida.equipes?.[0]?.nome}</td>
                <td>
                  {sumula
                    ? `${sumula.gols_equipe_a} x ${sumula.gols_equipe_b}`
                    : "-"}
                </td>
                <td>{partida.equipes_b?.[0]?.nome}</td>
                <td>
                  {sumula ? (
                    <Link
                      href={`/dashboard/sumula/${partida.id}`}
                      className="text-blue-600 underline"
                    >
                      Ver Súmula
                    </Link>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}