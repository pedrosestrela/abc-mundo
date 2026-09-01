// Central content loader: maps a language code to its content JSON files.
import alphabetPt from "./alphabet.pt.json";
import alphabetEn from "./alphabet.en.json";
import alphabetDe from "./alphabet.de.json";
import alphabetFr from "./alphabet.fr.json";
import alphabetZh from "./alphabet.zh.json";
import alphabetEs from "./alphabet.es.json";
import alphabetIt from "./alphabet.it.json";

import readingPt from "./reading.pt.json";
import readingEn from "./reading.en.json";
import readingDe from "./reading.de.json";
import readingFr from "./reading.fr.json";
import readingZh from "./reading.zh.json";
import readingEs from "./reading.es.json";
import readingIt from "./reading.it.json";

import syllablesPt from "./syllables.pt.json";
import syllablesEn from "./syllables.en.json";
import syllablesDe from "./syllables.de.json";
import syllablesFr from "./syllables.fr.json";
import syllablesZh from "./syllables.zh.json";
import syllablesEs from "./syllables.es.json";
import syllablesIt from "./syllables.it.json";

import phrasesPt from "./phrases.pt.json";
import phrasesEn from "./phrases.en.json";
import phrasesDe from "./phrases.de.json";
import phrasesFr from "./phrases.fr.json";
import phrasesZh from "./phrases.zh.json";
import phrasesEs from "./phrases.es.json";
import phrasesIt from "./phrases.it.json";

// Off-screen mission templates for "Missão de Hoje" (see dailyPath.js).
// TODO: only pt + en have real, hand-written templates so far. de/fr/zh/es/it
// currently reuse the pt templates (still readable/usable via TTS in the
// child's secondary language flows, but not actually translated) — a future
// pass should add real translations for the other 5 languages.
import offScreenMissionsPt from "./offScreenMissions.pt.json";
import offScreenMissionsEn from "./offScreenMissions.en.json";

import houseSystemsPt from "./houseSystems.pt.json";
import houseSystemsEn from "./houseSystems.en.json";
import houseSystemsDe from "./houseSystems.de.json";
import houseSystemsFr from "./houseSystems.fr.json";
import houseSystemsZh from "./houseSystems.zh.json";
import houseSystemsEs from "./houseSystems.es.json";
import houseSystemsIt from "./houseSystems.it.json";

import citySystemsPt from "./citySystems.pt.json";
import citySystemsEn from "./citySystems.en.json";
import citySystemsDe from "./citySystems.de.json";
import citySystemsFr from "./citySystems.fr.json";
import citySystemsZh from "./citySystems.zh.json";
import citySystemsEs from "./citySystems.es.json";
import citySystemsIt from "./citySystems.it.json";

import packingChallengesPt from "./packingChallenges.pt.json";
import packingChallengesEn from "./packingChallenges.en.json";
import packingChallengesDe from "./packingChallenges.de.json";
import packingChallengesFr from "./packingChallenges.fr.json";
import packingChallengesZh from "./packingChallenges.zh.json";
import packingChallengesEs from "./packingChallenges.es.json";
import packingChallengesIt from "./packingChallenges.it.json";

import transportScenariosPt from "./transportScenarios.pt.json";
import transportScenariosEn from "./transportScenarios.en.json";
import transportScenariosDe from "./transportScenarios.de.json";
import transportScenariosFr from "./transportScenarios.fr.json";
import transportScenariosZh from "./transportScenarios.zh.json";
import transportScenariosEs from "./transportScenarios.es.json";
import transportScenariosIt from "./transportScenarios.it.json";

import hangmanWordsPt from "./hangmanWords.pt.json";
import hangmanWordsEn from "./hangmanWords.en.json";
import hangmanWordsDe from "./hangmanWords.de.json";
import hangmanWordsFr from "./hangmanWords.fr.json";
import hangmanWordsZh from "./hangmanWords.zh.json";
import hangmanWordsEs from "./hangmanWords.es.json";
import hangmanWordsIt from "./hangmanWords.it.json";

import missionsPt from "./missions.pt.json";
import missionsEn from "./missions.en.json";
import missionsDe from "./missions.de.json";
import missionsFr from "./missions.fr.json";
import missionsZh from "./missions.zh.json";
import missionsEs from "./missions.es.json";
import missionsIt from "./missions.it.json";

import phonicsPt from "./phonics.pt.json";
import phonicsEn from "./phonics.en.json";
import phonicsDe from "./phonics.de.json";
import phonicsFr from "./phonics.fr.json";
import phonicsZh from "./phonics.zh.json";
import phonicsEs from "./phonics.es.json";
import phonicsIt from "./phonics.it.json";

import songsPt from "./songs.pt.json";
import songsEn from "./songs.en.json";
import songsDe from "./songs.de.json";
import songsFr from "./songs.fr.json";
import songsZh from "./songs.zh.json";
import songsEs from "./songs.es.json";
import songsIt from "./songs.it.json";

import completeTalesPt from "./completeTales.pt.json";
import completeTalesEn from "./completeTales.en.json";
import completeTalesDe from "./completeTales.de.json";
import completeTalesFr from "./completeTales.fr.json";
import completeTalesZh from "./completeTales.zh.json";
import completeTalesEs from "./completeTales.es.json";
import completeTalesIt from "./completeTales.it.json";

