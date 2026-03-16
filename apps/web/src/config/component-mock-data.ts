/**
 * Component Mock Data
 *
 * Centralized mock data for component registry static previews,
 * showcase stories, and composition scenes.
 *
 * All IDs are valid UUIDs. Dates are ISO 8601 strings.
 * Data is realistic but clearly fictitious.
 */

// ─── Pipeline ────────────────────────────────────────────────────────────────

export type PipelineStepStatus = 'completed' | 'running' | 'pending' | 'failed';

export interface MockPipelineStep {
  id: string;
  label: string;
  status: PipelineStepStatus;
  durationMs: number | null;
  startedAt: string | null;
  completedAt: string | null;
}

export const MOCK_PIPELINE_STEPS: MockPipelineStep[] = [
  {
    id: 'step-upload',
    label: 'Upload',
    status: 'completed',
    durationMs: 820,
    startedAt: '2026-03-16T09:00:00.000Z',
    completedAt: '2026-03-16T09:00:00.820Z',
  },
  {
    id: 'step-extraction',
    label: 'Extraction',
    status: 'completed',
    durationMs: 4210,
    startedAt: '2026-03-16T09:00:00.820Z',
    completedAt: '2026-03-16T09:00:05.030Z',
  },
  {
    id: 'step-chunking',
    label: 'Chunking',
    status: 'completed',
    durationMs: 1350,
    startedAt: '2026-03-16T09:00:05.030Z',
    completedAt: '2026-03-16T09:00:06.380Z',
  },
  {
    id: 'step-embedding',
    label: 'Embedding',
    status: 'running',
    durationMs: null,
    startedAt: '2026-03-16T09:00:06.380Z',
    completedAt: null,
  },
  {
    id: 'step-vector-storage',
    label: 'Vector Storage',
    status: 'pending',
    durationMs: null,
    startedAt: null,
    completedAt: null,
  },
  {
    id: 'step-index-update',
    label: 'Index Update',
    status: 'pending',
    durationMs: null,
    startedAt: null,
    completedAt: null,
  },
];

// ─── Game ─────────────────────────────────────────────────────────────────────

export interface MockGame {
  id: string;
  title: string;
  publisher: string;
  yearPublished: number;
  minPlayers: number;
  maxPlayers: number;
  minPlayTimeMinutes: number;
  maxPlayTimeMinutes: number;
  averageRating: number;
  categories: string[];
  mechanics: string[];
  description: string;
  imageUrl: string | null;
  bggId: number;
  sharedGameId: string;
  createdAt: string;
}

export const MOCK_GAME: MockGame = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  title: 'Catan',
  publisher: 'Kosmos',
  yearPublished: 1995,
  minPlayers: 3,
  maxPlayers: 4,
  minPlayTimeMinutes: 60,
  maxPlayTimeMinutes: 120,
  averageRating: 7.2,
  categories: ['Civilization', 'Negotiation'],
  mechanics: ['Dice Rolling', 'Trading', 'Area Control'],
  description:
    'In Catan, players try to be the dominant force on the island of Catan by building settlements, cities, and roads.',
  imageUrl: null,
  bggId: 13,
  sharedGameId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  createdAt: '2025-01-15T10:30:00.000Z',
};

