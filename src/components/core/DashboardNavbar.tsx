"use client";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const user = session?.user;

  return (
    <nav className="w-full flex items-center justify-between px-8 py-4 bg-white shadow-sm">
      <div className="flex items-center">
        <Image src="/images/Logo/LogoFoodeezMain.svg" alt="Foodeez Logo" width={120} height={40} />
      </div>
      <div className="relative">
        <button
          className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shadow flex items-center justify-center bg-gray-100 hover:bg-gray-200"
          onClick={() => setOpen((v) => !v)}
        >
          {user?.image ? (
            <Image src={user.image} alt={user.name || "Profile"} width={40} height={40} className="object-cover" />
          ) : (
            <span className="text-gray-400 text-xl font-bold">{user?.name?.[0] || "U"}</span>
          )}
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50">
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
} 