import { allAnalyses } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { MDXContent } from '@/components/mdx-content'
import { AnalysisLayout } from '@/components/analyses/AnalysisLayout'

export const generateStaticParams = async () => {
  return allAnalyses.map((analysis) => ({ slug: analysis.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const analysis = allAnalyses.find((analysis) => analysis.slug === slug)
  if (!analysis) return { title: 'Analysis Not Found' }
  return { title: analysis.title }
}

export default async function AnalysisPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const analysis = allAnalyses.find((analysis) => analysis.slug === slug)

  if (!analysis) notFound()

  return (
    <AnalysisLayout
      title={analysis.title}
      date={analysis.sourcePublicationDate || analysis.date}
      summary={analysis.summary}
      tags={analysis.tags}
      source={{
        provider: analysis.sourceProvider,
        title: analysis.sourceTitle,
        url: analysis.sourceUrl,
        publicationDate: analysis.sourcePublicationDate,
      }}
      hideBackLink={slug === 'betaalbaar-arr'}
    >
      <MDXContent code={analysis.body.code} />
    </AnalysisLayout>
  )
}
