import Link from "next/link";
import { FolderKanban, Package, Tags, Utensils } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type MenuPageProps = {
  params: Promise<{ businessId: string }>;
};

export default async function MenuPage({ params }: MenuPageProps) {
  const { businessId } = await params;
  const basePath = `/dashboard/${businessId}/menu`;
  const sections = [
    {
      label: "Products",
      description: "Manage menu items, pricing, stock, and status.",
      href: `${basePath}/products`,
      icon: Package,
    },
    {
      label: "Categories",
      description: "Organize products into menu categories.",
      href: `${basePath}/categories`,
      icon: FolderKanban,
    },
    {
      label: "Tags",
      description: "Maintain tags used across products and categories.",
      href: `${basePath}/tags`,
      icon: Tags,
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-foodeez-primary/10 text-foodeez-primary">
              <Utensils className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-950">
                Menu Cards
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Use this menu hub to manage the products, categories, and tags
                that shape the restaurant menu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <Link key={section.label} href={section.href}>
              <Card className="h-full border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="font-semibold text-gray-950">
                    {section.label}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
