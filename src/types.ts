export interface Team {
  jogadores: Jogador[];
  id: string;
  nome: string;
  modalidade: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_turma: string;
  created_at: string; 
  status: string;
  competicao_id: string;
}

export interface Partida {
  id: string;
  competicao_id: string;
  equipe_a_id: string;
  equipe_b_id: string;
  data: string; 
  local: string;
  criado_em: string; 
  atualizado_em: string; 
}

export interface Sumula {
  id: string;
  partida_id: string;
  equipe_a_id: string;
  equipe_b_id: string;
  gols_equipe_a: number;
  gols_equipe_b: number;
  cartoes_amarelos: unknown; 
  cartoes_vermelhos: unknown; 
  faltas: unknown;
  observacoes: string;
  criado_por: string;
  criado_em: string; 
  presenca_jogadores: unknown; 
}

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  photo_url: string;
  created_at: string;
  updated_at: string; 
}

export interface Jogador {
  id: string;
  equipe_id: string;  
  nome: string;
  matricula: string;
  turma: string;
  created_at: string;
  numero_camisa: number;
}

export interface JogadorComEquipeECompeticao extends Jogador {
  equipe: Team & {
    competicao_id: string;
    competicao?: Competicao;
  };
}


export interface HistoricoInscricao {
  id: string;
  equipe_id: string;
  acao: string;
  detalhes: string;
  realizado_por: string; 
  created_at: string;
}

export interface Competicao {
  id: string;
  nome: string;
  data_inicio: string; 
  criado_por: string;
  criado_em: string; 
  atualizado_em: string; 
  periodo_inscricao_inicio: string;
  periodo_inscricao_fim: string;
  periodo_competicao_inicio: string; 
  periodo_competicao_fim: string;
  modalidades_disponiveis: string[]; 
}

