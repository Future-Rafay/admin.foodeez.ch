"use client"

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react';
import { Session } from 'next-auth';
import { useBusinessId } from '@/components/providers/BusinessProvider';
import UserProfile from './UserProfile';

const BUSINESS_ID_KEY = 'foodeez_business_id';

const Navbar = () => {
    const pathname = usePathname();
    const { data: session } = useSession();
    const contextBusinessId = useBusinessId();
    const [businessId, setBusinessId] = useState<string | null>(null);

    // Initialize from localStorage
    useEffect(() => {
        const storedId = localStorage.getItem(BUSINESS_ID_KEY);
        if (storedId) {
            setBusinessId(storedId);
        }
    }, []);

    // Update when context changes
    useEffect(() => {
        if (contextBusinessId) {
            setBusinessId(contextBusinessId);
        }
    }, [contextBusinessId]);

    const NAV_LINKS = [
        { name: "Home", href:`/dashboard/${businessId}`  },
        { name: "Products", href: `/dashboard/${businessId}/products` },
        { name: "Settings", href:  `/dashboard/${businessId}/settings`  },
    ];

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white shadow-md">
            <div className="flex items-center gap-2">
                <Link href="/dashboard">
                    <Image 
                        src="/images/Logo/LogoFoodeezMain.svg" 
                        alt="Foodeez Logo" 
                        width={120} 
                        height={120}
                        className="cursor-pointer" 
                    />
                </Link>
            </div>
            <div className="flex gap-6">
                {NAV_LINKS.map((link) => (
                    <Link
                        key={link.name}
                        href={link.href}
                        className={`text-base font-medium px-3 py-2 rounded hover:bg-[var(--foodeez-secondary)]/10 transition ${pathname === link.href ? "text-[var(--foodeez-primary)] underline" : "text-gray-700"}`}
                    >
                        {link.name}
                    </Link>
                ))}
                <UserProfile session={session as Session} />
            </div>
        </nav>
    )
}

export default Navbar