export const MOCK_GAMES: MockGame[] = [
  MOCK_GAME,
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    title: 'Ticket to Ride',
    publisher: 'Days of Wonder',
    yearPublished: 2004,
    minPlayers: 2,
    maxPlayers: 5,
    minPlayTimeMinutes: 45,
    maxPlayTimeMinutes: 90,
    averageRating: 7.5,
    categories: ['Trains', 'Routes'],
    mechanics: ['Set Collection', 'Route Building'],
    description:
      'Collect and play matching train cards to claim railway routes connecting cities across North America.',
    imageUrl: null,
    bggId: 9209,
    sharedGameId: 'd4e5f6a7-b8c9-0123-defa-234567890123',
    createdAt: '2025-02-01T08:00:00.000Z',
  },
  {
    id: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    title: 'Pandemic',
    publisher: 'Z-Man Games',
    yearPublished: 2008,
    minPlayers: 2,
    maxPlayers: 4,
    minPlayTimeMinutes: 45,
    maxPlayTimeMinutes: 75,
    averageRating: 7.6,
    categories: ['Medical', 'Cooperative'],
    mechanics: ['Cooperative Play', 'Hand Management', 'Action Points'],
    description:
      'Four diseases threaten the world. Your team of specialists must work together to stop them.',
    imageUrl: null,
    bggId: 30549,
    sharedGameId: 'f6a7b8c9-d0e1-2345-fabc-456789012345',
    createdAt: '2025-02-20T14:15:00.000Z',
  },
  {
    id: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
    title: 'Wingspan',
    publisher: 'Stonemaier Games',
    yearPublished: 2019,
    minPlayers: 1,
    maxPlayers: 5,
    minPlayTimeMinutes: 40,
    maxPlayTimeMinutes: 70,
    averageRating: 8.0,
    categories: ['Animals', 'Nature'],
    mechanics: ['Card Drafting', 'Engine Building', 'Worker Placement'],
    description:
      'Attract a diverse collection of birds to your wildlife preserve. Each bird played extends a powerful chain of actions.',
    imageUrl: null,
    bggId: 266192,
    sharedGameId: 'b8c9d0e1-f2a3-4567-bcde-678901234567',
    createdAt: '2025-03-01T11:00:00.000Z',
  },
];

// ─── Agent ────────────────────────────────────────────────────────────────────

export interface MockAgent {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'idle' | 'disabled';
  description: string;
  kbCardIds: string[];
  strategyName: string;
  invocationCount: number;
  createdAt: string;
  lastInvokedAt: string | null;
}

export const MOCK_AGENT: MockAgent = {
  id: 'f1e2d3c4-b5a6-7890-fedc-ba0987654321',
  name: 'Catan Rules Expert',
  model: 'openai/gpt-4o-mini',
  status: 'active',
  description:
    'Specialised agent for answering questions about Catan rules, edge cases, and strategy.',
  kbCardIds: ['11111111-2222-3333-4444-555555555555', '22222222-3333-4444-5555-666666666666'],
  strategyName: 'HybridRag',
  invocationCount: 142,
  createdAt: '2025-12-01T09:00:00.000Z',
  lastInvokedAt: '2026-03-16T08:45:00.000Z',
};

// ─── User ─────────────────────────────────────────────────────────────────────

export interface MockUser {
  id: string;
  email: string;
  displayName: string;
  role: 'Admin' | 'User' | 'Contributor';
  tier: 'Free' | 'Premium';
  status: 'active' | 'suspended';
  isTwoFactorEnabled: boolean;
  createdAt: string;
  lastSeenAt: string | null;
}

export const MOCK_USER: MockUser = {
  id: '99887766-5544-3322-1100-aabbccddeeff',
  email: 'alice@meepleai.dev',
  displayName: 'Alice Rossi',
  role: 'Admin',
  tier: 'Premium',
  status: 'active',
  isTwoFactorEnabled: true,
  createdAt: '2025-06-01T07:00:00.000Z',
  lastSeenAt: '2026-03-16T09:30:00.000Z',
};

export const MOCK_USERS: MockUser[] = [
  MOCK_USER,
  {
    id: '11223344-5566-7788-99aa-bbccddeeff00',
    email: 'bob@example.com',
    displayName: 'Bob Esposito',
    role: 'User',
    tier: 'Free',
    status: 'active',
    isTwoFactorEnabled: false,
    createdAt: '2025-09-15T12:00:00.000Z',
    lastSeenAt: '2026-03-14T18:00:00.000Z',
  },
  {
    id: 'aabbccdd-eeff-0011-2233-445566778899',
    email: 'carol@boardgame.io',
    displayName: 'Carol Ferrari',
    role: 'Contributor',
    tier: 'Premium',
    status: 'active',
    isTwoFactorEnabled: true,
    createdAt: '2025-11-03T10:00:00.000Z',
    lastSeenAt: '2026-03-15T20:15:00.000Z',
  },
  {
    id: 'ffeeddcc-bbaa-9988-7766-554433221100',
    email: 'dave@example.net',
    displayName: 'Dave Conti',
    role: 'User',
    tier: 'Free',
    status: 'suspended',
    isTwoFactorEnabled: false,
    createdAt: '2025-07-22T16:00:00.000Z',
    lastSeenAt: '2026-01-10T09:00:00.000Z',
  },
];

