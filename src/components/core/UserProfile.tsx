"use client";

import { useState, useRef } from "react";
import { CircleUser, LogOut, Settings, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Session } from "next-auth";
import Image from "next/image";

interface UserProfileProps {
  session: Session;
}

export default function UserProfile({ session }: UserProfileProps) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { duration: 0.2 },
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    hidden: { x: -10, opacity: 0 },
    visible: (i: number) => ({
      x: 0, opacity: 1,
      transition: { delay: i * 0.05, stiffness: 300 },
    }),
  };

  const items = [
    // { label: "Update Profile", href: "/dashboard/profile", icon: <Settings className="w-4 h-4 mr-2" /> },
    { label: "Switch Business", href: "/dashboard/", icon: <Building2 className="w-4 h-4 mr-2" /> },
    {
      label: "Sign Out",
      href: "/signin",
      icon: <LogOut className="w-4 h-4 mr-2" />,
      onClick: () => signOut({ callbackUrl: "/" }),
    },
  ];

  const isValidImageUrl = (url: string | null | undefined) => {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
  };

  return (
    <>
      <div
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={0}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 cursor-pointer px-3 py-2 hover:text-primary transition-colors group">
          {session?.user?.image && isValidImageUrl(session.user.image) ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow group">
              <Image
                src={session.user.image}
                alt={session.user.name || "Profile"}
                fill
                className="object-cover"
                unoptimized={session.user.image.startsWith('http')}
              />
            </div>
          ) : (
            <div
              className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-100 hover:bg-gray-200 border-2 border-primary/30 shadow transition-colors flex items-center justify-center"
              aria-label="Upload profile image"
            >
              <CircleUser className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <span className="text-base font-semibold text-gray-800 group-hover:text-primary transition-colors">
            {session?.user?.name || "Profile"}
          </span>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute right-0 mt-3 w-64 bg-white/95 backdrop-blur border border-gray-100 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={dropdownVariants}
              tabIndex={-1}
            >
              <div className="p-5 border-b flex flex-col items-center bg-gradient-to-b from-primary/5 to-white">
                {session?.user?.image && isValidImageUrl(session.user.image) ? (
                  <div className="flex-shrink-0 relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40 shadow">
                    <Image
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      fill
                      className="object-cover"
                      unoptimized={session.user.image.startsWith('http')}
                    />
                  </div>
                ) : (
                  <CircleUser className="w-16 h-16 text-gray-300" />
                )}
                <div className="mt-3 text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {session?.user?.name}
                  </p>
                  {session?.user?.email && (
                    <p className="text-xs text-gray-500 mt-1">{session.user.email}</p>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {items.map((item, idx) =>
                  item.onClick ? (
                    <motion.button
                      key={idx}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                      onClick={item.onClick}
                      className="w-full flex items-center px-6 py-3 text-base text-red-600 hover:bg-red-50 transition-colors font-medium focus:outline-none"
                    >
                      {item.icon}
                      {item.label}
                    </motion.button>
                  ) : (
                    <motion.div
                      key={idx}
                      custom={idx}
                      initial="hidden"
                      animate="visible"
                      variants={itemVariants}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center px-6 py-3 text-base text-gray-700 hover:bg-primary/10 hover:text-primary transition-colors font-medium"
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </>
  );
}
