'use client'

import { useMDXComponent } from 'next-contentlayer/hooks'
import { ProjectBrowser } from '@/components/analyses/bouwprojecten-gemeenten/ProjectBrowser'
import { TopProjectsByCategory } from '@/components/analyses/bouwprojecten-gemeenten/TopProjectsByCategory'

interface MDXContentProps {
  code: string
}

const mdxComponents = {
  ProjectBrowser,
  TopProjectsByCategory,
}

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={mdxComponents} />
}
