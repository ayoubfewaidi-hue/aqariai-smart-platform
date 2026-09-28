import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ brokerId }: { brokerId: string }) {
  return (
    <Link
      to="/verify/$brokerId"
      params={{ brokerId }}
      onClick={(e) => e.stopPropagation()}
      title="وسيط موثّق — اضغط للتحقق"
      className="inline-flex items-center gap-1 rounded-full border border-primary/60 bg-primary/15 px-2 py-0.5 text-[11px] font-black text-primary"
    >
      <BadgeCheck className="size-3.5" /> موثّق
    </Link>
  );
}
