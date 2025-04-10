import cookiePolicyData from '@/data/legal/cookie-policy.json';

interface CookieType {
  name: string;
  description: string;
}

interface Link {
  text: string;
  url: string;
}

interface Section {
  title: string;
  content: string;
  additionalContent?: string;
  cookieTypes?: CookieType[];
  link?: Link;
}

interface CookiePolicyData {
  title: string;
  lastUpdated: string;
  sections: Section[];
}

export default function CookiePolicyComponent() {
  const policyData = cookiePolicyData as CookiePolicyData;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{policyData.title}</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {policyData.lastUpdated}</p>

      {policyData.sections.map((section: Section, index: number) => (
        <section key={index} className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
          <div className="prose max-w-none">
            <p className="mb-4">{section.content}</p>
          </div>

          {section.additionalContent && (
            <div className="mt-4">
              <p className="mb-4">{section.additionalContent}</p>
            </div>
          )}

          {section.cookieTypes && (
            <div className="mt-6">
              <h3 className="text-xl font-medium mb-4">Types of Cookies We Use</h3>
              <div className="grid gap-4">
                {section.cookieTypes.map((type: CookieType, tIndex: number) => (
                  <div key={tIndex} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">{type.name}</h4>
                    <p className="text-sm text-gray-400">{type.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.link && (
            <div className="mt-6">
              <a href={section.link.url} className="text-blue-600 hover:underline">
                {section.link.text}
              </a>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}