import detectivePt from "./detective.pt.json";
import detectiveEn from "./detective.en.json";
import detectiveDe from "./detective.de.json";
import detectiveFr from "./detective.fr.json";
import detectiveZh from "./detective.zh.json";
import detectiveEs from "./detective.es.json";
import detectiveIt from "./detective.it.json";

import financialPt from "./financial.pt.json";
import financialEn from "./financial.en.json";
import financialDe from "./financial.de.json";
import financialFr from "./financial.fr.json";
import financialZh from "./financial.zh.json";
import financialEs from "./financial.es.json";
import financialIt from "./financial.it.json";

import whysPt from "./whys.pt.json";
import whysEn from "./whys.en.json";
import whysDe from "./whys.de.json";
import whysFr from "./whys.fr.json";
import whysZh from "./whys.zh.json";
import whysEs from "./whys.es.json";
import whysIt from "./whys.it.json";

import artPromptsPt from "./artPrompts.pt.json";
import artPromptsEn from "./artPrompts.en.json";
import artPromptsDe from "./artPrompts.de.json";
import artPromptsFr from "./artPrompts.fr.json";
import artPromptsZh from "./artPrompts.zh.json";
import artPromptsEs from "./artPrompts.es.json";
import artPromptsIt from "./artPrompts.it.json";

import sciencePt from "./science.pt.json";
import scienceEn from "./science.en.json";
import scienceDe from "./science.de.json";
import scienceFr from "./science.fr.json";
import scienceZh from "./science.zh.json";
import scienceEs from "./science.es.json";
import scienceIt from "./science.it.json";

import humanEvolutionPt from "./humanEvolution.pt.json";
import humanEvolutionEn from "./humanEvolution.en.json";
import humanEvolutionDe from "./humanEvolution.de.json";
import humanEvolutionFr from "./humanEvolution.fr.json";
import humanEvolutionZh from "./humanEvolution.zh.json";
import humanEvolutionEs from "./humanEvolution.es.json";
import humanEvolutionIt from "./humanEvolution.it.json";

import labSimulatorsPt from "./labSimulators.pt.json";
import labSimulatorsEn from "./labSimulators.en.json";
import labSimulatorsDe from "./labSimulators.de.json";
import labSimulatorsFr from "./labSimulators.fr.json";
import labSimulatorsZh from "./labSimulators.zh.json";
import labSimulatorsEs from "./labSimulators.es.json";
import labSimulatorsIt from "./labSimulators.it.json";

import labEngineeringPt from "./labEngineering.pt.json";
import labEngineeringEn from "./labEngineering.en.json";
import labEngineeringDe from "./labEngineering.de.json";
import labEngineeringFr from "./labEngineering.fr.json";
import labEngineeringZh from "./labEngineering.zh.json";
import labEngineeringEs from "./labEngineering.es.json";
import labEngineeringIt from "./labEngineering.it.json";

import lifeSkillsPt from "./lifeSkills.pt.json";
import lifeSkillsEn from "./lifeSkills.en.json";
import lifeSkillsDe from "./lifeSkills.de.json";
import lifeSkillsFr from "./lifeSkills.fr.json";
import lifeSkillsZh from "./lifeSkills.zh.json";
import lifeSkillsEs from "./lifeSkills.es.json";
import lifeSkillsIt from "./lifeSkills.it.json";

import computingPt from "./computing.pt.json";
import computingEn from "./computing.en.json";
import computingDe from "./computing.de.json";
import computingFr from "./computing.fr.json";
import computingZh from "./computing.zh.json";
import computingEs from "./computing.es.json";
import computingIt from "./computing.it.json";

import computingSafetyPt from "./computingSafety.pt.json";
import computingSafetyEn from "./computingSafety.en.json";
import computingSafetyDe from "./computingSafety.de.json";
import computingSafetyFr from "./computingSafety.fr.json";
import computingSafetyZh from "./computingSafety.zh.json";
import computingSafetyEs from "./computingSafety.es.json";
import computingSafetyIt from "./computingSafety.it.json";

import computingPasswordsPt from "./computingPasswords.pt.json";
import computingPasswordsEn from "./computingPasswords.en.json";
import computingPasswordsDe from "./computingPasswords.de.json";
import computingPasswordsFr from "./computingPasswords.fr.json";
import computingPasswordsZh from "./computingPasswords.zh.json";
import computingPasswordsEs from "./computingPasswords.es.json";
import computingPasswordsIt from "./computingPasswords.it.json";

import computingInternetJourneyPt from "./computingInternetJourney.pt.json";
import computingInternetJourneyEn from "./computingInternetJourney.en.json";
import computingInternetJourneyDe from "./computingInternetJourney.de.json";
import computingInternetJourneyFr from "./computingInternetJourney.fr.json";
import computingInternetJourneyZh from "./computingInternetJourney.zh.json";
import computingInternetJourneyEs from "./computingInternetJourney.es.json";
import computingInternetJourneyIt from "./computingInternetJourney.it.json";

import howThingsWorkPt from "./howThingsWork.pt.json";
import howThingsWorkEn from "./howThingsWork.en.json";
import howThingsWorkDe from "./howThingsWork.de.json";
import howThingsWorkFr from "./howThingsWork.fr.json";
import howThingsWorkZh from "./howThingsWork.zh.json";
import howThingsWorkEs from "./howThingsWork.es.json";
import howThingsWorkIt from "./howThingsWork.it.json";

