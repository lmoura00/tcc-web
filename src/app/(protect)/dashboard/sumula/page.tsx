"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FiPlay,
  FiPause,
  FiSave,
  FiAlertCircle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCcw,
} from "react-icons/fi";

type Jogador = {
  id: string;
  nome: string;
  matricula: string;
  turma: string;
  equipe_id: string;
  numero_camisa?: number | null;
};

type JogadorSumula = Jogador & {
  presente: boolean;
};

type Equipe = {
  id: string;
  nome: string;
  modalidade: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_turma: string;
  status: string;
  competicao_id: string;
};

type Partida = {
  id: string;
  data: string;
  local: string;
  equipe_a_id: string;
  equipe_b_id: string;
  competicao_id: string;
  fase?: string;
  equipe_a_nome?: string;
  equipe_b_nome?: string;
};

type Competicao = {
  id: string;
  nome: string;
  data_inicio: string;
  periodo_inscricao_inicio: string;
  periodo_inscricao_fim: string;
  periodo_competicao_inicio: string;
  periodo_competicao_fim: string;
  modalidades_disponiveis: string;
};

type CartoesState = {
  amarelos: Record<string, number>;
  vermelhos: Record<string, boolean>;
};

type Suspensao = { jogadorId: string; partidas: number };

type FaltasState = Record<string, boolean>;

type TimeoutsState = { equipeA: number; equipeB: number };

type DocumentacaoOkState = { equipeA: boolean; equipeB: boolean };

type TempoState = {
  primeiroTempo: number;
  segundoTempo: number;
  intervalo: number;
  tempoAtual: number;
  periodo: "1T" | "Intervalo" | "2T" | "Fim";
  rodando: boolean;
  ultimaAtualizacao: number;
};

