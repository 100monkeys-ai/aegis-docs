import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col justify-center text-center flex-1">
      <h1 className="text-4xl font-bold mb-4">Aegis Orchestrator</h1>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
        The cyber-biological architecture for infinitely scalable, recursively improving AI swarms.
      </p>
      <div className="mt-8">
        <Link href="/docs" className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium hover:bg-primary/90 transition-colors">
          View Documentation
        </Link>
      </div>
    </div>
  );
}
