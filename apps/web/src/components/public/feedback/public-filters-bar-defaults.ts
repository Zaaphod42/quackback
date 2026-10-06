export {
  VOTE_THRESHOLDS,
  DATE_PRESETS,
  getDateFromDaysAgo,
  type DatePresetValue,
} from '@/components/shared/filter-presets'

// The labels are message descriptors, not strings: the filter bar translates
// them (the shared presets above keep plain English labels for the admin).
export const RESPONDED_OPTIONS = [
  {
    value: 'responded',
    message: { id: 'portal.feedback.filter.responded', defaultMessage: 'Has team response' },
  },
  {
    value: 'unresponded',
    message: {
      id: 'portal.feedback.filter.unresponded',
      defaultMessage: 'Awaiting team response',
    },
  },
] as const

/** "5+ votes": one message for every threshold of `VOTE_THRESHOLDS`. */
export const VOTE_THRESHOLD_MESSAGE = {
  id: 'portal.feedback.filter.votesAtLeast',
  defaultMessage: '{count}+ votes',
} as const

/** Labels of `DATE_PRESETS`, by preset value. */
export const DATE_PRESET_MESSAGES = {
  today: { id: 'portal.feedback.filter.date.today', defaultMessage: 'Today' },
  '7days': { id: 'portal.feedback.filter.date.7days', defaultMessage: 'Last 7 days' },
  '30days': { id: 'portal.feedback.filter.date.30days', defaultMessage: 'Last 30 days' },
  '90days': { id: 'portal.feedback.filter.date.90days', defaultMessage: 'Last 90 days' },
} as const

export type { RespondedFilter as RespondedValue } from '@/lib/shared/types/filters'

/**
 * Status category groups for the Status submenu.
 * Order matches the settings page (Active first, then Complete, then Closed).
 */
export const STATUS_CATEGORY_ORDER = ['active', 'complete', 'closed'] as const
