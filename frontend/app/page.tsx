import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <main className="flex flex-col items-center gap-8 text-center px-4">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Time Tracking Analytics
          </h1>
          <p className="text-lg text-muted-foreground max-w-md">
            Visualize and analyze your Toggl Track data with beautiful charts and insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/dashboard">
              View Dashboard
            </Link>
          </Button>
          <Button asChild variant="default" size="lg">
            <Link href="/audits">
              Time Awareness Audit
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
            </a>
          </Button>
        </div>

        <div className="mt-8 p-6 rounded-lg border bg-card text-left max-w-md">
          <h3 className="font-semibold mb-2">Features:</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>✓ Summary statistics with trends</li>
            <li>✓ Activity timeline visualization</li>
            <li>✓ Project breakdown analysis</li>
            <li>✓ Hourly productivity patterns</li>
            <li>✓ Top projects leaderboard</li>
            <li>🆕 Time Awareness Audit (Eisenhower Matrix)</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
