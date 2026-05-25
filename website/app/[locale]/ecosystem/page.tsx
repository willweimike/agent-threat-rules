/* /ecosystem is retained only as a permanent redirect to /implementers.
 * The old marketing layout has been replaced by the formal Implementer
 * Report at /implementers. Any inbound link to /ecosystem (badges,
 * external references, search-engine results) lands at the new URL.
 */
import { redirect } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function EcosystemRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = (locales.includes(raw as Locale) ? raw : "en") as Locale;
  redirect(`/${locale}/implementers`);
}
