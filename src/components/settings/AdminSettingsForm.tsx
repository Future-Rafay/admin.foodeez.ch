"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, X, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { BusinessInfo } from "@/services/settings-management";

type ToastState = {
  type: "success" | "error";
  message: string;
} | null;

interface AdminSettingsFormProps {
  businessId: number;
  businessInfo: BusinessInfo;
  initialDeliveryAreas: string;
}

function parseAreas(value: string) {
  return value
    .split(",")
    .map((area) => area.trim())
    .filter(Boolean);
}

export default function AdminSettingsForm({
  businessId,
  businessInfo,
  initialDeliveryAreas,
}: AdminSettingsFormProps) {
  const [deliveryAreas, setDeliveryAreas] = useState(initialDeliveryAreas);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const areas = useMemo(() => parseAreas(deliveryAreas), [deliveryAreas]);

  function removeArea(areaToRemove: string) {
    setDeliveryAreas(
      areas.filter((area) => area !== areaToRemove).join(", ")
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setToast(null);

    try {
      const response = await fetch(`/api/dashboard/${businessId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryAreas }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to save settings");
      }

      const saved = (await response.json()) as { deliveryAreas: string } | null;
      setDeliveryAreas(saved?.deliveryAreas || "");
      setToast({ type: "success", message: "Settings saved successfully." });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={
            toast.type === "success"
              ? "fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 shadow-lg"
              : "fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-lg"
          }
          role="status"
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="size-4" />
          ) : (
            <XCircle className="size-4" />
          )}
          {toast.message}
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-2 rounded p-0.5 hover:bg-black/5"
            aria-label="Dismiss notification"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-gray-950">
            Delivery Areas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="deliveryAreas">
              Delivery Areas (comma separated)
            </Label>
            <Textarea
              id="deliveryAreas"
              value={deliveryAreas}
              onChange={(event) => setDeliveryAreas(event.target.value)}
              placeholder="DHA Phase 1, Clifton, Gulshan-e-Iqbal"
              rows={5}
            />
            <p className="text-sm text-gray-500">
              Enter the areas where you deliver, separated by commas
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="mb-3 text-sm font-medium text-gray-700">
              Live preview
            </p>
            {areas.length ? (
              <div className="flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Badge
                    key={area}
                    variant="outline"
                    className="gap-1 border-foodeez-primary/20 bg-white text-gray-800"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(area)}
                      className="rounded-full text-gray-500 hover:text-red-600"
                      aria-label={`Remove ${area}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Add areas above to preview them here.
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-foodeez-primary text-white hover:bg-foodeez-secondary"
          >
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="border-b border-gray-100 px-5 py-4">
          <CardTitle className="text-lg font-semibold text-gray-950">
            Business Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business name</Label>
              <Input id="businessName" value={businessInfo.name} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" value={businessInfo.email} readOnly />
            </div>
          </div>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Contact support to update business info
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
