import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from 'react'

export interface Account {
  id: string
  email: string
  name: string
  phone: string
  lang: string
  emailVerified: boolean
  createdAt: string
}

export interface LessonEntry {
  id: string
  delta: number
  kind: 'purchase' | 'free' | 'used' | 'adjustment'
  note: string
  createdAt: string
}

export interface AccountBooking {
  id: string
  createdAt: string
  status: string
  plan: string
  genre: string
  date: string | null
  time: string
  noPreference: boolean
  dateLabel: string
  message: string
}

interface Overview {
  balance: number
  lessons: LessonEntry[]
  bookings: AccountBooking[]
}

interface AuthCtx extends Overview {
  user: Account | null
  /** Undefined until the first /me call settles — lets the UI avoid a flash. */
  ready: boolean
  refresh: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (data: SignUpData) => Promise<string | null>
  signOut: () => Promise<void>
  forgotPassword: (email: string) => Promise<string | null>
  resetPassword: (token: string, password: string) => Promise<string | null>
  verifyEmail: (token: string) => Promise<string | null>
  resendVerification: (email: string) => Promise<string | null>
}

export interface SignUpData {
  name: string
  email: string
  password: string
  phone: string
  lang: string
  consent: boolean
}

const EMPTY: Overview = { balance: 0, lessons: [], bookings: [] }

const Ctx = createContext<AuthCtx>({
  ...EMPTY,
  user: null,
  ready: false,
  refresh: async () => {},
  signIn: async () => null,
  signUp: async () => null,
  signOut: async () => {},
  forgotPassword: async () => null,
  resetPassword: async () => null,
  verifyEmail: async () => null,
  resendVerification: async () => null,
})

/** POSTs JSON and returns the server's error code, or null on success. */
async function post(action: string, body: unknown): Promise<string | null> {
  try {
    const res = await fetch(`/api/auth/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    return data.ok ? null : (data.error || 'server_error')
  } catch {
    return 'network_error'
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]   = useState<Account | null>(null)
  const [data, setData]   = useState<Overview>(EMPTY)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
      const body = await res.json()
      setUser(body.user ?? null)
      setData({
        balance:  body.balance  ?? 0,
        lessons:  body.lessons  ?? [],
        bookings: body.bookings ?? [],
      })
    } catch {
      setUser(null)
      setData(EMPTY)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const signIn = async (email: string, password: string) => {
    const error = await post('login', { email, password })
    if (!error) await refresh()
    return error
  }

  const signUp = async (payload: SignUpData) => post('register', payload)

  const signOut = async () => {
    await post('logout', {})
    setUser(null)
    setData(EMPTY)
  }

  const forgotPassword = (email: string) => post('forgot', { email })

  const resetPassword = async (token: string, password: string) => {
    const error = await post('reset', { token, password })
    if (!error) await refresh()
    return error
  }

  const verifyEmail = async (token: string) => {
    const error = await post('verify', { token })
    if (!error) await refresh()
    return error
  }

  const resendVerification = (email: string) => post('resend', { email })

  return (
    <Ctx.Provider value={{
      user, ready, ...data, refresh,
      signIn, signUp, signOut, forgotPassword, resetPassword, verifyEmail, resendVerification,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
