import type { LegalSection } from "@/content/terms";

export function ContentSections({ sections }: { sections: LegalSection[] }) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.heading}>
          <h2 className="mt-8 text-lg font-bold text-graphite md:text-xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <ul>
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}

export function AboutSections({
  sections,
}: {
  sections: { heading: string; paragraphs: string[]; bullets?: string[] }[];
}) {
  return (
    <>
      {sections.map((section) => (
        <div key={section.heading}>
          <h2 className="mt-8 text-lg font-bold text-graphite md:text-xl">{section.heading}</h2>
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {section.bullets && section.bullets.length > 0 && (
            <ul>
              {section.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </>
  );
}
