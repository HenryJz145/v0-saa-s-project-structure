import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckSquare,
  Zap,
  Users,
  LayoutGrid,
  ArrowRight,
  Check,
  Github,
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <CheckSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Taskflow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
        <Badge variant="secondary" className="px-4 py-1">
          Now in public beta
        </Badge>
        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl lg:text-7xl">
          Manage projects with{' '}
          <span className="text-primary">clarity and speed</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground text-balance md:text-xl">
          Taskflow is the modern project management tool that helps teams organize work, 
          track progress, and deliver results faster with intuitive Kanban boards.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              Start for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="#features">
            <Button size="lg" variant="outline">
              See how it works
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to ship faster
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Powerful features to help your team stay organized and productive.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <LayoutGrid className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Kanban Boards</h3>
            <p className="mt-2 text-muted-foreground">
              Visualize your workflow with customizable Kanban boards. Drag and drop tasks 
              between columns to update status instantly.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Team Collaboration</h3>
            <p className="mt-2 text-muted-foreground">
              Work together seamlessly with real-time updates, task assignments, 
              comments, and file attachments.
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="mt-2 text-muted-foreground">
              Built for speed with optimistic updates and real-time sync. 
              Your changes reflect instantly across all team members.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Start for free, upgrade when you need more.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-xl font-semibold">Free</h3>
            <p className="mt-2 text-muted-foreground">Perfect for getting started</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['Up to 3 workspaces', 'Unlimited projects', 'Basic Kanban boards', 'Up to 5 team members'].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/sign-up">
              <Button className="w-full mt-6" variant="outline">
                Get started
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="rounded-lg border-2 border-primary bg-card p-6 relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most popular
            </Badge>
            <h3 className="text-xl font-semibold">Pro</h3>
            <p className="mt-2 text-muted-foreground">For growing teams</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$12</span>
              <span className="text-muted-foreground">/user/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['Unlimited workspaces', 'Advanced Kanban features', 'Custom fields', 'Priority support', 'Integrations'].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/sign-up">
              <Button className="w-full mt-6">
                Start free trial
              </Button>
            </Link>
          </div>

          {/* Business Plan */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-xl font-semibold">Business</h3>
            <p className="mt-2 text-muted-foreground">For large organizations</p>
            <div className="mt-4">
              <span className="text-4xl font-bold">$29</span>
              <span className="text-muted-foreground">/user/month</span>
            </div>
            <ul className="mt-6 space-y-3">
              {['Everything in Pro', 'SSO authentication', 'Advanced analytics', 'API access', 'Dedicated support'].map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Link href="/auth/sign-up">
              <Button className="w-full mt-6" variant="outline">
                Contact sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50">
        <div className="container py-24 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to streamline your workflow?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of teams already using Taskflow to deliver projects on time.
          </p>
          <Link href="/auth/sign-up">
            <Button size="lg" className="mt-8 gap-2">
              Get started for free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-primary" />
            <span className="font-semibold">Taskflow</span>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Built with Next.js and Supabase. Open source on{' '}
            <Link href="https://github.com" className="underline hover:text-foreground">
              GitHub
            </Link>
            .
          </p>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
