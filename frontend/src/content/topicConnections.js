// "Ligações" — a small, hand-curated map of cross-subject connections.
//
// Deliberately NOT per-language: each entry only references a `module` +
// content `id` pair. The actual localized label/emoji is resolved at
// render time by RelatedLinks.jsx, which asks the matching module's own
// content getter (getScience/getWhys/getHowMade/getCountries) for the
// item — so a connection can never point at stale or made-up text.
//
// Every id below was verified against the real content files:
//   - science.pt.json   (module: "science")
//   - whys.pt.json      (module: "whys")
//   - howMade.pt.json   (module: "howMade")
//   - countries.json    (module: "world", id = ISO code)
//
// Connections are defined one-directional (source -> targets) but the
// list is built so common topics link both ways when it makes sense
// (e.g. science:arco-iris <-> whys:arco-iris) by having two entries.
export const TOPIC_CONNECTIONS = [
  // Chocolate: how it's made -> where cacao actually grows
  {
    from: { module: "howMade", id: "chocolate" },
    to: [{ module: "world", id: "ST" }],
  },
  // Bicycle assembly -> the lever/simple-machine science behind it
  {
    from: { module: "howMade", id: "bicicleta" },
    to: [{ module: "science", id: "alavancas" }],
  },

  // Whys <-> Science pairs that cover the same phenomenon from two angles
  {
    from: { module: "whys", id: "chuva" },
    to: [{ module: "science", id: "ciclo-agua" }],
  },
  {
    from: { module: "whys", id: "arco-iris" },
    to: [{ module: "science", id: "arco-iris" }],
  },
  {
    from: { module: "science", id: "arco-iris" },
    to: [{ module: "whys", id: "arco-iris" }],
  },
  {
    from: { module: "whys", id: "gelo-flutua" },
    to: [{ module: "science", id: "gelo-derrete" }],
  },
  {
    from: { module: "whys", id: "eletricidade" },
    to: [{ module: "science", id: "eletricidade-estatica" }],
  },
  {
    from: { module: "whys", id: "sombra" },
    to: [{ module: "science", id: "sombras" }],
  },
  {
    from: { module: "whys", id: "ima-atrai" },
    to: [{ module: "science", id: "imanes" }],
  },
  {
    from: { module: "whys", id: "estacoes-do-ano" },
    to: [{ module: "science", id: "estacoes" }],
  },
  {
    from: { module: "whys", id: "terra-gira" },
    to: [{ module: "science", id: "dia-noite" }],
  },
  {
    from: { module: "science", id: "coracao-bate" },
    to: [{ module: "whys", id: "coracao" }],
  },
  {
    from: { module: "science", id: "flutua-afunda" },
    to: [{ module: "whys", id: "barco" }],
  },
  {
    from: { module: "whys", id: "vulcoes" },
    to: [{ module: "world", id: "IS" }],
  },
  {
    from: { module: "whys", id: "trovao-relampago" },
    to: [{ module: "science", id: "som-vibracao" }],
  },
];

// Builds a lookup keyed "module:id" -> array of { module, id } targets.
// Also mirrors each connection in reverse, so e.g. opening the science
// "arco-iris" card surfaces the whys "arco-iris" question even though only
// one direction was declared above (avoids having to hand-write every pair
// twice while still letting both source pages show a real, working link).
function buildIndex() {
  const index = {};
  function add(from, to) {
    const key = `${from.module}:${from.id}`;
    if (!index[key]) index[key] = [];
    if (!index[key].some((t) => t.module === to.module && t.id === to.id)) {
      index[key].push(to);
    }
  }
  TOPIC_CONNECTIONS.forEach(({ from, to }) => {
    to.forEach((target) => {
      add(from, target);
      add(target, from);
    });
  });
  return index;
}

const CONNECTIONS_INDEX = buildIndex();

export function getRelatedTopics(module, id) {
  return CONNECTIONS_INDEX[`${module}:${id}`] || [];
}