import techHistoryPt from "./techHistory.pt.json";
import techHistoryEn from "./techHistory.en.json";
import techHistoryDe from "./techHistory.de.json";
import techHistoryFr from "./techHistory.fr.json";
import techHistoryZh from "./techHistory.zh.json";
import techHistoryEs from "./techHistory.es.json";
import techHistoryIt from "./techHistory.it.json";

import internetSafetyPt from "./internetSafety.pt.json";
import internetSafetyEn from "./internetSafety.en.json";
import internetSafetyDe from "./internetSafety.de.json";
import internetSafetyFr from "./internetSafety.fr.json";
import internetSafetyZh from "./internetSafety.zh.json";
import internetSafetyEs from "./internetSafety.es.json";
import internetSafetyIt from "./internetSafety.it.json";

import aiLabPt from "./aiLab.pt.json";
import aiLabEn from "./aiLab.en.json";
import aiLabDe from "./aiLab.de.json";
import aiLabFr from "./aiLab.fr.json";
import aiLabZh from "./aiLab.zh.json";
import aiLabEs from "./aiLab.es.json";
import aiLabIt from "./aiLab.it.json";

import lemonadeStandPt from "./lemonadeStand.pt.json";
import lemonadeStandEn from "./lemonadeStand.en.json";
import lemonadeStandDe from "./lemonadeStand.de.json";
import lemonadeStandFr from "./lemonadeStand.fr.json";
import lemonadeStandZh from "./lemonadeStand.zh.json";
import lemonadeStandEs from "./lemonadeStand.es.json";
import lemonadeStandIt from "./lemonadeStand.it.json";

import shoppingPt from "./shopping.pt.json";
import shoppingEn from "./shopping.en.json";
import shoppingDe from "./shopping.de.json";
import shoppingFr from "./shopping.fr.json";
import shoppingZh from "./shopping.zh.json";
import shoppingEs from "./shopping.es.json";
import shoppingIt from "./shopping.it.json";

import financialActivitiesPt from "./financialActivities.pt.json";
import financialActivitiesEn from "./financialActivities.en.json";
import financialActivitiesDe from "./financialActivities.de.json";
import financialActivitiesFr from "./financialActivities.fr.json";
import financialActivitiesZh from "./financialActivities.zh.json";
import financialActivitiesEs from "./financialActivities.es.json";
import financialActivitiesIt from "./financialActivities.it.json";

import adLiteracyPt from "./adLiteracy.pt.json";
import adLiteracyEn from "./adLiteracy.en.json";
import adLiteracyDe from "./adLiteracy.de.json";
import adLiteracyFr from "./adLiteracy.fr.json";
import adLiteracyZh from "./adLiteracy.zh.json";
import adLiteracyEs from "./adLiteracy.es.json";
import adLiteracyIt from "./adLiteracy.it.json";
import rhymesPt from "./rhymes.pt.json";
import rhymesEn from "./rhymes.en.json";
import rhymesDe from "./rhymes.de.json";
import rhymesFr from "./rhymes.fr.json";
import rhymesZh from "./rhymes.zh.json";
import rhymesEs from "./rhymes.es.json";
import rhymesIt from "./rhymes.it.json";

import thinkingPt from "./thinking.pt.json";
import thinkingEn from "./thinking.en.json";
import thinkingDe from "./thinking.de.json";
import thinkingFr from "./thinking.fr.json";
import thinkingZh from "./thinking.zh.json";
import thinkingEs from "./thinking.es.json";
import thinkingIt from "./thinking.it.json";

import newsroomPt from "./newsroom.pt.json";
import newsroomEn from "./newsroom.en.json";
import newsroomDe from "./newsroom.de.json";
import newsroomFr from "./newsroom.fr.json";
import newsroomZh from "./newsroom.zh.json";
import newsroomEs from "./newsroom.es.json";
import newsroomIt from "./newsroom.it.json";

import learningStrategiesPt from "./learningStrategies.pt.json";
import learningStrategiesEn from "./learningStrategies.en.json";
import learningStrategiesDe from "./learningStrategies.de.json";
import learningStrategiesFr from "./learningStrategies.fr.json";
import learningStrategiesZh from "./learningStrategies.zh.json";
import learningStrategiesEs from "./learningStrategies.es.json";
import learningStrategiesIt from "./learningStrategies.it.json";

import communicationPt from "./communication.pt.json";
import communicationEn from "./communication.en.json";
import communicationDe from "./communication.de.json";
import communicationFr from "./communication.fr.json";
import communicationZh from "./communication.zh.json";
import communicationEs from "./communication.es.json";
import communicationIt from "./communication.it.json";

import sensesMissionsPt from "./sensesMissions.pt.json";
import sensesMissionsEn from "./sensesMissions.en.json";
import sensesMissionsDe from "./sensesMissions.de.json";
import sensesMissionsFr from "./sensesMissions.fr.json";
import sensesMissionsZh from "./sensesMissions.zh.json";
import sensesMissionsEs from "./sensesMissions.es.json";
import sensesMissionsIt from "./sensesMissions.it.json";

import objectTeardownPt from "./objectTeardown.pt.json";
import objectTeardownEn from "./objectTeardown.en.json";
import objectTeardownDe from "./objectTeardown.de.json";
import objectTeardownFr from "./objectTeardown.fr.json";
import objectTeardownZh from "./objectTeardown.zh.json";
import objectTeardownEs from "./objectTeardown.es.json";
import objectTeardownIt from "./objectTeardown.it.json";

