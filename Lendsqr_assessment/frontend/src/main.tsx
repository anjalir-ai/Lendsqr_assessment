import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Copy,
  CreditCard,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  Wallet as WalletIcon
} from 'lucide-react';
import { api } from './api/client';
import type { Transaction, User, Wallet } from './types';
import './styles.css';

type Action = 'create' | 'login' | 'fund' | 'transfer' | 'withdraw' | 'refresh' | 'copy';
type Toast = { id: number; type: 'success' | 'error'; text: string };
type FieldErrors = Record<string, string>;
type RecentUser = Pick<User, 'id' | 'first_name' | 'last_name' | 'email'>;

const tokenStorageKey = 'demo-credit-token';
const recentUsersStorageKey = 'demo-credit-recent-users';

function currency(amount: number | string, code = 'NGN') {
  const value = typeof amount === 'string' ? Number(amount) : amount / 100;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: code }).format(Number.isFinite(value) ? value : 0);
}

function dateTime(value?: string) {
  if (!value) return 'Not synced yet';
  return new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function loadRecentUsers(): RecentUser[] {
  try {
    return JSON.parse(localStorage.getItem(recentUsersStorageKey) ?? '[]') as RecentUser[];
  } catch {
    return [];
  }
}

function App() {
  const [token, setToken] = useState(localStorage.getItem(tokenStorageKey) ?? '');
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>(loadRecentUsers);
  const [health, setHealth] = useState<'checking' | 'ok' | 'down'>('checking');
  const [lastUpdated, setLastUpdated] = useState('');
  const [busy, setBusy] = useState<Action | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [transferRecipient, setTransferRecipient] = useState('');

  const showToast = (type: Toast['type'], text: string) => {
    const id = Date.now();
    setToasts((items) => [...items, { id, type, text }]);
    window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4200);
  };

  const rememberUser = (createdUser: User) => {
    setRecentUsers((items) => {
      const next = [
        {
          id: createdUser.id,
          first_name: createdUser.first_name,
          last_name: createdUser.last_name,
          email: createdUser.email
        },
        ...items.filter((item) => item.id !== createdUser.id)
      ].slice(0, 5);
      localStorage.setItem(recentUsersStorageKey, JSON.stringify(next));
      return next;
    });
  };

  const refresh = async (activeToken = token) => {
    if (!activeToken) return;
    setBusy('refresh');
    try {
      const [me, walletResult, transactionResult] = await Promise.all([
        api.me(activeToken),
        api.wallet(activeToken),
        api.transactions(activeToken)
      ]);
      setUser(me.user);
      setWallet(walletResult.wallet);
      setTransactions(transactionResult.data);
      setLastUpdated(new Date().toISOString());
      localStorage.setItem(tokenStorageKey, activeToken);
      setFieldErrors({});
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to load account');
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.health();
        setHealth('ok');
      } catch {
        setHealth('down');
      }
    };

    void checkHealth();
    void refresh();
  }, []);

  const totals = useMemo(() => {
    return transactions.reduce(
      (summary, tx) => {
        if (tx.type === 'FUND' || tx.type === 'TRANSFER_IN') summary.inflow += tx.amount;
        if (tx.type === 'TRANSFER_OUT' || tx.type === 'WITHDRAWAL') summary.outflow += tx.amount;
        return summary;
      },
      { inflow: 0, outflow: 0 }
    );
  }, [transactions]);

  const validateAmount = (amount: string, field = 'amount') => {
    const value = Number(amount);
    if (!amount.trim()) return { [field]: 'Amount is required.' };
    if (!Number.isFinite(value) || value <= 0) return { [field]: 'Enter an amount greater than zero.' };
    return {};
  };

  const createAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      firstName: String(form.get('firstName') ?? '').trim(),
      lastName: String(form.get('lastName') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      phone: String(form.get('phone') ?? '').trim(),
      bvn: String(form.get('bvn') ?? '').trim()
    };
    const errors: FieldErrors = {};
    if (!values.firstName) errors.firstName = 'First name is required.';
    if (!values.lastName) errors.lastName = 'Last name is required.';
    if (!values.email.includes('@')) errors.email = 'Enter a valid email address.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setBusy('create');
    try {
      const result = await api.createUser(values);
      setToken(result.token);
      rememberUser(result.user);
      showToast('success', 'Account created. Faux token is ready.');
      await refresh(result.token);
      event.currentTarget.reset();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setBusy(null);
    }
  };

  const submitAmount = (action: 'fund' | 'withdraw') => async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amount = String(new FormData(event.currentTarget).get('amount') ?? '');
    const errors = validateAmount(amount, `${action}Amount`);
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setBusy(action);
    try {
      const result = action === 'fund' ? await api.fund(token, amount) : await api.withdraw(token, amount);
      setWallet(result.wallet);
      showToast('success', action === 'fund' ? 'Wallet funded.' : 'Withdrawal completed.');
      await refresh();
      event.currentTarget.reset();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setBusy(null);
    }
  };

  const transfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const recipientUserId = String(form.get('recipientUserId') ?? '').trim();
    const amount = String(form.get('amount') ?? '');
    const errors = { ...validateAmount(amount, 'transferAmount') };
    if (!recipientUserId) errors.recipientUserId = 'Recipient user ID is required.';
    if (recipientUserId && recipientUserId === user?.id) errors.recipientUserId = 'Choose another user as recipient.';
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      return;
    }

    setBusy('transfer');
    try {
      const result = await api.transfer(token, recipientUserId, amount, String(form.get('description') ?? ''));
      setWallet(result.wallet);
      showToast('success', 'Transfer completed.');
      setTransferRecipient('');
      await refresh();
      event.currentTarget.reset();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setBusy(null);
    }
  };

  const copyToken = async () => {
    if (!token) return;
    setBusy('copy');
    await navigator.clipboard.writeText(token);
    showToast('success', 'Token copied.');
    setBusy(null);
  };

  const actionLabel = (action: Action, idleLabel: string, loadingLabel: string) =>
    busy === action ? (
      <>
        <Loader2 className="spin" size={16} /> {loadingLabel}
      </>
    ) : (
      idleLabel
    );

  return (
    <main className="shell">
      <div className="toastStack">
        {toasts.map((toast) => (
          <div className={`toast ${toast.type}`} key={toast.id}>
            {toast.text}
          </div>
        ))}
      </div>

      <section className="hero">
        <div>
          <p className="eyebrow">Lendsqr assessment workspace</p>
          <h1>Demo Credit Wallet</h1>
          <p className="heroCopy">Create users, move funds, and inspect wallet activity from one reviewer-friendly fintech surface.</p>
        </div>
        <div className="statusStrip" aria-label="Service status">
          <span className={`statusBadge ${health === 'ok' ? 'good' : health === 'down' ? 'bad' : ''}`}>
            API: {health === 'ok' ? 'Connected' : health === 'down' ? 'Offline' : 'Checking'}
          </span>
          <span className={`statusBadge ${health === 'ok' ? 'good' : ''}`}>Database: {health === 'ok' ? 'Ready' : 'Waiting'}</span>
          <span className="statusBadge neutral">Adjutor: Configured</span>
          <button className="iconButton" onClick={() => refresh()} title="Refresh dashboard" disabled={busy === 'refresh'}>
            {busy === 'refresh' ? <Loader2 className="spin" size={18} /> : <RefreshCw size={18} />}
          </button>
        </div>
      </section>

      <section className="dashboard">
        <section className="balance">
          <div className="balanceTop">
            <span className="walletMark">
              <WalletIcon size={22} />
            </span>
            <span className="pill">Active wallet</span>
          </div>
          <span className="label">Available balance</span>
          <strong>{wallet ? currency(wallet.balanceMajor, wallet.currency) : currency(0)}</strong>
          <div className="balanceMeta">
            <span>Currency: {wallet?.currency ?? 'NGN'}</span>
            <span>Last updated: {dateTime(lastUpdated)}</span>
          </div>
          <div className="moneyFlow">
            <span>
              <ArrowDownLeft size={16} /> Inflow {currency(totals.inflow, wallet?.currency)}
            </span>
            <span>
              <ArrowUpRight size={16} /> Outflow {currency(totals.outflow, wallet?.currency)}
            </span>
          </div>
        </section>

        <section className="panel sessionPanel">
          <div className="panelHeader">
            <h2>
              <UserRound size={18} /> Session
            </h2>
            {user && <span className="pill soft">Faux login</span>}
          </div>
          <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste user id token" />
          <div className="row">
            <button onClick={() => refresh()} disabled={!token || busy !== null}>
              {actionLabel('login', 'Load User', 'Loading')}
            </button>
            <button className="secondary" onClick={copyToken} disabled={!token || busy !== null} title="Copy token">
              <Copy size={16} /> Copy token
            </button>
          </div>
          <div className="sessionDetails">
            <span>Name</span>
            <strong>{user ? `${user.first_name} ${user.last_name}` : 'No user loaded'}</strong>
            <span>Email</span>
            <strong>{user?.email ?? 'Use a token or create an account'}</strong>
            <span>User ID / token</span>
            <code>{user?.id ?? (token || 'Not available')}</code>
            <span>Wallet ID</span>
            <code>{wallet?.id ?? 'Not available'}</code>
          </div>
        </section>
      </section>

      <section className="grid">
        <form className="panel" onSubmit={createAccount} noValidate>
          <h2>
            <ShieldCheck size={18} /> Create Account
          </h2>
          <Field name="firstName" placeholder="First name" error={fieldErrors.firstName} />
          <Field name="lastName" placeholder="Last name" error={fieldErrors.lastName} />
          <Field name="email" type="email" placeholder="Email" error={fieldErrors.email} />
          <Field name="phone" placeholder="Phone" />
          <Field name="bvn" placeholder="BVN or identity" />
          <button type="submit" disabled={busy !== null}>
            {actionLabel('create', 'Create Account', 'Creating')}
          </button>
        </form>

        <section className="panel recentPanel">
          <h2>Recent Created Users</h2>
          {recentUsers.length === 0 ? (
            <p className="muted">Create two users, then pick one here as the transfer recipient.</p>
          ) : (
            <div className="recentList">
              {recentUsers.map((item) => (
                <button
                  className="recentUser"
                  disabled={item.id === user?.id}
                  key={item.id}
                  onClick={() => setTransferRecipient(item.id)}
                  type="button"
                >
                  <span>
                    <strong>{item.first_name} {item.last_name}</strong>
                    <small>{item.email}</small>
                  </span>
                  <em>{item.id === user?.id ? 'Current' : 'Use as recipient'}</em>
                </button>
              ))}
            </div>
          )}
        </section>

        <form className="panel compact" onSubmit={submitAmount('fund')} noValidate>
          <h2>
            <CreditCard size={18} /> Fund
          </h2>
          <Field name="amount" placeholder="Amount" error={fieldErrors.fundAmount} />
          <button type="submit" disabled={!token || busy !== null}>
            {actionLabel('fund', 'Fund Wallet', 'Funding')}
          </button>
        </form>

        <form className="panel compact" onSubmit={transfer} noValidate>
          <h2>
            <Send size={18} /> Transfer
          </h2>
          <Field
            name="recipientUserId"
            placeholder="Recipient user id"
            value={transferRecipient}
            onChange={(event) => setTransferRecipient(event.target.value)}
            error={fieldErrors.recipientUserId}
          />
          <Field name="amount" placeholder="Amount" error={fieldErrors.transferAmount} />
          <Field name="description" placeholder="Description" />
          <button type="submit" disabled={!token || busy !== null}>
            {actionLabel('transfer', 'Transfer', 'Transferring')}
          </button>
        </form>

        <form className="panel compact" onSubmit={submitAmount('withdraw')} noValidate>
          <h2>Withdraw</h2>
          <Field name="amount" placeholder="Amount" error={fieldErrors.withdrawAmount} />
          <button type="submit" disabled={!token || busy !== null}>
            {actionLabel('withdraw', 'Withdraw', 'Withdrawing')}
          </button>
        </form>
      </section>

      <section className="tablePanel">
        <div className="panelHeader">
          <h2>Transactions</h2>
          <span className="muted">{transactions.length} shown</span>
        </div>
        {transactions.length === 0 ? (
          <div className="emptyState">
            <CheckCircle2 size={26} />
            <strong>No transactions yet.</strong>
            <p>Create an account, fund the wallet, then try a transfer or withdrawal.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Reference</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>{dateTime(tx.created_at)}</td>
                  <td>
                    <span className={`typeBadge ${tx.type.toLowerCase()}`}>{tx.type}</span>
                  </td>
                  <td>{currency(tx.amount, wallet?.currency)}</td>
                  <td>
                    <span className="statusBadge good">{tx.status}</span>
                  </td>
                  <td>
                    <code>{tx.reference}</code>
                  </td>
                  <td>{tx.description ?? 'No description'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const { error, ...inputProps } = props;
  return (
    <label className="field">
      <input {...inputProps} aria-invalid={Boolean(error)} />
      {error && <span>{error}</span>}
    </label>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
