"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  href: string;
}

export function StatsCard({ title, value, description, icon: Icon, href }: StatsCardProps) {
  return (
    <Link href={href} className="group block rounded-lg shadow hover:shadow-lg transition-all duration-200">
      <Card className="border-foodeez-primary/20 group-hover:border-foodeez-primary h-full">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-foodeez-primary/10 p-3">
              <Icon className="w-6 h-6 text-foodeez-primary" />
            </div>
            <div>
              <div className="text-lg font-semibold text-foodeez-primary group-hover:underline">
                {title}
              </div>
              <div className="text-gray-500 text-sm">{description}</div>
              <div className="mt-2 text-2xl font-bold text-foodeez-primary">
                {value}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
} 