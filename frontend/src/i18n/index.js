import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  pt: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "Início", alphabet: "Alfabeto", reading: "Leitura", songs: "Canções", language: "Idiomas" },
      home: {
        pickProfile: "Escolhe o teu perfil",
        newProfile: "Novo perfil",
        name: "Nome",
        start: "Começar",
        chooseAvatar: "Escolhe um avatar",
      },
      languagePicker: {
        title: "Escolhe os teus idiomas",
        mother: "Idioma principal",
        secondary: "Idioma a aprender",
        continue: "Continuar",
      },
      modules: {
        alphabetTitle: "Alfabeto",
        readingTitle: "Leitura",
        songsTitle: "Canções",
        play: "Ouvir",
        speechUnavailable: "O áudio de voz não está disponível neste dispositivo.",
        printForm: "Letra de imprensa",
        handwrittenForm: "Letra manuscrita",
      },
    },
  },
  en: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "Home", alphabet: "Alphabet", reading: "Reading", songs: "Songs", language: "Languages" },
      home: {
        pickProfile: "Pick your profile",
        newProfile: "New profile",
        name: "Name",
        start: "Start",
        chooseAvatar: "Choose an avatar",
      },
      languagePicker: {
        title: "Choose your languages",
        mother: "Main language",
        secondary: "Language to learn",
        continue: "Continue",
      },
      modules: {
        alphabetTitle: "Alphabet",
        readingTitle: "Reading",
        songsTitle: "Songs",
        play: "Listen",
        speechUnavailable: "Voice audio is not available on this device.",
        printForm: "Printed letter",
        handwrittenForm: "Handwritten letter",
      },
    },
  },
  de: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "Start", alphabet: "Alphabet", reading: "Lesen", songs: "Lieder", language: "Sprachen" },
      home: {
        pickProfile: "Wähle dein Profil",
        newProfile: "Neues Profil",
        name: "Name",
        start: "Starten",
        chooseAvatar: "Wähle einen Avatar",
      },
      languagePicker: {
        title: "Wähle deine Sprachen",
        mother: "Hauptsprache",
        secondary: "Zu lernende Sprache",
        continue: "Weiter",
      },
      modules: {
        alphabetTitle: "Alphabet",
        readingTitle: "Lesen",
        songsTitle: "Lieder",
        play: "Anhören",
        speechUnavailable: "Sprachausgabe ist auf diesem Gerät nicht verfügbar.",
        printForm: "Druckbuchstabe",
        handwrittenForm: "Handschrift",
      },
    },
  },
  fr: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "Accueil", alphabet: "Alphabet", reading: "Lecture", songs: "Chansons", language: "Langues" },
      home: {
        pickProfile: "Choisis ton profil",
        newProfile: "Nouveau profil",
        name: "Nom",
        start: "Commencer",
        chooseAvatar: "Choisis un avatar",
      },
      languagePicker: {
        title: "Choisis tes langues",
        mother: "Langue principale",
        secondary: "Langue à apprendre",
        continue: "Continuer",
      },
      modules: {
        alphabetTitle: "Alphabet",
        readingTitle: "Lecture",
        songsTitle: "Chansons",
        play: "Écouter",
        speechUnavailable: "L'audio vocal n'est pas disponible sur cet appareil.",
        printForm: "Lettre imprimée",
        handwrittenForm: "Lettre manuscrite",
      },
    },
  },
  zh: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "首页", alphabet: "字母表", reading: "阅读", songs: "歌曲", language: "语言" },
      home: {
        pickProfile: "选择你的档案",
        newProfile: "新档案",
        name: "名字",
        start: "开始",
        chooseAvatar: "选择一个头像",
      },
      languagePicker: {
        title: "选择你的语言",
        mother: "主要语言",
        secondary: "正在学习的语言",
        continue: "继续",
      },
      modules: {
        alphabetTitle: "字母表",
        readingTitle: "阅读",
        songsTitle: "歌曲",
        play: "播放",
        speechUnavailable: "此设备不支持语音朗读。",
        printForm: "印刷体",
        handwrittenForm: "手写体",
      },
    },
  },
  es: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "Inicio", alphabet: "Alfabeto", reading: "Lectura", songs: "Canciones", language: "Idiomas" },
      home: {
        pickProfile: "Elige tu perfil",
        newProfile: "Nuevo perfil",
        name: "Nombre",
        start: "Empezar",
        chooseAvatar: "Elige un avatar",
      },
      languagePicker: {
        title: "Elige tus idiomas",
        mother: "Idioma principal",
        secondary: "Idioma a aprender",
        continue: "Continuar",
      },
      modules: {
        alphabetTitle: "Alfabeto",
        readingTitle: "Lectura",
        songsTitle: "Canciones",
        play: "Escuchar",
        speechUnavailable: "El audio de voz no está disponible en este dispositivo.",
        printForm: "Letra de imprenta",
        handwrittenForm: "Letra manuscrita",
      },
    },
  },
  it: {
    translation: {
      appName: "ABC Mundo",
      nav: { home: "Home", alphabet: "Alfabeto", reading: "Lettura", songs: "Canzoni", language: "Lingue" },
      home: {
        pickProfile: "Scegli il tuo profilo",
        newProfile: "Nuovo profilo",
        name: "Nome",
        start: "Inizia",
        chooseAvatar: "Scegli un avatar",
      },
      languagePicker: {
        title: "Scegli le tue lingue",
        mother: "Lingua principale",
        secondary: "Lingua da imparare",
        continue: "Continua",
      },
      modules: {
        alphabetTitle: "Alfabeto",
        readingTitle: "Lettura",
        songsTitle: "Canzoni",
        play: "Ascolta",
        speechUnavailable: "L'audio vocale non è disponibile su questo dispositivo.",
        printForm: "Lettera stampata",
        handwrittenForm: "Lettera corsiva",
      },
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "pt",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
