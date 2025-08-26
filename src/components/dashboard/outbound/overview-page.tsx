"use client"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  Phone,
  Users,
  BarChart3,
  Home,
  Clock,
  Activity,
  Menu,
  CloverIcon as CloseIcon,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  type TooltipProps,
} from "recharts"
import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

/* ---------------- Toast ---------------- */
const ToastProvider = ToastPrimitives.Provider

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return <ToastPrimitives.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...props} />
})
Toast.displayName = ToastPrimitives.Root.displayName

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  variant?: "default" | "destructive"
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

interface State {
  toasts: ToasterToast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({ type: "REMOVE_TOAST", toastId })
  }, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case "UPDATE_TOAST":
      return { ...state, toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)) }
    case "DISMISS_TOAST": {
      const { toastId } = action
      if (toastId) addToRemoveQueue(toastId)
      else state.toasts.forEach((toast) => addToRemoveQueue(toast.id))
      return {
        ...state,
        toasts: state.toasts.map((t) => (t.id === toastId || toastId === undefined ? { ...t, open: false } : t)),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] }
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
  }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function toast({ ...props }: Omit<ToasterToast, "id">) {
  const id = genId()
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })
  return { id, dismiss }
}

function useToast() {
  const [state, setState] = React.useState<State>(memoryState)
  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])
  return { ...state, toast }
}

const Toaster = React.memo(() => {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
})
Toaster.displayName = "Toaster"

/* --------------- Tipi --------------- */
interface CampaignData {
  id: string
  campaignName: string
  outboundId: string
  bearerToken: string
  userId: string
  createdAt: string
  updatedAt: string
}

interface AnalyticsData {
  callsStatusOverview: {
    totalCalls: number
    totalLeads: number
    needRetry: number
    wrongCountryCode: number
    needFollowUp: number
    voiceMailLeft: number
    successful: number
    unsuccessful: number
    wrongNumber: number
    completed: number
    unreachable: number
    error: number
  }
  callsSentimentOverview: {
    negative: number
    slightlyNegative: number
    neutral: number
    slightlyPositive: number
    positive: number
  }
  callsStatusTimeLine: Array<{
    totalCalls: number
    totalLeads: number
    needRetry: number
    wrongCountryCode: number
    needFollowUp: number
    voiceMailLeft: number
    successful: number
    unsuccessful: number
    wrongNumber: number
    completed: number
    unreachable: number
    error: number
    date: string
  }>
  callsAverageTimeLine: Array<{ date: string; averageCallDuration: number }>
  callsCostTimeLine: Array<{ date: string; totalPrice: number; averageCostPerCall: number }>
  callsPickupRateTimeLine: Array<{ date: string; pickupRatePercentage: number }>
  callsSuccessRateTimeLine: Array<{ date: string; successRatePercentage: number }>
  callLabelCount: Array<{ id: string; name: string; color: string; count: number }>
  callEventsCounts: {
    takeMessageCount: number
    smsSentCount: number
    callTransferredCount: number
    calendarBookedCount: number
    emailSentCount: number
  }
  callsByHourDayOfWeeks: Array<{ hourOfDay: number; dayOfWeek: number; count: number }>
  callsTimeline: Array<{
    date: string
    totalCalls: number
    successful: number
  }>
}

/* -------- LocalStorage helpers -------- */
const STORAGE_KEYS = {
  BEARER_TOKEN: "analytics_bearer_token",
  OUTBOUND_ID: "analytics_outbound_id",
  CAMPAIGN_ID: "analytics_campaign_id",
}

const saveToLocalStorage = (key: string, value: string) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) localStorage.setItem(key, value)
  } catch {}
}
const getFromLocalStorage = (key: string): string | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) return localStorage.getItem(key)
  } catch {}
  return null
}
const removeFromLocalStorage = (key: string) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) localStorage.removeItem(key)
  } catch {}
}
const clearAnalyticsStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => removeFromLocalStorage(key))
}

/* --------------- Costanti --------------- */
const API_BASE_URL = "https://whitelabel-server.onrender.com"
const ANALYTICS_API_BASE_URL = "https://api.nlpearl.ai/v1"

const OUR_CALL_RATE_PER_MIN = 0.4 // $ al minuto
const OUR_SMS_RATE = 0.16 as const
void OUR_SMS_RATE

const getDefaultDateRange = () => {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return { from: from.toISOString(), to: to.toISOString() }
}

const SENTIMENT_COLORS = {
  positive: "#22c55e",
  slightlyPositive: "#84cc16",
  neutral: "#6b7280",
  slightlyNegative: "#f59e0b",
  negative: "#ef4444",
}

/* Sidebar (3 tab) */
const sidebarItems = [
  { id: "overview", label: "Panoramica", icon: Home },
  { id: "timeline", label: "Cronologia", icon: Clock },
  { id: "performance", label: "Analisi", icon: Activity },
]

const priceTooltipFormatter: NonNullable<TooltipProps<number, string>["formatter"]> = (value, name, item) => {
  const dataKey = (item as { dataKey?: string } | undefined)?.dataKey
  const isTotal = dataKey === "totalPrice"
  const formatted = isTotal ? `$${(value as number).toFixed(2)}` : `$${(value as number).toFixed(3)}`
  return [formatted, String(name)]
}

