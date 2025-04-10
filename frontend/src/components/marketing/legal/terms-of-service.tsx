import termsData from '@/data/legal/terms-of-service.json';
import companyData from '@/data/legal/company.json';

interface Definition {
  term: string;
  meaning: string;
}

interface Contact {
  email: string;
  address: string;
}

interface Section {
  title: string;
  content: string;
  additionalContent?: string;
  definitions?: Definition[];
  prohibitions?: string[];
  contact?: Contact;
}

interface TermsOfServiceData {
  title: string;
  lastUpdated: string;
  sections: Section[];
}

export default function TermsOfServiceComponent() {
  const policyData = termsData as TermsOfServiceData;

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

  // Handle Mustache conditionals {{#property}}content{{/property}}
  const processConditional = (text: string): string => {
    if (!text) return '';
    
    const conditionalRegex = /\{\{#([\w\.]+)\}\}(.*?)\{\{\/\1\}\}/g;
    
    return text.replace(conditionalRegex, (match, property, content) => {
      const keys = property.split('.');
      let value: any = companyData;
      
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          value = undefined;
          break;
        }
      }
      
      // If the property exists and has a truthy value, include the content
      return value ? content : '';
    });
  };

  // Combine both placeholder replacement and conditional processing
  const processText = (text: string): string => {
    if (!text) return '';
    const processedConditionals = processConditional(text);
    return replacePlaceholders(processedConditionals);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{policyData.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: {policyData.lastUpdated}</p>

      {policyData.sections.map((section: Section, index: number) => (
        <section key={index} className="mb-10">
          <h2 className="text-xl font-semibold mb-4 text-foreground/90">{section.title}</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="mb-4 text-foreground/80 leading-relaxed">{processText(section.content)}</p>
          </div>

          {section.additionalContent && (
            <div className="mt-4">
              <p className="mb-4 text-foreground/70 leading-relaxed">{processText(section.additionalContent)}</p>
            </div>
          )}

          {section.definitions && (
            <div className="mt-6 space-y-4 bg-muted/30 p-4 rounded-lg">
              {section.definitions.map((def: Definition, dIndex: number) => (
                <div key={dIndex} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <h4 className="font-medium mb-1">{def.term}</h4>
                  <p className="text-sm text-muted-foreground">{processText(def.meaning)}</p>
                </div>
              ))}
            </div>
          )}

          {section.prohibitions && (
            <div className="mt-6">
              <ul className="list-disc pl-5 space-y-2">
                {section.prohibitions.map((item: string, pIndex: number) => (
                  <li key={pIndex} className="text-foreground/70">{item}</li>
                ))}
              </ul>
            </div>
          )}

          {section.contact && (
            <div className="mt-6 bg-muted/30 p-4 rounded-lg">
              <p className="mb-2">
                <span className="font-medium">Email:</span>{" "}
                <a href={`mailto:${processText(section.contact.email)}`} className="text-primary hover:underline">
                  {processText(section.contact.email)}
                </a>
              </p>
              <p>
                <span className="font-medium">Address:</span>{" "}
                <span className="text-foreground/70">{processText(section.contact.address)}</span>
              </p>
            </div>
          )}
        </section>
      ))}
    </div>
  );
} 