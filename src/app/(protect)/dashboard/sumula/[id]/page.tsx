import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FaUserCheck, FaUserTimes, FaRegStickyNote, FaRegSquare } from "react-icons/fa";
import { BsFillExclamationTriangleFill } from "react-icons/bs";
import { IoMdFootball } from "react-icons/io";


function renderCartoes(cartoes?: Record<string, any>, jogadores?: any[], cor = "yellow") {
  if (!cartoes || Object.keys(cartoes).length === 0) return <span className="text-gray-500">Nenhum</span>;
  return (
    <ul className="ml-2">
      {Object.entries(cartoes).map(([jogadorId, quantidade]) => (
        <li key={jogadorId} className="flex items-center gap-2">
          <span className={`inline-block w-3 h-4 rounded-sm ${cor === "yellow" ? "bg-yellow-300 border border-yellow-500" : "bg-red-400 border border-red-700"}`}></span>
          <span className="font-medium">{jogadores?.find(j => j.id === jogadorId)?.nome || "Jogador"}</span>
          <span className="text-xs text-gray-600">x{quantidade}</span>
        </li>
      ))}
    </ul>
  );
}

function renderFaltas(faltas?: Record<string, any>, jogadores?: any[]) {
  if (!faltas || Object.keys(faltas).length === 0) return <span className="text-gray-500">Nenhuma</span>;
  return (
    <ul className="ml-2">
      {Object.entries(faltas).map(([jogadorId, quantidade]) => (
        <li key={jogadorId} className="flex items-center gap-2">
          <BsFillExclamationTriangleFill className="text-orange-400" />
          <span className="font-medium">{jogadores?.find(j => j.id === jogadorId)?.nome || "Jogador"}</span>
          <span className="text-xs text-gray-600">x{quantidade}</span>
        </li>
      ))}
    </ul>
  );
}

function renderPresenca(presenca?: { equipeA?: any[]; equipeB?: any[] }) {
  if (!presenca) return <span className="text-gray-500">Nenhum dado</span>;
  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="font-semibold text-green-700">Equipe A</span>
        <ul className="ml-4">
          {presenca.equipeA?.map(j => (
            <li key={j.id} className="flex items-center gap-2">
              {j.presente ? (
                <FaUserCheck className="text-green-600" title="Presente" />
              ) : (
                <FaUserTimes className="text-red-500" title="Ausente" />
              )}
              <span className="font-medium">{j.nome}</span>
              {j.numero_camisa && (
                <span className="text-xs text-gray-600">Camisa {j.numero_camisa}</span>
              )}
            </li>
          )) || <li className="text-gray-500">Nenhum</li>}
        </ul>
      </div>
      <div>
        <span className="font-semibold text-blue-700">Equipe B</span>
        <ul className="ml-4">
          {presenca.equipeB?.map(j => (
            <li key={j.id} className="flex items-center gap-2">
              {j.presente ? (
                <FaUserCheck className="text-green-600" title="Presente" />
              ) : (
                <FaUserTimes className="text-red-500" title="Ausente" />
              )}
              <span className="font-medium">{j.nome}</span>
              {j.numero_camisa && (
                <span className="text-xs text-gray-600">Camisa {j.numero_camisa}</span>
              )}
            </li>
          )) || <li className="text-gray-500">Nenhum</li>}
        </ul>
      </div>
    </div>
  );
}

export default async function SumulaViewPage(props: any) {
  const { params } = props;
  const supabase = createClient();

  const { data: sumula, error } = await (await supabase)
    .from("sumulas")
    .select(
      `
        *,
        equipe_a: equipe_a_id (nome),
        equipe_b: equipe_b_id (nome)
      `
    )
    .eq("partida_id", params.id)
    .single();

  let jogadores: any[] = [];
  if (sumula?.equipe_a_id && sumula?.equipe_b_id) {
    const { data: jogadoresA } = await (await supabase)
      .from("jogadores")
      .select("id, nome")
      .eq("equipe_id", sumula.equipe_a_id);
    const { data: jogadoresB } = await (await supabase)
      .from("jogadores")
      .select("id, nome")
      .eq("equipe_id", sumula.equipe_b_id);
    jogadores = [...(jogadoresA || []), ...(jogadoresB || [])];
  }

  if (error || !sumula) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Súmula não encontrada</h1>
        <Link href="/dashboard/competicoes" className="text-blue-600 underline">Voltar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8 border border-gray-200">
      <h1 className="text-3xl font-extrabold mb-6 text-center flex items-center justify-center gap-2">
        <FaRegStickyNote className="text-blue-600" /> Súmula da Partida
      </h1>
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-green-700">{sumula.equipe_a?.nome || "-"}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-extrabold text-gray-800 flex items-center gap-2">
            <IoMdFootball className="text-gray-500" />
            {sumula.gols_equipe_a} <span className="text-xl text-gray-500">x</span> {sumula.gols_equipe_b}
            <IoMdFootball className="text-gray-500" />
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-blue-700">{sumula.equipe_b?.nome || "-"}</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="font-semibold text-yellow-700 flex items-center gap-2 mb-1">
            <FaRegSquare className="text-yellow-400" /> Cartões Amarelos
          </h2>
          {renderCartoes(sumula.cartoes_amarelos, jogadores, "yellow")}
          <h2 className="font-semibold text-red-700 flex items-center gap-2 mt-4 mb-1">
            <FaRegSquare className="text-red-500" /> Cartões Vermelhos
          </h2>
          {renderCartoes(sumula.cartoes_vermelhos, jogadores, "red")}
          <h2 className="font-semibold text-orange-700 flex items-center gap-2 mt-4 mb-1">
            <BsFillExclamationTriangleFill className="text-orange-400" /> Faltas
          </h2>
          {renderFaltas(sumula.faltas, jogadores)}
        </div>
        <div>
          <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
            <FaUserCheck className="text-green-600" /> Presença dos Jogadores
          </h2>
          {renderPresenca(sumula.presenca_jogadores)}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-1">
          <FaRegStickyNote className="text-blue-600" /> Observações
        </h2>
        <div className="bg-gray-100 p-2 rounded text-sm min-h-[32px]">{sumula.observacoes || "-"}</div>
      </div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <span className="font-semibold text-gray-700">Árbitro Principal:</span>
          <div>{sumula.arbitro_principal || "-"}</div>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Árbitro Auxiliar:</span>
          <div>{sumula.arbitro_auxiliar || "-"}</div>
        </div>
        <div>
          <span className="font-semibold text-gray-700">Anotador:</span>
          <div>{sumula.anotador || "-"}</div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <Link href="/dashboard/competicoes" className="text-blue-600 underline font-semibold">Voltar</Link>
      </div>
    </div>
  );
}