import type { Account, Budget, DashboardSummary, Transaction, User } from '../types/models';

// ── Mock user ─────────────────────────────────────────────────────────────────

export const SEED_USER: User = {
  id:             '1',
  name:           'Wendell Villareal',
  email:          'wendell@example.com',
  avatarInitials: 'WV',
  currency:       'USD',
  memberSince:    '2026-06-13',
};

// ── Mock accounts ─────────────────────────────────────────────────────────────

export const SEED_ACCOUNTS: Account[] = [
  {
    id:              'acc1',
    institutionName: 'Maya Savings',
    maskedNumber:    '•••• ••••',
    type:            'savings',
    balance:         100000.00,
    gradientIndex:   0,
  },
  {
    id:              'acc2',
    institutionName: 'PNB Savings',
    maskedNumber:    '•••• ••••',
    type:            'savings',
    balance:         140000.00,
    gradientIndex:   2,
  },
  {
    id:              'acc3',
    institutionName: 'Maya Time Deposit',
    maskedNumber:    '•••• ••••',
    type:            'savings',
    balance:         200000.00,
    gradientIndex:   1,
  },
];

// ── Mock transactions ─────────────────────────────────────────────────────────

export const SEED_TRANSACTIONS: Transaction[] = [
  // Income
  { id: 't01', merchant: 'Salary Deposit',      category: 'income_salary',    categoryLabel: 'Salary',        categoryIcon: '💼', amount: 4800.00, type: 'income',  date: '2026-06-01', time: '09:00' },
  { id: 't02', merchant: 'Freelance - Design',  category: 'income_freelance', categoryLabel: 'Freelance',     categoryIcon: '💻', amount: 1200.00, type: 'income',  date: '2026-06-05', time: '14:30' },
  { id: 't03', merchant: 'Dividends',           category: 'income_other',     categoryLabel: 'Other Income',  categoryIcon: '💰', amount:  420.00, type: 'income',  date: '2026-06-10', time: '08:00' },

  // Food & Dining
  { id: 't04', merchant: 'Whole Foods Market',  category: 'food',             categoryLabel: 'Food & Dining', categoryIcon: '🍔', amount:  124.50, type: 'expense', date: '2026-06-12', time: '11:20' },
  { id: 't05', merchant: 'Starbucks',           category: 'food',             categoryLabel: 'Food & Dining', categoryIcon: '🍔', amount:    7.85, type: 'expense', date: '2026-06-12', time: '08:45' },
  { id: 't06', merchant: 'Chipotle',            category: 'food',             categoryLabel: 'Food & Dining', categoryIcon: '🍔', amount:   14.25, type: 'expense', date: '2026-06-11', time: '13:10' },
  { id: 't07', merchant: 'DoorDash',            category: 'food',             categoryLabel: 'Food & Dining', categoryIcon: '🍔', amount:   32.40, type: 'expense', date: '2026-06-10', time: '19:30' },
  { id: 't08', merchant: 'Trader Joe\'s',       category: 'food',             categoryLabel: 'Food & Dining', categoryIcon: '🍔', amount:   87.60, type: 'expense', date: '2026-06-08', time: '16:15' },
  { id: 't09', merchant: 'Blue Bottle Coffee',  category: 'food',             categoryLabel: 'Food & Dining', categoryIcon: '🍔', amount:    9.50, type: 'expense', date: '2026-06-07', time: '09:00' },

  // Transport
  { id: 't10', merchant: 'Uber',                category: 'transport',        categoryLabel: 'Transport',     categoryIcon: '🚗', amount:   18.90, type: 'expense', date: '2026-06-12', time: '20:00' },
  { id: 't11', merchant: 'Shell Gas Station',   category: 'transport',        categoryLabel: 'Transport',     categoryIcon: '🚗', amount:   68.40, type: 'expense', date: '2026-06-09', time: '17:45' },
  { id: 't12', merchant: 'Metro Card',          category: 'transport',        categoryLabel: 'Transport',     categoryIcon: '🚗', amount:   33.00, type: 'expense', date: '2026-06-06', time: '08:30' },

  // Shopping
  { id: 't13', merchant: 'Amazon',              category: 'shopping',         categoryLabel: 'Shopping',      categoryIcon: '🛍️', amount:  145.99, type: 'expense', date: '2026-06-11', time: '22:10' },
  { id: 't14', merchant: 'Apple Store',         category: 'shopping',         categoryLabel: 'Shopping',      categoryIcon: '🛍️', amount:   29.99, type: 'expense', date: '2026-06-09', time: '15:20' },
  { id: 't15', merchant: 'H&M',                 category: 'shopping',         categoryLabel: 'Shopping',      categoryIcon: '🛍️', amount:   79.50, type: 'expense', date: '2026-06-07', time: '13:40' },

  // Bills & Utilities
  { id: 't16', merchant: 'Con Edison',          category: 'bills',            categoryLabel: 'Bills',         categoryIcon: '💡', amount:   98.00, type: 'expense', date: '2026-06-05', time: '10:00' },
  { id: 't17', merchant: 'Verizon',             category: 'bills',            categoryLabel: 'Bills',         categoryIcon: '💡', amount:   85.00, type: 'expense', date: '2026-06-04', time: '10:00' },
  { id: 't18', merchant: 'Netflix',             category: 'bills',            categoryLabel: 'Bills',         categoryIcon: '💡', amount:   15.99, type: 'expense', date: '2026-06-04', time: '10:00', note: 'Monthly subscription' },

  // Health
  { id: 't19', merchant: 'CVS Pharmacy',        category: 'health',           categoryLabel: 'Health',        categoryIcon: '💊', amount:   42.80, type: 'expense', date: '2026-06-08', time: '12:00' },
  { id: 't20', merchant: 'Gym Membership',      category: 'health',           categoryLabel: 'Health',        categoryIcon: '💊', amount:   49.00, type: 'expense', date: '2026-06-03', time: '10:00' },

  // Entertainment
  { id: 't21', merchant: 'AMC Theaters',        category: 'entertainment',    categoryLabel: 'Entertainment', categoryIcon: '🎬', amount:   28.50, type: 'expense', date: '2026-06-07', time: '19:00' },
  { id: 't22', merchant: 'Spotify',             category: 'entertainment',    categoryLabel: 'Entertainment', categoryIcon: '🎬', amount:    9.99, type: 'expense', date: '2026-06-04', time: '10:00', note: 'Monthly subscription' },
  { id: 't23', merchant: 'Steam',               category: 'entertainment',    categoryLabel: 'Entertainment', categoryIcon: '🎬', amount:   59.99, type: 'expense', date: '2026-06-05', time: '21:30' },

  // Education
  { id: 't24', merchant: 'Udemy Course',        category: 'education',        categoryLabel: 'Education',     categoryIcon: '📚', amount:   24.99, type: 'expense', date: '2026-06-06', time: '11:00' },
  { id: 't25', merchant: 'O\'Reilly Media',     category: 'education',        categoryLabel: 'Education',     categoryIcon: '📚', amount:   49.00, type: 'expense', date: '2026-06-03', time: '10:00', note: 'Monthly subscription' },

  // Other
  { id: 't26', merchant: 'ATM Withdrawal',      category: 'other',            categoryLabel: 'Other',         categoryIcon: '📦', amount:  100.00, type: 'expense', date: '2026-06-10', time: '14:00' },
  { id: 't27', merchant: 'Bank Fee',            category: 'bills',            categoryLabel: 'Bills',         categoryIcon: '💡', amount:   12.00, type: 'expense', date: '2026-06-02', time: '10:00' },
  { id: 't28', merchant: 'Dentist',             category: 'health',           categoryLabel: 'Health',        categoryIcon: '💊', amount:  180.00, type: 'expense', date: '2026-06-04', time: '11:00' },
  { id: 't29', merchant: 'Parking',             category: 'transport',        categoryLabel: 'Transport',     categoryIcon: '🚗', amount:   22.00, type: 'expense', date: '2026-06-11', time: '14:30' },
  { id: 't30', merchant: 'Interest Income',     category: 'income_other',     categoryLabel: 'Other Income',  categoryIcon: '💰', amount:   52.80, type: 'income',  date: '2026-06-01', time: '09:00' },
];

