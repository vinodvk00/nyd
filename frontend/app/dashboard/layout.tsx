export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Time Tracking Analytics</h1>
              <p className="text-sm text-muted-foreground">
                Insights from your Toggl Track data
              </p>
            </div>
          </div>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