import howMadePt from "./howMade.pt.json";
import howMadeEn from "./howMade.en.json";
import howMadeDe from "./howMade.de.json";
import howMadeFr from "./howMade.fr.json";
import howMadeZh from "./howMade.zh.json";
import howMadeEs from "./howMade.es.json";
import howMadeIt from "./howMade.it.json";

import foodOriginPt from "./foodOrigin.pt.json";
import foodOriginEn from "./foodOrigin.en.json";
import foodOriginDe from "./foodOrigin.de.json";
import foodOriginFr from "./foodOrigin.fr.json";
import foodOriginZh from "./foodOrigin.zh.json";
import foodOriginEs from "./foodOrigin.es.json";
import foodOriginIt from "./foodOrigin.it.json";

import trafficSignsPt from "./trafficSigns.pt.json";
import trafficSignsEn from "./trafficSigns.en.json";
import trafficSignsDe from "./trafficSigns.de.json";
import trafficSignsFr from "./trafficSigns.fr.json";
import trafficSignsZh from "./trafficSigns.zh.json";
import trafficSignsEs from "./trafficSigns.es.json";
import trafficSignsIt from "./trafficSigns.it.json";

import humanBodyPt from "./humanBody.pt.json";
import humanBodyEn from "./humanBody.en.json";
import humanBodyDe from "./humanBody.de.json";
import humanBodyFr from "./humanBody.fr.json";
import humanBodyZh from "./humanBody.zh.json";
import humanBodyEs from "./humanBody.es.json";
import humanBodyIt from "./humanBody.it.json";

import toyHospitalPt from "./toyHospital.pt.json";
import toyHospitalEn from "./toyHospital.en.json";
import toyHospitalDe from "./toyHospital.de.json";
import toyHospitalFr from "./toyHospital.fr.json";
import toyHospitalZh from "./toyHospital.zh.json";
import toyHospitalEs from "./toyHospital.es.json";
import toyHospitalIt from "./toyHospital.it.json";

import museumPt from "./museum.pt.json";
import museumEn from "./museum.en.json";
import museumDe from "./museum.de.json";
import museumFr from "./museum.fr.json";
import museumZh from "./museum.zh.json";
import museumEs from "./museum.es.json";
import museumIt from "./museum.it.json";

import archaeologyPt from "./archaeology.pt.json";
import archaeologyEn from "./archaeology.en.json";
import archaeologyDe from "./archaeology.de.json";
import archaeologyFr from "./archaeology.fr.json";
import archaeologyZh from "./archaeology.zh.json";
import archaeologyEs from "./archaeology.es.json";
import archaeologyIt from "./archaeology.it.json";

import zeroWastePt from "./zeroWaste.pt.json";
import zeroWasteEn from "./zeroWaste.en.json";
import zeroWasteDe from "./zeroWaste.de.json";
import zeroWasteFr from "./zeroWaste.fr.json";
import zeroWasteZh from "./zeroWaste.zh.json";
import zeroWasteEs from "./zeroWaste.es.json";
import zeroWasteIt from "./zeroWaste.it.json";

import teamworkPt from "./teamwork.pt.json";
import teamworkEn from "./teamwork.en.json";
import teamworkDe from "./teamwork.de.json";
import teamworkFr from "./teamwork.fr.json";
import teamworkZh from "./teamwork.zh.json";
import teamworkEs from "./teamwork.es.json";
import teamworkIt from "./teamwork.it.json";

// Re-exported so existing `import { SUPPORTED_LANGUAGES } from "../content"`
// call sites keep working unchanged. See content/languages.js for why the
// actual list lives in its own module.
export { SUPPORTED_LANGUAGES } from "./languages.js";

const ALPHABET = { pt: alphabetPt, en: alphabetEn, de: alphabetDe, fr: alphabetFr, zh: alphabetZh, es: alphabetEs, it: alphabetIt };
const READING = { pt: readingPt, en: readingEn, de: readingDe, fr: readingFr, zh: readingZh, es: readingEs, it: readingIt };
const SYLLABLES = { pt: syllablesPt, en: syllablesEn, de: syllablesDe, fr: syllablesFr, zh: syllablesZh, es: syllablesEs, it: syllablesIt };
const PHRASES = { pt: phrasesPt, en: phrasesEn, de: phrasesDe, fr: phrasesFr, zh: phrasesZh, es: phrasesEs, it: phrasesIt };
const SONGS = { pt: songsPt, en: songsEn, de: songsDe, fr: songsFr, zh: songsZh, es: songsEs, it: songsIt };
const COMPLETE_TALES = { pt: completeTalesPt, en: completeTalesEn, de: completeTalesDe, fr: completeTalesFr, zh: completeTalesZh, es: completeTalesEs, it: completeTalesIt };
const FINANCIAL = { pt: financialPt, en: financialEn, de: financialDe, fr: financialFr, zh: financialZh, es: financialEs, it: financialIt };
const PHONICS = { pt: phonicsPt, en: phonicsEn, de: phonicsDe, fr: phonicsFr, zh: phonicsZh, es: phonicsEs, it: phonicsIt };
const MISSIONS = { pt: missionsPt, en: missionsEn, de: missionsDe, fr: missionsFr, zh: missionsZh, es: missionsEs, it: missionsIt };
const DETECTIVE = { pt: detectivePt, en: detectiveEn, de: detectiveDe, fr: detectiveFr, zh: detectiveZh, es: detectiveEs, it: detectiveIt };
const WHYS = { pt: whysPt, en: whysEn, de: whysDe, fr: whysFr, zh: whysZh, es: whysEs, it: whysIt };
const ART_PROMPTS = { pt: artPromptsPt, en: artPromptsEn, de: artPromptsDe, fr: artPromptsFr, zh: artPromptsZh, es: artPromptsEs, it: artPromptsIt };
const LAB_SIMULATORS = { pt: labSimulatorsPt, en: labSimulatorsEn, de: labSimulatorsDe, fr: labSimulatorsFr, zh: labSimulatorsZh, es: labSimulatorsEs, it: labSimulatorsIt };
const LAB_ENGINEERING = { pt: labEngineeringPt, en: labEngineeringEn, de: labEngineeringDe, fr: labEngineeringFr, zh: labEngineeringZh, es: labEngineeringEs, it: labEngineeringIt };
const SCIENCE = { pt: sciencePt, en: scienceEn, de: scienceDe, fr: scienceFr, zh: scienceZh, es: scienceEs, it: scienceIt };