/* ---- Helper date per preset ---- */
type PresetKey = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "customDays"

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
const mondayOfWeek = (d: Date) => {
  const tmp = new Date(d)
  const day = tmp.getDay() // 0..6 dom..sab
  const diff = (day === 0 ? -6 : 1) - day // torna a lunedì
  tmp.setDate(tmp.getDate() + diff)
  return startOfDay(tmp)
}
const sundayOfWeek = (d: Date) => {
  const m = mondayOfWeek(d)
  const s = new Date(m)
  s.setDate(m.getDate() + 6)
  return endOfDay(s)
}
function buildRange(preset: PresetKey, customDays?: number) {
  const now = new Date()
  let from: Date, to: Date
  switch (preset) {
    case "today":
      from = startOfDay(now)
      to = endOfDay(now)
      break
    case "yesterday": {
      const y = new Date(now)
      y.setDate(now.getDate() - 1)
      from = startOfDay(y)
      to = endOfDay(y)
      break
    }
    case "thisWeek":
      from = mondayOfWeek(now)
      to = endOfDay(now)
      break
    case "lastWeek": {
      const lastWeekRef = new Date(mondayOfWeek(now))
      lastWeekRef.setDate(lastWeekRef.getDate() - 7)
      from = lastWeekRef
      to = sundayOfWeek(lastWeekRef)
      break
    }
    case "thisMonth":
      from = startOfMonth(now)
      to = endOfDay(now)
      break
    case "customDays": {
      const days = Math.max(1, Number(customDays || 1))
      to = endOfDay(now)
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)))
      break
    }
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

/* === Dizionari etichette (traduzioni chiavi API) === */
const STATUS_LABELS: Record<string, string> = {
  totalCalls: "Chiamate totali",
  totalLeads: "Lead totali",
  needRetry: "Da riprovare",
  wrongCountryCode: "Prefisso paese errato",
  needFollowUp: "Da ricontattare",
  voiceMailLeft: "Messaggio in segreteria",
  successful: "Riuscite",
  unsuccessful: "Non riuscite",
  wrongNumber: "Numero errato",
  completed: "Completate",
  unreachable: "Irraggiungibili",
  error: "Errore",
}

const EVENT_LABELS: Record<string, string> = {
  takeMessageCount: "Ha preso messaggio",
  smsSentCount: "SMS inviati",
  callTransferredCount: "Chiamate trasferite",
  calendarBookedCount: "Appuntamenti a calendario",
  emailSentCount: "Email inviate",
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: "Positivo",
  slightlyPositive: "Leggermente positivo",
  neutral: "Neutro",
  slightlyNegative: "Leggermente negativo",
  negative: "Negativo",
}

