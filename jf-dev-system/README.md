# JF Dev — Sistema Inteligente de Gestão e Agendamento

Sistema completo de gestão e agendamento, desenvolvido pela **JF Dev** como peça
de portfólio: uma aplicação full stack real, com landing page, experiência 3D,
agendamento público, área do cliente, autenticação e um painel administrativo
funcional (dashboard, agenda, clientes, profissionais, serviços, relatórios e
configurações).

> **Este README foi reescrito depois de uma auditoria de segurança e
> funcionamento.** A seção [Correções desta auditoria](#correções-desta-auditoria)
> lista, ponto a ponto, o que foi encontrado e o que foi corrigido — inclusive o
> que **não pôde ser testado dentro do ambiente usado para corrigir o
> projeto** (sem acesso à internet para instalar dependências), para que
> nada seja declarado "concluído" sem a devida ressalva.

Esta versão traz uma empresa fictícia de demonstração (**Studio Nova Era**),
mas a arquitetura foi desenhada para ser adaptada a qualquer negócio baseado
em agenda: barbearias, salões, clínicas, estética, tatuadores, profissionais
autônomos, oficinas, consultórios e demais prestadores de serviço.

> Todas as informações de contato da JF Dev (WhatsApp, e-mail, Instagram, URL)
> ficam centralizadas em [`src/config/site.ts`](./src/config/site.ts) — nenhum
> dado de contato foi inventado neste projeto. O WhatsApp oferecido ao
> cliente **depois de agendar um horário** é o do **estabelecimento**
> (configurado em Configurações → `whatsappNumber`), nunca o da JF Dev — ver
> correção nº 12 abaixo.

---

## Sumário

- [Funcionalidades](#funcionalidades)
- [Stack](#stack)
- [Arquitetura](#arquitetura)
- [Instalação e execução local](#instalação-e-execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Banco de dados e migrations](#banco-de-dados-e-migrations)
- [Segurança](#segurança)
- [Build e deploy](#build-e-deploy)
- [Correções desta auditoria](#correções-desta-auditoria)
- [Testes realizados e resultados reais](#testes-realizados-e-resultados-reais)
- [Pendências externas (o que só você pode configurar)](#pendências-externas-o-que-só-você-pode-configurar)

---

## Funcionalidades

**Site público**
- Landing page com identidade visual própria (dark + azul elétrico + roxo),
  composição 3D reativa a mouse/toque/scroll (com fallback CSS/SVG e pausa
  automática de renderização quando fora da tela) e seções de apresentação
  do produto.
- Sistema de agendamento real: serviço → profissional → data → horário →
  dados do cliente → confirmação, com disponibilidade calculada no servidor,
  no fuso horário do negócio (não no fuso do servidor).
- Área do cliente para consultar e **cancelar** agendamentos, com acesso
  protegido por código de verificação de uso único (nunca por busca livre
  de telefone/e-mail).

**Painel administrativo (`/admin`)**
- Login com autenticação real (senha com hash bcrypt, sessão JWT em cookie
  httpOnly, limite de tentativas) e rotas protegidas por middleware **e**
  pela camada de serviço.
- Dashboard com métricas e gráficos (faturamento, agendamentos, serviços
  mais usados, desempenho por profissional, evolução mensal).
- Agenda com visualização por dia, semana e mês — bloqueios de múltiplos
  dias aparecem corretamente nas três visões, e a tela nunca fica presa
  carregando depois de criar um agendamento ou bloqueio.
- Reagendamento real, com nova busca de horários disponíveis.
- CRUD de serviços, profissionais (com horários de trabalho) e clientes —
  excluir um registro com histórico de agendamentos é bloqueado pelo
  próprio banco (o histórico nunca é apagado em cascata); desative em vez
  de excluir.
- Gestão de status de agendamento (pendente, confirmado, concluído,
  cancelado, não compareceu) — reativar um agendamento cancelado passa
  pela mesma validação completa de disponibilidade de uma criação nova.
- Busca global real (clientes e agendamentos) na barra superior.
- Relatórios com exportação em CSV protegida contra injeção de fórmula.
- Configurações de horário de funcionamento e parâmetros do agendamento —
  `bookingWindowDays` e `cancellationWindowHours` agora têm efeito real.

**Regra crítica de negócio**: nunca é possível existir dois agendamentos do
mesmo profissional no mesmo intervalo de tempo — nem por concorrência (duas
reservas simultâneas), nem por reativação de um agendamento cancelado. Isso é
garantido em **três camadas** (aplicação, transação serializável, e uma
constraint do próprio Postgres) — ver
[`src/lib/booking-rules.ts`](./src/lib/booking-rules.ts),
[`src/lib/db-retry.ts`](./src/lib/db-retry.ts) e a migration
[`add_appointment_exclusion_constraint`](./prisma/migrations/20260101000200_add_appointment_exclusion_constraint/migration.sql).

---

## Stack

| Camada          | Tecnologia |
|-----------------|------------|
| Framework       | Next.js 15 (App Router) + TypeScript (strict, sem `any`) |
| Estilo          | Tailwind CSS (design system próprio da JF Dev) |
| Animação        | Framer Motion (com `reducedMotion="user"` global) |
| 3D              | Three.js + React Three Fiber + @react-three/drei |
| Gráficos        | Recharts |
| Banco de dados  | **PostgreSQL** (Supabase ou qualquer Postgres), via Prisma ORM, com migrations versionadas |
| Autenticação    | Sessão JWT (jose) + bcrypt para admin; código de uso único para clientes |
| Validação       | Zod (mensagens em português, usadas no cliente e no servidor) |
| Ícones          | Lucide Icons |

O projeto **não depende de imagens externas**: toda a experiência visual é
construída com CSS, SVG, gradientes e composições 3D. O único espaço
reservado para uma imagem real da marca é
[`public/images/jf-dev/`](./public/images/jf-dev/README.md).

---

## Arquitetura

```
src/
  app/                  Rotas (App Router): landing page, /agendar,
                         /area-do-cliente, /admin/**, /api/**
  components/
    layout/             Header, footer, menu mobile
    ui/                 Design system (botão, card, input, modal com focus
                         trap, toast...)
    3d/                 Cena 3D do hero + fallback CSS/SVG (pausa quando fora
                         da tela)
    booking/            Fluxo de agendamento público (etapas)
    dashboard/          Sidebar, topbar (com busca real), gráficos,
                         reagendamento, telas de gestão do admin
    sections/           Seções da landing page
  lib/
    auth.ts             Sessão administrativa (JWT+bcrypt) e token de acesso
                         do cliente (área do cliente)
    authz.ts            `requireAdminSession()` — checagem de sessão DENTRO
                         da camada de serviço (defesa em profundidade)
    booking-rules.ts    Motor ÚNICO de validação de agendamento (ver acima)
    timezone.ts         Conversão de fuso horário do negócio (sem dependência
                         nova, baseado em `Intl`)
    availability.ts     Cálculo de horários disponíveis (fuso-aware)
    db-retry.ts         Transação serializável com retry automático
    rate-limit.ts       Rate limiting em memória para endpoints sensíveis
    notifications.ts    Envio do código de acesso do cliente (interface
                         pronta para um provedor real de SMS/e-mail)
    db.ts               Cliente Prisma (singleton)
    validation.ts       Schemas Zod compartilhados
  services/              Camada de acesso a dados — cada função checa sua
                         própria autorização quando aplicável (nunca confia
                         só na rota)
  hooks/                 Hooks de cliente (reduced motion, media query, low
                         power device)
  types/                 Tipos compartilhados (sem uso de `any`)
  config/                Configuração central da marca (site.ts)
  utils/                 Formatação de datas e valores
prisma/
  schema.prisma          Modelo de dados (PostgreSQL)
  migrations/            Migrations versionadas (SQL), incluindo a
                         constraint de exclusão anti-double-booking
  seed.ts                Dados fictícios de demonstração (protegido contra
                         rodar em produção/banco não-vazio)
  create-admin.ts        Criação/atualização da conta administrativa
                         (separado do seed — nunca uma senha fixa no código)
scripts/
  test-pure-logic.ts     Testes reais de lógica pura (fuso horário e
                         disponibilidade) executáveis com `tsx`
```

**Fluxo de uma requisição administrativa**: página (Server Component) ou
componente cliente → rota em `src/app/api/**/route.ts` (checa sessão) →
camada `src/services/*.service.ts` (checa sessão DE NOVO, independentemente
da rota) → Prisma → banco de dados. As regras de negócio críticas
(disponibilidade, conflito de horário, permissões) vivem nos `services/` e em
`src/lib/booking-rules.ts`, nunca só no componente visual.

### Estratégia de 3D

A cena principal (`src/components/3d/hero-scene.tsx`) é carregada via
`next/dynamic` com `ssr: false` (code-splitting — nunca entra no bundle
inicial nem roda no servidor). Ela reage a mouse **e toque** através dos
Pointer Events nativos do React Three Fiber, e à rolagem da página via
`window.scrollY`, mantendo a rolagem natural da página (`touchAction:
'pan-y'` no canvas). Um `IntersectionObserver` (`src/components/3d/hero-3d.tsx`)
pausa completamente o loop de renderização (`frameloop="never"`) quando o
hero sai da área visível da tela. Um hook (`use-low-power-device`) e a
preferência do sistema por `prefers-reduced-motion` decidem automaticamente
entre a cena 3D completa e uma versão simplificada em CSS/SVG
(`hero-scene-fallback.tsx`) com a mesma identidade visual.

### Estratégia de segurança

- Senhas de administrador nunca ficam em texto puro — apenas o hash bcrypt
  (`src/lib/auth.ts`). A conta é criada por `prisma/create-admin.ts`, que lê
  a senha de variável de ambiente/prompt — **nunca** um valor fixo no
  código-fonte (correção da falha mais crítica encontrada na auditoria).
- A sessão administrativa é um JWT assinado (HS256) em cookie **httpOnly**;
  o segredo (`AUTH_SECRET`) vem exclusivamente de variável de ambiente.
- `src/middleware.ts` protege todas as rotas `/admin/*`; **além disso**,
  cada função da camada de serviço que faz uma operação administrativa
  chama `requireAdminSession()` (`src/lib/authz.ts`) — a autorização não
  depende só da rota lembrar de checar a sessão.
- A Área do Cliente nunca faz busca por correspondência parcial de
  telefone/e-mail: o acesso exige um código de uso único, de curta duração,
  enviado (nesta demonstração, registrado nos logs do servidor — ver
  [Pendências externas](#pendências-externas-o-que-só-você-pode-configurar))
  para o contato exato já cadastrado.
- Login e verificação de código de acesso têm rate limiting (ver
  `src/lib/rate-limit.ts`).
- Toda regra crítica de agendamento (impedir horário duplicado, reativação
  de agendamento cancelado, reagendamento) é validada dentro de uma
  transação serializável no banco — nunca apenas no formulário — **e** há
  uma constraint de exclusão no próprio Postgres como barreira final.
- Nenhuma credencial, chave privada ou segredo é versionado — veja
  `.env.example` e `.gitignore`. Nenhuma chave de serviço (`SUPABASE_SERVICE_ROLE_KEY`)
  é lida por código que roda no navegador (auditado: nenhum componente
  `'use client'` lê `process.env` diretamente).

---

## Instalação e execução local

Pré-requisitos: Node.js 18.18+, npm, e um **PostgreSQL** (local ou remoto —
não há mais suporte a SQLite, ver correção nº 8).

### 1. Suba um Postgres (se não tiver um à mão)

A forma mais rápida para desenvolvimento local é via Docker:

```bash
docker run --name jfdev-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
```

(Alternativamente, crie um projeto gratuito no [Supabase](https://supabase.com)
e use a connection string dele diretamente — pule para o passo 3.)

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` e preencha `DATABASE_URL` (aponte para o Postgres do passo 1 ou
para o seu Supabase) e gere um `AUTH_SECRET` forte:

```bash
openssl rand -base64 32
```

> Por que `.env` e não `.env.local`? Porque tanto o Next.js quanto o CLI do
> Prisma e os scripts standalone (`seed.ts`, `create-admin.ts`) leem `.env`
> automaticamente — `.env.local` só é lido pelo Next.js. Usar `.env.local`
> para `DATABASE_URL` causava o erro `P1012: variável de ambiente não
> encontrada: DATABASE_URL` ao rodar `prisma migrate`/`prisma studio`
> diretamente (erro relatado na auditoria e corrigido ao padronizar em
> `.env`).

### 4. Rode as migrations

```bash
npm run db:migrate:deploy
```

Isso cria todas as tabelas **e** a constraint de exclusão anti-double-booking
(ver [Banco de dados e migrations](#banco-de-dados-e-migrations)).

### 5. Crie a conta de administrador

```bash
npm run db:create-admin
```

O script pede e-mail, nome e senha (ou lê de `ADMIN_EMAIL`/`ADMIN_NAME`/
`ADMIN_PASSWORD` no `.env`, se definidos) — **nada é gravado em nenhum
arquivo do repositório**, apenas o hash da senha vai para o banco.

### 6. (Opcional) Popule dados fictícios de demonstração

```bash
npm run db:seed
```

Este script **nunca** cria a conta de administrador (isso é só o passo 5) e
**recusa rodar** se o banco já tiver dados ou se `NODE_ENV=production` — a
menos que você defina explicitamente `SEED_FORCE=eu-entendo-que-isso-apaga-dados`
(ver comentários em `prisma/seed.ts`).

### 7. Rode em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` para o site público e
`http://localhost:3000/admin/login` para o painel administrativo (use o
e-mail/senha que você definiu no passo 5).

### Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Sobe o build de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos (`tsc --noEmit`) |
| `npm run db:generate` | Gera o Prisma Client |
| `npm run db:migrate:dev` | Cria uma nova migration a partir de alterações no schema (ambiente de desenvolvimento) |
| `npm run db:migrate:deploy` | Aplica as migrations já existentes (ambiente de produção/CI) |
| `npm run db:seed` | Popula dados fictícios de demonstração (protegido — ver acima) |
| `npm run db:create-admin` | Cria/atualiza a conta de administrador |
| `npm run db:studio` | Abre o Prisma Studio (explorar o banco visualmente) |

---

## Variáveis de ambiente

Veja [`.env.example`](./.env.example) para a lista completa e comentada.
Nunca coloque valores reais nesse arquivo (ele é versionado) — os valores
reais vão em `.env` (ignorado pelo Git).

| Variável | Obrigatória | Descrição |
|---|---|---|
| `DATABASE_URL` | Sim | Connection string do Postgres (local ou Supabase) |
| `AUTH_SECRET` | Sim | Segredo para assinar cookies de sessão administrativa e tokens de acesso do cliente |
| `AUTH_SESSION_DURATION` | Não | Duração da sessão administrativa em segundos (padrão: 8h) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Não | Usadas apenas por `npm run db:create-admin`; sem elas, o script pergunta interativamente |
| `SEED_FORCE` | Não | Só necessária para forçar `npm run db:seed` a rodar contra um banco não-vazio ou em produção |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Não | Apenas se você usar recursos nativos do Supabase além do Postgres |
| `SUPABASE_SERVICE_ROLE_KEY` | Não | **Nunca** exponha esta chave ao navegador; o sistema, hoje, nem precisa dela — todo acesso ao banco passa pelo Prisma no servidor |
| `NEXT_PUBLIC_APP_URL` | Não | URL pública da aplicação — agora efetivamente usada para montar a URL base de Open Graph/metadados (antes era lida no README mas não no código — corrigido) |

---

## Banco de dados e migrations

O schema (`prisma/schema.prisma`) modela: `profiles`, `businesses`,
`professionals`, `professional_working_hours`, `clients`, `services`,
`professional_services`, `appointments`, `blocked_times`, `business_hours`,
`settings` e `client_access_codes` — com UUIDs, timestamps
(`createdAt`/`updatedAt`) e relacionamentos adequados.

O provider é **PostgreSQL** — não há mais um modo "SQLite de
desenvolvimento" (correção da auditoria: o schema anterior usava SQLite,
incompatível com a constraint de exclusão descrita abaixo e com o pedido
explícito de "banco real"). Duas migrations versionadas estão em
`prisma/migrations/`:

1. **`20260101000100_init`** — todas as tabelas, índices e chaves
   estrangeiras. As relações de `Appointment` com `Client`, `Professional` e
   `Service` usam `ON DELETE RESTRICT` (não `CASCADE`): excluir um cliente,
   profissional ou serviço com histórico de agendamentos é **recusado pelo
   banco**, nunca apaga o histórico. Prefira desativar (`isActive = false`).
2. **`20260101000200_add_appointment_exclusion_constraint`** — ativa a
   extensão `btree_gist` e cria uma **exclusion constraint** que impede, no
   próprio Postgres, que o mesmo profissional tenha dois agendamentos
   "ativos" (pending/confirmed/completed) com horários sobrepostos — a
   barreira final contra duas reservas simultâneas do mesmo horário,
   independente de qualquer lógica de aplicação.

Estas migrations foram **escritas manualmente** (o ambiente usado para esta
correção não tem acesso à internet para instalar o CLI do Prisma) e depois
**verificadas de verdade contra um PostgreSQL 16 real** disponível nesse
mesmo ambiente — a aplicação das migrations, os testes de conflito e o
teste de concorrência real (duas transações simultâneas) estão documentados
com o resultado exato em
[Testes realizados e resultados reais](#testes-realizados-e-resultados-reais).
Ao rodar `npm run db:migrate:deploy` num ambiente com o Prisma CLI instalado
normalmente, o fluxo é o padrão do Prisma Migrate — nada de especial é
necessário.

Se for usar o Supabase além do Postgres puro (ex.: Storage, Realtime), ative
**Row Level Security (RLS)** nas tabelas antes de expor qualquer acesso
direto do navegador ao banco. Hoje, porém, **nenhum acesso direto do
navegador ao Supabase existe neste projeto** — todo o acesso passa pelo
Prisma, no servidor, então a política de RLS relevante, no mínimo, é
"negar tudo" para o cliente anônimo (o Prisma se conecta com uma connection
string de banco, não com a anon key).

---

## Segurança

- `.env` e qualquer arquivo com segredo estão no `.gitignore`.
- Nenhuma senha, token ou chave privada existe hardcoded no código-fonte —
  incluindo a conta de administrador, que antes tinha uma senha fixa no
  seed (corrigido, ver abaixo).
- Rate limiting em memória (`src/lib/rate-limit.ts`) nos endpoints de login,
  solicitação/verificação de código de acesso do cliente, e criação pública
  de agendamento. **Limitação honesta**: por ser em memória do processo, não
  é compartilhado entre múltiplas instâncias/réplicas — para produção
  multi-instância, troque por um limitador com estado compartilhado (ex.:
  Upstash Redis), reaproveitando a mesma interface.
- Autorização checada em duas camadas: nas rotas de API **e** dentro da
  camada de serviço (`requireAdminSession()`), então um esquecimento em uma
  rota não abre uma falha silenciosa.
- Dados de demonstração (`prisma/seed.ts`) são inteiramente fictícios.

---

## Build e deploy

```bash
npm run build
npm run start
```

**Este projeto não foi publicado nem implantado como parte desta correção**
(instrução explícita: nenhum deploy foi feito). Para publicar quando você
decidir:

1. Provisione um Postgres real (ex.: Supabase) e configure `DATABASE_URL`.
2. Configure `AUTH_SECRET` com um valor forte e exclusivo do ambiente de
   produção (nunca reutilize o de desenvolvimento).
3. Rode `npx prisma migrate deploy` antes do primeiro start.
4. Rode `npm run db:create-admin` (com `ADMIN_EMAIL`/`ADMIN_PASSWORD`
   definidos como segredos da plataforma de deploy, nunca em texto puro).
5. Preencha `src/config/site.ts` com os dados reais de contato da JF Dev.
6. Adicione a imagem oficial da marca em `public/images/jf-dev/`.
7. Configure um provedor real de SMS/e-mail para o código de acesso da Área
   do Cliente (ver [Pendências externas](#pendências-externas-o-que-só-você-pode-configurar)).

---

## Correções desta auditoria

Resumo do que foi encontrado e corrigido, na ordem do relatório recebido:

1. **Busca de histórico do cliente insegura** — a Área do Cliente buscava
   por `phone: { contains }` / `email: { contains }` (correspondência
   parcial): qualquer pessoa que soubesse um pedaço do telefone/e-mail de
   outra pessoa via o histórico completo dela. **Corrigido**: fluxo de duas
   etapas com correspondência EXATA + código de acesso de uso único, de
   curta duração, com rate limiting e resposta genérica (nunca revela se um
   contato existe). Ver `src/services/client-access.service.ts` e
   `src/app/api/client-lookup/{request,verify}/route.ts`.
2. **Senha de admin hardcoded no seed** — `JfDev@2026` estava fixa no
   código-fonte. **Corrigido**: criação de admin separada em
   `prisma/create-admin.ts`, lendo credenciais de variável de
   ambiente/prompt; o seed nunca mais toca na tabela `profiles`.
3. **Seed sem proteção contra rodar em produção** — `prisma/seed.ts`
   apagava todas as tabelas incondicionalmente. **Corrigido**: recusa rodar
   se `NODE_ENV=production` ou se o banco já tiver dados, a menos que
   `SEED_FORCE` seja definida explicitamente.
4. **Rate limiting ausente** — adicionado em login, código de acesso do
   cliente e criação pública de agendamento (`src/lib/rate-limit.ts`).
5. **Autorização só nas rotas** — `requireAdminSession()` agora é chamada
   também dentro de cada função da camada de serviço que faz uma operação
   administrativa (`src/lib/authz.ts`).
6. **Segredos no frontend** — auditado: nenhum componente `'use client'` lê
   `process.env` diretamente; `AUTH_SECRET` e `SUPABASE_SERVICE_ROLE_KEY`
   só são referenciados em código que roda exclusivamente no servidor.
7. **Dependências desatualizadas** — versões atualizadas em `package.json`
   (Next 15.2.4 — já corrige o CVE-2025-29927 de bypass de middleware —,
   Prisma 5.20, jose 5.9, framer-motion 11.11, three 0.168,
   @react-three/fiber 8.17, @react-three/drei 9.114, recharts 2.13,
   lucide-react 0.451, tailwindcss 3.4.13); `date-fns` removido (não era
   usado em nenhum lugar do código).
8. **Validação de agendamento espalhada e reativação sem checagem** — toda
   a regra de negócio (horário comercial, expediente do profissional,
   vínculo profissional-serviço, duração real do serviço, bloqueios,
   conflito com outros agendamentos, horário no passado, janela de
   agendamento, fuso horário do negócio) agora vive em UMA função
   (`assertBookableSlot`, em `src/lib/booking-rules.ts`), usada por
   disponibilidade, criação, reagendamento **e** mudança de status
   (inclusive reativar um agendamento cancelado). O cenário exato descrito
   — cancelar A, reservar B no mesmo horário, reativar A — foi reproduzido
   e verificado como impossível (ver seção de testes).
9. **Concorrência (double booking)** — uma consulta antes do INSERT jamais
   seria suficiente: agora a criação/reagendamento/reativação rodam dentro
   de uma transação **SERIALIZABLE** com retry automático em conflito
   (`src/lib/db-retry.ts`), **e** existe uma **constraint de exclusão no
   próprio Postgres** (`btree_gist`) como barreira final — verificada com um
   teste real de duas transações concorrentes (ver testes).
10. **Reagendamento não re-derivava a duração** — `rescheduleAppointment`
    agora sempre busca a duração/preço atuais do serviço no banco, nunca
    reaproveita um valor antigo ou vindo do cliente.
11. **Banco SQLite "preparado para produção"** — trocado definitivamente
    para PostgreSQL, com migrations versionadas e hand-verificadas contra um
    Postgres real (ver acima). Nenhuma credencial do Supabase foi inventada
    — a conexão usa `DATABASE_URL` como qualquer Postgres.
12. **Cascata de exclusão destruindo histórico** — `onDelete: Restrict` nas
    relações de `Appointment`; excluir cliente/profissional/serviço com
    histórico agora é recusado pelo banco (era `Cascade` antes).
13. **Atualizações multietapas não atômicas** — `updateProfessional` e
    `updateService` apagavam vínculos/horários numa transação separada da
    atualização principal; uma falha no meio deixava o registro sem nenhum
    vínculo. Agora tudo roda em uma única transação.
14. **Agenda travando após criar/bloquear** — o recarregamento dependia de
    `setRefDate(new Date(d))`, que não mudava `getTime()` e por isso nunca
    re-executava o `useEffect` de busca. Corrigido com um contador de
    recarregamento explícito.
15. **Bloqueios de múltiplos dias não apareciam** — a visão de dia só
    considerava bloqueios cujo início batia exatamente com o dia exibido;
    as visões de semana/mês nem recebiam os bloqueios. Corrigido: qualquer
    bloqueio cujo intervalo toque o dia aparece nas três visões.
16. **`bookingWindowDays`/`cancellationWindowHours` sem efeito real** — a
    seleção de data no site público usava um valor fixo de 30 dias,
    ignorando a configuração; não existia nenhum cancelamento de cliente
    para `cancellationWindowHours` valer. Corrigido: novo endpoint público
    `/api/public/business-info` expõe `bookingWindowDays` de verdade, e a
    Área do Cliente ganhou cancelamento real, que aplica
    `cancellationWindowHours`.
17. **Reagendamento inexistente no painel** — adicionado
    (`RescheduleForm`), reaproveitando a mesma busca de disponibilidade do
    site público.
18. **Dashboard/relatórios com rótulo divergente do cálculo** — "Clientes"
    exibia uma contagem total rotulada como "ativos"; renomeado para
    "Clientes cadastrados" (rótulo agora corresponde exatamente ao que é
    calculado), e as métricas restritas aos últimos 6 meses foram
    identificadas como tal na tela.
19. **Busca e notificações decorativas** — a busca da barra superior não
    fazia nada; implementada busca real (`/api/search`). O sino de
    notificações não tinha nenhuma notificação real por trás — removido
    (nenhum botão decorativo).
20. **"Confirmado" exibido para registro pendente** — a tela de
    confirmação do agendamento sempre dizia "Agendamento confirmado!",
    mesmo quando o status real era `pending` (o padrão). Corrigido: a
    mensagem reflete o status real devolvido pelo servidor.
21. **Mensagem falsa de envio de SMS** — "Enviamos os detalhes para seu
    telefone" nunca correspondeu a nenhum envio real. Removida; substituída
    por uma mensagem honesta (os dados ficam disponíveis na Área do
    Cliente).
22. **Contato da JF Dev misturado com o do estabelecimento** — o botão
    "Falar pelo WhatsApp" na confirmação de agendamento usava o WhatsApp da
    JF Dev; agora usa o WhatsApp do **estabelecimento**
    (`Setting.whatsappNumber`), e a JF Dev só aparece no rodapé/seções
    institucionais.
23. **CSV exportável vulnerável a injeção de fórmula** — células que
    começassem com `=`, `+`, `-`, `@` são agora prefixadas com um apóstrofo
    antes da exportação (mitigação recomendada pela OWASP).
24. **Erros de build/lint/compilação já identificados** — os 5 apontados
    foram corrigidos sem desabilitar nenhuma regra de TypeScript/lint:
    TS2430 em `charts.tsx` (tooltip customizado redeclarava `formatter` do
    Recharts com assinatura incompatível — resolvido com `Pick<...>` e um
    nome de prop diferente), `.eslintrc.json` sem `next/typescript`, SVG
    quebrado em `input.tsx` (substituído por um ícone `ChevronDown` real),
    e o carregamento de `DATABASE_URL` padronizado em `.env` (ver acima).
25. **Acessibilidade do modal** — nenhum gerenciamento de foco existia;
    adicionado focus trap completo (foco vai para o modal ao abrir, Tab
    fica preso dentro dele, foco volta ao elemento que o abriu ao fechar).
26. **`prefers-reduced-motion` só na cena 3D** — as dezenas de animações
    Framer Motion do resto do site ignoravam a preferência do sistema.
    Corrigido com `<MotionConfig reducedMotion="user">` no layout raiz,
    aplicando a preferência a toda a árvore de componentes de uma vez.
27. **3D continuava renderizando fora da tela** — adicionado um
    `IntersectionObserver` que pausa o loop de renderização
    (`frameloop="never"`) quando o hero sai da área visível.
28. **URL de metadados/Open Graph nunca lida de `NEXT_PUBLIC_APP_URL`** —
    a variável estava documentada desde sempre mas não era usada em nenhum
    lugar do código. Corrigida.

---

## Testes realizados e resultados reais

Ver o arquivo dedicado **[`RELATORIO_DE_TESTES.md`](./RELATORIO_DE_TESTES.md)**
para o resultado de cada um dos 12 cenários pedidos, incluindo:

- os testes que puderam ser executados **de verdade** neste ambiente (lógica
  pura via `tsx`, e verificação do banco via `psql` contra um PostgreSQL 16
  real — inclusive um teste real de duas transações concorrentes tentando
  reservar o mesmo horário, e a reprodução exata do cenário "cancelar A,
  reservar B, reativar A");
- os testes que **não puderam ser executados neste ambiente** porque ele não
  tem acesso à internet para instalar `node_modules`/rodar `next build` —
  com o passo a passo exato de como você mesmo pode rodá-los no seu
  computador.

---

## Pendências externas (o que só você pode configurar)

Nenhuma credencial foi inventada. Para colocar este sistema em produção
com 100% das funcionalidades descritas, falta configurar externamente:

1. **Um Postgres real de produção** (ex.: criar o projeto no Supabase) e
   apontar `DATABASE_URL` para ele.
2. **Um provedor real de SMS ou e-mail** para o código de acesso da Área do
   Cliente — hoje (`src/lib/notifications.ts`) o código é apenas registrado
   nos logs do servidor, o que é seguro (nada é exposto ao cliente
   indevidamente) mas não é um envio de verdade. Implemente
   `NotificationSender` com Resend/SendGrid (e-mail) ou Twilio/Zenvia (SMS)
   e troque a instância exportada — as credenciais desse provedor vão em
   variáveis de ambiente, nunca no código.
3. **A imagem real da marca JF Dev** em `public/images/jf-dev/` e os dados
   reais de contato em `src/config/site.ts` (hoje em branco de propósito).
4. **Rodar `npm install`, `npm run build`, `npm run typecheck` e `npm run
   lint` no seu computador/CI** — o ambiente usado para esta correção não
   tem acesso à internet para baixar pacotes do npm, então esses comandos
   não puderam ser executados aqui (ver `RELATORIO_DE_TESTES.md` para o que
   foi verificado como alternativa).
5. Se for operar com múltiplas instâncias/réplicas em produção, trocar o
   rate limiter em memória (`src/lib/rate-limit.ts`) por um com estado
   compartilhado (ex.: Upstash Redis).

---

Desenvolvido pela **JF Dev** — tecnologia, exclusividade e sofisticação.
