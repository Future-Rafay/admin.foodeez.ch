import Image from 'next/image'
import React from 'react'

const DashboardFooter = () => {
    return (
        <footer className="bg-white shadow-inner py-4 mt-auto">
            <div className="flex items-center justify-center gap-10">
                <Image src="/images/Logo/LogoFoodeezMain.svg" alt="Foodeez Logo" width={100} height={100} />
                <span className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Foodeez. All rights reserved.</span>
            </div>
        </footer>
    )
}

export default DashboardFooter