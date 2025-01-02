/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
    {
      type: 'doc',
      id: 'introduction',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'features',
      label: 'Features',
    },
    {
      type: 'category',
      label: 'User Guide',
      items: [
        'user-guide/getting-started',
        'user-guide/authentication',
        'user-guide/creating-videos',
        'user-guide/managing-projects',
      ],
    },
    {
      type: 'doc',
      id: 'pricing',
      label: 'Pricing',
    },
    {
      type: 'doc',
      id: 'enterprise',
      label: 'Enterprise',
    },
    {
      type: 'doc',
      id: 'faq',
      label: 'FAQ',
    },
  ],
  developerSidebar: [
    {
      type: 'doc',
      id: 'developer/getting-started',
      label: 'Getting Started',
    },
    {
      type: 'category',
      label: 'Integration Guide',
      items: [
        'developer/authentication',
        'developer/api-basics',
        'developer/webhooks',
        'developer/sdks',
      ],
    },
  ],
  apiSidebar: [
    {
      type: 'doc',
      id: 'api/overview',
      label: 'Overview',
    },
    {
      type: 'doc',
      id: 'api/authentication',
      label: 'Authentication',
    },
    {
      type: 'link',
      label: 'API Reference',
      href: '/api-docs',
    },
  ],
};

module.exports = sidebars; 