const SumulaFutsal = () => {
  const supabase = createClient();
  const lastDbUpdate = useRef<string>("");
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [partidas, setPartidas] = useState<Partida[]>([]);
  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [jogadoresSumula, setJogadoresSumula] = useState<{
    equipeA: JogadorSumula[];
    equipeB: JogadorSumula[];
  }>({ equipeA: [], equipeB: [] });
  const [selectedCompeticao, setSelectedCompeticao] = useState<string | null>(null);
  const [selectedPartida, setSelectedPartida] = useState<string | null>(null);
  const [placar, setPlacar] = useState({ equipeA: 0, equipeB: 0 });
  const [cartoes, setCartoes] = useState<CartoesState>({ amarelos: {}, vermelhos: {} });
  const [suspensoes, setSuspensoes] = useState<Suspensao[]>([]);
  const [faltas, setFaltas] = useState<FaltasState>({});
  const [timeouts, setTimeouts] = useState<TimeoutsState>({ equipeA: 0, equipeB: 0 });
  const [observacoes, setObservacoes] = useState("");
  const [documentacaoOk, setDocumentacaoOk] = useState<DocumentacaoOkState>({ equipeA: false, equipeB: false });
  const [arbitroPrincipal, setArbitroPrincipal] = useState("");
  const [arbitroAuxiliar, setArbitroAuxiliar] = useState("");
  const [anotador, setAnotador] = useState("");
  const [tempo, setTempo] = useState<TempoState>({
    primeiroTempo: 10 * 60,
    segundoTempo: 10 * 60,
    intervalo: 2 * 60,
    tempoAtual: 0,
    periodo: "1T",
    rodando: false,
    ultimaAtualizacao: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    const fetchCompeticoes = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("competicoes")
        .select("*")
        .order("data_inicio", { ascending: false });
      if (fetchError) {
        setError("Erro ao carregar competições: " + fetchError.message);
      } else {
        setCompeticoes(data || []);
      }
      setIsLoading(false);
    };
    fetchCompeticoes();
  }, [supabase]);

  useEffect(() => {
    if (!selectedCompeticao) {
      setPartidas([]);
      setSelectedPartida(null);
      return;
    }
    const fetchPartidas = async () => {
      setIsLoading(true);
      setError(null);
      const { data: partidasData, error: partidasError } = await supabase
        .from("partidas")
        .select("*")
        .eq("competicao_id", selectedCompeticao)
        .order("data", { ascending: true });
      if (partidasError) {
        setError("Erro ao carregar partidas: " + partidasError.message);
        setIsLoading(false);
        return;
      }
      const equipeIds = partidasData.flatMap((p) => [p.equipe_a_id, p.equipe_b_id]);
      const { data: equipesData, error: equipesError } = await supabase
        .from("equipes")
        .select("id, nome")
        .in("id", equipeIds);
      if (equipesError) {
        setError("Erro ao carregar nomes das equipes: " + equipesError.message);
        setIsLoading(false);
        return;
      }
      const equipesMap = new Map(equipesData.map((equipe) => [equipe.id, equipe.nome]));
      const partidasComNomes = partidasData.map((partida) => ({
        ...partida,
        equipe_a_nome: equipesMap.get(partida.equipe_a_id) || "Equipe A",
        equipe_b_nome: equipesMap.get(partida.equipe_b_id) || "Equipe B",
      }));
      setPartidas(partidasComNomes);
      setIsLoading(false);
    };
    fetchPartidas();
  }, [selectedCompeticao, supabase]);

  const fetchEquipesAndJogadores = useCallback(async (matchId: string) => {
    setIsLoading(true);
    setError(null);
    const partidaSelecionada = partidas.find((p) => p.id === matchId);
    if (!partidaSelecionada) {
      setError("Partida selecionada não encontrada.");
      setIsLoading(false);
      return;
    }
    const { data: equipesData, error: equipesError } = await supabase
      .from("equipes")
      .select("*")
      .in("id", [partidaSelecionada.equipe_a_id, partidaSelecionada.equipe_b_id]);
    if (equipesError) {
      setError("Erro ao carregar equipes da partida: " + equipesError.message);
      setIsLoading(false);
      return;
    }
    setEquipes(equipesData || []);
    const fetchPlayersForTeam = async (teamId: string) => {
      const { data, error: playerError } = await supabase
        .from("jogadores")
        .select("*")
        .eq("equipe_id", teamId);
      if (playerError) {
        return [];
      }
      return data.map(jogador => ({ ...jogador, presente: false, numero_camisa: null }));
    };
    const playersA = await fetchPlayersForTeam(equipesData[0]?.id);
    const playersB = await fetchPlayersForTeam(equipesData[1]?.id);
    setJogadoresSumula({ equipeA: playersA, equipeB: playersB });
    setIsLoading(false);
  }, [partidas, supabase]);

  useEffect(() => {
    if (selectedPartida) {
      fetchEquipesAndJogadores(selectedPartida);
    } else {
      setEquipes([]);
      setJogadoresSumula({ equipeA: [], equipeB: [] });
      resetSumulaStates();
    }
  }, [selectedPartida, fetchEquipesAndJogadores]);

  useEffect(() => {
    if (!selectedPartida) return;
    const savedSumula = localStorage.getItem(`sumula_${selectedPartida}`);
    if (savedSumula) {
      try {
        const parsed = JSON.parse(savedSumula);
        setPlacar(parsed.placar || { equipeA: 0, equipeB: 0 });
        setCartoes(parsed.cartoes || { amarelos: {}, vermelhos: {} });
        setSuspensoes(parsed.suspensoes || []);
        setFaltas(parsed.faltas || {});
        setTimeouts(parsed.timeouts || { equipeA: 0, equipeB: 0 });
        setObservacoes(parsed.observacoes || "");
        setDocumentacaoOk(parsed.documentacaoOk || { equipeA: false, equipeB: false });
        setJogadoresSumula(parsed.jogadoresSumula || { equipeA: [], equipeB: [] });
        setTempo(parsed.tempo || {
          primeiroTempo: 10 * 60,
          segundoTempo: 10 * 60,
          intervalo: 2 * 60,
          tempoAtual: 0,
          periodo: "1T",
          rodando: false,
          ultimaAtualizacao: 0,
        });
        setArbitroPrincipal(parsed.arbitroPrincipal || "");
        setArbitroAuxiliar(parsed.arbitroAuxiliar || "");
        setAnotador(parsed.anotador || "");
      } catch (e) {
        resetSumulaStates();
      }
    } else {
      resetSumulaStates();
    }
  }, [selectedPartida]);

  const resetSumulaStates = () => {
    setPlacar({ equipeA: 0, equipeB: 0 });
    setCartoes({ amarelos: {}, vermelhos: {} });
    setSuspensoes([]);
    setFaltas({});
    setTimeouts({ equipeA: 0, equipeB: 0 });
    setObservacoes("");
    setDocumentacaoOk({ equipeA: false, equipeB: false });
    setJogadoresSumula(prev => ({
      equipeA: prev.equipeA.map(j => ({ ...j, presente: false, numero_camisa: null })),
      equipeB: prev.equipeB.map(j => ({ ...j, presente: false, numero_camisa: null }))
    }));
    setTempo({
      primeiroTempo: 10 * 60,
      segundoTempo: 10 * 60,
      intervalo: 2 * 60,
      tempoAtual: 0,
      periodo: "1T",
      rodando: false,
      ultimaAtualizacao: 0,
    });
    setArbitroPrincipal("");
    setArbitroAuxiliar("");
    setAnotador("");
  };

  useEffect(() => {
    if (!selectedPartida) return;
    const delaySave = setTimeout(() => {
      const sumulaData = {
        placar,
        cartoes,
        suspensoes,
        faltas,
        timeouts,
        observacoes,
        documentacaoOk,
        tempo,
        jogadoresSumula,
        arbitroPrincipal,
        arbitroAuxiliar,
        anotador,
      };
      localStorage.setItem(`sumula_${selectedPartida}`, JSON.stringify(sumulaData));
    }, 500);
    return () => clearTimeout(delaySave);
  }, [placar, cartoes, suspensoes, faltas, timeouts, observacoes, documentacaoOk, tempo, jogadoresSumula, selectedPartida, arbitroPrincipal, arbitroAuxiliar, anotador]);

  useEffect(() => {
    if (!selectedPartida) return;
    const loadSumulaFromDb = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: dbError } = await supabase
        .from('sumulas')
        .select('*')
        .eq('partida_id', selectedPartida)
        .single();
      if (dbError && dbError.code !== 'PGRST116') {
        setError("Erro ao carregar súmula do banco: " + dbError.message);
      } else if (data) {
        if (data.atualizado_em !== lastDbUpdate.current) {
          lastDbUpdate.current = data.atualizado_em;
          setPlacar({ equipeA: data.gols_equipe_a, equipeB: data.gols_equipe_b });
          setCartoes({ amarelos: data.cartoes_amarelos || {}, vermelhos: data.cartoes_vermelhos || {} });
          setSuspensoes(data.suspensoes || []);
          setFaltas(data.faltas || {});
          setTimeouts({ equipeA: data.timeouts_equipe_a || 0, equipeB: data.timeouts_equipe_b || 0 });
          setObservacoes(data.observacoes || "");
          setDocumentacaoOk({ equipeA: data.documentacao_ok_equipe_a || false, equipeB: data.documentacao_ok_equipe_b || false });
          setJogadoresSumula(data.presenca_jogadores || { equipeA: [], equipeB: [] });
          setTempo(prev => ({
            ...prev,
            tempoAtual: data.tempo_decorrido || 0,
            periodo: data.periodo_atual || "1T",
            rodando: false,
          }));
          setArbitroPrincipal(data.arbitro_principal || "");
          setArbitroAuxiliar(data.arbitro_auxiliar || "");
          setAnotador(data.anotador || "");
        }
      }
      setIsLoading(false);
    };
    loadSumulaFromDb();
    const channel = supabase
      .channel(`sumula_${selectedPartida}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sumulas',
          filter: `partida_id=eq.${selectedPartida}`
        },
        (payload) => {
          if (
            payload.new &&
            typeof payload.new === "object" &&
            "atualizado_em" in payload.new
          ) {
            if (payload.new.atualizado_em !== lastDbUpdate.current) {
              lastDbUpdate.current = payload.new.atualizado_em;
              setPlacar({ equipeA: payload.new.gols_equipe_a, equipeB: payload.new.gols_equipe_b });
              setCartoes({ amarelos: payload.new.cartoes_amarelos || {}, vermelhos: payload.new.cartoes_vermelhos || {} });
              setSuspensoes(payload.new.suspensoes || []);
              setFaltas(payload.new.faltas || {});
              setTimeouts({ equipeA: payload.new.timeouts_equipe_a || 0, equipeB: payload.new.timeouts_equipe_b || 0 });
              setObservacoes(payload.new.observacoes || "");
              setDocumentacaoOk({ equipeA: payload.new.documentacao_ok_equipe_a || false, equipeB: payload.new.documentacao_ok_equipe_b || false });
              setJogadoresSumula(payload.new.presenca_jogadores || { equipeA: [], equipeB: [] });
              setTempo(prev => ({
                ...prev,
                tempoAtual: (payload.new as { tempo_decorrido?: number }).tempo_decorrido || 0,
                periodo: (payload.new as { periodo_atual?: "1T" | "Intervalo" | "2T" | "Fim" }).periodo_atual || "1T",
                rodando: false,
              }));
              setArbitroPrincipal(payload.new.arbitro_principal || "");
              setArbitroAuxiliar(payload.new.arbitro_auxiliar || "");
              setAnotador(payload.new.anotador || "");
            }
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPartida, supabase]);

  const salvarSumula = useCallback(async () => {
    if (!selectedPartida) {
      alert("Por favor, selecione uma partida antes de salvar.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      lastDbUpdate.current = now;
      const { error: upsertError } = await supabase.from("sumulas").upsert(
        {
          partida_id: selectedPartida,
          equipe_a_id: equipes[0]?.id,
          equipe_b_id: equipes[1]?.id,
          gols_equipe_a: placar.equipeA,
          gols_equipe_b: placar.equipeB,
          cartoes_amarelos: cartoes.amarelos,
          cartoes_vermelhos: cartoes.vermelhos,
          suspensoes: suspensoes,
          faltas: faltas,
          timeouts_equipe_a: timeouts.equipeA,
          timeouts_equipe_b: timeouts.equipeB,
          documentacao_ok_equipe_a: documentacaoOk.equipeA,
          documentacao_ok_equipe_b: documentacaoOk.equipeB,
          observacoes: observacoes,
          tempo_primeiro: tempo.primeiroTempo,
          tempo_segundo: tempo.segundoTempo,
          tempo_intervalo: tempo.intervalo,
          tempo_decorrido: tempo.tempoAtual,
          periodo_atual: tempo.periodo,
          presenca_jogadores: jogadoresSumula,
          arbitro_principal: arbitroPrincipal,
          arbitro_auxiliar: arbitroAuxiliar,
          anotador: anotador,
          atualizado_em: now,
        },
        { onConflict: 'partida_id' }
      );
      if (!upsertError) {
        alert("Súmula salva com sucesso!");
      } else {
        setError("Erro ao salvar súmula: " + upsertError.message);
        alert("Erro ao salvar súmula: " + upsertError.message);
      }
    } catch {
      setError("Erro inesperado ao salvar súmula.");
      alert("Erro inesperado ao salvar súmula.");
    } finally {
      setIsSaving(false);
    }
  }, [selectedPartida, equipes, placar, cartoes, suspensoes, faltas, timeouts, observacoes, documentacaoOk, tempo, jogadoresSumula, arbitroPrincipal, arbitroAuxiliar, anotador, supabase]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (selectedPartida && (tempo.tempoAtual > 0 || placar.equipeA > 0 || placar.equipeB > 0)) {
        e.preventDefault();
        e.returnValue = 'Você tem dados não salvos. Tem certeza que deseja sair?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedPartida, tempo.tempoAtual, placar]);

  useEffect(() => {
    let intervalo: NodeJS.Timeout;
    if (tempo.rodando) {
      intervalo = setInterval(() => {
        const agora = Date.now();
        const decorrido = Math.floor((agora - tempo.ultimaAtualizacao) / 1000);
        setTempo((prev) => {
          let novoTempo = prev.tempoAtual + decorrido;
          let novoPeriodo = prev.periodo;
          let parar = false;
          const currentPeriodDuration =
            prev.periodo === "1T" ? prev.primeiroTempo :
            prev.periodo === "Intervalo" ? prev.intervalo :
            prev.periodo === "2T" ? prev.segundoTempo : 0;
          if (novoTempo >= currentPeriodDuration && prev.periodo !== "Fim") {
            novoTempo = 0;
            if (prev.periodo === "1T") {
              novoPeriodo = "Intervalo";
            } else if (prev.periodo === "Intervalo") {
              novoPeriodo = "2T";
            } else if (prev.periodo === "2T") {
              novoPeriodo = "Fim";
              parar = true;
            }
          }
          return {
            ...prev,
            tempoAtual: novoTempo,
            periodo: novoPeriodo,
            rodando: !parar,
            ultimaAtualizacao: parar ? prev.ultimaAtualizacao : agora,
          };
        });
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [tempo.rodando, tempo.ultimaAtualizacao, tempo.primeiroTempo, tempo.intervalo, tempo.segundoTempo]);

  const iniciarTempo = () => {
    if (!tempo.rodando && tempo.periodo !== "Fim") {
      setTempo((prev) => ({
        ...prev,
        rodando: true,
        ultimaAtualizacao: Date.now(),
      }));
    }
  };

  const pausarTempo = () => {
    setTempo((prev) => ({ ...prev, rodando: false }));
  };

  const reiniciarTempo = () => {
    if (window.confirm("Tem certeza que deseja reiniciar o tempo? Isso apagará o progresso do cronômetro.")) {
      setTempo((prev) => ({
        ...prev,
        tempoAtual: 0,
        periodo: "1T",
        rodando: false,
        ultimaAtualizacao: 0,
      }));
    }
  };

  const handleGol = useCallback((equipe: "equipeA" | "equipeB") => {
    setPlacar((prev) => ({ ...prev, [equipe]: prev[equipe] + 1 }));
  }, []);

  const handleCartaoAmarelo = useCallback((jogadorId: string) => {
    setCartoes((prev) => {
      const currentAmarelos = prev.amarelos[jogadorId] || 0;
      const newAmarelos = { ...prev.amarelos };
      if (currentAmarelos < 1) {
        newAmarelos[jogadorId] = currentAmarelos + 1;
      } else {
        newAmarelos[jogadorId] = 0;
        return {
          ...prev,
          amarelos: newAmarelos,
          vermelhos: { ...prev.vermelhos, [jogadorId]: true },
        };
      }
      return {
        ...prev,
        amarelos: newAmarelos,
      };
    });
  }, []);

  const handleCartaoVermelho = useCallback((jogadorId: string) => {
    setCartoes((prev) => {
      const isCurrentlyRed = prev.vermelhos[jogadorId];
      const newVermelhos = { ...prev.vermelhos, [jogadorId]: !isCurrentlyRed };
      const newAmarelos = { ...prev.amarelos, [jogadorId]: 0 };
      setSuspensoes(currentSus => {
        if (!isCurrentlyRed) {
          if (!currentSus.some(s => s.jogadorId === jogadorId)) {
            return [...currentSus, { jogadorId, partidas: 1 }];
          }
        } else {
          return currentSus.filter(s => s.jogadorId !== jogadorId);
        }
        return currentSus;
      });
      return {
        amarelos: newAmarelos,
        vermelhos: newVermelhos,
      };
    });
  }, []);

  const handleFalta = useCallback((jogadorId: string, periodo: "1T" | "2T", numeroFalta: number) => {
    const key = `${jogadorId}-${periodo}-${numeroFalta}`;
    setFaltas((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleTimeout = useCallback((equipe: "equipeA" | "equipeB") => {
    if (timeouts[equipe] < 1) {
      setTimeouts((prev) => ({ ...prev, [equipe]: prev[equipe] + 1 }));
      pausarTempo();
      alert("Timeout chamado! O cronômetro foi pausado por 1 minuto. Inicie-o manualmente após 60 segundos.");
    } else {
      alert(`Equipe ${equipe === "equipeA" ? equipes[0]?.nome : equipes[1]?.nome} já usou seu timeout.`);
    }
  }, [timeouts, equipes]);

  const toggleDocumentacao = useCallback((equipe: "equipeA" | "equipeB") => {
    setDocumentacaoOk(prev => ({
      ...prev,
      [equipe]: !prev[equipe]
    }));
  }, []);

  const handleNumeroCamisaChange = useCallback((
    equipe: "equipeA" | "equipeB",
    jogadorId: string,
    value: string
  ) => {
    const numero = value === "" ? null : parseInt(value);
    setJogadoresSumula(prev => ({
      ...prev,
      [equipe]: prev[equipe].map(jogador =>
        jogador.id === jogadorId
          ? { ...jogador, numero_camisa: numero }
          : jogador
      )
    }));
  }, []);

  const togglePresenca = useCallback((equipe: "equipeA" | "equipeB", jogadorId: string) => {
    setJogadoresSumula(prev => ({
      ...prev,
      [equipe]: prev[equipe].map(jogador =>
        jogador.id === jogadorId
          ? { ...jogador, presente: !jogador.presente }
          : jogador
      )
    }));
  }, []);

  const renderCartoesAmarelos = useCallback((jogadorId: string, presente: boolean) => {
    const count = cartoes.amarelos[jogadorId] || 0;
    return (
      <div className="flex items-center justify-center gap-1">
        <button
          className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-semibold
                      ${count > 0 ? "bg-yellow-400 text-gray-800" : "border border-gray-300 text-gray-600"}
                      ${!presente ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-500 hover:text-white"}`}
          onClick={() => handleCartaoAmarelo(jogadorId)}
          disabled={!presente || cartoes.vermelhos[jogadorId]}
          title={`Amarelos: ${count}`}
        >
          {count > 0 ? count : "-"}
        </button>
      </div>
    );
  }, [cartoes.amarelos, cartoes.vermelhos, handleCartaoAmarelo]);

  const renderCartaoVermelho = useCallback((jogadorId: string, presente: boolean) => {
    const isRed = cartoes.vermelhos[jogadorId];
    return (
      <button
        className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center text-sm font-semibold
                    ${isRed ? "bg-red-600 text-white" : "border border-gray-300 text-gray-600"}
                    ${!presente ? "opacity-50 cursor-not-allowed" : "hover:bg-red-700 hover:text-white"}`}
        onClick={() => handleCartaoVermelho(jogadorId)}
        disabled={!presente}
        title={isRed ? "Remover Cartão Vermelho" : "Adicionar Cartão Vermelho"}
      >
        {isRed ? "V" : ""}
      </button>
    );
  }, [cartoes.vermelhos, handleCartaoVermelho]);

  const renderFaltas = useCallback((jogadorId: string, presente: boolean) => {
    const periodoAtual = tempo.periodo === "1T" ? "1T" : "2T";
    if (tempo.periodo === "Intervalo" || tempo.periodo === "Fim") return null;
    return (
      <div className="flex flex-wrap justify-center gap-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            className={`w-5 h-5 rounded-full text-xs font-semibold
                        ${faltas[`${jogadorId}-${periodoAtual}-${num}`]
                          ? "bg-blue-500 text-white"
                          : "border border-gray-300 text-gray-600"}
                        ${!presente || cartoes.vermelhos[jogadorId] ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600 hover:text-white"}`}
            onClick={() => handleFalta(jogadorId, periodoAtual, num)}
            disabled={!presente || cartoes.vermelhos[jogadorId]}
            title={`Falta ${num} (${periodoAtual})`}
          >
            {num}
          </button>
        ))}
      </div>
    );
  }, [handleFalta, tempo.periodo, cartoes.vermelhos]);

  const renderDocumentacao = useCallback((equipe: "equipeA" | "equipeB") => {
    const isOk = documentacaoOk[equipe];
    const equipeNome = equipes[equipe === "equipeA" ? 0 : 1]?.nome || `Equipe ${equipe === "equipeA" ? "A" : "B"}`;
    return (
      <div className={`p-4 rounded-lg shadow-md ${isOk ? "bg-green-50" : "bg-red-50"}`}>
        <h3 className="font-bold mb-3 text-gray-700">
          Documentação - {equipeNome}
        </h3>
        <button
          className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 font-semibold transition-colors
                      ${isOk ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white`}
          onClick={() => toggleDocumentacao(equipe)}
        >
          {isOk ? (
            <>
              <FiCheckCircle className="text-xl" />
              <span>Documentação OK</span>
            </>
          ) : (
            <>
              <FiXCircle className="text-xl" />
              <span>Verificar Documentação</span>
            </>
          )}
        </button>
      </div>
    );
  }, [documentacaoOk, equipes, toggleDocumentacao]);

  const renderTabelaJogadores = useCallback((equipe: "equipeA" | "equipeB") => (
    <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
      <h3 className="font-bold text-lg mb-4 border-b pb-2 text-gray-800">
        {equipes[equipe === "equipeA" ? 0 : 1]?.nome || `Equipe ${equipe === "equipeA" ? "A" : "B"}`} - Jogadores
      </h3>
      <table className="w-full text-sm text-gray-700">
        <thead>
          <tr className="bg-gray-100 uppercase text-xs">
            <th className="p-2 text-left min-w-[120px]">Nome</th>
            <th className="p-2 min-w-[60px]">Nº</th>
            <th className="p-2 min-w-[70px]">Presença</th>
            <th className="p-2 min-w-[80px]">Matrícula</th>
            <th className="p-2 min-w-[60px]">Amarelos</th>
            <th className="p-2 min-w-[40px]">V</th>
            <th className="p-2 min-w-[120px]">Faltas ({tempo.periodo === "1T" ? "1T" : tempo.periodo === "2T" ? "2T" : "N/A"})</th>
          </tr>
        </thead>
        <tbody>
          {jogadoresSumula[equipe].length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                Nenhum jogador encontrado.
              </td>
            </tr>
          )}
          {jogadoresSumula[equipe].map((jogador) => (
            <tr key={jogador.id} className={`border-b border-gray-100 transition-colors ${!jogador.presente ? 'bg-gray-50 text-gray-400' : ''}`}>
              <td className="p-2">{jogador.nome}</td>
              <td className="p-2">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={jogador.numero_camisa !== null ? jogador.numero_camisa : ""}
                  onChange={(e) => handleNumeroCamisaChange(equipe, jogador.id, e.target.value)}
                  className="w-12 p-1 border border-gray-300 rounded text-center text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nº"
                  disabled={!jogador.presente || cartoes.vermelhos[jogador.id]}
                  title={!jogador.presente ? "Marque presença para editar" : ""}
                />
              </td>
              <td className="p-2 text-center">
                <input
                  type="checkbox"
                  checked={jogador.presente}
                  onChange={() => togglePresenca(equipe, jogador.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </td>
              <td className="p-2 text-center">{jogador.matricula}</td>
              <td className="p-2 text-center">
                {renderCartoesAmarelos(jogador.id, jogador.presente)}
              </td>
              <td className="p-2 text-center">
                {renderCartaoVermelho(jogador.id, jogador.presente)}
              </td>
              <td className="p-2">
                {renderFaltas(jogador.id, jogador.presente)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 text-sm text-red-700">
        <h4 className="font-semibold">Suspensões Acumuladas:</h4>
        {suspensoes.filter(s =>
            (equipe === "equipeA" && jogadoresSumula.equipeA.some(j => j.id === s.jogadorId)) ||
            (equipe === "equipeB" && jogadoresSumula.equipeB.some(j => j.id === s.jogadorId))
          ).map(s => {
            const player = [...jogadoresSumula.equipeA, ...jogadoresSumula.equipeB].find(j => j.id === s.jogadorId);
            return (
              <p key={s.jogadorId} className="ml-2">- {player?.nome} ({s.partidas} partida{s.partidas > 1 ? 's' : ''})</p>
            );
          })}
        {suspensoes.filter(s =>
            (equipe === "equipeA" && jogadoresSumula.equipeA.some(j => j.id === s.jogadorId)) ||
            (equipe === "equipeB" && jogadoresSumula.equipeB.some(j => j.id === s.jogadorId))
          ).length === 0 && <p className="ml-2 text-gray-500 italic">Nenhuma suspensão.</p>}
      </div>
    </div>
  ), [jogadoresSumula, equipes, cartoes, faltas, tempo.periodo, renderCartoesAmarelos, renderCartaoVermelho, renderFaltas, handleNumeroCamisaChange, togglePresenca, suspensoes]);

  // --- Main Render ---
  return (
    <div className="container mx-auto p-2 md:p-4 max-w-9xl min-h-screen bg-gray-50">
      <h1 className="text-xl md:text-3xl font-extrabold text-center text-gray-800 mb-4 md:mb-6">
        SÚMULA OFICIAL DE FUTSAL
      </h1>
      {isLoading && (
        <div className="text-center text-blue-600 font-medium my-4 flex items-center justify-center">
          <FiRefreshCcw className="animate-spin mr-2" /> Carregando dados...
        </div>
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4 flex items-center">
          <FiAlertCircle className="mr-2" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-4 mb-4 md:mb-6 bg-white p-4 rounded-lg shadow-md">
        <div>
          <label htmlFor="competicao-select" className="block text-sm font-medium text-gray-700 mb-1">Competição:</label>
          <select
            id="competicao-select"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedCompeticao || ""}
            onChange={(e) => setSelectedCompeticao(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Selecione a competição</option>
            {competicoes.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="partida-select" className="block text-sm font-medium text-gray-700 mb-1">Partida:</label>
          <select
            id="partida-select"
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedPartida || ""}
            onChange={(e) => setSelectedPartida(e.target.value)}
            disabled={!selectedCompeticao || isLoading}
          >
            <option value="">Selecione a partida</option>
            {partidas.map((partida) => (
              <option key={partida.id} value={partida.id}>
                {partida.equipe_a_nome} x {partida.equipe_b_nome}
                {partida.fase ? ` (${partida.fase})` : ""}
                {partida.local ? ` - ${partida.local}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      {selectedPartida && (
        <>
          <div className="bg-white p-2 md:p-4 rounded-lg shadow-md mb-4 md:mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center justify-between">
              <FiClock className="mr-2 text-blue-600" /> Cronômetro da Partida
              <button
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-300 transition-colors"
                onClick={reiniciarTempo}
                disabled={tempo.rodando}
              >
                Reiniciar Tempo
              </button>
            </h2>
            <div className="flex flex-col md:flex-row justify-between items-center mb-2 md:mb-4 gap-4">
              <div className="text-center">
                <div className="text-5xl font-extrabold text-blue-700">
                  {formatarTempo(tempo.tempoAtual)}
                </div>
                <div className="text-lg font-semibold text-gray-700 capitalize">
                  {tempo.periodo === "1T" ? "1º Tempo" :
                   tempo.periodo === "2T" ? "2º Tempo" :
                   tempo.periodo === "Intervalo" ? "Intervalo" :
                   "Partida Encerrada"}
                </div>
              </div>
              <div className="flex space-x-3">
                {!tempo.rodando ? (
                  <button
                    className="bg-green-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold hover:bg-green-700 transition-colors"
                    onClick={iniciarTempo}
                    disabled={tempo.periodo === "Fim"}
                  >
                    <FiPlay /> Iniciar
                  </button>
                ) : (
                  <button
                    className="bg-yellow-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-semibold hover:bg-yellow-700 transition-colors"
                    onClick={pausarTempo}
                  >
                    <FiPause /> Pausar
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm font-medium text-gray-600 mt-4">
              <div className="bg-gray-100 p-2 rounded">
                <div>1º Tempo</div>
                <div className="font-bold text-gray-800">
                  {formatarTempo(tempo.primeiroTempo)}
                </div>
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <div>Intervalo</div>
                <div className="font-bold text-gray-800">{formatarTempo(tempo.intervalo)}</div>
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <div>2º Tempo</div>
                <div className="font-bold text-gray-800">
                  {formatarTempo(tempo.segundoTempo)}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-between">
              <h3 className="font-bold text-2xl text-gray-800 mb-2">
                {equipes[0]?.nome || "Equipe A"}
              </h3>
              <div className="text-7xl font-extrabold text-blue-700 my-4">{placar.equipeA}</div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-green-700 transition-colors"
                  onClick={() => handleGol("equipeA")}
                >
                  Gol
                </button>
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-yellow-700 transition-colors"
                  onClick={() => handleTimeout("equipeA")}
                  disabled={timeouts.equipeA >= 1 || !tempo.rodando}
                >
                  Timeout ({timeouts.equipeA}/1)
                </button>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col justify-center items-center">
              <div className="text-4xl font-extrabold text-gray-600 mb-2">VS</div>
              <div className="text-base text-gray-500 font-medium">
                {selectedPartida &&
                  partidas.find((p) => p.id === selectedPartida)?.local}
              </div>
              {selectedPartida &&
                partidas.find((p) => p.id === selectedPartida)?.data && (
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(partidas.find((p) => p.id === selectedPartida)!.data).toLocaleDateString('pt-BR')}
                  </div>
                )}
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col items-center justify-between">
              <h3 className="font-bold text-2xl text-gray-800 mb-2">
                {equipes[1]?.nome || "Equipe B"}
              </h3>
              <div className="text-7xl font-extrabold text-red-700 my-4">{placar.equipeB}</div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-green-700 transition-colors"
                  onClick={() => handleGol("equipeB")}
                >
                  Gol
                </button>
                <button
                  className="bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold hover:bg-yellow-700 transition-colors"
                  onClick={() => handleTimeout("equipeB")}
                  disabled={timeouts.equipeB >= 1 || !tempo.rodando}
                >
                  Timeout ({timeouts.equipeB}/1)
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {renderDocumentacao("equipeA")}
            {renderDocumentacao("equipeB")}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {renderTabelaJogadores("equipeA")}
            {renderTabelaJogadores("equipeB")}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-3">
                Responsável Equipe - {equipes[0]?.nome || "Equipe A"}
              </h3>
              <div className="space-y-2 text-gray-700">
                <div>
                  <label className="block text-sm font-medium">Nome Responsável:</label>
                  <p className="p-2 bg-gray-50 rounded text-sm">
                    {equipes[0]?.responsavel_nome || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium">E-mail Contato:</label>
                  <p className="p-2 bg-gray-50 rounded text-sm">
                    {equipes[0]?.responsavel_email || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium">Turma:</label>
                  <p className="p-2 bg-gray-50 rounded text-sm">
                    {equipes[0]?.responsavel_turma || "Não informado"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-3">
                Responsável Equipe - {equipes[1]?.nome || "Equipe B"}
              </h3>
              <div className="space-y-2 text-gray-700">
                <div>
                  <label className="block text-sm font-medium">Nome Responsável:</label>
                  <p className="p-2 bg-gray-50 rounded text-sm">
                    {equipes[1]?.responsavel_nome || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium">E-mail Contato:</label>
                  <p className="p-2 bg-gray-50 rounded text-sm">
                    {equipes[1]?.responsavel_email || "Não informado"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium">Turma:</label>
                  <p className="p-2 bg-gray-50 rounded text-sm">
                    {equipes[1]?.responsavel_turma || "Não informado"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <h3 className="font-bold text-lg text-gray-800 mb-3">Observações da Partida</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md h-24 text-sm focus:ring-blue-500 focus:border-blue-500"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Registre aqui qualquer ocorrência importante da partida (lesões, comportamentos, etc.)..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Árbitro Principal</p>
                <input
                  type="text"
                  className="w-full p-2 border-b border-gray-300 text-center text-gray-800 focus:outline-none focus:border-blue-500"
                  placeholder="Nome do Árbitro"
                  value={arbitroPrincipal}
                  onChange={(e) => setArbitroPrincipal(e.target.value)}
                />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md text-center flex flex-col justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Árbitro Auxiliar</p>
                <input
                  type="text"
                  className="w-full p-2 border-b border-gray-300 text-center text-gray-800 focus:outline-none focus:border-blue-500"
                  placeholder="Nome do Auxiliar"
                  value={arbitroAuxiliar}
                  onChange={(e) => setArbitroAuxiliar(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-8">
            <button
              className="bg-gray-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold hover:bg-gray-600 transition-colors"
              onClick={() => {
                if (window.confirm("Tem certeza que deseja limpar todos os dados da súmula desta partida?")) {
                  resetSumulaStates();
                }
              }}
            >
              <FiRefreshCcw /> Limpar Súmula
            </button>
            <button
              className={`px-6 py-3 rounded-lg flex items-center gap-2 font-semibold transition-colors
                          ${isSaving ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              onClick={salvarSumula}
              disabled={
                isSaving ||
                !selectedPartida ||
                !documentacaoOk.equipeA ||
                !documentacaoOk.equipeB ||
                tempo.rodando
              }
            >
              {isSaving ? (
                <>
                  <FiSave className="animate-pulse" /> Salvando...
                </>
              ) : (
                <>
                  <FiSave /> Finalizar e Salvar Súmula
                </>
              )}
            </button>
          </div>
        </>
      )}
      {!selectedPartida && !isLoading && (
        <div className="text-center text-gray-600 my-12 p-8 bg-white rounded-lg shadow-md">
          <p className="text-xl font-medium">Por favor, selecione uma competição e uma partida para iniciar a súmula.</p>
          <p className="text-sm text-gray-500 mt-2">Os dados serão salvos automaticamente no seu navegador, e no banco de dados ao clicar em "Finalizar e Salvar Súmula".</p>
        </div>
      )}
    </div>
  );
};

export default SumulaFutsal;