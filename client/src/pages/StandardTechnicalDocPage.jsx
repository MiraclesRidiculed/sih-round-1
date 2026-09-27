import { BookOpen, ExternalLink, FileText } from "lucide-react";

const StandardTechnicalDocPage = () => (
  <main className="mx-auto max-w-5xl space-y-6">
    <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#334155]">
        Implementation-based documentation
      </p>
      <h1 className="mt-2 text-3xl font-bold text-[#0B2545]">
        Land Stack Technical Documentation
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
        Describes the repository's current application architecture and behavior. It is not a
        government-approved specification or a claim of compliance with an external standard.
        Each section distinguishes implemented behavior from prototypes, simulations, plans, and gaps.
      </p>
    </header>

    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="rounded-xl bg-slate-100 p-3 text-[#0B2545]">
          <FileText size={22} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-lg font-bold text-[#0B2545]">Read the complete 32-section document</h2>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            The document covers architecture, data, APIs, roles, workflows, offline survey,
            deployment, security, and known limitations.
          </p>
          <a
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0B2545] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#16385f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
            href="/Land_Stack_Standard_Technical_Document.md"
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={16} aria-hidden="true" />
            Open technical document
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  </main>
);

export default StandardTechnicalDocPage;
