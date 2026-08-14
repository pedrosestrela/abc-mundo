# ABC Mundo — Arquitetura

## Estado atual (auditoria)

**Stack**: Vite + React (frontend), FastAPI + sqlite3 puro (backend, ficheiro
único `backend/main.py`), Docker + Fly.io + Litestream + GitHub Actions
(deploy), PWA (manifest + service worker), pasta `android/` com scaffold TWA.

**Frontend — 21 módulos ativos**, todos ligados por rota + item de nav +
traduções nos 7 idiomas (`frontend/src/i18n/index.js`). A ordem na barra de
navegação segue a sequência pedagógica sugerida (sons → letras → sílabas →
leitura → ... → mundos de conhecimento → literacia financeira → missões →
conquistas → pais):

| Módulo | Rota | Conteúdo |
|---|---|---|
| Sons (Consciência Fonológica) | `/phonics` | `content/phonics.<lang>.json` |
| Alfabeto | `/alphabet` | `content/alphabet.<lang>.json` |
| Sílabas | `/syllables` | `content/syllables.<lang>.json` |
| Leitura | `/reading` | `content/reading.<lang>.json` |
| Frases | `/phrases` | `content/phrases.<lang>.json` |
| Histórias | `/stories` | `content/stories.<lang>.json` |
| Jogo (quiz) | `/game` | gerado a partir de `reading.<lang>.json` |
| Matemática | `/math` | gerado (contar/números/soma-subtração) |
| Canções | `/songs` | `content/songs.<lang>.json` |
| Piano | `/piano` | `content/pianoSongs.json` |
| Mundo dos Exploradores (geografia) | `/world` | `content/countries.json` (20 países) + globo 3D |
| Detetive da Verdade (pensamento crítico) | `/detective` | `content/detective.<lang>.json` |
| Castelo do Tempo (História de Portugal) | `/history` | `content/portugalHistory.json` (20 eras) |
| Laboratório das Descobertas (Ciências) | `/science` | `content/science.<lang>.json` |
| Planeta dos Robôs (programação) | `/robots` | níveis gerados (grelha/algoritmos) |
| Atelier da Imaginação (arte) | `/art` | `content/artPrompts.<lang>.json` + canvas |
| Grande Livro dos Porquês | `/whys` | `content/whys.<lang>.json` |
| Literacia Financeira | `/financial` | `content/financial.<lang>.json` |
| Missões (mundo real) | `/missions` | `content/missions.<lang>.json` |
| Modo Pais | `/parents` | lê `storage.js` (motor de progresso) |
| Conquistas | `/achievements` | lê `storage.js` |

Adicional: `SessionEndOverlay` (sugestão gentil para sair do ecrã ao fim de
~15 min de sessão, não bloqueante).

**Idiomas**: pt (Portugal), en, de, fr, es, it, zh — 7 idiomas, par
"idioma principal / idioma a aprender" escolhido pelo utilizador.

**Perfil**: nome, avatar, idade (5–10+) — guardado em `localStorage`
(`abcmundo.profile`). Um único perfil por dispositivo (sem multi-perfil
familiar ainda).

**Motor de progresso** (`frontend/src/storage.js`, tudo em `localStorage`,
sem backend):
- `recordSkillEvent(profile, skill, correct)` — XP, sequência diária,
  contagem correct/attempts por skill, mastery a partir de 5 acertos
  seguidos.
- `getDifficultyTier(age)` — 3 níveis (5-6 / 7-8 / 9+) usados pelos jogos
  para escalar dificuldade.
- `completeMission` / `getCompletedMissions` — passaporte de missões
  offline.
- **Lacuna conhecida**: `recordSkillEvent` só é chamado nalguns módulos
  (Game, Phonics, MathGame, Financial). Alphabet/Reading/Syllables/Phrases
  ainda só chamam `pingProgress` (fire-and-forget para o backend, não
  fica localmente queryable). Isto significa que o Modo Pais e as
  Conquistas ficam com dados parciais até isso ser generalizado.

**Backend**: `GET /api/health`, `POST /api/progress/ping`,
`GET /api/progress/summary` — regista eventos agregados em sqlite
(`progress_events`). Não há autenticação, não há perfis no backend (tudo
client-side). Serve o build do frontend via `StaticFiles` quando
`backend/static` existe (é o que o `Dockerfile` gera).

**Conteúdo**: ficheiros JSON planos por idioma/módulo em
`frontend/src/content/`, carregados por um loader central
(`content/index.js`) com `import` estático (bundled no build, sem
carregamento dinâmico). ~60 ficheiros JSON.

**Testes**: nenhum teste automatizado (nem frontend nem backend). CI
(`.github/workflows/deploy.yml`) só faz deploy, sem lint/test step.

## O que falta para o deploy (manual, fora do meu alcance)
- Secret `FLY_API_TOKEN` no GitHub.
- Criar a app e o volume no Fly.io.

## Direção-alvo (roadmap, não implementado nesta sessão)

O pedido do utilizador descreve uma plataforma educativa 4–12 anos
completa (Mundos temáticos, currículo data-driven por
idade/competência/pré-requisito, Escola da Vida, sistema adaptativo,
multi-perfil familiar, PWA offline completo, testes de schema, etc.) —
ver histórico de conversa para a especificação completa. Isto é
trabalho de várias sessões, não de uma iteração. Prioridades sugeridas,
por fases:

1. **Fundação de dados**: migrar de "ficheiro JSON por módulo/idioma" para
   um schema de competência único (`skill`, `ageMin/ageMax`,
   `difficulty`, `prerequisites`) que module todos os módulos existentes
   sob a mesma estrutura — sem isso, currículo adaptativo por idade não
   é possível de forma consistente.
2. **Generalizar `recordSkillEvent`** a todos os módulos (hoje só 4 de 11
   o chamam) — pré-requisito para Modo Pais/Conquistas terem dados reais.
3. **Multi-perfil familiar** (hoje só há 1 perfil por dispositivo).
4. Só depois: novos Mundos (Ciências, História de Portugal, Tecnologia,
   Programação) e projetos de vários dias (horta, estação meteorológica).

### Decisão técnica: globo 3D adiado

O pedido inclui um globo terrestre 3D interativo (WebGL, ex. `three.js`
ou `globe.gl`) para o Mundo dos Exploradores. Implementei em vez disso
uma versão 2D (grelha de países + cartão de detalhe + quizzes de
bandeiras/capitais) — é a própria regra de fallback do pedido ("se WebGL
não estiver disponível, mostrar mapa 2D funcional"). Um globo 3D real
exige: escolher e testar a biblioteca WebGL, dados geográficos
(fronteiras/coordenadas) num formato compatível, otimização de
performance em tablets, e fallback automático para dispositivos fracos —
isto é um projeto à parte, não uma tarde de trabalho. Fica como item de
fase futura.

Este documento deve ser atualizado à medida que a arquitetura evolui.
