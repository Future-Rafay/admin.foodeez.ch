import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <Card className="border-gray-200 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Settings className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-950">Settings</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Settings management is not enabled yet. Contact support to update
              business information or operational settings.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
