import Link from 'next/link';

const features = [
  {
    title: '100monkeys Execution Loop',
    description:
      'Agents run in a supervised generate → validate → refine cycle. Up to 10 iterations per execution with gradient-scored validation (0.0–1.0), not binary pass/fail.',
  },
  {
    title: 'Docker & Firecracker Runtimes',
    description:
      'Docker containers for local development. Firecracker micro-VMs for production — kernel-level isolation with sub-second cold starts and no shared kernel attack surface.',
  },
  {
    title: 'Secure Tool Access (SMCP)',
    description:
      'All MCP tool calls are proxied through the orchestrator with Ed25519-signed envelopes. Agents never hold credentials. Cedar-based policy rules enforced per call.',
  },
  {
    title: 'Declarative Agent Manifests',
    description:
      'Define agents as Kubernetes-style YAML: apiVersion, kind, metadata, spec. Set model, runtime, security policy, resource limits, and tool capabilities in one file.',
  },
  {
    title: 'Workflow FSMs',
    description:
      'Compose agents into durable finite state machines with a shared Blackboard context. States can be agent executions, system commands, or human approval gates.',
  },
  {
    title: 'Multi-Agent Swarms',
    description:
      'A parent agent can spawn child executions, pass messages between agents, and coordinate on shared resources using TTL-backed locks. Security context ceiling enforced at spawn.',
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-col items-center w-full">
      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 pt-20 pb-16 max-w-3xl">
        <div className="mb-4 inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          Open Source · AGPL 3.0
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-5">
          The orchestrator for autonomous AI agents
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed mb-8">
          AEGIS manages the full lifecycle of AI agents — from manifest deployment through iterative
          execution, secure tool access, workflow coordination, and multi-agent swarms. Agents run in
          isolated containers, tools are proxied through a signed security layer, and every execution
          is observed, scored, and learned from.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/docs/getting-started"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/docs"
            className="border border-border px-6 py-3 rounded-md font-medium hover:bg-muted transition-colors"
          >
            Read the Docs
          </Link>
        </div>
      </section>

      {/* Quick Start */}
      <section className="w-full max-w-3xl px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6 text-center">Quick Start</h2>
        <div className="rounded-lg border border-border bg-muted/40 overflow-hidden text-sm">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>bash</span>
          </div>
          <pre className="p-4 overflow-x-auto leading-relaxed text-foreground/90">
            <code>{`# 1. Install AEGIS
curl -fsSL https://raw.githubusercontent.com/100monkeys-ai/aegis-examples/main/install.sh | bash

# 2. Initialize local stack and config
aegis init

# 3. Execute hello-world (if deployed during init)
aegis task execute hello-world \\
  --input '{"task": "Write a Python function that returns the Fibonacci sequence up to n."}' \\
  --follow

# Output:
# 2026-02-25T13:56:43.091943Z  INFO Delegating to daemon API
# Executing agent 88b73d1b-0da0-4b92-9376-fd744b9cafbf...
# ✓ Execution started: f668f593-370f-4c19-b043-0487e9bd1ae5
# [2026-02-25T13:56:43.140898+00:00] Execution started
# [2026-02-25T13:56:43.164238272+00:00] Iteration 1
# [2026-02-25T13:57:34.455428513+00:00] LLM [default]
# [STDOUT] "First, I would write the required \`fib_sequence\` function in \`/workspace/solution.py\`:\n\n\`\`...`}</code>
          </pre>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Need more detail?{' '}
          <Link href="/docs/getting-started" className="underline underline-offset-4 hover:text-foreground">
            Full Getting Started guide →
          </Link>
        </p>
      </section>

      {/* Features */}
      <section className="w-full max-w-5xl px-4 pb-20">
        <h2 className="text-2xl font-bold mb-8 text-center">What AEGIS provides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-5 flex flex-col gap-2"
            >
              <h3 className="font-semibold text-sm">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