/* ============== Componente ============== */
const OverviewPage = () => {
  const { user, isLoaded } = useUser()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState<CampaignData[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignData | null>(null)

  // tre bucket (panoramica, analisi, cronologia)
  const [analyticsOverviewData, setAnalyticsOverviewData] = useState<AnalyticsData | null>(null)
  const [analyticsPerfData, setAnalyticsPerfData] = useState<AnalyticsData | null>(null)
  const [analyticsTimelineData, setAnalyticsTimelineData] = useState<AnalyticsData | null>(null)

  const [loading, setLoading] = useState(false)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dateRange] = useState(getDefaultDateRange())
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // --- stati ON/OFF ---
  const [isCampaignOn, setIsCampaignOn] = useState<boolean | null>(null)
  const [isCampaignChecking, setIsCampaignChecking] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // --- filtro unico Prestazioni ---
  const [perfPreset, setPerfPreset] = useState<PresetKey>("thisMonth")
  const [perfCustomDays, setPerfCustomDays] = useState<string>("")
  const [perfCustomFrom, setPerfCustomFrom] = useState<string>("")
  const [perfCustomTo, setPerfCustomTo] = useState<string>("")

  // --- Cronologia (preset + giorni personalizzati) ---
  const [timePreset, setTimePreset] = useState<PresetKey>("thisMonth")
  const [timeCustomDays, setTimeCustomDays] = useState<string>("")

  /* ---- Verifica stato campagna ---- */
  const fetchOutboundActive = useCallback(
    async (outboundId: string, bearerToken: string) => {
      setIsCampaignChecking(true)
      try {
        const res = await fetch(`${ANALYTICS_API_BASE_URL}/Outbound/${outboundId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${bearerToken.replace("Bearer ", "")}`,
            "Content-Type": "application/json",
          },
        })
        if (!res.ok) {
          let msg = `Recupero stato non riuscito (${res.status})`
          if (res.status === 401) msg = "Bearer token non valido."
          if (res.status === 403) msg = "Accesso negato."
          if (res.status === 404) msg = "Outbound ID non trovato."
          throw new Error(msg)
        }
        const data = await res.json()
        const status: number | undefined = data?.status
        if (status === 1) {
          setIsCampaignOn(true)
          return true
        } else if (status === 2) {
          setIsCampaignOn(false)
          return false
        } else {
          setIsCampaignOn(null)
          toast({
            title: "Stato sconosciuto",
            description: `Ricevuto status=${String(status)}. Atteso 1 (ON) o 2 (OFF).`,
            variant: "destructive",
          })
          return null
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Impossibile leggere lo stato della campagna."
        toast({ title: "Verifica stato non riuscita", description: msg, variant: "destructive" })
        setIsCampaignOn(null)
        return null
      } finally {
        setIsCampaignChecking(false)
      }
    },
    [toast],
  )

  /* ---- Endpoint toggle ---- */
  const toggleOutboundActive = useCallback(async (outId: string, token: string, isActive: boolean) => {
    const response = await fetch(`${ANALYTICS_API_BASE_URL}/Outbound/${outId}/Active`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token.replace("Bearer ", "")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    })
    if (!response.ok) {
      let errorMessage = "Impossibile attivare/disattivare la campagna."
      switch (response.status) {
        case 401:
          errorMessage = "Bearer token non valido."
          break
        case 403:
          errorMessage = "Accesso negato."
          break
        case 404:
          errorMessage = "Outbound ID non trovato."
          break
        case 400:
          errorMessage = "Body della richiesta non valido."
          break
        case 500:
          errorMessage = "Errore del server."
          break
        default:
          errorMessage = `Errore API (${response.status}).`
      }
      throw new Error(errorMessage)
    }
  }, [])

  /* ---- Toggle ottimistico ---- */
  const handleCampaign = useCallback(async () => {
    if (!selectedCampaign) {
      toast({ title: "Credenziali mancanti", description: "Seleziona prima una campagna.", variant: "destructive" })
      return
    }
    if (isToggling || isCampaignChecking || isCampaignOn === null) return

    const next = !isCampaignOn
    setIsCampaignOn(next)
    setIsToggling(true)
    try {
      await toggleOutboundActive(selectedCampaign.outboundId, selectedCampaign.bearerToken, next)
      toast({
        title: next ? "Campagna attivata" : "Campagna disattivata",
        description: `Outbound ${selectedCampaign.outboundId} ora è ${next ? "attiva" : "inattiva"}.`,
      })
    } catch (err) {
      setIsCampaignOn(!next)
      const msg = err instanceof Error ? err.message : "Errore inatteso."
      toast({ title: "Toggle non riuscito", description: msg, variant: "destructive" })
    } finally {
      setIsToggling(false)
    }
  }, [selectedCampaign, isCampaignOn, isToggling, isCampaignChecking, toggleOutboundActive, toast])

  /* ---- Memo ---- */
  const userEmail = useMemo(() => user?.emailAddresses?.[0]?.emailAddress || "", [user?.emailAddresses])


  // Timeline costi derivata dal dataset prestazioni
  const ourCostTimelinePerf = useMemo(() => {
    const src = analyticsPerfData
    if (!src) return []
    const avgMap = new Map((src.callsAverageTimeLine || []).map((d) => [d.date, d.averageCallDuration]))
    const callMap = new Map((src.callsStatusTimeLine || []).map((d) => [d.date, d.totalCalls]))
    const dates = Array.from(new Set([...avgMap.keys(), ...callMap.keys()])).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime(),
    )
    return dates.map((date) => {
      const avgSec = avgMap.get(date) ?? 0
      const calls = callMap.get(date) ?? 0
      const avgMin = avgSec / 60
      const averageCostPerCall = +(avgMin * OUR_CALL_RATE_PER_MIN).toFixed(3)
      const totalPrice = +(calls * averageCostPerCall).toFixed(2)
      return { date, totalPrice, averageCostPerCall }
    })
  }, [analyticsPerfData])

  /* ---- Fetchers ---- */
  const getAnalytics = useCallback(
    async (
      outboundId: string,
      bearerToken: string,
      range: { from: string; to: string },
      campaignIdToPersist?: string,
    ) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      try {
        const response = await fetch(`${ANALYTICS_API_BASE_URL}/Outbound/${outboundId}/Analytics`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${bearerToken.replace("Bearer ", "")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ from: range.from, to: range.to }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          let errorMessage = "Impossibile recuperare i dati analitici."
          switch (response.status) {
            case 401:
              errorMessage = "Bearer token non valido. Controlla le credenziali di autenticazione."
              break
            case 403:
              errorMessage = "Accesso negato. Il bearer token potrebbe non avere i permessi."
              break
            case 404:
              errorMessage = "Outbound ID non trovato. Verifica che l'ID sia corretto."
              break
            case 400:
              errorMessage = "Richiesta non valida. Controlla Outbound ID e bearer token."
              break
            case 500:
              errorMessage = "Errore del server. Riprova più tardi."
              break
            default:
              errorMessage = `Errore API (${response.status}). Controlla le credenziali e riprova.`
          }
          throw new Error(errorMessage)
        }
        const data: AnalyticsData = await response.json()

        // Persistenza credenziali
        saveToLocalStorage(STORAGE_KEYS.BEARER_TOKEN, bearerToken)
        saveToLocalStorage(STORAGE_KEYS.OUTBOUND_ID, outboundId)
        if (campaignIdToPersist) saveToLocalStorage(STORAGE_KEYS.CAMPAIGN_ID, campaignIdToPersist)

        return data
      } catch (error) {
        let errorMessage = "Si è verificato un errore inatteso."
        if (error instanceof Error) {
          if (error.name === "AbortError") errorMessage = "Richiesta analitiche scaduta. Riprova."
          else errorMessage = error.message
        }
        toast({ title: "Errore analitiche", description: errorMessage, variant: "destructive" })
        if (
          error instanceof Error &&
          (error.message.includes("Bearer token non valido") ||
            error.message.includes("Accesso negato") ||
            error.message.includes("Outbound ID non trovato"))
        ) {
          clearAnalyticsStorage()
        }
        throw error
      }
    },
    [toast],
  )

  const fetchCampaigns = useCallback(
    async (email: string, showLoader = true) => {
      if (!email) return
      if (showLoader) setLoading(true)
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000)
        const response = await fetch(`${API_BASE_URL}/users/email/${encodeURIComponent(email)}/userdata`, {
          signal: controller.signal,
          headers: { "Cache-Control": "no-cache" },
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          if (response.status === 404) {
            setCampaigns([])
            setSelectedCampaign(null)
            toast({
              title: "Nessuna campagna trovata",
              description: "Non ci sono campagne associate a questa email.",
              variant: "destructive",
            })
            return []
          }
          throw new Error(`Errore HTTP! stato: ${response.status}`)
        }

        const data: CampaignData[] = await response.json()
        const campaignsArray = Array.isArray(data) ? data : []
        setCampaigns(campaignsArray)

        if (campaignsArray.length > 0) {
          const savedCampaignId = getFromLocalStorage(STORAGE_KEYS.CAMPAIGN_ID)
          const existingCampaign = savedCampaignId ? campaignsArray.find((c) => c.id === savedCampaignId) : null
          const campaignToSelect = existingCampaign || campaignsArray[0]

          setSelectedCampaign(campaignToSelect)

          // Popola tutti i bucket
          setAnalyticsLoading(true)
          const initial = await getAnalytics(
            campaignToSelect.outboundId,
            campaignToSelect.bearerToken,
            dateRange,
            campaignToSelect.id,
          )
          setAnalyticsOverviewData(initial)
          setAnalyticsPerfData(initial)
          setAnalyticsTimelineData(initial)
          setAnalyticsLoading(false)

          fetchOutboundActive(campaignToSelect.outboundId, campaignToSelect.bearerToken)
        } else {
          toast({ title: "Nessuna campagna trovata", description: "Non ci sono campagne per questa email." })
        }

        return campaignsArray
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.name === "AbortError"
              ? "Richiesta scaduta. Riprova."
              : "Recupero campagne non riuscito. Riprova."
            : "Si è verificato un errore inatteso."
        toast({ title: "Errore", description: errorMessage, variant: "destructive" })
        setCampaigns([])
        setSelectedCampaign(null)
        return []
      } finally {
        if (showLoader) setLoading(false)
      }
    },
    [toast, fetchOutboundActive, getAnalytics, dateRange],
  )

  const handleCampaignChange = useCallback(
    async (campaignId: string) => {
      const campaign = campaigns.find((c) => c.id === campaignId)
      if (campaign) {
        setSelectedCampaign(campaign)
        setAnalyticsLoading(true)
        const initial = await getAnalytics(campaign.outboundId, campaign.bearerToken, dateRange, campaign.id)
        setAnalyticsOverviewData(initial)
        setAnalyticsPerfData(initial)
        setAnalyticsTimelineData(initial)
        setAnalyticsLoading(false)
        fetchOutboundActive(campaign.outboundId, campaign.bearerToken)
      }
    },
    [campaigns, fetchOutboundActive, getAnalytics, dateRange],
  )

  const handleRefresh = useCallback(async () => {
    const userEmailLocal = userEmail
    if (!userEmailLocal || refreshing) return
    setRefreshing(true)
    const campaignsData = await fetchCampaigns(userEmailLocal, false)
    if (campaignsData && campaignsData.length > 0 && selectedCampaign) {
      const updatedCampaign = campaignsData.find((c) => c.id === selectedCampaign.id) || campaignsData[0]
      setAnalyticsLoading(true)
      const initial = await getAnalytics(
        updatedCampaign.outboundId,
        updatedCampaign.bearerToken,
        dateRange,
        updatedCampaign.id,
      )
      setAnalyticsOverviewData(initial)
      setAnalyticsPerfData(initial)
      setAnalyticsTimelineData(initial)
      setAnalyticsLoading(false)
      await fetchOutboundActive(updatedCampaign.outboundId, updatedCampaign.bearerToken)
    }
    setRefreshing(false)
    toast({ title: "Aggiornato", description: "I dati sono stati aggiornati." })
  }, [userEmail, refreshing, fetchCampaigns, selectedCampaign, getAnalytics, dateRange, fetchOutboundActive, toast])

  /* ---- Effetti ---- */
  useEffect(() => {
    if (isLoaded && userEmail) {
      fetchCampaigns(userEmail)
    }
  }, [isLoaded, userEmail, fetchCampaigns])

  useEffect(() => {
    if (isLoaded && campaigns.length > 0) {
      const savedCampaignId = getFromLocalStorage(STORAGE_KEYS.CAMPAIGN_ID)
      const savedBearerToken = getFromLocalStorage(STORAGE_KEYS.BEARER_TOKEN)
      const savedOutboundId = getFromLocalStorage(STORAGE_KEYS.OUTBOUND_ID)

      if (savedCampaignId && savedBearerToken && savedOutboundId) {
        const matchingCampaign = campaigns.find(
          (campaign) =>
            campaign.id === savedCampaignId &&
            campaign.bearerToken === savedBearerToken &&
            campaign.outboundId === savedOutboundId,
        )

        if (matchingCampaign && (!selectedCampaign || selectedCampaign.id !== matchingCampaign.id)) {
          setSelectedCampaign(matchingCampaign)
          ;(async () => {
            setAnalyticsLoading(true)
            const initial = await getAnalytics(
              matchingCampaign.outboundId,
              matchingCampaign.bearerToken,
              dateRange,
              matchingCampaign.id,
            )
            setAnalyticsOverviewData(initial)
            setAnalyticsPerfData(initial)
            setAnalyticsTimelineData(initial)
            setAnalyticsLoading(false)
          })()
          fetchOutboundActive(matchingCampaign.outboundId, matchingCampaign.bearerToken)
        }
      }
    }
  }, [isLoaded, campaigns, selectedCampaign, getAnalytics, dateRange, fetchOutboundActive])

  useEffect(() => {
    if (!selectedCampaign) setIsCampaignOn(null)
  }, [selectedCampaign])

  const clearStoredCredentials = useCallback(() => {
    clearAnalyticsStorage()
    toast({ title: "Pulito", description: "Le credenziali memorizzate sono state eliminate." })
  }, [toast])

  /* --------- Toolbar CRONOLOGIA --------- */
  const RangeToolbarTimeline = ({
    preset,
    customDays,
    setCustomDays,
    onApply,
  }: {
    preset: PresetKey
    customDays: string
    setCustomDays: (v: string) => void
    onApply: (p: PresetKey, n?: number) => void
  }) => {
    const Btn = ({ p, label }: { p: PresetKey; label: string }) => (
      <Button size="sm" variant={preset === p ? "default" : "outline"} onClick={() => onApply(p)}>
        {label}
      </Button>
    )
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Btn p="today" label="Oggi" />
        <Btn p="yesterday" label="Ieri" />
        <Btn p="thisWeek" label="Questa settimana" />
        <Btn p="lastWeek" label="Settimana scorsa" />
        <Btn p="thisMonth" label="Questo mese" />
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            placeholder="giorni fino a oggi"
            className="h-9 w-48 rounded-md border px-2 text-sm"
            value={customDays}
            onChange={(e) => setCustomDays(e.target.value.replace(/[^\d]/g, ""))}
          />
          <Button size="sm" onClick={() => onApply("customDays", Number(customDays))}>
            Applica
          </Button>
        </div>
      </div>
    )
  }

  /* --------- Applica CRONOLOGIA --------- */
  const applyTimelineRange = useCallback(
    async (preset: PresetKey, customDays?: number) => {
      if (!selectedCampaign) return toast({ title: "Seleziona prima una campagna.", variant: "destructive" })
      setTimePreset(preset)
      if (preset === "customDays" && (!customDays || customDays <= 0)) {
        toast({
          title: "Giorni personalizzati richiesti",
          description: "Inserisci un numero positivo di giorni.",
          variant: "destructive",
        })
        return
      }
      const range = buildRange(preset, customDays)
      setAnalyticsLoading(true)
      const data = await getAnalytics(
        selectedCampaign.outboundId,
        selectedCampaign.bearerToken,
        range,
        selectedCampaign.id,
      )
      setAnalyticsTimelineData(data)
      setAnalyticsLoading(false)
      toast({ title: "Cronologia aggiornata", description: "Intervallo temporale applicato." })
    },
    [getAnalytics, selectedCampaign, toast],
  )

  /* --------- Prestazioni: Applica/Reimposta --------- */
  const applyPerformanceFilter = useCallback(async () => {
    if (!selectedCampaign) return toast({ title: "Seleziona prima una campagna.", variant: "destructive" })

    // Priorità: Da–A esplicito -> Giorni personalizzati -> Preset
    let range: { from: string; to: string } | null = null

    if (perfCustomFrom && perfCustomTo) {
      const from = new Date(perfCustomFrom)
      const to = new Date(perfCustomTo)
      if (from > to) {
        toast({ title: "Intervallo non valido", description: "La data di inizio deve precedere la fine.", variant: "destructive" })
        return
      }
      const fromISO = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0, 0).toISOString()
      const toISO = new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999).toISOString()
      range = { from: fromISO, to: toISO }
    } else if (perfCustomDays) {
      const n = Number(perfCustomDays)
      if (!Number.isFinite(n) || n <= 0) {
        toast({ title: "Giorni non validi", description: "Inserisci un numero positivo di giorni.", variant: "destructive" })
        return
      }
      range = buildRange("customDays", n)
      setPerfPreset("customDays")
    } else {
      range = buildRange(perfPreset)
    }

    setAnalyticsLoading(true)
    const data = await getAnalytics(
      selectedCampaign.outboundId,
      selectedCampaign.bearerToken,
      range!,
      selectedCampaign.id,
    )
    setAnalyticsPerfData(data)
    setAnalyticsLoading(false)
    toast({ title: "Prestazioni aggiornate", description: "Intervallo applicato a tutte le widget." })
  }, [selectedCampaign, perfPreset, perfCustomDays, perfCustomFrom, perfCustomTo, getAnalytics, toast])

  const resetPerformanceFilter = useCallback(async () => {
    setPerfPreset("thisMonth")
    setPerfCustomDays("")
    setPerfCustomFrom("")
    setPerfCustomTo("")

    if (!selectedCampaign) return
    setAnalyticsLoading(true)
    const data = await getAnalytics(
      selectedCampaign.outboundId,
      selectedCampaign.bearerToken,
      buildRange("thisMonth"),
      selectedCampaign.id,
    )
    setAnalyticsPerfData(data)
    setAnalyticsLoading(false)
    toast({ title: "Prestazioni ripristinate", description: "Tornato a Questo mese." })
  }, [selectedCampaign, getAnalytics, toast])

  /* ---- Loading gates ---- */
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Caricamento...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[100svh]">
        <div className="text-center px-4">
          <h2 className="text-xl font-semibold mb-2">Autenticazione richiesta</h2>
          <p className="text-gray-600">Accedi per continuare.</p>
        </div>
      </div>
    )
  }

  /* ---- Renderer contenuto ---- */
  const renderContent = () => {
    if (!analyticsOverviewData && activeSection === "overview") {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500 mb-4">Nessun dato analitico disponibile.</p>
            <Button
              onClick={async () => {
                if (selectedCampaign) {
                  setAnalyticsLoading(true)
                  const d = await getAnalytics(
                    selectedCampaign.outboundId,
                    selectedCampaign.bearerToken,
                    dateRange,
                    selectedCampaign.id,
                  )
                  setAnalyticsOverviewData(d)
                  setAnalyticsPerfData(d)
                  setAnalyticsTimelineData(d)
                  setAnalyticsLoading(false)
                }
              }}
            >
              Carica analitiche
            </Button>
          </CardContent>
        </Card>
      )
    }

    switch (activeSection) {
      case "overview": {
        const data = analyticsOverviewData!
        return (
          <div className="space-y-4 lg:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium">Chiamate totali</CardTitle>
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold">
                    {data.callsStatusOverview.totalCalls.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium">Lead totali</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold">
                    {data.callsStatusOverview.totalLeads.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium">Riuscite</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold text-green-600">
                    {data.callsStatusOverview.successful.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card className="min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs lg:text-sm font-medium">Completate</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl lg:text-2xl font-bold">
                    {data.callsStatusOverview.completed.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-base lg:text-lg">Panoramica stato chiamate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(data.callsStatusOverview).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm">
                          {STATUS_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-medium text-sm lg:text-base">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle className="text-base lg:text-lg">Conteggi eventi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(data.callEventsCounts).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-xs lg:text-sm">
                          {EVENT_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        <span className="font-medium text-sm lg:text-base">{value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      case "timeline": {
        const data = analyticsTimelineData
        if (!data) return null
        return (
          <div className="space-y-6">
            <Card className="min-w-0">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>Cronologia chiamate</CardTitle>
                    <CardDescription>Chiamate e lead nel tempo</CardDescription>
                  </div>
                  <RangeToolbarTimeline
                    preset={timePreset}
                    customDays={timeCustomDays}
                    setCustomDays={setTimeCustomDays}
                    onApply={applyTimelineRange}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] sm:h-[250px] lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.callsStatusTimeLine}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalCalls"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Chiamate totali"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="totalLeads"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Lead totali"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader>
                <CardTitle>Durata media chiamate</CardTitle>
                <CardDescription>Durata media nel tempo (minuti)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[220px] sm:h-[250px] lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.callsAverageTimeLine}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(Number(v) / 60)}m`} />
                      <Tooltip
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        formatter={(v) => [`${Math.round(Number(v) / 60)} minuti`, "Durata media"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageCallDuration"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Durata media"
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      }

      case "performance": {
        const data = analyticsPerfData
        if (!data) return null
        return (
          <div className="space-y-6">
            {/* Barra filtro unificata */}
            <Card className="min-w-0">
              <CardHeader className="space-y-2">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
                  <div>
                    <CardTitle>Prestazioni</CardTitle>
                    <CardDescription>Un unico filtro temporale controlla tutti i grafici</CardDescription>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        { key: "today", label: "Oggi" },
                        { key: "yesterday", label: "Ieri" },
                        { key: "thisWeek", label: "Questa settimana" },
                        { key: "lastWeek", label: "Settimana scorsa" },
                        { key: "thisMonth", label: "Questo mese" },
                      ] as { key: PresetKey; label: string }[]
                    ).map((p) => (
                      <Button
                        key={p.key}
                        size="sm"
                        variant={perfPreset === p.key ? "default" : "outline"}
                        onClick={() => setPerfPreset(p.key)}
                      >
                        {p.label}
                      </Button>
                    ))}

                    {/* Giorni personalizzati */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        placeholder="giorni fino a oggi"
                        className="h-9 w-40 rounded-md border px-2 text-sm"
                        value={perfCustomDays}
                        onChange={(e) => setPerfCustomDays(e.target.value.replace(/[^\d]/g, ""))}
                      />
                    </div>

                    {/* Da - A */}
                    <input
                      type="date"
                      className="h-9 rounded-md border px-2 text-sm"
                      value={perfCustomFrom}
                      onChange={(e) => setPerfCustomFrom(e.target.value)}
                    />
                    <span className="text-xs text-gray-500">a</span>
                    <input
                      type="date"
                      className="h-9 rounded-md border px-2 text-sm"
                      value={perfCustomTo}
                      onChange={(e) => setPerfCustomTo(e.target.value)}
                    />

                    <Button size="sm" onClick={applyPerformanceFilter}>
                      Applica
                    </Button>
                    <Button size="sm" variant="outline" onClick={resetPerformanceFilter}>
                      Reimposta
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Tasso di risposta</CardTitle>
                  <CardDescription>Tasso di risposta nel tempo (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] lg:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.callsPickupRateTimeLine}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} fontSize={12} />
                        <YAxis fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          labelFormatter={(v) => new Date(v).toLocaleDateString()}
                          formatter={(v) => [`${v}%`, "Tasso di risposta"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="pickupRatePercentage"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          name="Tasso di risposta"
                          dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Tasso di successo</CardTitle>
                  <CardDescription>Tasso di successo nel tempo (%)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px] lg:h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data.callsSuccessRateTimeLine}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} fontSize={12} />
                        <YAxis fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          labelFormatter={(v) => new Date(v).toLocaleDateString()}
                          formatter={(v) => [`${v}%`, "Tasso di successo"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="successRatePercentage"
                          stroke="#22c55e"
                          strokeWidth={2}
                          name="Tasso di successo"
                          dot={{ fill: "#22c55e", strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Analisi dei costi (si aggiorna con il filtro prestazioni) */}
            <Card className="min-w-0">
              <CardHeader className="space-y-1">
                <CardTitle>Analisi dei costi</CardTitle>
                <CardDescription>Costo totale e costo medio per chiamata nel tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[230px] sm:h-[260px] lg:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ourCostTimelinePerf}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        fontSize={12}
                        tickFormatter={(v: number) => `$${v.toFixed(3)}`}
                      />
                      <Tooltip<number, string>
                        labelFormatter={(v) => new Date(v).toLocaleDateString()}
                        formatter={priceTooltipFormatter}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalPrice"
                        stroke="#dc2626"
                        strokeWidth={2}
                        name="Costo totale"
                        dot={{ fill: "#dc2626", strokeWidth: 2, r: 3 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="averageCostPerCall"
                        stroke="#7c3aed"
                        strokeWidth={2}
                        name="Costo medio per chiamata"
                        dot={{ fill: "#7c3aed", strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Sentiment */}
            <Card className="min-w-0">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg">Analisi del sentiment</CardTitle>
                <CardDescription className="text-sm">Distribuzione dei sentiment delle chiamate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="space-y-3 lg:space-y-4">
                    {Object.entries(data.callsSentimentOverview).map(([key, value]) => {
                      const total = Object.values(data.callsSentimentOverview).reduce((a, b) => a + b, 0)
                      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0"
                      return (
                        <div key={key} className="flex items-center justify-between p-2 lg:p-3 rounded-lg border">
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <div
                              className="w-3 h-3 lg:w-4 lg:h-4 rounded-full"
                              style={{ backgroundColor: SENTIMENT_COLORS[key as keyof typeof SENTIMENT_COLORS] }}
                            />
                            <span className="text-sm lg:text-base">
                              {SENTIMENT_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-sm lg:text-base">{value.toLocaleString()}</span>
                            <span className="text-xs lg:text-sm text-gray-500 ml-1 lg:ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-center mt-4 lg:mt-0">
                    <div className="h-[220px] w-[220px] sm:h-[260px] sm:w-[260px] lg:h-[300px] lg:w-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={Object.entries(data.callsSentimentOverview)
                              .filter(([, value]) => value > 0)
                              .map(([key, value]) => ({
                                name: SENTIMENT_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim(),
                                value,
                                fill: SENTIMENT_COLORS[key as keyof typeof SENTIMENT_COLORS],
                              }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {Object.entries(data.callsSentimentOverview).map(([key], index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={SENTIMENT_COLORS[key as keyof typeof SENTIMENT_COLORS]}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [value.toLocaleString(), name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Eventi: Etichette + per ora */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Etichette chiamate</CardTitle>
                  <CardDescription>Distribuzione delle etichette delle chiamate</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.callLabelCount.map((label) => {
                      const total = data.callLabelCount.reduce((sum, l) => sum + l.count, 0)
                      const percentage = total > 0 ? ((label.count / total) * 100).toFixed(1) : "0"
                      return (
                        <div key={label.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: label.color }} />
                            <span>{label.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold">{label.count.toLocaleString()}</span>
                            <span className="text-sm text-gray-500 ml-2">({percentage}%)</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="min-w-0">
                <CardHeader>
                  <CardTitle>Chiamate per ora</CardTitle>
                  <CardDescription>Distribuzione delle chiamate durante la giornata</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[230px] sm:h-[260px] lg:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.callsByHourDayOfWeeks}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hourOfDay" fontSize={12} tickFormatter={(v) => `${v}:00`} />
                        <YAxis fontSize={12} />
                        <Tooltip
                          labelFormatter={(v) => `${v}:00`}
                          formatter={(v: number) => [v.toLocaleString(), "Chiamate"]}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      }

      default:
        return null
    }
  }

  /* ---- Layout ---- */
  return (
    <>
      <div className="flex min-h-[100svh] bg-gray-50 overflow-x-hidden">
        {/* Overlay sidebar mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 w-80 sm:w-72 md:w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out z-30",
            "lg:translate-x-0 lg:static lg:inset-0 lg:z-auto",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {/* Chiudi mobile */}
          <div className="flex items-center justify-between p-4 lg:hidden border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          <span className="relative block h-8 w-[140px] p-4">
            <Image
              src="https://www.ai-scaleup.com/wp-content/uploads/2024/03/Logo-AI-ScaleUp-300x59-1-300x59.png"
              alt="Logo Digital Coach"
              fill
              unoptimized
              sizes="140px"
              className="object-contain"
              priority
            />
          </span>

          {/* Selettore campagna */}
          {campaigns.length > 0 ? (
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Campagna</label>
                  <Select value={selectedCampaign?.id || ""} onValueChange={handleCampaignChange}>
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Seleziona campagna" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id} className="text-xs sm:text-sm">
                          {campaign.campaignName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Toggle campagna */}
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Stato campagna</span>
                  <button
                    onClick={handleCampaign}
                    disabled={isCampaignChecking}
                    className={cn(
                      "relative inline-flex h-7 w-14 sm:h-8 sm:w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50",
                      isCampaignOn === null ? "bg-neutral-300" : isCampaignOn ? "bg-green-100" : "bg-red-100",
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-4px)] rounded-full transition-transform duration-200 shadow",
                        isCampaignOn === null ? "bg-neutral-400/80" : isCampaignOn ? "bg-green-500" : "bg-red-500",
                        isCampaignOn ? "translate-x-0" : "translate-x-[calc(100%+4px)]",
                        "z-0",
                      )}
                    />
                    <div className="relative z-10 grid w-full grid-cols-2 text-xs font-medium">
                      <span
                        className={cn(
                          "text-center transition-colors",
                          isCampaignOn ? "text-white" : "text-neutral-600",
                        )}
                      >
                        {isCampaignChecking ? "…" : "On"}
                      </span>
                      <span
                        className={cn(
                          "text-center transition-colors",
                          !isCampaignOn ? "text-white" : "text-neutral-600",
                        )}
                      >
                        {isCampaignChecking ? "…" : "Off"}
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200">
              <div className="text-center py-4">
                <p className="text-xs sm:text-sm text-gray-500 mb-2">Nessuna campagna disponibile</p>
                <p className="text-xs text-gray-400">
                  {loading ? "Caricamento campagne..." : "Controlla la configurazione della tua email"}
                </p>
              </div>
            </div>
          )}

          {/* Navigazione */}
          <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
            <div className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveSection(item.id)
                      setSidebarOpen(false)
                    }}
                    className={cn(
                      "w-full flex items-center px-3 py-3 sm:py-2 text-sm font-medium rounded-md transition-colors touch-manipulation",
                      activeSection === item.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100",
                    )}
                  >
                    <Icon className="mr-3 h-4 w-4 sm:h-4 sm:w-4 shrink-0" />
                    <span className="truncate text-sm sm:text-sm">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Azioni */}
          <div className="p-3 sm:p-4 border-t border-gray-200 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="w-full bg-transparent h-10 sm:h-9 text-sm touch-manipulation"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Aggiorna
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearStoredCredentials}
              className="w-full bg-transparent h-10 sm:h-9 text-sm touch-manipulation"
            >
              Cancella credenziali
            </Button>
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header mobile */}
          <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 touch-manipulation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900 truncate px-2">Dashboard analitica</h1>
            <div className="w-9" />
          </div>

          {/* Area contenuti */}
          <div className="flex-1 overflow-y-auto touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
            <div className="p-3 sm:p-4 lg:p-6 max-w-full">
              {analyticsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span className="text-sm lg:text-base">Caricamento dati analitici...</span>
                </div>
              ) : (
                renderContent()
              )}
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  )
}

export default OverviewPage