// ── Mock budgets ──────────────────────────────────────────────────────────────

export const SEED_BUDGETS: Budget[] = [
  { id: 'b01', category: 'food',          label: 'Food & Dining',  icon: '🍔', color: '#F97316', limit: 600, spent: 275.10, month: 6, year: 2026 },
  { id: 'b02', category: 'transport',     label: 'Transport',       icon: '🚗', color: '#3B82F6', limit: 200, spent: 142.30, month: 6, year: 2026 },
  { id: 'b03', category: 'shopping',      label: 'Shopping',        icon: '🛍️', color: '#EC4899', limit: 300, spent: 255.48, month: 6, year: 2026 },
  { id: 'b04', category: 'bills',         label: 'Bills',           icon: '💡', color: '#EF4444', limit: 400, spent: 210.99, month: 6, year: 2026 },
  { id: 'b05', category: 'health',        label: 'Health',          icon: '💊', color: '#22C55E', limit: 250, spent: 271.80, month: 6, year: 2026 },
  { id: 'b06', category: 'entertainment', label: 'Entertainment',   icon: '🎬', color: '#A855F7', limit: 150, spent:  98.48, month: 6, year: 2026 },
  { id: 'b07', category: 'education',     label: 'Education',       icon: '📚', color: '#14B8A6', limit: 100, spent:  73.99, month: 6, year: 2026 },
  { id: 'b08', category: 'other',         label: 'Other',           icon: '📦', color: '#6B7280', limit: 150, spent: 100.00, month: 6, year: 2026 },
];

// ── Dashboard summary ─────────────────────────────────────────────────────────

export const SEED_DASHBOARD: DashboardSummary = {
  totalBalance:    17098.30,
  netWorth:        15255.95,
  monthlyIncome:    6472.80,
  monthlyExpenses:  1428.14,
  savingsRate:        77.9,
  balanceDelta:      348.50,
  balanceDeltaPct:     2.08,
};
