import { Dashboard } from "@/components/dashboard"

export default function Home() {
  return (
    <div className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            Local LLM Manager
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your llama.cpp server instances
          </p>
        </header>
        <Dashboard />
      </div>
    </div>
  )
}
