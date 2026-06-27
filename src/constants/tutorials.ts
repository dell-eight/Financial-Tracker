export const TUTORIAL = {
  DASHBOARD:    'tutorial_dashboard',
  ACCOUNTS:     'tutorial_accounts',
  TRANSACTIONS: 'tutorial_transactions',
  BUDGET:       'tutorial_budget',
  WEALTH:       'tutorial_wealth',
  SAVINGS:      'tutorial_savings',
  INVESTMENTS:  'tutorial_investments',
  ANALYTICS:    'tutorial_analytics',
  HEALTH_SCORE: 'tutorial_health_score',
} as const;

export type TutorialKey = typeof TUTORIAL[keyof typeof TUTORIAL];

// "First Wins" checklist storage keys
export const WIN = {
  ACCOUNT_ADDED:       'win_account_added',
  TRANSACTION_LOGGED:  'win_transaction_logged',
  BUDGET_CREATED:      'win_budget_created',
  GOAL_CREATED:        'win_goal_created',
  INVESTMENT_ADDED:    'win_investment_added',
  REMINDER_ENABLED:    'win_reminder_enabled',
  HEALTH_SCORE_VIEWED: 'win_health_score_viewed',
} as const;