const HUMAN_EVOLUTION = {
  pt: humanEvolutionPt,
  en: humanEvolutionEn,
  de: humanEvolutionDe,
  fr: humanEvolutionFr,
  zh: humanEvolutionZh,
  es: humanEvolutionEs,
  it: humanEvolutionIt,
};
const LIFE_SKILLS = { pt: lifeSkillsPt, en: lifeSkillsEn, de: lifeSkillsDe, fr: lifeSkillsFr, zh: lifeSkillsZh, es: lifeSkillsEs, it: lifeSkillsIt };
const COMPUTING = { pt: computingPt, en: computingEn, de: computingDe, fr: computingFr, zh: computingZh, es: computingEs, it: computingIt };
const COMPUTING_SAFETY = { pt: computingSafetyPt, en: computingSafetyEn, de: computingSafetyDe, fr: computingSafetyFr, zh: computingSafetyZh, es: computingSafetyEs, it: computingSafetyIt };
const COMPUTING_PASSWORDS = { pt: computingPasswordsPt, en: computingPasswordsEn, de: computingPasswordsDe, fr: computingPasswordsFr, zh: computingPasswordsZh, es: computingPasswordsEs, it: computingPasswordsIt };
const COMPUTING_INTERNET_JOURNEY = { pt: computingInternetJourneyPt, en: computingInternetJourneyEn, de: computingInternetJourneyDe, fr: computingInternetJourneyFr, zh: computingInternetJourneyZh, es: computingInternetJourneyEs, it: computingInternetJourneyIt };
const HOW_THINGS_WORK = { pt: howThingsWorkPt, en: howThingsWorkEn, de: howThingsWorkDe, fr: howThingsWorkFr, zh: howThingsWorkZh, es: howThingsWorkEs, it: howThingsWorkIt };
const TECH_HISTORY = { pt: techHistoryPt, en: techHistoryEn, de: techHistoryDe, fr: techHistoryFr, zh: techHistoryZh, es: techHistoryEs, it: techHistoryIt };
const INTERNET_SAFETY = { pt: internetSafetyPt, en: internetSafetyEn, de: internetSafetyDe, fr: internetSafetyFr, zh: internetSafetyZh, es: internetSafetyEs, it: internetSafetyIt };
const AI_LAB = { pt: aiLabPt, en: aiLabEn, de: aiLabDe, fr: aiLabFr, zh: aiLabZh, es: aiLabEs, it: aiLabIt };
const LEMONADE_STAND = { pt: lemonadeStandPt, en: lemonadeStandEn, de: lemonadeStandDe, fr: lemonadeStandFr, zh: lemonadeStandZh, es: lemonadeStandEs, it: lemonadeStandIt };
const SHOPPING = { pt: shoppingPt, en: shoppingEn, de: shoppingDe, fr: shoppingFr, zh: shoppingZh, es: shoppingEs, it: shoppingIt };
const AD_LITERACY = { pt: adLiteracyPt, en: adLiteracyEn, de: adLiteracyDe, fr: adLiteracyFr, zh: adLiteracyZh, es: adLiteracyEs, it: adLiteracyIt };
const FINANCIAL_ACTIVITIES = { pt: financialActivitiesPt, en: financialActivitiesEn, de: financialActivitiesDe, fr: financialActivitiesFr, zh: financialActivitiesZh, es: financialActivitiesEs, it: financialActivitiesIt };
const THINKING = { pt: thinkingPt, en: thinkingEn, de: thinkingDe, fr: thinkingFr, zh: thinkingZh, es: thinkingEs, it: thinkingIt };
const NEWSROOM = { pt: newsroomPt, en: newsroomEn, de: newsroomDe, fr: newsroomFr, zh: newsroomZh, es: newsroomEs, it: newsroomIt };
const COMMUNICATION = { pt: communicationPt, en: communicationEn, de: communicationDe, fr: communicationFr, zh: communicationZh, es: communicationEs, it: communicationIt };
const LEARNING_STRATEGIES = { pt: learningStrategiesPt, en: learningStrategiesEn, de: learningStrategiesDe, fr: learningStrategiesFr, zh: learningStrategiesZh, es: learningStrategiesEs, it: learningStrategiesIt };
const RHYMES = { pt: rhymesPt, en: rhymesEn, de: rhymesDe, fr: rhymesFr, zh: rhymesZh, es: rhymesEs, it: rhymesIt };
const HOUSE_SYSTEMS = { pt: houseSystemsPt, en: houseSystemsEn, de: houseSystemsDe, fr: houseSystemsFr, zh: houseSystemsZh, es: houseSystemsEs, it: houseSystemsIt };
const CITY_SYSTEMS = { pt: citySystemsPt, en: citySystemsEn, de: citySystemsDe, fr: citySystemsFr, zh: citySystemsZh, es: citySystemsEs, it: citySystemsIt };
const PACKING_CHALLENGES = { pt: packingChallengesPt, en: packingChallengesEn, de: packingChallengesDe, fr: packingChallengesFr, zh: packingChallengesZh, es: packingChallengesEs, it: packingChallengesIt };
const TRANSPORT_SCENARIOS = { pt: transportScenariosPt, en: transportScenariosEn, de: transportScenariosDe, fr: transportScenariosFr, zh: transportScenariosZh, es: transportScenariosEs, it: transportScenariosIt };
const HANGMAN_WORDS = { pt: hangmanWordsPt, en: hangmanWordsEn, de: hangmanWordsDe, fr: hangmanWordsFr, zh: hangmanWordsZh, es: hangmanWordsEs, it: hangmanWordsIt };
const TRAFFIC_SIGNS = { pt: trafficSignsPt, en: trafficSignsEn, de: trafficSignsDe, fr: trafficSignsFr, zh: trafficSignsZh, es: trafficSignsEs, it: trafficSignsIt };
const HOW_MADE = { pt: howMadePt, en: howMadeEn, de: howMadeDe, fr: howMadeFr, zh: howMadeZh, es: howMadeEs, it: howMadeIt };
const FOOD_ORIGIN = { pt: foodOriginPt, en: foodOriginEn, de: foodOriginDe, fr: foodOriginFr, zh: foodOriginZh, es: foodOriginEs, it: foodOriginIt };
const SENSES_MISSIONS = { pt: sensesMissionsPt, en: sensesMissionsEn, de: sensesMissionsDe, fr: sensesMissionsFr, zh: sensesMissionsZh, es: sensesMissionsEs, it: sensesMissionsIt };
const OBJECT_TEARDOWN = { pt: objectTeardownPt, en: objectTeardownEn, de: objectTeardownDe, fr: objectTeardownFr, zh: objectTeardownZh, es: objectTeardownEs, it: objectTeardownIt };
const MUSEUM = { pt: museumPt, en: museumEn, de: museumDe, fr: museumFr, zh: museumZh, es: museumEs, it: museumIt };
const ARCHAEOLOGY = { pt: archaeologyPt, en: archaeologyEn, de: archaeologyDe, fr: archaeologyFr, zh: archaeologyZh, es: archaeologyEs, it: archaeologyIt };
const HUMAN_BODY = { pt: humanBodyPt, en: humanBodyEn, de: humanBodyDe, fr: humanBodyFr, zh: humanBodyZh, es: humanBodyEs, it: humanBodyIt };
const TOY_HOSPITAL = { pt: toyHospitalPt, en: toyHospitalEn, de: toyHospitalDe, fr: toyHospitalFr, zh: toyHospitalZh, es: toyHospitalEs, it: toyHospitalIt };
const ZERO_WASTE = { pt: zeroWastePt, en: zeroWasteEn, de: zeroWasteDe, fr: zeroWasteFr, zh: zeroWasteZh, es: zeroWasteEs, it: zeroWasteIt };
const TEAMWORK = { pt: teamworkPt, en: teamworkEn, de: teamworkDe, fr: teamworkFr, zh: teamworkZh, es: teamworkEs, it: teamworkIt };

