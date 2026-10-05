import type { Metadata } from "next";
import { generateMetadataObject } from "@/lib/shared/metadata";

export type HealthSection = "conditions" | "medicines" | "tests" | "guides" | "nutrition" | "articles";

export interface HealthItem {
  id: number;
  title?: string;
  name?: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  articleType?: string;
  content?: unknown[];
  dynamic_zone?: Array<{ id: number; __component: string; [key: string]: unknown }>;
  image?: { url: string; alternativeText?: string } | null;
  seo?: Record<string, unknown>;
  categories?: Array<{ id?: number; name: string }>;
  conditions?: HealthItem[];
  treatments?: HealthItem[];
  medicalTests?: HealthItem[];
  healthGuides?: HealthItem[];
  nutritionGuides?: HealthItem[];
  articles?: HealthItem[];
  overview?: unknown[];
  causes?: unknown[];
  symptoms?: unknown[];
  riskFactors?: unknown[];
  diagnosis?: unknown[];
  investigations?: unknown[];
  treatmentAndManagement?: unknown[];
  prevention?: unknown[];
  whenToSeekCare?: unknown[];
  genericName?: string;
  uses?: unknown[];
  generalUse?: unknown[];
  commonSideEffects?: unknown[];
  precautions?: unknown[];
  contraindications?: unknown[];
  whatItIs?: unknown[];
  whyRequested?: unknown[];
  preparation?: unknown[];
  generalInterpretation?: unknown[];
  instructions?: unknown[];
}

export interface HealthListResponse { data?: HealthItem[]; meta?: { pagination?: { pageCount?: number } } }

export const healthSections: Record<HealthSection, {
  api: string;
  route: string;
  title: Record<string, string>;
  intro: Record<string, string>;
  itemTitle: (item: HealthItem) => string;
  itemDescription: (item: HealthItem) => string | undefined;
}> = {
  conditions: { api: "conditions", route: "conditions", title: { en: "Conditions", sw: "Magonjwa na hali za afya", fr: "Pathologies" }, intro: { en: "Clear, practical information to help you understand health conditions and the care available.", sw: "Taarifa rahisi na za vitendo kuhusu hali za afya na huduma zinazopatikana.", fr: "Des informations claires pour comprendre les problèmes de santé et les soins disponibles." }, itemTitle: x => x.name || "", itemDescription: x => x.shortDescription },
  medicines: { api: "treatments", route: "medicines", title: { en: "Medicines & Treatments", sw: "Dawa na matibabu", fr: "Médicaments et traitements" }, intro: { en: "Learn about common medicines and treatments, and what to discuss with your clinician.", sw: "Jifunze kuhusu dawa na matibabu ya kawaida na mambo ya kujadili na mtaalamu wako wa afya.", fr: "Découvrez les médicaments et traitements courants et les questions à poser à votre professionnel de santé." }, itemTitle: x => x.name || "", itemDescription: x => x.description },
  tests: { api: "medical-tests", route: "tests", title: { en: "Tests & Investigations", sw: "Vipimo na uchunguzi", fr: "Examens et analyses" }, intro: { en: "Understand what a test involves and why your care team may request it.", sw: "Fahamu kipimo kinachohusika na kwa nini timu yako ya afya inaweza kukiomba.", fr: "Comprenez le déroulement d’un examen et pourquoi votre équipe soignante peut le demander." }, itemTitle: x => x.name || "", itemDescription: x => x.shortDescription },
  guides: { api: "health-guides", route: "guides", title: { en: "Health Guides", sw: "Miongozo ya afya", fr: "Guides de santé" }, intro: { en: "Simple steps and practical guidance for looking after your health.", sw: "Hatua rahisi na mwongozo wa vitendo wa kutunza afya yako.", fr: "Des conseils pratiques et des étapes simples pour prendre soin de votre santé." }, itemTitle: x => x.title || "", itemDescription: x => x.shortDescription },
  nutrition: { api: "nutrition-guides", route: "nutrition", title: { en: "Nutrition", sw: "Lishe", fr: "Nutrition" }, intro: { en: "Informational nutrition guidance to support everyday wellbeing.", sw: "Taarifa za lishe zinazosaidia ustawi wa kila siku.", fr: "Des informations nutritionnelles pour accompagner le bien-être au quotidien." }, itemTitle: x => x.title || "", itemDescription: x => x.shortDescription },
  articles: { api: "articles", route: "articles", title: { en: "Articles", sw: "Makala", fr: "Articles" }, intro: { en: "Thoughtful health articles from the OnlineDoc team, written for real life.", sw: "Makala ya afya kutoka kwa timu ya OnlineDoc, yaliyoandikwa kwa maisha halisi.", fr: "Des articles de santé de l’équipe OnlineDoc, pensés pour la vie quotidienne." }, itemTitle: x => x.title || "", itemDescription: x => x.description },
};

