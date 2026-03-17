'use client'

import { useMDXComponent } from 'next-contentlayer/hooks'
import { ProjectBrowser } from '@/components/analyses/bouwprojecten-gemeenten/ProjectBrowser'
import { TopProjectsByCategory } from '@/components/analyses/bouwprojecten-gemeenten/TopProjectsByCategory'
import { InvesteringenDashboard } from '@/components/analyses/gemeentelijke-investeringen/InvesteringenDashboard'

interface MDXContentProps {
  code: string
}

const mdxComponents = {
  InvesteringenDashboard,
  ProjectBrowser,
  TopProjectsByCategory,
}

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={mdxComponents} />
}
