"use client";

import { Bug, FileText, PawPrint, Scale, Stethoscope, Syringe } from "lucide-react";
import type { ReactNode } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TAB_ICONS = {
  overview: PawPrint,
  vaccines: Syringe,
  deworming: Bug,
  medical: Stethoscope,
  weight: Scale,
  documents: FileText,
} as const;

export type PetTabKey = keyof typeof TAB_ICONS;

const TAB_LABELS: Record<PetTabKey, string> = {
  overview: "Overview",
  vaccines: "Vaccines",
  deworming: "Deworming",
  medical: "Medical",
  weight: "Weight",
  documents: "Documents",
};

/**
 * Client-side tab chrome around server-rendered panels.
 *
 * Panels come in as `children` already rendered on the server, so switching
 * tabs is instant and no data fetching moves to the client.
 */
export function PetTabs({ panels }: { panels: Record<PetTabKey, ReactNode> }) {
  const keys = Object.keys(TAB_LABELS) as PetTabKey[];

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        {keys.map((key) => {
          const Icon = TAB_ICONS[key];
          return (
            <TabsTrigger key={key} value={key}>
              <Icon />
              <span className="hidden sm:inline">{TAB_LABELS[key]}</span>
            </TabsTrigger>
          );
        })}
      </TabsList>

      {keys.map((key) => (
        <TabsContent key={key} value={key}>
          {panels[key]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
