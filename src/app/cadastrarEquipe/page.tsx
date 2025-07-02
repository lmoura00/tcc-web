"use client";
import { useState, useEffect } from "react";
import Head from "next/head";
import {
  FiTrash2,
  FiUserPlus,
  FiUserMinus,
  FiCheck,
  FiX,
  FiArrowLeft,
  FiArrowRight,
  FiCheckCircle,
  FiMail,
  FiCalendar,
} from "react-icons/fi";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Competicao {
  id: string;
  nome: string;
  periodo_inscricao_inicio: string;
  periodo_inscricao_fim: string;
  modalidades_disponiveis: string[] | string;
  criado_por: string;
  criado_em: string;
  atualizado_em: string;
}

interface Jogador {
  nome: string;
  matricula: string;
  turma: string;
  selected: boolean;
}

export default function CadastrarEquipe() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [progressWidth, setProgressWidth] = useState("0%");
  const [modalidade, setModalidade] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [turma, setTurma] = useState("");
  const [nomeEquipe, setNomeEquipe] = useState("");
  const [competicao, setCompeticao] = useState<Competicao | null>(null);
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loadingCompeticoes, setLoadingCompeticoes] = useState(true);
  const [errorCompeticoes, setErrorCompeticoes] = useState<string | null>(null);
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jogadores, setJogadores] = useState<Jogador[]>([
    { nome: "", matricula: "", turma: "", selected: true },
  ]);
  
  useEffect(() => {
    const progressValues: Record<number, string> = {
      0: "0%",
      1: "33.00%",
      2: "66.00%",
      3: "100%",
    };
    setProgressWidth(progressValues[step] || "0%");
  }, [step]);

  const parseDate = (dateString: string) => {
    const [year, month, day] = dateString.split("-");
    return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
  };

  const formatarData = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      timeZone: "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const toggleJogadorSelection = (index: number) => {
    const updatedJogadores = [...jogadores];
    updatedJogadores[index].selected = !updatedJogadores[index].selected;
    setJogadores(updatedJogadores);
  };
  const handleJogadorChange = (index: number, field: keyof Jogador, value: string) => {
    const updatedJogadores = [...jogadores];
    updatedJogadores[index][field] = value;
    setJogadores(updatedJogadores);
  };

  const removeJogador = (index: number) => {
    if (jogadores.length <= 1) {
      alert("A equipe deve ter pelo menos um jogador!");
      return;
    }
    const updatedJogadores = [...jogadores];
    updatedJogadores.splice(index, 1);
    setJogadores(updatedJogadores);
  };

  const addJogador = () => {
    setJogadores([
      ...jogadores,
      { nome: "", matricula: "", turma: "", selected: true },
    ]);
  };

  useEffect(() => {
    const carregarCompeticoes = async () => {
      try {
        setLoadingCompeticoes(true);
        setErrorCompeticoes(null);

        const hoje = new Date();
        const hojeUTC = new Date(
          Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
        );

        const { data, error: supabaseError } = await supabase.from("competicoes").select("*");

        if (supabaseError) throw supabaseError;

        const competicoesFiltradas =
          data?.filter((comp: Competicao) => {
            const inicio = parseDate(comp.periodo_inscricao_inicio);
            const fim = parseDate(comp.periodo_inscricao_fim);
            return hojeUTC >= inicio && hojeUTC <= fim;
          }) || [];

        setCompeticoes(competicoesFiltradas);
        if (competicoesFiltradas.length === 0) {
          setErrorCompeticoes(
            "Não há competições com inscrições abertas no momento."
          );
        }
      } catch {
        setErrorCompeticoes(
          "Erro ao carregar competições. Tente novamente mais tarde."
        );
      } finally {
        setLoadingCompeticoes(false);
      }
    };

    carregarCompeticoes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  const nextStep = () => {
    if (
      step === 1 &&
      (!modalidade || !nomeCompleto || !email || !turma || !nomeEquipe)
    ) {
      alert("Preencha todos os campos obrigatórios!");
      return;
    }

    if (step === 2 && jogadores.filter((j) => j.selected).length === 0) {
      alert("Adicione pelo menos um jogador para continuar!");
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => {
    if (step === 0) return;
    setStep(step - 1);
  };

  const handleSelectCompeticao = (comp: Competicao) => {
    setCompeticao(comp);
    setModalidade("");
    nextStep();
  };

  const handleFinalizarInscricao = async () => {
    setIsSubmitting(true);

    try {
      if (!competicao) {
        throw new Error("Nenhuma competição selecionada!");
      }

      if (!modalidade || !nomeCompleto || !email || !turma || !nomeEquipe) {
        throw new Error("Preencha todos os campos obrigatórios!");
      }

      if (jogadores.filter((j) => j.selected).length === 0) {
        throw new Error("Adicione pelo menos um jogador para continuar!");
      }

      const { data: equipe, error: equipeError } = await supabase
        .from("equipes")
        .insert({
          nome: nomeEquipe,
          modalidade,
          competicao_id: competicao.id,
          responsavel_nome: nomeCompleto,
          responsavel_email: email,
          responsavel_turma: turma,
          status: "pendente",
        })
        .select()
        .single();

      if (equipeError) throw equipeError;

      const jogadoresParaCadastrar = jogadores
        .filter((j) => j.selected)
        .map((j) => ({
          equipe_id: equipe.id,
          nome: j.nome,
          matricula: j.matricula,
          turma: j.turma,
        }));

      const { error: jogadoresError } = await supabase
        .from("jogadores")
        .insert(jogadoresParaCadastrar);

      if (jogadoresError) throw jogadoresError;

      alert("Inscrição realizada com sucesso! Aguarde a aprovação.");
      router.push("/login");
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message || "Ocorreu um erro desconhecido");
      } else {
        alert("Ocorreu um erro desconhecido");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Selecione a Competição
            </h1>
            {loadingCompeticoes ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600"></div>
              </div>
            ) : errorCompeticoes ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiX className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{errorCompeticoes}</p>
                  </div>
                </div>
              </div>
            ) : competicoes.length === 0 ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FiCalendar className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Não há competições com inscrições abertas no momento.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">
                    Selecione abaixo a competição que deseja participar. Apenas competições com período de inscrição aberto são exibidas.
                  </p>
                  <div className="space-y-3">
                    {competicoes.map((comp) => (
                      <div
                        key={comp.id}
                        onClick={() => handleSelectCompeticao(comp)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          competicao?.id === comp.id
                            ? "border-green-500 bg-green-50"
                            : "border-gray-300 hover:border-green-400 hover:bg-green-50"
                        }`}
                      >
                        <h3 className="font-bold text-lg text-gray-800">
                          {comp.nome}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center text-sm text-gray-600 mt-1 gap-1">
                          <span className="flex items-center">
                            <FiCalendar className="mr-2" />
                            Inscrições: {formatarData(parseDate(comp.periodo_inscricao_inicio))} a {formatarData(parseDate(comp.periodo_inscricao_fim))}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-block bg-gray-100 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 mr-2">
                            Modalidades:{" "}
                            {Array.isArray(comp.modalidades_disponiveis)
                              ? comp.modalidades_disponiveis.join(" ,  ")
                              : comp.modalidades_disponiveis?.replace(/[\[\]"]/g, "") || "Não informado"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 flex items-center">
                    <FiCheckCircle className="mr-2" />
                    Período de inscrições:{" "}
                    {competicoes.length > 0
                      ? `${formatarData(parseDate(competicoes[0].periodo_inscricao_inicio))} a ${formatarData(parseDate(competicoes[0].periodo_inscricao_fim))}`
                      : "Não disponível"}
                  </p>
                </div>
              </>
            )}
          </div>
        );
      case 1:
        return (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Inscrição - {competicao?.nome}
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              Informações Básicas
            </h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selecione a modalidade*
              </label>
              <select
                value={modalidade}
                onChange={(e) => setModalidade(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Selecione...</option>
                {Array.isArray(competicao?.modalidades_disponiveis)
                  ? competicao.modalidades_disponiveis.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))
                  : competicao?.modalidades_disponiveis
                      ?.replace(/[\[\]"]/g, "")
                      .split(",")
                      .map((mod) => (
                        <option key={mod.trim()} value={mod.trim()}>
                          {mod.trim()}
                        </option>
                      ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo*
              </label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turma*
              </label>
              <input
                type="text"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Turma"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da equipe*
              </label>
              <input
                type="text"
                value={nomeEquipe}
                onChange={(e) => setNomeEquipe(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Nome da equipe"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <button
                onClick={prevStep}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <FiArrowLeft className="mr-2" /> Voltar
              </button>
              <button
                onClick={nextStep}
                disabled={
                  !modalidade ||
                  !nomeCompleto ||
                  !email ||
                  !turma ||
                  !nomeEquipe
                }
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                Próxima etapa <FiArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Inscrição da equipe
            </h1>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              Jogadores da equipe
            </h2>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-blue-800 flex items-center">
                <FiCheckCircle className="mr-2" />
                {jogadores.filter((j) => j.selected).length} jogador(es) selecionado(s)
              </p>
            </div>
            <div className="space-y-4 mb-6">
              {jogadores.map((jogador, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 relative transition-all ${
                    jogador.selected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-center mb-3 gap-2">
                    <h3 className="font-medium text-gray-700">
                      Jogador {index + 1}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleJogadorSelection(index)}
                        className={`p-2 rounded-md ${
                          jogador.selected
                            ? "bg-green-100 text-green-600 hover:bg-green-200"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        aria-label={
                          jogador.selected
                            ? "Remover jogador da equipe"
                            : "Adicionar jogador à equipe"
                        }
                      >
                        {jogador.selected ? (
                          <FiUserMinus size={18} />
                        ) : (
                          <FiUserPlus size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => removeJogador(index)}
                        className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200"
                        aria-label="Remover jogador"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                  {jogador.selected ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nome*
                        </label>
                        <input
                          type="text"
                          value={jogador.nome}
                          onChange={(e) =>
                            handleJogadorChange(index, "nome", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Nome do jogador"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Matrícula*
                        </label>
                        <input
                          type="text"
                          value={jogador.matricula}
                          onChange={(e) =>
                            handleJogadorChange(
                              index,
                              "matricula",
                              e.target.value
                            )
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Matrícula do Jogador"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Turma*
                        </label>
                        <input
                          type="text"
                          value={jogador.turma}
                          onChange={(e) =>
                            handleJogadorChange(index, "turma", e.target.value)
                          }
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="Turma do Jogador"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <FiX size={24} className="mx-auto mb-2" />
                      <p>Jogador não selecionado para a equipe</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addJogador}
              className="w-full mb-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
            >
              <FiUserPlus className="mr-2" size={18} />
              Adicionar jogador
            </button>
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <button
                onClick={prevStep}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <FiArrowLeft className="mr-2" /> Voltar
              </button>
              <button
                onClick={nextStep}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                disabled={jogadores.filter((j) => j.selected).length === 0}
              >
                Próxima etapa <FiArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">
              Confirmação
            </h1>
            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg mb-6 border border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b pb-2">
                Resumo da inscrição
              </h2>
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">
                  Informações da equipe:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Competição</p>
                    <p className="font-medium">
                      {competicao?.nome || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Modalidade</p>
                    <p className="font-medium">
                      {modalidade || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Nome da equipe</p>
                    <p className="font-medium">
                      {nomeEquipe || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Responsável</p>
                    <p className="font-medium">
                      {nomeCompleto || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">E-mail</p>
                    <p className="font-medium">{email || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Turma do responsável
                    </p>
                    <p className="font-medium">{turma || "Não informado"}</p>
                  </div>
                </div>
                <h3 className="font-medium text-gray-700 mb-2">
                  Jogadores ({jogadores.filter((j) => j.selected).length}):
                </h3>
                <ul className="space-y-3">
                  {jogadores.filter((j) => j.selected).length > 0 ? (
                    jogadores
                      .filter((j) => j.selected)
                      .map((jogador, index) => (
                        <li
                          key={index}
                          className="border-b border-gray-200 pb-3 last:border-0"
                        >
                          <p className="font-medium">
                            {jogador.nome || "Nome não informado"}
                          </p>
                          <div className="flex flex-col sm:flex-row text-sm text-gray-600">
                            <span className="mr-4">
                              Matrícula: {jogador.matricula || "Não informada"}
                            </span>
                            <span>
                              Turma: {jogador.turma || "Não informada"}
                            </span>
                          </div>
                        </li>
                      ))
                  ) : (
                    <li className="text-gray-500 italic">
                      Nenhum jogador adicionado
                    </li>
                  )}
                </ul>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-green-800 flex items-center">
                  <FiCheckCircle className="mr-2" />
                  Verifique todas as informações antes de finalizar a inscrição
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <button
                onClick={prevStep}
                className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center justify-center"
              >
                <FiArrowLeft className="mr-2" /> Voltar
              </button>
              <button
                onClick={handleFinalizarInscricao}
                disabled={isSubmitting}
                className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <FiCheck className="mr-2" /> Finalizar inscrição
                  </>
                )}
              </button>
            </div>
          </div>
        );
      default:
        return <div>Etapa não encontrada</div>;
    }
  };

  return (
    <>
      <Head>
        <title>Inscrição de Equipe</title>
        <meta name="description" content="Formulário de inscrição de equipe" />
      </Head>
      <div className="min-h-screen bg-[#149048] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="relative mb-12">
            <div className="absolute inset-0 flex items-center px-10">
              <div className="w-full h-2 mb-5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-black rounded-full transition-all duration-500 ease-in-out"
                  style={{
                    width: progressWidth,
                    background:
                      "linear-gradient(90deg, #149048 0%, #000000 100%)",
                  }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between relative z-10 px-4">
              {["Competição", "Informações", "Jogadores", "Confirmação"].map(
                (label, index) => {
                  const stepNumber = index;
                  return (
                    <div
                      key={stepNumber}
                      className="flex flex-col items-center"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                          step >= stepNumber
                            ? "border-black bg-white text-black shadow-md"
                            : "border-gray-300 bg-white text-gray-400"
                        } font-bold transition-all duration-300`}
                      >
                        {stepNumber + 1}
                      </div>
                      <span
                        className={`text-xs mt-2 font-medium ${
                          step >= stepNumber ? "text-black" : "text-gray-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>
          {renderStep()}
        </div>
      </div>
    </>
  );
}
