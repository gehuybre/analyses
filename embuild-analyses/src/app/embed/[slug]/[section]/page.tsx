import { EmbedClient } from "./EmbedClient"
import { getAllEmbedParams } from "@/lib/embed-config"
import { EmbedErrorBoundary } from "@/components/EmbedErrorBoundary"

// Auto-generate all embeddable sections from centralized config
export function generateStaticParams() {
  return getAllEmbedParams()
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string; section: string }>
}) {
  const { slug, section } = await params

  // View type and filters are handled client-side via URL query params
  // Wrap in error boundary to catch and display rendering failures gracefully
  return (
    <EmbedErrorBoundary>
      <EmbedClient slug={slug} section={section} />
    </EmbedErrorBoundary>
  )
}
