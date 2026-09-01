// Vasco's exploration/science lines for Science, World, City and HowMade.
// Kept as plain content (like offScreenMissions.*.json) rather than i18n
// keys because frontend/src/i18n/index.js is being actively edited by a
// concurrent agent — routing through it here would collide.
//
// Shape: LINES[langCode][area] = { opening, correct, encouraging, closing }
// — each an array of short, warm, age-5-appropriate variants so repeat
// visits don't feel robotic. Use pickLine() from
// components/mascots/reactionLines.js to choose one at random.
//
// TODO: only pt/en are filled in; other 5 app languages fall back to en.
const LINES = {
  pt: {
    science: {
      opening: [
        "Olá! Sou o Vasco. Hoje vamos explorar como o mundo funciona!",
        "Prepara a lupa do explorador — há muita ciência para descobrir!",
        "Vamos fazer experiências e descobrir os segredos da natureza?",
      ],
      correct: ["Boa descoberta! 🔬", "Isso mesmo, cientista!", "Muito bem, olhaste com atenção!"],
      encouraging: [
        "Não faz mal, os cientistas também se enganam nas experiências!",
        "Quase! Vamos observar outra vez.",
        "Boa tentativa — continua a explorar!",
      ],
      closing: [
        "Hoje foste um verdadeiro cientista! Vai lá fora e observa uma planta ou uma pedra diferente.",
        "Adorei explorar contigo! Experimenta encontrar algo no jardim que já sabes explicar.",
        "Boa sessão de descobertas! Olha à tua volta — quantas coisas consegues explicar agora?",
      ],
    },
    world: {
      opening: [
        "Olá! Sou o Vasco. Vamos viajar pelo mundo sem sair daqui?",
        "O mundo é enorme e cheio de lugares novos — vamos explorar?",
        "Prepara a mala do explorador! Hoje vamos conhecer países novos.",
      ],
      correct: ["Boa! Já conheces mais um cantinho do mundo!", "Isso mesmo, explorador!", "Muito bem, a tua bússola está certeira!"],
      encouraging: [
        "Não faz mal, o mundo é grande — vamos tentar outra vez!",
        "Quase lá! Olha bem para as pistas.",
        "Boa tentativa, continua a explorar o mapa!",
      ],
      closing: [
        "Que viagem incrível! Vai procurar num mapa ou globo um país que ainda não conheces.",
        "Explorámos o mundo todo hoje! Pergunta a alguém da família qual é o país favorito dela.",
        "Boa aventura! Experimenta desenhar a bandeira de um país que descobriste.",
      ],
    },
    city: {
      opening: [
        "Olá! Sou o Vasco. Vamos explorar como as coisas funcionam à tua volta?",
        "Este mundo está cheio de segredos escondidos — vamos descobri-los?",
        "Prepara a lupa do explorador! Hoje vamos ver como tudo funciona.",
      ],
      correct: ["Boa! Descobriste como funciona!", "Isso mesmo, engenheiro!", "Muito bem, percebeste o sistema todo!"],
      encouraging: [
        "Não faz mal, vamos olhar outra vez com atenção.",
        "Quase lá! Pensa nos passos com calma.",
        "Boa tentativa, continua a explorar!",
      ],
      closing: [
        "Agora já sabes como isto funciona! Pergunta em casa como chega a água à torneira.",
        "Boa exploração! Vai ver de perto uma destas coisas em casa ou na rua.",
        "Adorei explorar contigo! Conta a alguém da família o que descobriste hoje.",
      ],
    },
    howMade: {
      opening: [
        "Olá! Sou o Vasco. Vamos descobrir como as coisas são feitas?",
        "Achas que sabes de onde vem isto? Vamos investigar!",
        "Prepara-te, explorador — hoje seguimos o caminho das coisas!",
      ],
      correct: ["Boa! Seguiste bem o caminho!", "Isso mesmo, detetive das coisas!", "Muito bem, descobriste a origem!"],
      encouraging: [
        "Não faz mal, vamos seguir os passos outra vez.",
        "Quase lá! Pensa em como a coisa começa.",
        "Boa tentativa, continua a investigar!",
      ],
      closing: [
        "Agora já sabes de onde vêm as coisas! Vai ver a etiqueta de algo em casa e descobre de onde veio.",
        "Boa investigação! Pergunta em casa como se faz o teu alimento preferido.",
        "Adorei explorar contigo a origem das coisas! Conta a alguém o que aprendeste.",
      ],
    },
  },
  en: {
    science: {
      opening: [
        "Hi! I'm Vasco. Today let's explore how the world works!",
        "Grab your explorer's magnifying glass — there's so much science to find!",
        "Shall we run some experiments and uncover nature's secrets?",
      ],
      correct: ["Great discovery! 🔬", "That's it, scientist!", "Well done, sharp eyes!"],
      encouraging: [
        "That's okay, even scientists get surprised sometimes!",
        "Almost! Let's take another look.",
        "Good try — keep exploring!",
      ],
      closing: [
        "You were a real scientist today! Go outside and look closely at a plant or a rock.",
        "I loved exploring with you! See if you can find something in your garden you can now explain.",
        "Great discovery session! Look around — how many things can you explain now?",
      ],
    },
    world: {
      opening: [
        "Hi! I'm Vasco. Shall we travel the world without leaving home?",
        "The world is huge and full of new places — let's explore!",
        "Pack your explorer bag! Today we meet new countries.",
      ],
      correct: ["Nice! You know a new corner of the world now!", "That's it, explorer!", "Well done, your compass is spot on!"],
      encouraging: [
        "That's okay, the world is big — let's try again!",
        "Almost there! Look closely at the clues.",
        "Good try, keep exploring the map!",
      ],
      closing: [
        "What an amazing trip! Go find a country you don't know yet on a map or globe.",
        "We explored the whole world today! Ask someone in your family what their favourite country is.",
        "Great adventure! Try drawing the flag of a country you discovered.",
      ],
    },
    city: {
      opening: [
        "Hi! I'm Vasco. Let's explore how things around you work!",
        "This world is full of hidden secrets — shall we find them?",
        "Grab your explorer's magnifying glass! Today we see how things work.",
      ],
      correct: ["Nice! You figured out how it works!", "That's it, engineer!", "Well done, you understood the whole system!"],
      encouraging: [
        "That's okay, let's look again carefully.",
        "Almost there! Think through the steps slowly.",
        "Good try, keep exploring!",
      ],
      closing: [
        "Now you know how this works! Ask at home how water gets to the tap.",
        "Great exploring! Go take a close look at one of these things at home or outside.",
        "I loved exploring with you! Tell someone in your family what you discovered today.",
      ],
    },
    howMade: {
      opening: [
        "Hi! I'm Vasco. Let's find out how things are made!",
        "Do you know where this comes from? Let's investigate!",
        "Get ready, explorer — today we follow the trail of things!",
      ],
      correct: ["Nice! You followed the trail well!", "That's it, thing-detective!", "Well done, you found the origin!"],
      encouraging: [
        "That's okay, let's follow the steps again.",
        "Almost there! Think about how it begins.",
        "Good try, keep investigating!",
      ],
      closing: [
        "Now you know where things come from! Go check the label on something at home and find out where it came from.",
        "Great investigating! Ask at home how your favourite food is made.",
        "I loved exploring where things come from with you! Tell someone what you learned.",
      ],
    },
  },
};

export function getVascoLines(area, langCode) {
  const byLang = LINES[langCode] || LINES.en;
  return byLang[area] || LINES.en[area];
}