// ─── KB Card ──────────────────────────────────────────────────────────────────

export interface MockKbCard {
  id: string;
  title: string;
  documentType: 'Rulebook' | 'Errata' | 'Homerule';
  chunkCount: number;
  status: 'Completed' | 'Processing' | 'Failed' | 'Pending';
  progressPercentage: number;
  gameId: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  processedAt: string | null;
}

export const MOCK_KB_CARD: MockKbCard = {
  id: '11111111-2222-3333-4444-555555555555',
  title: 'Catan Rulebook 5th Edition',
  documentType: 'Rulebook',
  chunkCount: 248,
  status: 'Completed',
  progressPercentage: 100,
  gameId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  fileName: 'catan-rulebook-5th-edition.pdf',
  fileSizeBytes: 3_145_728,
  uploadedAt: '2026-01-10T14:00:00.000Z',
  processedAt: '2026-01-10T14:08:22.000Z',
};

// ─── Chart / Usage Data ───────────────────────────────────────────────────────

export interface MockUsageDataPoint {
  date: string;
  requests: number;
  cost: number;
}

export const MOCK_USAGE_DATA: MockUsageDataPoint[] = [
  { date: '2026-03-09', requests: 312, cost: 0.47 },
  { date: '2026-03-10', requests: 428, cost: 0.64 },
  { date: '2026-03-11', requests: 389, cost: 0.58 },
  { date: '2026-03-12', requests: 502, cost: 0.76 },
  { date: '2026-03-13', requests: 615, cost: 0.93 },
  { date: '2026-03-14', requests: 478, cost: 0.72 },
  { date: '2026-03-15', requests: 541, cost: 0.81 },
  { date: '2026-03-16', requests: 203, cost: 0.31 },
];

// ─── KPI Stats ────────────────────────────────────────────────────────────────

export interface MockKpiStats {
  totalGames: number;
  totalUsers: number;
  totalAgents: number;
  totalDocuments: number;
  pendingApprovals: number;
}

export const MOCK_KPI_STATS: MockKpiStats = {
  totalGames: 347,
  totalUsers: 1_284,
  totalAgents: 52,
  totalDocuments: 918,
  pendingApprovals: 7,
};

// ─── Alert Rule ───────────────────────────────────────────────────────────────