export function healthLabel(locale: string, key: string): string {
  const labels: Record<string, Record<string, string>> = {
    en: { library: "OnlineDoc Health", intro: "Reliable health information, explained in a clear and human way.", explore: "Explore the Health Library", search: "Search", empty: "There is no published content here yet.", read: "Read more", related: "Explore related information", back: "Back to Health", notFound: "We couldn't find this page.", disclaimer: "This information is for general education and does not replace advice from a qualified health professional.", overview: "A closer look", causes: "What can cause it", symptoms: "Signs and symptoms", riskFactors: "Who may be more at risk", diagnosis: "How it is assessed", investigations: "Tests that may be used", treatmentAndManagement: "Treatment and management", prevention: "Reducing the risk", whenToSeekCare: "When to get medical help", genericName: "Generic name", uses: "What it may be used for", generalUse: "Using it safely", commonSideEffects: "Common side effects", precautions: "Things to consider", contraindications: "When it may not be suitable", whatItIs: "What the test involves", whyRequested: "Why it may be requested", preparation: "How to prepare", generalInterpretation: "Understanding results", instructions: "What you can do", content: "More information", categories: "Topics", relatedConditions: "Related conditions", relatedArticles: "Related articles", relatedTreatments: "Related medicines and treatments", relatedTests: "Related tests", relatedGuides: "Related guides", relatedNutrition: "Related nutrition guides" },
    sw: { library: "Afya ya OnlineDoc", intro: "Taarifa za afya zinazoaminika, zikielezwa kwa uwazi na kwa lugha rahisi.", explore: "Gundua Maktaba ya Afya", search: "Tafuta", empty: "Bado hakuna maudhui yaliyochapishwa hapa.", read: "Soma zaidi", related: "Taarifa nyingine zinazohusiana", back: "Rudi kwenye Afya", notFound: "Ukurasa huu haukupatikana.", disclaimer: "Taarifa hizi ni kwa elimu ya jumla na hazichukui nafasi ya ushauri kutoka kwa mtaalamu wa afya aliyehitimu.", overview: "Muhtasari", causes: "Sababu zinazoweza kusababisha", symptoms: "Dalili", riskFactors: "Wanaoweza kuwa kwenye hatari zaidi", diagnosis: "Jinsi hali inavyotathminiwa", investigations: "Vipimo vinavyoweza kufanywa", treatmentAndManagement: "Matibabu na usimamizi", prevention: "Kupunguza hatari", whenToSeekCare: "Wakati wa kutafuta matibabu", genericName: "Jina la kawaida", uses: "Matumizi yanayowezekana", generalUse: "Matumizi salama", commonSideEffects: "Madhara ya kawaida", precautions: "Mambo ya kuzingatia", contraindications: "Wakati huenda isifae", whatItIs: "Kipimo kinahusu nini", whyRequested: "Kwa nini kinaweza kuombwa", preparation: "Jinsi ya kujiandaa", generalInterpretation: "Kuelewa majibu", instructions: "Unachoweza kufanya", content: "Taarifa zaidi", categories: "Mada", relatedConditions: "Hali zinazohusiana", relatedArticles: "Makala zinazohusiana", relatedTreatments: "Dawa na matibabu yanayohusiana", relatedTests: "Vipimo vinavyohusiana", relatedGuides: "Miongozo inayohusiana", relatedNutrition: "Miongozo ya lishe inayohusiana" },
    fr: { library: "OnlineDoc Santé", intro: "Des informations de santé fiables, expliquées clairement et simplement.", explore: "Explorer la bibliothèque santé", search: "Rechercher", empty: "Aucun contenu publié pour le moment.", read: "En savoir plus", related: "Informations complémentaires", back: "Retour à Santé", notFound: "Cette page est introuvable.", disclaimer: "Ces informations sont éducatives et ne remplacent pas l’avis d’un professionnel de santé qualifié.", overview: "Présentation", causes: "Causes possibles", symptoms: "Signes et symptômes", riskFactors: "Facteurs de risque", diagnosis: "Évaluation", investigations: "Examens possibles", treatmentAndManagement: "Traitement et prise en charge", prevention: "Prévention", whenToSeekCare: "Quand consulter", genericName: "Nom générique", uses: "Utilisations possibles", generalUse: "Utilisation sûre", commonSideEffects: "Effets secondaires courants", precautions: "Précautions", contraindications: "Contre-indications", whatItIs: "En quoi consiste l’examen", whyRequested: "Pourquoi cet examen peut être demandé", preparation: "Préparation", generalInterpretation: "Comprendre les résultats", instructions: "Ce que vous pouvez faire", content: "En savoir plus", categories: "Thèmes", relatedConditions: "Pathologies associées", relatedArticles: "Articles associés", relatedTreatments: "Médicaments et traitements associés", relatedTests: "Examens associés", relatedGuides: "Guides associés", relatedNutrition: "Guides nutritionnels associés" },
  };
  return labels[locale]?.[key] || labels.en[key] || key;
}

export function sectionTitle(section: HealthSection, locale: string): string {
  return healthSections[section].title[locale] || healthSections[section].title.en;
}

export function contentTitle(section: HealthSection, item: HealthItem): string {
  return healthSections[section].itemTitle(item);
}

export function contentDescription(section: HealthSection, item: HealthItem): string | undefined {
  return healthSections[section].itemDescription(item);
}

export function contentMetadata(seo: Record<string, unknown> | undefined, locale: string): Metadata {
  return generateMetadataObject(seo, {
    locale,
    type: "article",
    canonical: typeof seo?.canonicalURL === "string" ? seo.canonicalURL : undefined,
  }) as Metadata;
}
