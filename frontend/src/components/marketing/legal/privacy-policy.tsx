import privacyPolicyData from '@/data/legal/privacy-policy.json';
import companyData from '@/data/legal/company.json';

export default function PrivacyPolicyComponent() {
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
    <div className="container px-4 md:px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">{privacyPolicyData.title}</h1>
      
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-6">
          Last updated: {privacyPolicyData.lastUpdated}
        </p>
        
        {privacyPolicyData.sections.map((section, index) => (
          <section key={index} className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
            <p>{replacePlaceholders(section.content)}</p>
            
            {section.dataTypes && (
              <ul className="list-disc pl-6 mt-2">
                {section.dataTypes.map((dataType, idx) => (
                  <li key={idx}>
                    <strong>{dataType.name}:</strong> {dataType.description}
                  </li>
                ))}
              </ul>
            )}
            
            {section.thirdParties && (
              <ul className="list-disc pl-6 mt-2">
                {section.thirdParties.map((party, idx) => (
                  <li key={idx}>
                    <strong>{party.name}:</strong> {party.purpose}
                  </li>
                ))}
              </ul>
            )}
            
            {section.additionalContent && (
              <p className="mt-2">{replacePlaceholders(section.additionalContent)}</p>
            )}
            
            {section.uses && (
              <ul className="list-disc pl-6 mt-2">
                {section.uses.map((use, idx) => (
                  <li key={idx}>{use}</li>
                ))}
              </ul>
            )}
            
            {section.rights && (
              <ul className="list-disc pl-6 mt-2">
                {section.rights.map((right, idx) => (
                  <li key={idx}>{right}</li>
                ))}
              </ul>
            )}
            
            {section.authority && (
              <div className="mt-2">
                <p><strong>{section.authority.name}</strong></p>
                <p>{section.authority.address}</p>
                <p><a href={section.authority.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {section.authority.website}
                </a></p>
              </div>
            )}
            
            {section.title.includes("Contact Us") && (
              <p className="mt-2">
                <strong>Email:</strong> {companyData.contact.email}<br />
                <strong>Phone:</strong> {companyData.contact.phone}<br />
                <strong>Address:</strong> {companyData.name}, {companyData.address.street}, {companyData.address.postalCode} {companyData.address.city}, {companyData.address.country}
              </p>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}