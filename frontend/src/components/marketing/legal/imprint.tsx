import imprintData from "@/data/legal/imprint.json";
import companyData from "@/data/legal/company.json";

interface Section {
  title: string;
  content: string;
  representatives?: string;
  additionalContent?: string;
  link?: {
    text: string;
    url: string;
  };
}

export default function ImprintComponent() {
  // Helper function to replace placeholders with actual data
  const replacePlaceholders = (text: string): string => {
    if (!text) return '';
    
    return text.replace(/\{\{company\.([\w\.]+)\}\}/g, (match, path) => {
      const keys = path.split('.');
      let value: any = companyData;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return match; // Return original placeholder if path not found
        }
      }
      
      return value || match;
    });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-8">{imprintData.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {imprintData.lastUpdated}</p>

      {imprintData.sections.map((section: Section, index: number) => (
        <section key={index} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{section.title}</h2>
          <div className="whitespace-pre-line">{replacePlaceholders(section.content)}</div>
          
          {section.representatives && (
            <p className="mt-2">{replacePlaceholders(section.representatives)}</p>
          )}
          
          {section.additionalContent && (
            <p className="mt-2">{replacePlaceholders(section.additionalContent)}</p>
          )}
          
          {section.link && (
            <p className="mt-2">
              <a
                href={replacePlaceholders(section.link.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                {replacePlaceholders(section.link.text)}
              </a>
            </p>
          )}
        </section>
      ))}
    </div>
  );
}