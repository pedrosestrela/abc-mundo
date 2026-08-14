# ABC Mundo

ABC Mundo é uma aplicação web de literacia infantil, no estilo Khan Kids,
que ensina o reconhecimento de letras maiúsculas/minúsculas, leitura e
escrita em 7 idiomas: Português, Inglês, Alemão, Francês, Mandarim, Espanhol e Italiano.

Os pais/professores escolhem um "idioma principal" (interface) e um
"idioma secundário" (idioma a aprender), e a app mostra sempre os dois em
simultâneo — por exemplo, a letra "A" com a palavra "Abelha / Bee" e a
pronúncia de ambos os idiomas via Web Speech API.

Módulos:

- **Alfabeto** — tocar/traçar letras maiúsculas e minúsculas, ouvir a
  pronúncia via `speechSynthesis`.
- **Leitura** — palavras simples por idioma, com emojis como ilustração.
- **Canções** — 2-3 "canções do alfabeto" originais por idioma, com letra
  lida em voz alta via Web Speech API (não é áudio/vídeo gravado real) e
  ilustrações em SVG inline.

## Stack

- **Backend**: Python + FastAPI, sqlite3 (stdlib, sem ORM), ficheiro único
  `backend/main.py`.
- **Frontend**: Vite + React, `react-i18next` para a interface, PWA
  (manifest + service worker).
- **Deploy**: Docker (build multi-stage) + Fly.io + Litestream (replicação
  do sqlite para armazenamento S3-compatível) + GitHub Actions.

## Correr localmente

### Backend

```
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8099
```

A API fica disponível em `http://127.0.0.1:8099`. O endpoint de saúde é
`GET /api/health`.

### Frontend

```
cd frontend
npm install
npm run dev
```

O frontend fica disponível em `http://localhost:5173` (porta por omissão
do Vite) e faz proxy de `/api` para `http://127.0.0.1:8099` (ver
`frontend/vite.config.js`).

### Build de produção local

```
cd frontend
npm run build
```

Isto gera `frontend/dist`, que pode ser copiado para `backend/static`
para o FastAPI servir tudo a partir de um único processo (é o que o
`Dockerfile` faz automaticamente).

## Deploy

O deploy é feito **exclusivamente via GitHub Actions**: um push para a
branch `main` despoleta o workflow `.github/workflows/deploy.yml`, que
corre `flyctl deploy -a abc-mundo-api` usando o secret `FLY_API_TOKEN`.

**Nunca fazer deploy manual via `flyctl` localmente** — mantém o histórico
de deploys consistente e evita divergências entre o que está no Git e o
que está em produção.

## Falta fazer manualmente

- Configurar o secret `FLY_API_TOKEN` no GitHub (Settings → Secrets and
  variables → Actions).
- Criar a app no Fly.io: `fly apps create abc-mundo-api`.
- Criar o volume de dados: `fly volumes create abcmundo_data --size 1 -a abc-mundo-api -r lhr`.
- Gerar ícones PNG reais a partir do placeholder SVG (`frontend/public/icon.svg`)
  para melhor compatibilidade com lojas de apps e alguns launchers Android.
- (Opcional/futuro) substituir os placeholders SVG e as canções sintetizadas
  por voz por ilustrações e áudio/vídeo reais gravados.

## Estado do projeto

Isto é um **scaffold v1**:

- Os 5 idiomas estão estruturalmente ligados (seletor, conteúdo, UI).
- O Mandarim é um conjunto inicial de ~30 caracteres comuns, pensado para
  ser expandido (não é um "alfabeto" completo — o Mandarim não tem
  alfabeto no sentido ocidental).
- Todo o áudio usa a Web Speech API do navegador (`speechSynthesis`) e
  todas as ilustrações das canções são SVG inline — nada foi descarregado
  ou reutilizado de fontes com direitos de autor. Estes podem ser
  substituídos por media real no futuro.
