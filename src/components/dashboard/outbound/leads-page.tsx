"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import {
  Phone,
  Plus,
  Upload,
  X as XIcon,
  Play,
  Pause,
  Clock,
  PhoneCall,
  Settings,
  AlertCircle,
  Download,
} from "lucide-react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

/* ----------------- CSV helpers ----------------- */
const escapeCsv = (val: string | number | null | undefined) => {
  if (val === null || val === undefined) return ""
  const str = String(val)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

const downloadBlob = (content: string, filename: string, type = "text/csv;charset=utf-8;") => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
/* ----------------------------------------------- */

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
    <XIcon className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => <ToastPrimitives.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />)
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
    toast: { ...props, id, open: true, onOpenChange: (open) => { if (!open) dismiss() } },
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
          <div className="grid gap-1">{title && <ToastTitle>{title}</ToastTitle>}{description && <ToastDescription>{description}</ToastDescription>}</div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
})
Toaster.displayName = "Toaster"

/* -------- LocalStorage helpers -------- */
const STORAGE_KEYS = {
  BEARER_TOKEN: "analytics_bearer_token",
  OUTBOUND_ID: "analytics_outbound_id",
}

const saveToLocalStorage = (key: string, value: string) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) localStorage.setItem(key, value)
  } catch { }
}
const getFromLocalStorage = (key: string): string | null => {
  try {
    if (typeof window !== "undefined" && window.localStorage) return localStorage.getItem(key)
  } catch { }
  return null
}
const removeFromLocalStorage = (key: string) => {
  try {
    if (typeof window !== "undefined" && window.localStorage) localStorage.removeItem(key)
  } catch { }
}
const clearLeadsStorage = () => {
  Object.values(STORAGE_KEYS).forEach((key) => removeFromLocalStorage(key))
}

/* --------------- APIs --------------- */
const API_BASE_URL = process.env.NLPEARL_API_BASE_URL || "https://api.nlpearl.ai/v2" // calls + status + toggle

/* --------------- Types --------------- */
type Lead = {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  status: "pending" | "called" | "failed"
  callId?: string
}
type BulkCallState = {
  inProgress: boolean
  currentIndex: number
  totalCalls: number
  timeframe: number
  paused: boolean
}
type CampaignCreds = { outboundId: string; bearerToken: string } | null

