import { Suspense } from "react";
import PlanDetailClient from "./PlanDetailClient";

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading plan...</p>}>
      <PlanDetailClient id={id} />
    </Suspense>
  );
}
