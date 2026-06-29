import EditBookClient from "./EditBookClient";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditBookClient id={id} />;
}