/* ============== Component ============== */
export default function LeadsPage() {
  const { toast } = useToast()

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([])
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [isBulkCallOpen, setIsBulkCallOpen] = useState(false)
  // Credentials state removed - credentials come from Panoramica page
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(false)

  // Credenziali campagna da localStorage
  const [campaignCreds, setCampaignCreds] = useState<CampaignCreds>(null)
  const isConfigured = !!campaignCreds

  // Stato ON/OFF campagna (non mostrato)
  const [, setIsCampaignOn] = useState<boolean | null>(null)

  const [, setIsCampaignChecking] = useState(false)



  // Stato form
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "" })

  // Stato import massivo
  const [bulkData, setBulkData] = useState("")
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvPreview, setCsvPreview] = useState<string[][]>([])

  // Stato chiamata massiva
  const [bulkCallState, setBulkCallState] = useState<BulkCallState>({
    inProgress: false,
    currentIndex: 0,
    totalCalls: 0,
    timeframe: 5,
    paused: false,
  })

  // Refs per chiamate massive
  const bulkCallQueueRef = useRef<Lead[]>([])
  const bulkCallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* ======== Helpers stato campagna ======== */
  const fetchOutboundActive = useCallback(
    async (outId: string, token: string) => {
      setIsCampaignChecking(true)
      try {
        const res = await fetch(`${API_BASE_URL}/Pearl/${outId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token.replace("Bearer ", "")}`,
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
        if (status === 1) setIsCampaignOn(true)
        else if (status === 2) setIsCampaignOn(false)
        else {
          setIsCampaignOn(null)
          toast({
            title: "Stato sconosciuto",
            description: `Ricevuto status=${String(status)}. Atteso 1 (ON) o 2 (OFF).`,
            variant: "destructive",
          })
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Impossibile leggere lo stato della campagna."
        toast({ title: "Verifica stato non riuscita", description: msg, variant: "destructive" })
        setIsCampaignOn(null)
      } finally {
        setIsCampaignChecking(false)
      }
    },
    [toast],
  )

  /* ======== Carica credenziali da localStorage e ascolta cambiamenti ======== */
  const loadCredentials = useCallback(() => {
    const savedBearerToken = getFromLocalStorage(STORAGE_KEYS.BEARER_TOKEN)
    const savedOutboundId = getFromLocalStorage(STORAGE_KEYS.OUTBOUND_ID)
    if (savedBearerToken && savedOutboundId) {
      const creds = { bearerToken: savedBearerToken, outboundId: savedOutboundId }
      setCampaignCreds(creds)
      // Stato attuale ON/OFF
      fetchOutboundActive(savedOutboundId, savedBearerToken)
    } else {
      setCampaignCreds(null)
      // Don't open credentials modal - credentials come from Overview page campaign selection
    }
  }, [fetchOutboundActive])

  // Load on mount
  useEffect(() => {
    loadCredentials()
  }, [loadCredentials])

  // Listen for campaign changes from other pages (custom event)
  useEffect(() => {
    const handleCampaignChange = () => {
      loadCredentials()
    }

    // Listen for custom event dispatched when campaign changes
    window.addEventListener('campaignChanged', handleCampaignChange)

    return () => {
      window.removeEventListener('campaignChanged', handleCampaignChange)
    }
  }, [loadCredentials])

  /* ======== Gestione form lead ======== */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  const handleBulkDataChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => setBulkData(e.target.value)

  /* ======== Upload CSV ======== */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast({ title: "Tipo di file non valido", description: "Carica un file CSV.", variant: "destructive" })
      return
    }

    setCsvFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.trim().split("\n")
      const preview = lines.slice(0, 5).map((line) => line.split(",").map((cell) => cell.trim().replace(/"/g, "")))
      setCsvPreview(preview)
    }
    reader.readAsText(file)
  }

  const handleCsvImport = () => {
    if (!csvFile) {
      toast({ title: "Nessun file selezionato", description: "Seleziona un file CSV da importare.", variant: "destructive" })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.trim().split("\n")
        if (lines.length < 2) {
          toast({ title: "CSV non valido", description: "Il CSV deve avere almeno intestazione e una riga.", variant: "destructive" })
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""))
        const firstNameIndex = headers.findIndex((h) => (h.includes("first") && h.includes("name")) || h === "firstname")
        const lastNameIndex = headers.findIndex((h) => (h.includes("last") && h.includes("name")) || h === "lastname")
        const nameIndex = headers.findIndex((h) => h === "name" && firstNameIndex === -1)
        const emailIndex = headers.findIndex((h) => h.includes("email"))
        const phoneIndex = headers.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("number"))

        if ((firstNameIndex === -1 && nameIndex === -1) || phoneIndex === -1) {
          toast({ title: "Colonne obbligatorie mancanti", description: "Il CSV deve contenere nome (o nome/cognome) e telefono.", variant: "destructive" })
          return
        }

        const newLeads: Lead[] = []
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(",").map((cell) => cell.trim().replace(/"/g, ""))
          if (row.length < headers.length) continue

          let firstName = ""
          let lastName = ""
          if (firstNameIndex !== -1 && lastNameIndex !== -1) {
            firstName = row[firstNameIndex] || ""
            lastName = row[lastNameIndex] || ""
          } else if (nameIndex !== -1) {
            const fullName = row[nameIndex].split(" ")
            firstName = fullName[0] || ""
            lastName = fullName.slice(1).join(" ") || ""
          }
          const email = emailIndex !== -1 ? row[emailIndex] || "" : ""
          const phoneNumber = row[phoneIndex] || ""

          if (firstName && phoneNumber) {
            newLeads.push({
              id: crypto.randomUUID(),
              firstName,
              lastName,
              email,
              phoneNumber,
              status: "pending",
            })
          }
        }

        if (newLeads.length === 0) {
          toast({ title: "Nessun lead valido", description: "Controlla il formato del CSV e riprova.", variant: "destructive" })
          return
        }

        setLeads((prev) => [...prev, ...newLeads])
        setCsvFile(null)
        setCsvPreview([])
        setIsBulkImportOpen(false)
        toast({ title: "Import CSV riuscita", description: `${newLeads.length} lead importati dal CSV.` })
      } catch {
        toast({ title: "Import fallita", description: "Errore durante l'elaborazione del file CSV.", variant: "destructive" })
      }
    }
    reader.readAsText(csvFile)
  }

  /* ======== Aggiunta manuale + incolla massiva ======== */
  const resetForm = () => setFormData({ firstName: "", lastName: "", email: "", phoneNumber: "" })

  const handleAddLead = () => {
    if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
      toast({ title: "Informazioni mancanti", description: "Compila tutti i campi obbligatori.", variant: "destructive" })
      return
    }
    const newLead: Lead = { id: crypto.randomUUID(), ...formData, status: "pending" }
    setLeads((prev) => [...prev, newLead])
    resetForm()
    setIsAddLeadOpen(false)
    toast({ title: "Lead aggiunto", description: `${newLead.firstName} ${newLead.lastName} è stato aggiunto.` })
  }

  const handleBulkImport = () => {
    try {
      const lines = bulkData.trim().split("\n")
      const startIndex =
        lines[0]?.toLowerCase().includes("first") ||
          lines[0]?.toLowerCase().includes("name") ||
          lines[0]?.toLowerCase().includes("email")
          ? 1
          : 0

      const newLeads: Lead[] = []
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue
        const [firstName, lastName, email, phoneNumber] = line.split(",").map((item) => item.trim())
        if (firstName && lastName && phoneNumber) {
          newLeads.push({
            id: crypto.randomUUID(),
            firstName,
            lastName,
            email: email || "",
            phoneNumber,
            status: "pending",
          })
        }
      }

      if (newLeads.length === 0) {
        toast({ title: "Nessun lead valido", description: "Controlla il formato dei dati e riprova.", variant: "destructive" })
        return
      }

      setLeads((prev) => [...prev, ...newLeads])
      setBulkData("")
      setIsBulkImportOpen(false)
      toast({ title: "Import massiva riuscita", description: `${newLeads.length} lead sono stati importati.` })
    } catch {
      toast({ title: "Import fallita", description: "Errore nell'elaborazione dei dati.", variant: "destructive" })
    }
  }

  /* ======== Effettua una chiamata ======== */
  const makeCall = async (lead: Lead) => {
    const savedBearerToken = getFromLocalStorage(STORAGE_KEYS.BEARER_TOKEN)
    const savedOutboundId = getFromLocalStorage(STORAGE_KEYS.OUTBOUND_ID)

    if (!savedBearerToken || !savedOutboundId) {
      toast({ title: "Nessuna campagna selezionata", description: "Vai alla scheda Panoramica e seleziona una campagna.", variant: "destructive" })
      return false
    }

    setIsLoading(true)
    try {
      const createResponse = await fetch(`${API_BASE_URL}/Pearl/${savedOutboundId}/Call`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${savedBearerToken.replace("Bearer ", "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: lead.phoneNumber,
          callData: { firstName: lead.firstName, lastName: lead.lastName, email: lead.email },
        }),
      })

      if (!createResponse.ok) {
        let errorMessage = "Impossibile iniziare la chiamata."
        switch (createResponse.status) {
          case 401:
            errorMessage = "Bearer token non valido. Vai alla scheda Panoramica e riseleziona la campagna."
            clearLeadsStorage()
            break
          case 403:
            errorMessage = "Accesso negato. Controlla i permessi."
            break
          case 404:
            errorMessage = "Outbound ID non trovato. Vai alla scheda Panoramica e riseleziona la campagna."
            clearLeadsStorage()
            break
          default:
            errorMessage = `Errore API: ${createResponse.status}`
        }
        throw new Error(errorMessage)
      }

      const createData = await createResponse.json()
      if (!createData.id) throw new Error("Nessun request ID ricevuto dall'API")

      const requestId = createData.id

      const callInfo = {
        id: requestId,
        requestId,
        from: createData.from || "Sconosciuto",
        to: createData.to || lead.phoneNumber,
        leadName: `${lead.firstName} ${lead.lastName}`,
        startTime: new Date().toISOString(),
        status: "In corso",
        conversationStatus: "In coda",
        queuePosition: createData.queuePosition || 0,
      }
      const existingCalls = JSON.parse(localStorage.getItem("outboundCalls") || "[]")
      existingCalls.push(callInfo)
      localStorage.setItem("outboundCalls", JSON.stringify(existingCalls))

      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "called", callId: requestId } : l)))
      toast({ title: "Chiamata avviata", description: `Chiamata a ${lead.firstName} ${lead.lastName} avviata. Request ID: ${requestId}` })
      return true
    } catch (error) {
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "failed" } : l)))
      toast({
        title: "Chiamata fallita",
        description: error instanceof Error ? error.message : "Errore sconosciuto",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  /* ======== Flusso chiamate massive ======== */
  const toggleLeadSelection = (id: string) => {
    setSelectedLeads((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedLeads(new Set())
    } else {
      const pendingLeadIds = leads.filter((l) => l.status === "pending").map((l) => l.id)
      setSelectedLeads(new Set(pendingLeadIds))
    }
    setSelectAll((s) => !s)
  }

  const startBulkCall = () => {
    if (!isConfigured) {
      toast({ title: "Nessuna campagna selezionata", description: "Vai alla scheda Panoramica e seleziona una campagna.", variant: "destructive" })
      return
    }
    if (selectedLeads.size === 0) {
      toast({ title: "Nessun lead selezionato", description: "Seleziona almeno un lead da chiamare.", variant: "destructive" })
      return
    }
    const selected = leads.filter((l) => selectedLeads.has(l.id) && l.status === "pending")
    if (selected.length === 0) {
      toast({ title: "Nessun lead valido", description: "Tutti i lead selezionati sono già stati chiamati.", variant: "destructive" })
      return
    }
    setBulkCallState((prev) => ({ ...prev, inProgress: true, currentIndex: 0, totalCalls: selected.length, paused: false }))
    bulkCallQueueRef.current = [...selected]
    processBulkCallQueue()
    setIsBulkCallOpen(false)
    toast({
      title: "Chiamata massiva avviata",
      description: `Avvio di ${selected.length} chiamate con ${bulkCallState.timeframe}s tra le chiamate.`,
    })
  }

  const processBulkCallQueue = async () => {
    if (bulkCallQueueRef.current.length === 0 || bulkCallState.paused) return
    const lead = bulkCallQueueRef.current.shift()
    if (!lead) return
    await makeCall(lead)
    setBulkCallState((prev) => ({ ...prev, currentIndex: prev.currentIndex + 1 }))

    if (bulkCallQueueRef.current.length > 0 && !bulkCallState.paused) {
      bulkCallTimerRef.current = setTimeout(processBulkCallQueue, bulkCallState.timeframe * 1000)
    } else {
      if (bulkCallQueueRef.current.length === 0) {
        setBulkCallState((prev) => ({ ...prev, inProgress: false }))
        toast({ title: "Chiamata massiva completata", description: `Completate tutte le ${bulkCallState.totalCalls} chiamate.` })
      }
    }
  }

  const pauseBulkCall = () => {
    setBulkCallState((prev) => ({ ...prev, paused: true }))
    if (bulkCallTimerRef.current) clearTimeout(bulkCallTimerRef.current)
    toast({ title: "Chiamata massiva in pausa", description: `In pausa dopo ${bulkCallState.currentIndex} di ${bulkCallState.totalCalls}.` })
  }
  const resumeBulkCall = () => {
    setBulkCallState((prev) => ({ ...prev, paused: false }))
    processBulkCallQueue()
    toast({ title: "Chiamata massiva ripresa", description: `Ripresa con ${bulkCallQueueRef.current.length} chiamate rimanenti.` })
  }
  const cancelBulkCall = () => {
    setBulkCallState((prev) => ({ ...prev, inProgress: false, currentIndex: 0, totalCalls: 0, paused: false }))
    bulkCallQueueRef.current = []
    if (bulkCallTimerRef.current) clearTimeout(bulkCallTimerRef.current)
    toast({ title: "Chiamata massiva annullata", description: "L'operazione di chiamata massiva è stata annullata." })
  }

  /* ======== Download CSV & Excel ======== */
  const downloadCsvTemplate = () => {
    const headers = ["firstName", "lastName", "email", "phoneNumber"].join(",")
    const rows = [
      ["John", "Doe", "john@example.com", "+1234567890"],
      ["Jane", "Smith", "jane@example.com", "+0987654321"],
    ]
      .map((r) => r.map(escapeCsv).join(","))
      .join("\n")
    const csv = `${headers}\n${rows}\n`
    downloadBlob(csv, "leads-template.csv")
  }

  const downloadExcelTemplate = () => {
    const headers = ["firstName", "lastName", "email", "phoneNumber"]
    const data = [
      headers,
      ["John", "Doe", "john@example.com", "+1234567890"],
      ["Jane", "Smith", "jane@example.com", "+0987654321"],
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    // larghezza colonne
    ws["!cols"] = [{ wch: 14 }, { wch: 14 }, { wch: 28 }, { wch: 16 }]
    XLSX.utils.book_append_sheet(wb, ws, "Leads Template")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "leads-template.xlsx"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const exportLeadsCsv = () => {
    if (leads.length === 0) {
      toast({ title: "Nessun lead da esportare", description: "Aggiungi o importa prima qualche lead.", variant: "destructive" })
      return
    }
    const headers = ["firstName", "lastName", "email", "phoneNumber", "status"].join(",")
    const rows = leads
      .map((l) => [l.firstName, l.lastName, l.email || "", l.phoneNumber || "", l.status].map(escapeCsv).join(","))
      .join("\n")
    const csv = `${headers}\n${rows}\n`
    const date = new Date().toISOString().split("T")[0]
    downloadBlob(csv, `leads-${date}.csv`)
  }

  /* ======== Cleanup timer ======== */
  useEffect(() => {
    return () => {
      if (bulkCallTimerRef.current) clearTimeout(bulkCallTimerRef.current)
    }
  }, [])

  /* ======== UI ======== */
  return (
    <div className="container mx-auto py-8">
      <Toaster />
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Sistema chiamate in uscita</h1>
            <p className="text-muted-foreground mt-2">Gestisci i tuoi lead ed effettua chiamate in uscita</p>
          </div>

          <div className="flex items-center space-x-2">
            {/* segnaposto per toggle campagna se necessario */}
          </div>
        </div>

        {!isConfigured && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
              <p className="text-amber-800 font-medium">Nessuna campagna selezionata</p>
            </div>
            <p className="text-amber-700 text-sm mt-1">
              Vai alla scheda Panoramica e seleziona una campagna per iniziare a effettuare chiamate.
            </p>
          </div>
        )}
      </header>

      <div className="flex justify-between items-center mb-6">
        <div className="space-x-2">
          <Button onClick={() => setIsAddLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Aggiungi lead
          </Button>
          <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Importazione massiva
          </Button>
          <Button variant="outline" onClick={exportLeadsCsv} disabled={leads.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Esporta CSV
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsBulkCallOpen(true)}
            disabled={selectedLeads.size === 0 || bulkCallState.inProgress || !isConfigured}
          >
            <PhoneCall className="mr-2 h-4 w-4" /> Chiamate massive ({selectedLeads.size})
          </Button>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            {leads.length} lead • {leads.filter((l) => l.status === "called").length} chiamati
          </p>
        </div>
      </div>

      {/* Avanzamento bulk */}
      {bulkCallState.inProgress && (
        <div className="mb-6 p-4 border rounded-lg bg-slate-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Chiamata massiva in corso</h3>
            <div className="space-x-2">
              {bulkCallState.paused ? (
                <Button size="sm" variant="outline" onClick={resumeBulkCall}>
                  <Play className="h-4 w-4 mr-1" /> Riprendi
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={pauseBulkCall}>
                  <Pause className="h-4 w-4 mr-1" /> Pausa
                </Button>
              )}
              <Button size="sm" variant="destructive" onClick={cancelBulkCall}>
                <XIcon className="h-4 w-4 mr-1" /> Annulla
              </Button>
            </div>
          </div>
          <Progress value={(bulkCallState.currentIndex / bulkCallState.totalCalls) * 100} className="h-2 mb-2" />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {bulkCallState.currentIndex} di {bulkCallState.totalCalls} chiamate completate
            </span>
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              {bulkCallState.timeframe} secondi tra le chiamate
            </span>
          </div>
        </div>
      )}

      {/* Tabella lead */}
      {leads.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox checked={selectAll} onCheckedChange={toggleSelectAll} aria-label="Seleziona tutti i lead" />
                </TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefono</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLeads.has(lead.id)}
                      onCheckedChange={() => toggleLeadSelection(lead.id)}
                      disabled={lead.status !== "pending" || bulkCallState.inProgress}
                      aria-label={`Seleziona ${lead.firstName} ${lead.lastName}`}
                    />
                  </TableCell>
                  <TableCell>{lead.firstName} {lead.lastName}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phoneNumber}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        lead.status === "called"
                          ? "bg-green-100 text-green-800"
                          : lead.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-blue-100 text-blue-800",
                      )}
                    >
                      {lead.status === "called" ? "Chiamato" : lead.status === "failed" ? "Fallito" : "In attesa"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => makeCall(lead)}
                              disabled={isLoading || lead.status === "called" || bulkCallState.inProgress || !isConfigured}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Chiama questo lead</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setLeads((prev) => prev.filter((l) => l.id !== lead.id))
                              setSelectedLeads((prev) => {
                                const n = new Set(prev); n.delete(lead.id); return n
                              })
                              toast({ title: "Lead rimosso", description: "Il lead è stato rimosso dall'elenco." })
                            }}>
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Rimuovi lead</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Ancora nessun lead. Aggiungi il tuo primo lead per iniziare.</p>
          <Button className="mt-4" onClick={() => setIsAddLeadOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Aggiungi lead
          </Button>
        </div>
      )}

      {/* Modale Aggiungi Lead */}
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aggiungi nuovo lead</DialogTitle>
            <DialogDescription>Inserisci i dati del lead per aggiungerlo alla lista chiamate.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nome *</Label>
                <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Mario" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Cognome *</Label>
                <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Rossi" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="mario.rossi@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Numero di telefono *</Label>
              <Input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} placeholder="+393331234567" required />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>Annulla</Button>
            <Button onClick={handleAddLead}>Aggiungi lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale Import Massivo */}
      <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
        <DialogContent
          className="
            w-[calc(100vw-2rem)] sm:max-w-[600px]
            max-h-[85vh] overflow-y-auto
            p-4 sm:p-6
          "
        >
          <DialogHeader>
            <DialogTitle>Importazione massiva lead</DialogTitle>
            <DialogDescription>
              Incolla i dati dei tuoi lead in formato CSV/Excel: firstName,lastName,email,phoneNumber
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2 sm:py-4">
            <Tabs defaultValue="paste">
              {/* Tabs responsive */}
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-2">
                <TabsTrigger value="paste">Incolla dati</TabsTrigger>
                <TabsTrigger value="upload">Carica file</TabsTrigger>
                <TabsTrigger value="format">Guida formato</TabsTrigger>
              </TabsList>

              {/* Incolla */}
              <TabsContent value="paste" className="space-y-3 sm:space-y-4">
                <Textarea
                  placeholder=" Marco,Rossi,marco.rossi@example.com,+393513914422"
                  className="min-h-[160px] sm:min-h-[200px]"
                  value={bulkData}
                  onChange={handleBulkDataChange}
                />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Ogni riga deve contenere un lead nel formato:
                  {" "}firstName,lastName,email,phoneNumber
                </p>
              </TabsContent>

              {/* Carica */}
              <TabsContent value="upload" className="space-y-3 sm:space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6">
                  <div className="text-center">
                    <Upload className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                    <div className="mt-3 sm:mt-4">
                      <label htmlFor="csv-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Carica file
                        </span>
                        <span className="mt-1 block text-xs sm:text-sm text-gray-500">
                          Seleziona un file con colonne name, email e phone
                        </span>
                      </label>
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="mt-4 bg-transparent w-full sm:w-auto"
                      onClick={() => document.getElementById("csv-upload")?.click()}
                    >
                      Scegli file
                    </Button>
                  </div>
                </div>

                {csvFile && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium break-all">
                      File selezionato: {csvFile.name}
                    </p>

                    {csvPreview.length > 0 && (
                      <div className="border rounded-md p-3">
                        <p className="text-xs text-muted-foreground mb-2">
                          Anteprima (prime 5 righe):
                        </p>

                        {/* Tabella scrollabile su mobile */}
                        <div className="overflow-x-auto -mx-1 sm:mx-0">
                          <table className="min-w-[520px] w-full text-xs sm:text-sm">
                            <tbody>
                              {csvPreview.map((row, index) => (
                                <tr
                                  key={index}
                                  className={index === 0 ? "font-medium bg-muted" : ""}
                                >
                                  {row.map((cell, cellIndex) => (
                                    <td
                                      key={cellIndex}
                                      className="border px-2 py-1 truncate max-w-[120px]"
                                      title={cell}
                                    >
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Guida formato */}
              <TabsContent value="format">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Formato per incolla dati:</h4>
                    <p className="text-sm mb-2">
                      I tuoi dati devono essere in formato CSV con queste colonne:
                    </p>
                    <pre className="bg-muted p-3 sm:p-4 rounded-md text-xs overflow-x-auto">
                      {`firstName,lastName,email,phoneNumber
John,Doe,john@example.com,+1234567890
Jane,Smith,jane@example.com,+0987654321`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Formato file CSV:</h4>
                    <p className="text-sm mb-2">
                      Il tuo CSV può avere una di queste combinazioni di colonne:
                    </p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• <code>firstName, lastName, email, phone</code></li>
                      <li>• <code>first name, last name, email, phone number</code></li>
                      <li>• <code>name, email, mobile</code></li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 p-3 rounded-md">
                    <h4 className="font-medium text-amber-800 flex items-center">
                      <Clock className="h-4 w-4 mr-2" /> Note importanti
                    </h4>
                    <ul className="text-sm space-y-1 mt-2 text-amber-700">
                      <li>• Le chiamate avverranno in sequenza con il ritardo specificato</li>
                      <li>• Puoi mettere in pausa o annullare il processo in qualsiasi momento</li>
                      <li>• Ogni chiamata aggiornerà automaticamente lo stato del lead</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Footer responsive */}
          <DialogFooter className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setIsBulkImportOpen(false)}
              className="w-full sm:w-auto"
            >
              Annulla
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={downloadCsvTemplate}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Template CSV
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={downloadExcelTemplate}
              className="w-full sm:w-auto"
            >
              <Download className="mr-2 h-4 w-4" />
              Template Excel
            </Button>

            <Button
              onClick={bulkData ? handleBulkImport : handleCsvImport}
              className="w-full sm:w-auto"
            >
              {csvFile ? "Importa da CSV" : "Importa lead"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale Chiamata Massiva */}
      <Dialog open={isBulkCallOpen} onOpenChange={setIsBulkCallOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Impostazioni chiamata massiva</DialogTitle>
            <DialogDescription>Configura le impostazioni per chiamare più lead in sequenza</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Lead selezionati</h3>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm"><strong>{selectedLeads.size}</strong> lead selezionati per la chiamata massiva</p>
                  <p className="text-xs text-muted-foreground mt-1">Saranno chiamati solo i lead con stato &quot;In attesa&quot;</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label>Tempo tra le chiamate (secondi)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[bulkCallState.timeframe]}
                    min={3}
                    max={30}
                    step={1}
                    onValueChange={(value) => setBulkCallState((prev) => ({ ...prev, timeframe: value[0] }))}
                    className="flex-1"
                  />
                  <span className="w-12 text-center font-medium">{bulkCallState.timeframe}s</span>
                </div>
                <p className="text-xs text-muted-foreground">Consigliato: 5–10 secondi tra le chiamate</p>
              </div>
              <div className="bg-amber-50 p-3 rounded-md">
                <h4 className="font-medium text-amber-800 flex items-center">
                  <Clock className="h-4 w-4 mr-2" /> Note importanti
                </h4>
                <ul className="text-sm space-y-1 mt-2 text-amber-700">
                  <li>• Le chiamate avverranno in sequenza con il ritardo specificato</li>
                  <li>• Puoi mettere in pausa o annullare il processo in qualsiasi momento</li>
                  <li>• Ogni chiamata aggiornerà automaticamente lo stato del lead</li>
                </ul>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkCallOpen(false)}>Annulla</Button>
            <Button onClick={startBulkCall} disabled={!isConfigured}>Avvia chiamata massiva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