// Normalizes zh's different shape ({hanzi,...}) to the same shape used by
// the Latin-alphabet languages ({letter, lower, upper, exampleWord, emoji}).
export function getAlphabet(langCode) {
  if (langCode === "zh") {
    return ALPHABET.zh.characters.map((c) => ({
      letter: c.hanzi,
      lower: c.hanzi,
      upper: c.hanzi,
      exampleWord: c.exampleWord,
      emoji: c.emoji,
      pronunciationHint: c.pinyin,
    }));
  }
  return ALPHABET[langCode] || [];
}

export function getReading(langCode) {
  return READING[langCode] || [];
}

const OFF_SCREEN_MISSIONS = { pt: offScreenMissionsPt, en: offScreenMissionsEn };

// Returns the off-screen mission templates for langCode, falling back to pt
// (untranslated but functional) for languages that don't have their own
// templates yet — see the TODO on the imports above.
export function getOffScreenMissions(langCode) {
  return OFF_SCREEN_MISSIONS[langCode] || OFF_SCREEN_MISSIONS.pt;
}

export function getSyllables(langCode) {
  return SYLLABLES[langCode] || [];
}

export function getPhrases(langCode) {
  return PHRASES[langCode] || [];
}

export function getSongs(langCode) {
  return SONGS[langCode] || [];
}

// Stories content is by far the largest per-language dataset (~130KB per
// language, ~930KB combined), and has a single consumer (Stories.jsx). It is
// lazy-loaded per language via a dynamic import (Vite code-splits each
// stories.<lang>.json into its own tiny chunk) instead of being bundled
// statically into this module like every other content type here, so
// visiting any other content page no longer pulls in all 7 languages' worth
// of story text. Results are cached per language so repeat calls (e.g.
// re-renders, switching back to a previously-loaded language) don't re-fetch.
const storiesCache = new Map();

