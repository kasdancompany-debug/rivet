type LegalSection = {
  readonly heading: string
  readonly body: readonly string[]
}

export function LegalBodySections({ sections }: { sections: readonly LegalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.heading} className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">{section.heading}</h2>
          <div className="space-y-3">
            {section.body.map((p, i) => (
              <p key={`${section.heading}-${i}`}>{p}</p>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}
