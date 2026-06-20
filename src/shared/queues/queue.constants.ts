export const QUEUES = {
  EMBEDDING: 'embedding',
  DRIVE_SYNC: 'drive-sync',
} as const

export const EMBEDDING_JOBS = {
  FAQ_EMBED: 'faq-embed',
  KB_EMBED: 'kb-embed',
} as const

export const DRIVE_SYNC_JOBS = {
  PROCESS_DOCUMENT: 'process-document',
  RUN_CRON_TICK: 'run-cron-tick',
} as const
