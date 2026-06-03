// The app is 100% behind authentication. There is no public landing screen: the
// first protected load (the transactions screen) acts as the auth gate — a 401 is
// handled centrally by the HTTP client (redirect to GET /api/auth/login).
import { TransactionsScreen } from './features/transactions/TransactionsScreen'

export default function App() {
  return <TransactionsScreen />
}