export async function getStories(langCode) {
  if (storiesCache.has(langCode)) return storiesCache.get(langCode);
  let data;
  try {
    const mod = await import(`./stories.${langCode}.json`);
    data = mod.default || [];
  } catch {
    data = [];
  }
  storiesCache.set(langCode, data);
  return data;
}

export function getCompleteTales(langCode) {
  return COMPLETE_TALES[langCode] || [];
}

export function getFinancial(langCode) {
  return FINANCIAL[langCode] || [];
}

export function getPhonics(langCode) {
  return PHONICS[langCode] || [];
}

export function getMissions(langCode) {
  return MISSIONS[langCode] || [];
}

export function getDetectiveCards(langCode) {
  return DETECTIVE[langCode] || [];
}

export function getArtPrompts(langCode) {
  return ART_PROMPTS[langCode] || [];
}

export function getScience(langCode) {
  return SCIENCE[langCode] || [];
}

export function getHumanEvolution(langCode) {
  return HUMAN_EVOLUTION[langCode] || HUMAN_EVOLUTION.pt;
}

// Solar-system content has a single consumer (SolarSystem.jsx) and, at ~10KB
// per language (~70KB combined), is one of several always-eager datasets
// bulking out the shared chunk every lazy-loaded page pays for. Lazy-loaded
// per language via dynamic import (same pattern as getStories above) so
// visiting any other content page no longer pulls it in. Cached per language.
const solarSystemCache = new Map();

export async function getSolarSystem(langCode) {
  if (solarSystemCache.has(langCode)) return solarSystemCache.get(langCode);
  let data;
  try {
    const mod = await import(`./solarSystem.${langCode}.json`);
    data = mod.default;
  } catch {
    data = undefined;
  }
  if (!data) {
    const mod = await import("./solarSystem.pt.json");
    data = mod.default;
  }
  solarSystemCache.set(langCode, data);
  return data;
}

export function getLabSimulators(langCode) {
  return LAB_SIMULATORS[langCode] || LAB_SIMULATORS.pt;
}

export function getLabEngineering(langCode) {
  return LAB_ENGINEERING[langCode] || LAB_ENGINEERING.pt;
}

export function getLifeSkills(langCode) {
  return LIFE_SKILLS[langCode] || [];
}

export function getComputing(langCode) {
  return COMPUTING[langCode] || [];
}

export function getComputingSafety(langCode) {
  return COMPUTING_SAFETY[langCode] || [];
}

export function getComputingPasswords(langCode) {
  return COMPUTING_PASSWORDS[langCode] || [];
}

export function getComputingInternetJourney(langCode) {
  return COMPUTING_INTERNET_JOURNEY[langCode] || [];
}

export function getHowThingsWork(langCode) {
  return HOW_THINGS_WORK[langCode] || HOW_THINGS_WORK.pt || [];
}

export function getTechHistory(langCode) {
  return TECH_HISTORY[langCode] || TECH_HISTORY.pt;
}

export function getInternetSafety(langCode) {
  return INTERNET_SAFETY[langCode] || INTERNET_SAFETY.en || [];
}

export function getAiLab(langCode) {
  return AI_LAB[langCode] || AI_LAB.en || {};
}

export function getLemonadeStand(langCode) {
  return LEMONADE_STAND[langCode] || LEMONADE_STAND.pt;
}

export function getShopping(langCode) {
  return SHOPPING[langCode] || SHOPPING.pt;
}

export function getAdLiteracy(langCode) {
  return AD_LITERACY[langCode] || [];
}

// Deeper financial-literacy activities beyond the basic concept cards: wants
// vs needs sorting, a save-vs-spend consequence scenario, a growing piggy
// bank, misleading-discount ad reasoning, a concrete simple-interest example
// (tier-gated in the UI), and a money-safety mini quiz. Falls back to pt
// since every language file mirrors the same id order/shape.
export function getFinancialActivities(langCode) {
  return FINANCIAL_ACTIVITIES[langCode] || FINANCIAL_ACTIVITIES.pt;
}

export function getThinking(langCode) {
  return THINKING[langCode] || THINKING.pt;
}

export function getNewsroom(langCode) {
  return NEWSROOM[langCode] || NEWSROOM.pt;
}

export function getCommunication(langCode) {
  return COMMUNICATION[langCode] || COMMUNICATION.pt;
}

export function getLearningStrategies(langCode) {
  return LEARNING_STRATEGIES[langCode] || LEARNING_STRATEGIES.pt;
}

export function getHouseSystems(langCode) {
  return HOUSE_SYSTEMS[langCode] || [];
}

export function getCitySystems(langCode) {
  return CITY_SYSTEMS[langCode] || [];
}

export function getRhymes(langCode) {
  return RHYMES[langCode] || RHYMES.pt;
}

export function getPackingChallenges(langCode) {
  return PACKING_CHALLENGES[langCode] || PACKING_CHALLENGES.pt;
}

export function getHangmanWords(langCode) {
  return HANGMAN_WORDS[langCode] || HANGMAN_WORDS.pt;
}

export function getTransportScenarios(langCode) {
  return TRANSPORT_SCENARIOS[langCode] || TRANSPORT_SCENARIOS.pt;
}

export function getTrafficSigns(langCode) {
  return TRAFFIC_SIGNS[langCode] || TRAFFIC_SIGNS.pt;
}

