import { EmbedAutoResize } from "@/components/EmbedAutoResize"

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-background">
      <EmbedAutoResize />
      {children}
    </div>
  )
}

