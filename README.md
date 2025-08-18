# Jogos Intercursos IFMA - Campus Timon

![Logo Jogos Intercursos](public/assets/logo.jpg)

O projeto é uma aplicação web completa desenvolvida para o gerenciamento de competições esportivas, com um foco especial nos jogos escolares do IFMA - Campus Timon. A plataforma centraliza e otimiza a organização de eventos esportivos, desde a criação de competições e inscrição de equipes até o registro de resultados em tempo real e a visualização de classificações.

## ✨ Funcionalidades

O sistema foi projetado para atender tanto os organizadores dos jogos quanto os participantes, oferecendo uma experiência integrada e eficiente.

### Para Administradores e Organizadores:
- **Painel de Controle (Dashboard):** Visão geral com estatísticas, competições ativas, equipes pendentes e as próximas partidas agendadas.
- **Gerenciamento de Competições:** Crie, edite e exclua competições, definindo nome, períodos de inscrição e datas dos jogos/editar/page.tsx].
- **Gestão de Equipes:** Aprove, reprove ou marque como pendente as inscrições das equipes, com notificações automáticas por e-mail para os responsáveis.
- **Sorteio Automático de Partidas:** Gere confrontos de forma automática entre as equipes aprovadas, distribuídos pelas modalidades.
- **Súmula Eletrônica em Tempo Real:** Preencha placares, cartões, faltas e outras ocorrências durante as partidas, com salvamento automático e sincronização.

### Para Participantes e Visitantes:
- **Página de Login e Cadastro:** Autenticação segura para administradores e um fluxo de cadastro para novos usuários.
- **Inscrição de Equipes Simplificada:** Um formulário passo a passo para que os responsáveis inscrevam suas equipes e jogadores nas competições abertas.
- **Visualização de Partidas:** Acompanhe a agenda dos próximos jogos diretamente na tela de login.
- **Resultados e Classificação:** Consulte os resultados das partidas já realizadas e a tabela de classificação atualizada por modalidade/page.tsx].
- **Detalhes das Equipes:** Visualize as informações de cada equipe, incluindo seus jogadores e status na competição/page.tsx].

## 🚀 Tecnologias Utilizadas

Este projeto foi construído com tecnologias modernas para garantir uma aplicação robusta, escalável e de fácil manutenção.

- **Frontend:**
  - **Next.js:** Framework React para renderização no servidor e componentes otimizados.
  - **React:** Biblioteca para a construção de interfaces de usuário dinâmicas.
  - **TypeScript:** Garante um código mais seguro e manutenível através da tipagem estática.
  - **Tailwind CSS:** Framework CSS para uma estilização rápida e consistente.
  - **shadcn/ui & Radix UI:** Componentes de UI acessíveis e reutilizáveis.
  - **Sonner:** Para notificações (toasts) elegantes e informativas.

- **Backend & Banco de Dados:**
  - **Supabase:** Plataforma *open-source* que provê:
    - **Banco de Dados PostgreSQL:** Para armazenamento de todos os dados da aplicação.
    - **Autenticação:** Gerenciamento de usuários e sessões.
    - **APIs em Tempo Real:** Para funcionalidades como a súmula ao vivo.
  - **Next.js (Server Actions & API Routes):** Lógica de backend integrada ao framework frontend.
  - **Resend:** Para o envio de e-mails transacionais (notificações de status de equipe, sorteio de partidas, etc.).

## ⚙️ Instalação e Execução

Siga os passos abaixo para executar o projeto em seu ambiente de desenvolvimento local.

### Pré-requisitos
- Node.js (versão 20.x ou superior)
- npm, yarn, ou pnpm
- Uma conta no [Supabase](https://supabase.com/) para criar seu projeto de backend.

### Passos

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/lmoura00/tcc-web.git](https://github.com/lmoura00/tcc-web.git)
   cd tcc-web
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as Variáveis de Ambiente:**
   - Crie um arquivo `.env.local` na raiz do projeto.
   - Adicione as chaves do seu projeto Supabase e a chave da API do Resend. Você pode encontrar as chaves do Supabase em *Project Settings > API* no seu painel do Supabase.

   ```env
   NEXT_PUBLIC_SUPABASE_URL=SUA_URL_DO_PROETO_SUPABASE
   NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_SUPABASE
   RESEND_API_KEY=SUA_CHAVE_API_RESEND
   ```

4. **Execute o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

5. **Acesse a aplicação:**
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## 📂 Estrutura do Projeto

O código está organizado seguindo as convenções do Next.js App Router, facilitando a navegação e o desenvolvimento.

```
tcc-web/
├── src/
│   ├── app/
│   │   ├── (protect)/     # Rotas que exigem autenticação
│   │   │   └── dashboard/ # Páginas do painel administrativo
│   │   ├── api/           # Rotas de API
│   │   ├── cadastrar/     # Página de cadastro de usuário
│   │   ├── cadastrarEquipe/ # Página de inscrição de equipe
│   │   ├── login/         # Página de login
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Página inicial
│   ├── components/
│   │   ├── ui/            # Componentes UI (shadcn)
│   │   └── *.tsx          # Componentes reutilizáveis
│   └── lib/
│       ├── supabase/      # Configuração do cliente Supabase
│       └── utils.ts       # Funções utilitárias
├── public/
│   └── assets/          # Imagens, logos e ícones
└── ...
```

---
*Este README foi gerado com base na análise do código-fonte do projeto.*