export function getHowMade(langCode) {
  return HOW_MADE[langCode] || HOW_MADE.pt;
}

export function getFoodOrigin(langCode) {
  return FOOD_ORIGIN[langCode] || FOOD_ORIGIN.pt;
}

export function getSensesMissions(langCode) {
  return SENSES_MISSIONS[langCode] || SENSES_MISSIONS.pt;
}

export function getObjectTeardown(langCode) {
  return OBJECT_TEARDOWN[langCode] || OBJECT_TEARDOWN.pt;
}

// Museu ABC: rooms of exhibits, each with a "guess first" question before
// revealing the real explanation. Falls back to pt like the other
// history/culture content types.
export function getMuseum(langCode) {
  return MUSEUM[langCode] || MUSEUM.pt;
}

// Pequeno Arqueólogo: virtual excavation scenarios, each revealing artifacts
// then asking a reasoning question about what the clues suggest together.
export function getArchaeology(langCode) {
  return ARCHAEOLOGY[langCode] || ARCHAEOLOGY.pt;
}

export function getHumanBody(langCode) {
  return HUMAN_BODY[langCode] || HUMAN_BODY.pt;
}

export function getToyHospital(langCode) {
  return TOY_HOSPITAL[langCode] || TOY_HOSPITAL.pt;
}

// Desafio Zero Desperdício: a fictional family's day, framed as gentle,
// guilt-free waste-reduction decision points (food, packaging, water,
// electricity). Falls back to pt like the other scenario-based content types.
export function getZeroWaste(langCode) {
  return ZERO_WASTE[langCode] || ZERO_WASTE.pt;
}

// Trabalho em Equipa: cooperation scenarios where the child matches a
// fictional character's strength to a task's needs. Falls back to pt.
export function getTeamwork(langCode) {
  return TEAMWORK[langCode] || TEAMWORK.pt;
}

// Countries are language-agnostic in shape (name/fact are per-language
// dictionaries inside each entry); langCode picks which strings to surface.
// The whole ~316KB countries.json is a single (not per-language) file, so
// lazy-loading it doesn't save bandwidth per language the way stories does —
// it only keeps this ~316KB out of the eagerly-loaded shared content chunk
// for users who never visit /world. The import promise is cached once (not
// per-language, since it's one file) so repeated calls don't re-fetch.
let countriesPromise = null;
function loadCountries() {
  if (!countriesPromise) {
    countriesPromise = import("./countries.json").then((mod) => mod.default || []);
  }
  return countriesPromise;
}

export async function getCountries(langCode) {
  const countries = await loadCountries();
  return countries.map((c) => ({
    iso: c.iso,
    flag: c.flag,
    capital: c.capital,
    continent: c.continent,
    currency: c.currency,
    lat: c.lat,
    lng: c.lng,
    name: c.name[langCode] || c.name.en,
    fact: c.fact[langCode] || c.fact.en,
    music: c.music ? c.music[langCode] || c.music.en : undefined,
    language: c.language ? c.language[langCode] || c.language.en : undefined,
    greeting: c.greeting,
    greetingTranslation: c.greetingTranslation ? c.greetingTranslation[langCode] || c.greetingTranslation.en : undefined,
    animal: c.animal ? { emoji: c.animal.emoji, name: c.animal.name[langCode] || c.animal.name.en } : undefined,
    additionalAnimal: c.additionalAnimal ? { emoji: c.additionalAnimal.emoji, name: c.additionalAnimal.name[langCode] || c.additionalAnimal.name.en } : undefined,
    tradition: c.tradition ? c.tradition[langCode] || c.tradition.en : undefined,
    emojiScene: c.emojiScene,
    landmark: c.landmark ? c.landmark[langCode] || c.landmark.en : undefined,
    food: c.food ? c.food[langCode] || c.food.en : undefined,
    climate: c.climate ? c.climate[langCode] || c.climate.en : undefined,
    population: c.population ? c.population[langCode] || c.population.en : undefined,
    funCuriosity: c.funCuriosity ? c.funCuriosity[langCode] || c.funCuriosity.en : undefined,
    nativeName: c.nativeName,
    nativeLangCode: c.nativeLangCode,
  }));
}

export function getWhys(langCode) {
  return WHYS[langCode] || [];
}

// Portugal history timeline entries: same language-agnostic shape as
// countries (title/description are per-language dictionaries); langCode
// picks which strings to surface. Falls back to pt since the content is
// written primarily for Portuguese children. Lazy-loaded for the same
// reason as getCountries above (single ~74KB file, not per-language).
let portugalHistoryPromise = null;
function loadPortugalHistory() {
  if (!portugalHistoryPromise) {
    portugalHistoryPromise = import("./portugalHistory.json").then((mod) => mod.default || []);
  }
  return portugalHistoryPromise;
}

export async function getPortugalHistory(langCode) {
  const portugalHistory = await loadPortugalHistory();
  return portugalHistory.map((e) => ({
    id: e.id,
    year: e.year,
    emoji: e.emoji,
    title: e.title[langCode] || e.title.pt,
    description: e.description[langCode] || e.description.pt,
    relatedSong: e.relatedSong
      ? {
          title: e.relatedSong.title,
          composer: e.relatedSong.composer,
          canPlayFull: e.relatedSong.canPlayFull,
          songId: e.relatedSong.songId,
          historicalNote: e.relatedSong.historicalNote[langCode] || e.relatedSong.historicalNote.pt,
        }
      : null,
  }));
}
