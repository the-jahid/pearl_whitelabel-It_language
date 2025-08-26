"use client";
import React, { useState } from "react";

import {
  IconOutbound,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";



export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const links = [
    // {
    //   label: "Dashboard",
    //   href: "/dashboard",
    //   icon: (
    //     <IconDashboardFilled className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    //   ),
    // },
    // {
    //   label: "Inbound",
    //   href: "/dashboard/inbound",
    //   icon: (
    //     <IconDropCircle className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
    //   ),
    // },
    {
      label: "Outbound",
      href: "/dashboard/outbound",
      icon: (
        <IconOutbound className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
  return (
    <div
      className={cn(
        "mx-auto flex w-full  flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-white md:flex-row text-black",
        "h-[100vh]" // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : ''}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
           <UserButton />
          </div>
        </SidebarBody>
      </Sidebar>
      {children}
    </div>
  );
}
const Logo = () => {
  return (
    <Link
      href="/"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        <Image src={'https://www.ai-scaleup.com/wp-content/uploads/2024/03/Logo-AI-ScaleUp-300x59-1-300x59.png'} width={100} height={30}  alt="image_logo" />
      </motion.span>
    </Link>
  );
};
