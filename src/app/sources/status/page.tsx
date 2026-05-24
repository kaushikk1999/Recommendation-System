import { DataSourcesStatus } from "@/components/source-library";
import { getDataSourcesStatus } from "@/lib/source-status";

export default async function DataSourcesStatusPage() {
  const status = await getDataSourcesStatus();
  return <DataSourcesStatus {...status} />;
}
