"use client"

import { cn } from "@/lib/utils"
import { IconMenu2, IconX } from "@tabler/icons-react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react"
import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"

/* ----------------------------- Types ----------------------------- */

interface NavbarProps {
  children: React.ReactNode
  className?: string
  /** "sticky" (default) or "fixed" */
  position?: "sticky" | "fixed"
  /** top offset class e.g. "top-0" (default) */
  topClassName?: string
}

interface NavBodyProps {
  children: React.ReactNode
  className?: string
  visible?: boolean
}

interface NavItemsProps {
  items: {
    name: string
    link: string
  }[]
  className?: string
  onItemClick?: () => void
}

interface MobileNavProps {
  children: React.ReactNode
  className?: string
  visible?: boolean
}

interface MobileNavHeaderProps {
  children: React.ReactNode
  className?: string
}

interface MobileNavMenuProps {
  children: React.ReactNode
  className?: string
  isOpen: boolean
  /** optional: show a backdrop overlay and allow closing via click/Escape */
  withOverlay?: boolean
  onClose?: () => void
}

/* ----------------------------- Navbar ---------------------------- */

export const Navbar = ({ children, className, position = "sticky", topClassName = "top-0" }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const [visible, setVisible] = useState<boolean>(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > 8)
  })

  return (
    <motion.div ref={ref} className={cn(`${position} inset-x-0 ${topClassName} z-50 w-full`, className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ visible?: boolean }>, { visible })
          : child,
      )}
    </motion.div>
  )
}

/* ----------------------------- Desktop Body ----------------------------- */

export const NavBody = ({ children, className, visible }: NavBodyProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
          : "none",
        y: visible ? 8 : 0,
      }}
      transition={{ type: "spring", stiffness: 220, damping: 42 }}
      className={cn(
        "relative z-[60] mx-auto hidden w-full max-w-7xl items-center justify-between rounded-none bg-transparent px-4 py-2 lg:flex",
        visible && "bg-white/80 dark:bg-neutral-950/80 lg:rounded-full",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

/* ----------------------------- Desktop Nav Items ----------------------------- */

export const NavItems = ({ items, className, onItemClick }: NavItemsProps) => {
  const [hovered, setHovered] = useState<number | null>(null)

  return (
    <nav
      onMouseLeave={() => setHovered(null)}
      className={cn("hidden flex-1 items-center justify-center gap-1 text-sm font-medium lg:flex", className)}
      aria-label="Principale"
    >
      {items.map((item, idx) => (
        <Link
          key={`link-${idx}`}
          href={item.link}
          onMouseEnter={() => setHovered(idx)}
          onClick={onItemClick}
          className="relative rounded-full px-4 py-2 text-neutral-700 transition-colors hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white"
        >
          {hovered === idx && (
            <motion.span
              layoutId="hovered"
              className="absolute inset-0 rounded-full bg-gray-100 dark:bg-neutral-800"
              aria-hidden
            />
          )}
          <span className="relative z-10">{item.name}</span>
        </Link>
      ))}
    </nav>
  )
}

/* ----------------------------- Mobile Wrappers ----------------------------- */

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <motion.div
      animate={{
        backdropFilter: visible ? "blur(10px)" : "none",
        boxShadow: visible
          ? "0 0 24px rgba(34,42,53,0.06), 0 1px 1px rgba(0,0,0,0.05), 0 0 0 1px rgba(34,42,53,0.04), 0 0 4px rgba(34,42,53,0.08), 0 16px 68px rgba(47,48,55,0.05), 0 1px 0 rgba(255,255,255,0.1) inset"
          : "none",
        y: visible ? 8 : 0,
      }}
      transition={{ type: "spring", stiffness: 220, damping: 42 }}
      className={cn(
        "relative z-50 mx-auto flex w-full max-w-7xl flex-col items-center justify-between bg-transparent px-4 py-2 lg:hidden",
        visible && "bg-white/80 dark:bg-neutral-950/80 rounded-xl",
        className,
      )}
    >
      {children}
    </motion.div>
  )
}

