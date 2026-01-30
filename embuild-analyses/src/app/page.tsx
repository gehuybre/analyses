import { allAnalyses } from 'contentlayer/generated'
import { compareDesc, format, parseISO } from 'date-fns'
import { nl } from 'date-fns/locale'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const analyses = allAnalyses.sort((a, b) => {
    const dateA = a.sourcePublicationDate || a.date
    const dateB = b.sourcePublicationDate || b.date
    return compareDesc(new Date(dateA), new Date(dateB))
  })

  return (
    <main className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Analyses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {analyses.map((analysis) => (
          <Link href={analysis.url} key={analysis.slug}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <CardTitle>{analysis.title}</CardTitle>
                <CardDescription>
                  {format(parseISO(analysis.sourcePublicationDate || analysis.date), 'd MMMM yyyy', { locale: nl })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{analysis.summary}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {analysis.tags?.map(tag => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  )
}
