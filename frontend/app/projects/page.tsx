"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Folder, ArrowRight } from 'lucide-react'

export default function ProjectsPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto px-4 py-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground mt-2">
          Overview of all your tracked projects
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="max-w-2xl mx-auto mt-12">
        <CardContent className="pt-12 pb-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-engineer/10 flex items-center justify-center">
              <Folder className="h-12 w-12 text-engineer" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The projects overview page is under development. Soon you&apos;ll be able to see all your projects at a glance without clicking through each one.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