export const MobileNavHeader = ({ children, className }: MobileNavHeaderProps) => {
  return <div className={cn("flex w-full items-center justify-between", className)}>{children}</div>
}

export const MobileNavMenu = ({ children, className, isOpen, withOverlay = true, onClose }: MobileNavMenuProps) => {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isOpen, onClose])

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original || ""
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {withOverlay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
              onClick={onClose}
              aria-hidden="true"
            />
          )}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={cn(
              "absolute inset-x-0 top-14 z-50 mx-0 flex w-full flex-col items-start justify-start gap-4 rounded-lg bg-white px-4 py-6 shadow-[0_0_24px_rgba(34,_42,_53,_0.06),_0_1px_1px_rgba(0,_0,_0,_0.05),_0_0_0_1px_rgba(34,_42,_53,_0.04),_0_0_4px_rgba(34,_42,_53,_0.08),_0_16px_68px_rgba(47,_48,_55,_0.05),_0_1px_0_rgba(255,_255,_255,_0.1)_inset] dark:bg-neutral-950",
              className,
            )}
            role="dialog"
            aria-modal="true"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/* ----------------------------- Mobile Toggle ----------------------------- */

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean
  onClick: () => void
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Chiudi menu" : "Apri menu"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {isOpen ? (
        <IconX className="h-6 w-6 text-black dark:text-white" />
      ) : (
        <IconMenu2 className="h-6 w-6 text-black dark:text-white" />
      )}
    </button>
  )
}

/* ----------------------------- Logo ----------------------------- */

export const NavbarLogo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 mr-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      aria-label="Home Digital Coach"
    >
      {/* Fixed height box to ensure consistent rendering */}
      <span className="relative block h-8 w-[140px]">
        <Image
          src="https://www.ai-scaleup.com/wp-content/uploads/2024/03/Logo-AI-ScaleUp-300x59-1-300x59.png"
          alt="Digital Coach logo"
          fill
          unoptimized
          sizes="140px"
          className="object-contain"
          priority
        />
      </span>
      <span className="sr-only">Digital Coach</span>
    </Link>
  )
}

/* ----------------------------- Buttons ----------------------------- */

export const NavbarButton = ({
  href,
  as: Tag = "a",
  children,
  className,
  variant = "primary",
  ...props
}: {
  href?: string
  as?: React.ElementType
  children: React.ReactNode
  className?: string
  variant?: "primary" | "secondary" | "dark" | "gradient"
} & (React.ComponentPropsWithoutRef<"a"> | React.ComponentPropsWithoutRef<"button">)) => {
  const baseStyles =
    "px-4 py-2 rounded-md text-sm font-semibold relative cursor-pointer transition duration-200 inline-flex items-center justify-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"

  const variantStyles = {
    primary:
      "bg-white text-black shadow-[0_0_24px_rgba(34,42,53,0.06),_0_1px_1px_rgba(0,0,0,0.05),_0_0_0_1px_rgba(34,42,53,0.04),_0_0_4px_rgba(34,42,53,0.08),_0_16px_68px_rgba(47,48,55,0.05),_0_1px_0_rgba(255,255,255,0.1)_inset] hover:-translate-y-0.5",
    secondary: "bg-transparent text-black/80 dark:text-white/90 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
    dark: "bg-black text-white shadow-[0_0_24px_rgba(34,42,53,0.06),_0_1px_1px_rgba(0,0,0,0.05),_0_0_0_1px_rgba(34,42,53,0.04),_0_0_4px_rgba(34,42,53,0.08),_0_16px_68px_rgba(47,48,55,0.05),_0_1px_0_rgba(255,255,255,0.1)_inset] hover:-translate-y-0.5",
    gradient:
      "bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] hover:opacity-95",
  } as const

  return (
    <Tag href={href || undefined} className={cn(baseStyles, variantStyles[variant], className)} {...props}>
      {children}
    </Tag>
  )
}
