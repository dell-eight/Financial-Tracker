/**
 * Category taxonomy — single source of truth for all category metadata.
 *
 * Consumed by:
 *   - CategoryPickerGrid (icon + label)
 *   - TransactionItem (icon circle color)
 *   - FilterChipRow (label + color)
 *   - DonutChart (slice color)
 *   - BudgetCategoryCard (icon + color)
 *   - utils/category.ts helpers
 *   - types/models.ts CategoryKey union
 */

import { categoryColors } from '../theme';
import type { CategoryKey } from '../theme';

export interface CategoryMeta {
  key:       CategoryKey;
  label:     string;
  iconName:  string;    // Phosphor / Heroicons icon name — resolved in IconCircle component
  emoji:     string;    // Emoji glyph — used in pickers and transaction lists
  color:     string;    // hex — from theme.categoryColors
  type:      'expense' | 'income' | 'both';
}

export const CATEGORIES: CategoryMeta[] = [
  {
    key:      'food',
    label:    'Food',
    iconName: 'fork-knife',
    emoji:    '🍔',
    color:    categoryColors.food,
    type:     'expense',
  },
  {
    key:      'transport',
    label:    'Transport',
    iconName: 'car',
    emoji:    '🚗',
    color:    categoryColors.transport,
    type:     'expense',
  },
  {
    key:      'shopping',
    label:    'Shopping',
    iconName: 'shopping-bag',
    emoji:    '🛍️',
    color:    categoryColors.shopping,
    type:     'expense',
  },
  {
    key:      'bills',
    label:    'Bills',
    iconName: 'lightning',
    emoji:    '⚡',
    color:    categoryColors.bills,
    type:     'expense',
  },
  {
    key:      'health',
    label:    'Health',
    iconName: 'heart',
    emoji:    '💊',
    color:    categoryColors.health,
    type:     'expense',
  },
  {
    key:      'entertainment',
    label:    'Entertainment',
    iconName: 'game-controller',
    emoji:    '🎬',
    color:    categoryColors.entertainment,
    type:     'expense',
  },
  {
    key:      'education',
    label:    'Education',
    iconName: 'graduation-cap',
    emoji:    '📚',
    color:    categoryColors.education,
    type:     'expense',
  },
  {
    key:      'other',
    label:    'Other',
    iconName: 'dots-three',
    emoji:    '💰',
    color:    categoryColors.other,
    type:     'both',
  },
  {
    key:      'income_salary',
    label:    'Salary',
    iconName: 'briefcase',
    emoji:    '💼',
    color:    categoryColors.income_salary,
    type:     'income',
  },
  {
    key:      'income_freelance',
    label:    'Freelance',
    iconName: 'laptop',
    emoji:    '💻',
    color:    categoryColors.income_freelance,
    type:     'income',
  },
  {
    key:      'income_other',
    label:    'Other Income',
    iconName: 'coins',
    emoji:    '💵',
    color:    categoryColors.income_other,
    type:     'income',
  },
] as const;

// Derived subsets
export const EXPENSE_CATEGORIES = CATEGORIES.filter(
  c => c.type === 'expense' || c.type === 'both',
);

export const INCOME_CATEGORIES = CATEGORIES.filter(
  c => c.type === 'income' || c.type === 'both',
);

// Lookup map for O(1) access by key
export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map(c => [c.key, c]),
) as Record<CategoryKey, CategoryMeta>;

/** Returns the CategoryMeta for a given key. Falls back to 'other'. */
export function getCategoryMeta(key: string): CategoryMeta {
  return CATEGORY_MAP[key as CategoryKey] ?? CATEGORY_MAP['other'];
}
