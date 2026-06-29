"use client";

import type { LucideIcon } from "lucide-react";
import { Float, ScaleIn } from "@/components/layout/motion";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <ScaleIn>
      <Card className="overflow-hidden border-dashed">
        <CardContent className="relative flex flex-col items-center justify-center py-16 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20" />
          <Float className="relative mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 shadow-inner dark:bg-indigo-950/60">
              <Icon className="h-8 w-8 text-indigo-400" />
            </div>
          </Float>
          <h2 className="relative text-lg font-medium">{title}</h2>
          <p className="relative mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
          {children && <div className="relative mt-6 flex gap-3">{children}</div>}
        </CardContent>
      </Card>
    </ScaleIn>
  );
}
