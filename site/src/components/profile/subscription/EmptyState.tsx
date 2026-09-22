import Link from "next/link";
import { CreditCardIcon } from "@/components/icons";

export default function EmptyState() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
      <CreditCardIcon size={48} className="text-white/30 mx-auto mb-4" />
      <h4 className="text-lg font-medium text-white/70 mb-2">
        No Active Subscriptions
      </h4>
      <p className="text-white/50 mb-6">
        You don't have any active subscriptions yet. Browse our courses to
        get started.
      </p>
      <Link
        href="/courses"
        className="inline-flex items-center gap-2 px-6 py-3 bg-(--color-gold) text-black font-medium rounded-xl hover:bg-(--color-gold)/90 transition-all duration-200"
      >
        Browse Courses
      </Link>
    </div>
  );
}