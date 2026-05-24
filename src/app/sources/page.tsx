import { SourceLibrary } from "@/components/source-library";
import { listDocuments } from "@/lib/store";

export default async function SourcesPage() {
  const docs = await listDocuments(100);
  return <SourceLibrary docs={docs} />;
}
