import Link from "next/link";
import { Card } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20">
      <Card>
        <h1 className="text-2xl font-black">Source not found</h1>
        <p className="mt-3 text-[var(--muted)]">The requested evidence item is not available in the current store.</p>
        <Link className="mt-5 inline-flex font-bold text-[var(--primary)]" href="/sources">Return to source library</Link>
      </Card>
    </div>
  );
}
