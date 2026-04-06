export type TaskStatus = 'Pendiente' | 'En Progreso' | 'En Revisión' | 'Completada' | 'Cobrado';
export type PartnerStatus =
  | 'Prospecto'
  | 'En Negociación'
  | 'Activo'
  | 'Inactivo'
  | 'On Hold'
  | 'Relación Culminada';

export type PartnershipType = 'Permanente' | 'Plazo Fijo' | 'One Time' | 'Por definir';

export type AppTheme = 'light' | 'dark';

export type FreelancerType =
  | 'content_creator'
  | 'podcaster'
  | 'streamer'
  | 'radio'
  | 'photographer'
  | 'copywriter'
  | 'community_manager'
  | 'host_mc'
  | 'speaker'
  | 'dj'
  | 'recruiter'
  | 'coach';

export interface Contact {
  id: string;
  name: string;
  role: string;
  email: string;
  ig: string;
  phone?: string;
}

export interface Partner {
  id: string;
  name: string;
  status: PartnerStatus;
  logo?: string;
  contacts: Contact[];
  goalId?: string;
  keyTerms?: string;
  partnershipType?: PartnershipType;
  startDate?: string;
  endDate?: string;
  monthlyRevenue?: number;
  annualRevenue?: number;
  mainChannel?: string;
  createdAt: string;
  lastContactedAt?: string;
  source?: string;
}

export function getPartnerLookupKey(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  partnerId: string;
  goalId?: string;
  status: TaskStatus;
  dueDate: string;
  value: number;
  gcalEventId?: string;
  createdAt: string;
  completedAt?: string;
  cobradoAt?: string;
  actualPayment?: number;
  checklistItems: ChecklistItem[];
}

export interface TaskStatusTransition {
  id: string;
  taskId: string;
  fromStatus: TaskStatus | null;
  toStatus: TaskStatus;
  changedAt: string;
}

export interface PartnerStatusTransition {
  id: string;
  partnerId: string;
  fromStatus: PartnerStatus | null;
  toStatus: PartnerStatus;
  changedAt: string;
}

export interface Template {
  id: string;
  name: string;
  body: string;
}

export interface SocialProfiles {
  instagram: string;
  tiktok: string;
  x: string;
  threads: string;
  youtube: string;
}

export type BlockType =
  | 'identity'
  | 'about'
  | 'metrics'
  | 'portfolio'
  | 'brands'
  | 'services'
  | 'closing'
  | 'testimonials'
  | 'press'
  | 'speaking_topics'
  | 'video_reel'
  | 'equipment'
  | 'awards'
  | 'faq'
  | 'episodes'
  | 'releases'
  | 'links';

export interface MediaKitMetric {
  label: string;
  value: string;
}

export interface MediaKitOffer {
  title: string;
  price: string;
  description: string;
}

export interface MediaKitTestimonial {
  quote: string;
  author: string;
  company: string;
  role: string;
}

export interface MediaKitPressItem {
  publication: string;
  headline: string;
  url: string;
  year: string;
}

export interface MediaKitSpeakingTopic {
  title: string;
  description: string;
}

export interface MediaKitVideoReel {
  url: string;
  label: string;
}

export interface MediaKitEquipmentItem {
  item: string;
  description: string;
}

export interface MediaKitAward {
  name: string;
  issuer: string;
  year: string;
}

export interface MediaKitFaqItem {
  question: string;
  answer: string;
}

export interface MediaKitEpisode {
  title: string;
  description: string;
  listenUrl: string;
}

export interface MediaKitRelease {
  name: string;
  platforms: { label: string; url: string }[];
}

export interface MediaKitLink {
  label: string;
  url: string;
}

export interface MediaKitProfile {
  // Block system control
  enabledBlocks: BlockType[];
  blockOrder: BlockType[];
  blockComponents: Record<string, string[]>; // sparse: only blocks with explicit config appear here; absent = all components enabled

  // Identity block fields
  periodLabel: string;
  updatedLabel: string;
  tagline: string;
  contactEmail: string;

  // About block fields
  featuredImage: string;
  aboutTitle: string;
  aboutParagraphs: string[];
  topicTags: string[];

  // Metrics block fields
  insightStats: MediaKitMetric[];
  audienceGender: MediaKitMetric[];
  ageDistribution: MediaKitMetric[];
  topCountries: MediaKitMetric[];

  // Portfolio block fields
  portfolioImages: string[];

  // Services block fields
  servicesTitle: string;
  servicesDescription: string;
  offerings: MediaKitOffer[];

  // Brands block fields
  brandsTitle: string;
  trustedBrands: string[];

