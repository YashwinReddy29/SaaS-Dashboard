import Link from "next/link";
import { ArrowRight, BarChart3, Shield, Users, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Zap className="h-5 w-5 text-indigo-600" />
          SaaSify
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/register"
            className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          Multi-tenant SaaS with Stripe billing
        </div>
        <h1 className="text-5xl font-bold text-gray-900 tracking-tight mb-6">
          The dashboard your
          <br />
          <span className="text-indigo-600">team actually needs</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Manage projects, team members, and billing in one place. Built with Next.js, Prisma, and Stripe.
        </p>
        <div className="flex items-center gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="text-gray-600 px-6 py-3 hover:text-gray-900">
            Sign in →
          </Link>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-6 mt-24 text-left">
          {[
            { icon: Users, title: "Multi-Tenant", desc: "Each org gets isolated data, roles, and billing." },
            { icon: BarChart3, title: "Analytics", desc: "Real-time dashboards with project and member stats." },
            { icon: Shield, title: "Stripe Billing", desc: "Free, Pro, and Enterprise plans with webhooks." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 border rounded-xl">
              <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
