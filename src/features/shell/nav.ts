// Shared navigation model so App and Sidebar agree without a circular import. Navigation is
// plain local state (design D4): no router, no deep-links.

import {
  AccountIcon,
  AccountsIcon,
  CardsIcon,
  CategoriesIcon,
  DashboardIcon,
  InvestmentsIcon,
  RecurringIcon,
  TransactionsIcon,
  UpcomingIcon,
} from './NavIcons'

export type View =
  | 'dashboard'
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'recurring'
  | 'occurrences'
  | 'investments'
  | 'cards'
  | 'account'

export interface NavItem {
  id: View
  label: string
  Icon: () => React.JSX.Element
}

export const VIEWS: NavItem[] = [
  { id: 'dashboard', label: 'Visão geral', Icon: DashboardIcon },
  { id: 'accounts', label: 'Contas', Icon: AccountsIcon },
  { id: 'transactions', label: 'Transações', Icon: TransactionsIcon },
  { id: 'categories', label: 'Categorias', Icon: CategoriesIcon },
  { id: 'recurring', label: 'Recorrentes', Icon: RecurringIcon },
  { id: 'occurrences', label: 'Previstos', Icon: UpcomingIcon },
  { id: 'investments', label: 'Investimentos', Icon: InvestmentsIcon },
  { id: 'cards', label: 'Cartões', Icon: CardsIcon },
  { id: 'account', label: 'Conta', Icon: AccountIcon },
]