  // Closing block fields
  closingTitle: string;
  closingDescription: string;
  footerNote: string;

  // New block data fields
  testimonials: MediaKitTestimonial[];
  press: MediaKitPressItem[];
  speakingTopics: MediaKitSpeakingTopic[];
  videoReels: MediaKitVideoReel[];
  equipment: MediaKitEquipmentItem[];
  awards: MediaKitAward[];
  faq: MediaKitFaqItem[];
  episodes: MediaKitEpisode[];
  releases: MediaKitRelease[];
  links: MediaKitLink[];
}

export type GoalStatus = 'Pendiente' | 'En Curso' | 'Alcanzado' | 'Cancelado';
export type GoalPriority = 'Baja' | 'Media' | 'Alta';

export interface Goal {
  id: string;
  area: string;
  generalGoal: string;
  successMetric: string;
  timeframe: number; // months (1–36)
  targetDate: string; // ISO date (createdAt + timeframe months)
  createdAt: string; // ISO timestamp, set on first save
  status: GoalStatus;
  priority: GoalPriority;
  revenueEstimation: number;
}

export function createEmptySocialProfiles(): SocialProfiles {
  return {
    instagram: '',
    tiktok: '',
    x: '',
    threads: '',
    youtube: '',
  };
}

export function createDefaultMediaKitProfile(): MediaKitProfile {
  return {
    enabledBlocks: [],
    blockOrder: [],
    blockComponents: {},
    periodLabel: '',
    updatedLabel: '',
    tagline: '',
    contactEmail: '',
    featuredImage: '',
    aboutTitle: '',
    aboutParagraphs: [],
    topicTags: [],
    insightStats: [],
    audienceGender: [],
    ageDistribution: [],
    topCountries: [],
    portfolioImages: [],
    servicesTitle: '',
    servicesDescription: '',
    offerings: [],
    brandsTitle: '',
    trustedBrands: [],
    closingTitle: '',
    closingDescription: '',
    footerNote: '',
    testimonials: [],
    press: [],
    speakingTopics: [],
    videoReels: [],
    equipment: [],
    awards: [],
    faq: [],
    episodes: [],
    releases: [],
    links: [],
  };
}

export interface UserProfile {
  name: string;
  avatar: string;
  handle: string;
  socialProfiles: SocialProfiles;
  mediaKit: MediaKitProfile;
  goals: Goal[];
  notificationsEnabled: boolean;
  primaryProfession?: FreelancerType;
  secondaryProfessions?: FreelancerType[];
}

export interface AppState {
  tasks: Task[];
  partners: Partner[];
  profile: UserProfile;
  accentColor: string;
  templates: Template[];
  theme: AppTheme;
}

// ────────────────────────────────────────────────────────────
// Notifications
// ────────────────────────────────────────────────────────────

export type AppNotificationCategory = 'agenda' | 'gamification';

export interface AppNotification {
  id: string;
  category: AppNotificationCategory;
  title: string;
  body: string;
  actionTab?: string;
}

// ────────────────────────────────────────────────────────────
// Efisystem — gamification types
// ────────────────────────────────────────────────────────────

export type PointEventType =
  | 'config_accent_change'    // every accent change; service awards points only on 2nd
  | 'config_profile_complete'
  | 'config_first_goal'
  | 'network_first_partner'
  | 'network_partner_subsequent'
  | 'network_first_contact'
  | 'network_contact_subsequent'
  | 'pipeline_first_task'
  | 'pipeline_first_checklist_item'
  | 'pipeline_task_moved'
  | 'pipeline_task_completed'
  | 'pipeline_task_paid';

export type BadgeKey =
  | 'perfil_estelar'       // Empezaste a construir tu perfil público
  | 'vision_clara'         // Definiste 3 objetivos estratégicos
  | 'circulo_intimo'       // Agregaste 5 socios a tu red
  | 'directorio_dorado'    // 10 Socios y 10 Contactos en tu red
  | 'motor_de_ideas'       // Creaste 5 entregas en tu pipeline
  | 'promesa_cumplida'     // Completaste 10 entregas
  | 'creador_imparable'    // Completaste 25 entregas
  | 'negocio_en_marcha'    // Cobraste 5 entregas
  | 'lluvia_de_billetes';  // Cobraste 20 entregas

export interface EfisystemAward {
  pointsEarned: number;
  newTotal: number;
  newLevel: number;
  leveledUp: boolean;
  newBadges: BadgeKey[];
}

export interface EfisystemSnapshot {
  totalPoints: number;
  currentLevel: number;
  unlockedBadges: BadgeKey[];
}
