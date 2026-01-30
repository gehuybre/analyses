"use client"

// CACHE BUSTER v3.0 - Switched from scatter to distribution view
import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InvesteringenBVSection } from "./InvesteringenBVSection"
import { InvesteringenBVDifferenceSection } from "./InvesteringenBVDifferenceSection"
import { InvesteringenBVTopFieldsSection } from "./InvesteringenBVTopFieldsSection"
import { InvesteringenREKSection } from "./InvesteringenREKSection"
import { InvesteringenBVCategorySection } from "./InvesteringenBVCategorySection"
import { InvesteringenREKCategorySection } from "./InvesteringenREKCategorySection"

export function InvesteringenDashboard() {
  return (
    <div className="space-y-16">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rapportjaren</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2014, 2020, 2026</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Gemeenten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">285</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Perspectieven</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">BV & REK</div>
          </CardContent>
        </Card>
      </div>

      <div id="investments-bv" className="scroll-mt-20">
        <InvesteringenBVSection />
      </div>

      <div className="border-t pt-16" id="investments-bv-difference">
        <InvesteringenBVDifferenceSection />
      </div>

      <div className="border-t pt-16" id="investments-bv-top-fields">
        <InvesteringenBVTopFieldsSection />
      </div>

      <div className="border-t pt-16" id="bv-category-breakdown">
        <InvesteringenBVCategorySection />
      </div>

      <div className="border-t pt-16" id="investments-rek">
        <InvesteringenREKSection />
      </div>

      <div className="border-t pt-16" id="rek-category-breakdown">
        <InvesteringenREKCategorySection />
      </div>

      {/* Histograms removed per request: BV and REK distribution sections */}
    </div>
  )
}
