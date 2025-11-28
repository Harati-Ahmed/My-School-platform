import { redirect } from "next/navigation";

/**
 * Admin root page - redirects to dashboard
 */
export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/admin/dashboard`);
}