export interface MockAlertRule {
  id: string;
  name: string;
  alertType: string;
  severity: 'Info' | 'Warning' | 'Error' | 'Critical';
  thresholdValue: number;
  thresholdUnit: string;
  durationMinutes: number;
  isEnabled: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const MOCK_ALERT_RULE: MockAlertRule = {
  id: 'deadbeef-cafe-babe-feed-c0ffee000001',
  name: 'High RPM Alert',
  alertType: 'RpmThreshold',
  severity: 'Warning',
  thresholdValue: 80,
  thresholdUnit: 'percent',
  durationMinutes: 5,
  isEnabled: true,
  description: 'Triggers when OpenRouter RPM utilisation exceeds 80% for 5 minutes.',
  createdAt: '2026-02-01T12:00:00.000Z',
  updatedAt: '2026-03-01T08:00:00.000Z',
};

// ─── Vector Collection ────────────────────────────────────────────────────────

export interface MockVectorCollection {
  name: string;
  vectorCount: number;
  dimensions: number;
  storage: string;
  health: number;
}

export const MOCK_VECTOR_COLLECTION: MockVectorCollection = {
  name: 'rulebooks_v2',
  vectorCount: 124_580,
  dimensions: 768,
  storage: 'qdrant',
  health: 0.99,
};

// ─── Chat Messages ────────────────────────────────────────────────────────────

export interface MockChatMessage {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  sequenceNumber: number;
  createdAt: string;
}

export const MOCK_CHAT_MESSAGES: MockChatMessage[] = [
  {
    id: '10000001-aaaa-bbbb-cccc-dddddddddddd',
    chatId: '20000001-aaaa-bbbb-cccc-dddddddddddd',
    role: 'user',
    content: 'Can I build a settlement on a port on my first turn?',
    sequenceNumber: 1,
    createdAt: '2026-03-16T09:10:00.000Z',
  },
  {
    id: '10000002-aaaa-bbbb-cccc-dddddddddddd',
    chatId: '20000001-aaaa-bbbb-cccc-dddddddddddd',
    role: 'assistant',
    content:
      'No — during the initial placement phase you may place settlements on any valid intersection, ' +
      'but you cannot place them directly on a port hex. Ports are simply adjacent coastal intersections ' +
      'that grant 2:1 or 3:1 trading ratios once you have a settlement there.',
    sequenceNumber: 2,
    createdAt: '2026-03-16T09:10:04.000Z',
  },
  {
    id: '10000003-aaaa-bbbb-cccc-dddddddddddd',
    chatId: '20000001-aaaa-bbbb-cccc-dddddddddddd',
    role: 'user',
    content: 'What if two players want the same port intersection?',
    sequenceNumber: 3,
    createdAt: '2026-03-16T09:10:45.000Z',
  },
  {
    id: '10000004-aaaa-bbbb-cccc-dddddddddddd',
    chatId: '20000001-aaaa-bbbb-cccc-dddddddddddd',
    role: 'assistant',
    content:
      'First come, first served. The player who places their initial settlement there during setup ' +
      'claims that port for the rest of the game. The other player must choose a different location.',
    sequenceNumber: 4,
    createdAt: '2026-03-16T09:10:50.000Z',
  },
];

// ─── Entity Links ─────────────────────────────────────────────────────────────

export interface MockEntityLink {
  id: string;
  sourceEntityType: string;
  sourceEntityId: string;
  targetEntityType: string;
  targetEntityId: string;
  linkType:
    | 'ExpansionOf'
    | 'SequelOf'
    | 'Reimplements'
    | 'CompanionTo'
    | 'RelatedTo'
    | 'PartOf'
    | 'CollaboratesWith'
    | 'SpecializedBy';
  isBidirectional: boolean;
  scope: 'User' | 'Shared';
  isAdminApproved: boolean;
  createdAt: string;
}

export const MOCK_ENTITY_LINKS: MockEntityLink[] = [
  {
    id: '30000001-aaaa-bbbb-cccc-dddddddddddd',
    sourceEntityType: 'Game',
    sourceEntityId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    targetEntityType: 'Game',
    targetEntityId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    linkType: 'RelatedTo',
    isBidirectional: true,
    scope: 'Shared',
    isAdminApproved: true,
    createdAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: '30000002-aaaa-bbbb-cccc-dddddddddddd',
    sourceEntityType: 'Game',
    sourceEntityId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    targetEntityType: 'Game',
    targetEntityId: 'e5f6a7b8-c9d0-1234-efab-345678901234',
    linkType: 'CompanionTo',
    isBidirectional: false,
    scope: 'User',
    isAdminApproved: false,
    createdAt: '2026-02-05T15:30:00.000Z',
  },
  {
    id: '30000003-aaaa-bbbb-cccc-dddddddddddd',
    sourceEntityType: 'Game',
    sourceEntityId: 'a7b8c9d0-e1f2-3456-abcd-567890123456',
    targetEntityType: 'Agent',
    targetEntityId: 'f1e2d3c4-b5a6-7890-fedc-ba0987654321',
    linkType: 'SpecializedBy',
    isBidirectional: false,
    scope: 'Shared',
    isAdminApproved: true,
    createdAt: '2026-02-18T09:00:00.000Z',
  },
];
