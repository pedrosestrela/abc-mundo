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
  de: {
    science: {
      opening: [
        "Hallo! Ich bin Vasco. Heute erkunden wir, wie die Welt funktioniert!",
        "Nimm deine Forscherlupe — es gibt so viel Wissenschaft zu entdecken!",
        "Machen wir Experimente und lüften die Geheimnisse der Natur?",
      ],
      correct: ["Tolle Entdeckung! 🔬", "Genau so, kleiner Forscher!", "Sehr gut, du hast genau hingeschaut!"],
      encouraging: [
        "Macht nichts, auch Forscher werden manchmal überrascht!",
        "Fast! Schauen wir noch einmal genau hin.",
        "Guter Versuch — weiter erkunden!",
      ],
      closing: [
        "Heute warst du ein echter Wissenschaftler! Geh raus und schau dir eine Pflanze oder einen Stein genau an.",
        "Ich habe es geliebt, mit dir zu forschen! Such im Garten etwas, das du jetzt erklären kannst.",
        "Tolle Entdeckungsreise! Schau dich um — wie viele Dinge kannst du jetzt erklären?",
      ],
    },
    world: {
      opening: [
        "Hallo! Ich bin Vasco. Reisen wir um die Welt, ohne das Haus zu verlassen?",
        "Die Welt ist riesig und voller neuer Orte — erkunden wir sie?",
        "Pack deine Forschertasche! Heute lernen wir neue Länder kennen.",
      ],
      correct: ["Toll! Du kennst jetzt eine neue Ecke der Welt!", "Genau so, kleiner Entdecker!", "Sehr gut, dein Kompass zeigt genau richtig!"],
      encouraging: [
        "Macht nichts, die Welt ist groß — versuchen wir es noch mal!",
        "Fast geschafft! Schau dir die Hinweise genau an.",
        "Guter Versuch, erkunde die Karte weiter!",
      ],
      closing: [
        "Was für eine tolle Reise! Such auf einer Karte oder einem Globus ein Land, das du noch nicht kennst.",
        "Wir haben heute die ganze Welt erkundet! Frag jemanden in deiner Familie, was sein Lieblingsland ist.",
        "Tolles Abenteuer! Versuch, die Flagge eines Landes zu zeichnen, das du entdeckt hast.",
      ],
    },
    city: {
      opening: [
        "Hallo! Ich bin Vasco. Erkunden wir, wie die Dinge um dich herum funktionieren?",
        "Diese Welt steckt voller versteckter Geheimnisse — finden wir sie?",
        "Nimm deine Forscherlupe! Heute schauen wir, wie alles funktioniert.",
      ],
      correct: ["Toll! Du hast herausgefunden, wie es funktioniert!", "Genau so, kleiner Ingenieur!", "Sehr gut, du hast das ganze System verstanden!"],
      encouraging: [
        "Macht nichts, schauen wir noch einmal genau hin.",
        "Fast geschafft! Denk in Ruhe an die einzelnen Schritte.",
        "Guter Versuch, weiter erkunden!",
      ],
      closing: [
        "Jetzt weißt du, wie das funktioniert! Frag zu Hause, wie das Wasser bis zum Wasserhahn kommt.",
        "Tolles Erkunden! Schau dir eines dieser Dinge zu Hause oder draußen genau an.",
        "Ich habe es geliebt, mit dir zu erkunden! Erzähl jemandem in deiner Familie, was du heute entdeckt hast.",
      ],
    },
    howMade: {
      opening: [
        "Hallo! Ich bin Vasco. Finden wir heraus, wie Dinge gemacht werden?",
        "Weißt du, woher das kommt? Lass uns das untersuchen!",
        "Mach dich bereit, kleiner Forscher — heute folgen wir der Spur der Dinge!",
      ],
      correct: ["Toll! Du bist der Spur gut gefolgt!", "Genau so, kleiner Dingedetektiv!", "Sehr gut, du hast den Ursprung gefunden!"],
      encouraging: [
        "Macht nichts, folgen wir den Schritten noch einmal.",
        "Fast geschafft! Denk daran, wie es anfängt.",
        "Guter Versuch, weiter untersuchen!",
      ],
      closing: [
        "Jetzt weißt du, woher die Dinge kommen! Schau dir zu Hause ein Etikett an und finde heraus, woher es kam.",
        "Tolle Untersuchung! Frag zu Hause, wie dein Lieblingsessen gemacht wird.",
        "Ich habe es geliebt, mit dir den Ursprung der Dinge zu erkunden! Erzähl jemandem, was du gelernt hast.",
      ],
    },
  },
  fr: {
    science: {
      opening: [
        "Salut ! Je suis Vasco. Aujourd'hui, explorons comment le monde fonctionne !",
        "Prends ta loupe d'explorateur — il y a tant de science à découvrir !",
        "On fait des expériences et on découvre les secrets de la nature ?",
      ],
      correct: ["Belle découverte ! 🔬", "C'est ça, petit scientifique !", "Bravo, tu as bien observé !"],
      encouraging: [
        "Ce n'est pas grave, même les scientifiques sont parfois surpris !",
        "Presque ! Regardons encore une fois.",
        "Bel essai — continue à explorer !",
      ],
      closing: [
        "Aujourd'hui, tu étais un vrai scientifique ! Va dehors et observe de près une plante ou une pierre.",
        "J'ai adoré explorer avec toi ! Cherche dans le jardin quelque chose que tu peux maintenant expliquer.",
        "Belle séance de découvertes ! Regarde autour de toi — combien de choses peux-tu expliquer maintenant ?",
      ],
    },
    world: {
      opening: [
        "Salut ! Je suis Vasco. On voyage autour du monde sans sortir de chez toi ?",
        "Le monde est immense et plein de nouveaux endroits — on explore ?",
        "Prépare ton sac d'explorateur ! Aujourd'hui, on découvre de nouveaux pays.",
      ],
      correct: ["Bien joué ! Tu connais un nouveau coin du monde !", "C'est ça, petit explorateur !", "Bravo, ta boussole est parfaitement réglée !"],
      encouraging: [
        "Ce n'est pas grave, le monde est grand — essayons encore !",
        "Presque ! Regarde bien les indices.",
        "Bel essai, continue à explorer la carte !",
      ],
      closing: [
        "Quel voyage incroyable ! Va chercher sur une carte ou un globe un pays que tu ne connais pas encore.",
        "On a exploré le monde entier aujourd'hui ! Demande à quelqu'un de ta famille quel est son pays préféré.",
        "Belle aventure ! Essaie de dessiner le drapeau d'un pays que tu as découvert.",
      ],
    },
    city: {
      opening: [
        "Salut ! Je suis Vasco. Explorons comment fonctionnent les choses autour de toi !",
        "Ce monde est plein de secrets cachés — on les trouve ?",
        "Prends ta loupe d'explorateur ! Aujourd'hui, on voit comment tout fonctionne.",
      ],
      correct: ["Bien joué ! Tu as compris comment ça marche !", "C'est ça, petit ingénieur !", "Bravo, tu as compris tout le système !"],
      encouraging: [
        "Ce n'est pas grave, regardons encore une fois attentivement.",
        "Presque ! Pense calmement aux étapes.",
        "Bel essai, continue à explorer !",
      ],
      closing: [
        "Maintenant tu sais comment ça marche ! Demande à la maison comment l'eau arrive au robinet.",
        "Belle exploration ! Va observer de près une de ces choses à la maison ou dehors.",
        "J'ai adoré explorer avec toi ! Raconte à quelqu'un de ta famille ce que tu as découvert aujourd'hui.",
      ],
    },
    howMade: {
      opening: [
        "Salut ! Je suis Vasco. On découvre comment les choses sont fabriquées ?",
        "Tu sais d'où ça vient ? Enquêtons !",
        "Prépare-toi, petit explorateur — aujourd'hui on suit le chemin des choses !",
      ],
      correct: ["Bien joué ! Tu as bien suivi la piste !", "C'est ça, petit détective des objets !", "Bravo, tu as trouvé l'origine !"],
      encouraging: [
        "Ce n'est pas grave, suivons les étapes encore une fois.",
        "Presque ! Pense à comment ça commence.",
        "Bel essai, continue à enquêter !",
      ],
      closing: [
        "Maintenant tu sais d'où viennent les choses ! Va regarder l'étiquette de quelque chose à la maison et découvre d'où ça vient.",
        "Belle enquête ! Demande à la maison comment on fait ton plat préféré.",
        "J'ai adoré explorer avec toi l'origine des choses ! Raconte à quelqu'un ce que tu as appris.",
      ],
    },
  },
  es: {
    science: {
      opening: [
        "¡Hola! Soy Vasco. Hoy vamos a explorar cómo funciona el mundo!",
        "Prepara tu lupa de explorador — ¡hay tanta ciencia por descubrir!",
        "¿Hacemos experimentos y descubrimos los secretos de la naturaleza?",
      ],
      correct: ["¡Gran descubrimiento! 🔬", "¡Eso es, pequeño científico!", "¡Muy bien, miraste con atención!"],
      encouraging: [
        "No pasa nada, ¡hasta los científicos se llevan sorpresas!",
        "¡Casi! Observemos otra vez.",
        "Buen intento — ¡sigue explorando!",
      ],
      closing: [
        "¡Hoy fuiste un verdadero científico! Sal fuera y observa de cerca una planta o una piedra.",
        "¡Me encantó explorar contigo! Busca en el jardín algo que ahora puedas explicar.",
        "¡Buena sesión de descubrimientos! Mira a tu alrededor — ¿cuántas cosas puedes explicar ahora?",
      ],
    },
    world: {
      opening: [
        "¡Hola! Soy Vasco. ¿Viajamos por el mundo sin salir de casa?",
        "El mundo es enorme y está lleno de lugares nuevos — ¿exploramos?",
        "¡Prepara tu mochila de explorador! Hoy conocemos países nuevos.",
      ],
      correct: ["¡Genial! ¡Ya conoces un nuevo rincón del mundo!", "¡Eso es, pequeño explorador!", "¡Muy bien, tu brújula está bien calibrada!"],
      encouraging: [
        "No pasa nada, el mundo es grande — ¡intentémoslo otra vez!",
        "¡Casi! Mira bien las pistas.",
        "Buen intento, ¡sigue explorando el mapa!",
      ],
      closing: [
        "¡Qué viaje tan increíble! Busca en un mapa o un globo un país que aún no conozcas.",
        "¡Hoy exploramos el mundo entero! Pregunta a alguien de tu familia cuál es su país favorito.",
        "¡Buena aventura! Prueba a dibujar la bandera de un país que descubriste.",
      ],
    },
    city: {
      opening: [
        "¡Hola! Soy Vasco. ¿Exploramos cómo funcionan las cosas a tu alrededor?",
        "Este mundo está lleno de secretos escondidos — ¿los descubrimos?",
        "¡Prepara tu lupa de explorador! Hoy vemos cómo funciona todo.",
      ],
      correct: ["¡Genial! ¡Descubriste cómo funciona!", "¡Eso es, pequeño ingeniero!", "¡Muy bien, entendiste todo el sistema!"],
      encouraging: [
        "No pasa nada, miremos otra vez con atención.",
        "¡Casi! Piensa en los pasos con calma.",
        "Buen intento, ¡sigue explorando!",
      ],
      closing: [
        "¡Ahora ya sabes cómo funciona esto! Pregunta en casa cómo llega el agua al grifo.",
        "¡Buena exploración! Ve a ver de cerca una de estas cosas en casa o en la calle.",
        "¡Me encantó explorar contigo! Cuéntale a alguien de tu familia lo que descubriste hoy.",
      ],
    },
    howMade: {
      opening: [
        "¡Hola! Soy Vasco. ¿Descubrimos cómo se hacen las cosas?",
        "¿Sabes de dónde viene esto? ¡Vamos a investigar!",
        "¡Prepárate, pequeño explorador — hoy seguimos el rastro de las cosas!",
      ],
      correct: ["¡Genial! ¡Seguiste bien el rastro!", "¡Eso es, pequeño detective de las cosas!", "¡Muy bien, descubriste el origen!"],
      encouraging: [
        "No pasa nada, sigamos los pasos otra vez.",
        "¡Casi! Piensa en cómo empieza.",
        "Buen intento, ¡sigue investigando!",
      ],
      closing: [
        "¡Ahora ya sabes de dónde vienen las cosas! Ve a mirar la etiqueta de algo en casa y descubre de dónde vino.",
        "¡Buena investigación! Pregunta en casa cómo se hace tu comida favorita.",
        "¡Me encantó explorar contigo el origen de las cosas! Cuéntale a alguien lo que aprendiste.",
      ],
    },
  },
  it: {
    science: {
      opening: [
        "Ciao! Sono Vasco. Oggi esploriamo come funziona il mondo!",
        "Prendi la lente d'ingrandimento dell'esploratore — c'è tanta scienza da scoprire!",
        "Facciamo esperimenti e scopriamo i segreti della natura?",
      ],
      correct: ["Bella scoperta! 🔬", "Esatto, piccolo scienziato!", "Bravo, hai osservato con attenzione!"],
      encouraging: [
        "Non fa niente, anche gli scienziati a volte restano sorpresi!",
        "Quasi! Osserviamo di nuovo.",
        "Bel tentativo — continua a esplorare!",
      ],
      closing: [
        "Oggi sei stato un vero scienziato! Vai fuori e osserva da vicino una pianta o un sasso.",
        "Ho adorato esplorare con te! Cerca in giardino qualcosa che ora sai spiegare.",
        "Bella sessione di scoperte! Guardati intorno — quante cose riesci a spiegare adesso?",
      ],
    },
    world: {
      opening: [
        "Ciao! Sono Vasco. Viaggiamo per il mondo senza uscire di casa?",
        "Il mondo è enorme e pieno di posti nuovi — esploriamo?",
        "Prepara lo zaino da esploratore! Oggi conosciamo paesi nuovi.",
      ],
      correct: ["Bravo! Ora conosci un nuovo angolo del mondo!", "Esatto, piccolo esploratore!", "Bravissimo, la tua bussola è perfetta!"],
      encouraging: [
        "Non fa niente, il mondo è grande — riproviamo!",
        "Quasi! Guarda bene gli indizi.",
        "Bel tentativo, continua a esplorare la mappa!",
      ],
      closing: [
        "Che viaggio incredibile! Vai a cercare su una mappa o un mappamondo un paese che ancora non conosci.",
        "Oggi abbiamo esplorato tutto il mondo! Chiedi a qualcuno della tua famiglia qual è il suo paese preferito.",
        "Bella avventura! Prova a disegnare la bandiera di un paese che hai scoperto.",
      ],
    },
    city: {
      opening: [
        "Ciao! Sono Vasco. Esploriamo come funzionano le cose intorno a te?",
        "Questo mondo è pieno di segreti nascosti — li scopriamo?",
        "Prendi la lente d'ingrandimento dell'esploratore! Oggi vediamo come funziona tutto.",
      ],
      correct: ["Bravo! Hai scoperto come funziona!", "Esatto, piccolo ingegnere!", "Bravissimo, hai capito tutto il sistema!"],
      encouraging: [
        "Non fa niente, guardiamo di nuovo con attenzione.",
        "Quasi! Pensa ai passaggi con calma.",
        "Bel tentativo, continua a esplorare!",
      ],
      closing: [
        "Ora sai come funziona! Chiedi a casa come arriva l'acqua al rubinetto.",
        "Bella esplorazione! Vai a guardare da vicino una di queste cose a casa o fuori.",
        "Ho adorato esplorare con te! Racconta a qualcuno della tua famiglia cosa hai scoperto oggi.",
      ],
    },
    howMade: {
      opening: [
        "Ciao! Sono Vasco. Scopriamo come sono fatte le cose?",
        "Sai da dove viene questo? Indaghiamo!",
        "Preparati, piccolo esploratore — oggi seguiamo la strada delle cose!",
      ],
      correct: ["Bravo! Hai seguito bene la traccia!", "Esatto, piccolo detective delle cose!", "Bravissimo, hai scoperto l'origine!"],
      encouraging: [
        "Non fa niente, seguiamo di nuovo i passaggi.",
        "Quasi! Pensa a come inizia.",
        "Bel tentativo, continua a indagare!",
      ],
      closing: [
        "Ora sai da dove vengono le cose! Vai a guardare l'etichetta di qualcosa a casa e scopri da dove viene.",
        "Bella indagine! Chiedi a casa come si fa il tuo cibo preferito.",
        "Ho adorato esplorare con te l'origine delle cose! Racconta a qualcuno cosa hai imparato.",
      ],
    },
  },
  zh: {
    science: {
      opening: [
        "你好！我是巴斯科。今天我们一起来探索这个世界是怎么运作的吧！",
        "拿上你的探险放大镜——有好多科学等着我们去发现！",
        "我们来做实验，发现大自然的秘密吧？",
      ],
      correct: ["了不起的发现！🔬", "没错，小小科学家！", "真棒，你观察得真仔细！"],
      encouraging: [
        "没关系，连科学家有时候也会感到意外呢！",
        "就快了！我们再仔细看一次。",
        "很棒的尝试——继续探索吧！",
      ],
      closing: [
        "今天你就是一位真正的科学家！去外面仔细看看一株植物或一块石头吧。",
        "和你一起探索真开心！去花园里找一样你现在能解释清楚的东西吧。",
        "太棒的探索时光！看看你周围——你现在能解释多少东西呢？",
      ],
    },
    world: {
      opening: [
        "你好！我是巴斯科。我们不出门也能环游世界吗？",
        "世界很大很大，到处都是新地方——我们去探索吧？",
        "准备好探险背包！今天我们要认识新的国家。",
      ],
      correct: ["真棒！你又认识了世界的一个新角落！", "没错，小小探险家！", "真厉害，你的指南针指得很准！"],
      encouraging: [
        "没关系，世界很大——我们再试一次吧！",
        "就快到了！仔细看看这些线索。",
        "很棒的尝试，继续探索地图吧！",
      ],
      closing: [
        "多么精彩的旅程！去地图或地球仪上找一个你还不认识的国家吧。",
        "今天我们探索了整个世界！问问家人他们最喜欢哪个国家。",
        "太棒的冒险！试着画一画你发现的那个国家的国旗吧。",
      ],
    },
    city: {
      opening: [
        "你好！我是巴斯科。我们来探索你身边的东西是怎么运作的吧？",
        "这个世界藏着好多秘密——我们去找出来吧？",
        "拿上你的探险放大镜！今天我们看看一切是怎么运作的。",
      ],
      correct: ["真棒！你发现它是怎么运作的了！", "没错，小小工程师！", "真厉害，你搞懂了整个系统！"],
      encouraging: [
        "没关系，我们再仔细看一次。",
        "就快了！慢慢想想每一个步骤。",
        "很棒的尝试，继续探索吧！",
      ],
      closing: [
        "现在你知道这是怎么运作的了！回家问问水是怎么流到水龙头里的。",
        "太棒的探索！去家里或外面近距离看看其中一样东西吧。",
        "和你一起探索真开心！告诉家人你今天发现了什么吧。",
      ],
    },
    howMade: {
      opening: [
        "你好！我是巴斯科。我们来发现东西是怎么做出来的吧？",
        "你知道这东西是从哪里来的吗？我们来调查一下吧！",
        "准备好了吗，小小探险家——今天我们要追踪东西的来历！",
      ],
      correct: ["真棒！你顺着线索找到了！", "没错，小小物品侦探！", "真厉害，你找到源头了！"],
      encouraging: [
        "没关系，我们再顺着步骤走一次。",
        "就快了！想想它是怎么开始的。",
        "很棒的尝试，继续调查吧！",
      ],
      closing: [
        "现在你知道东西是从哪里来的了！去看看家里某样东西的标签，找找它是从哪里来的吧。",
        "太棒的调查！回家问问你最喜欢的食物是怎么做出来的。",
        "和你一起探索东西的来历真开心！告诉别人你学到了什么吧。",
      ],
    },
  },
};

export function getVascoLines(area, langCode) {
  const byLang = LINES[langCode] || LINES.en;
  return byLang[area] || LINES.en[area];
}
