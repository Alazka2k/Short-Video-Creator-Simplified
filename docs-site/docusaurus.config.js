// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const {themes} = require('prism-react-renderer');
const lightCodeTheme = themes.github;
const darkCodeTheme = themes.dracula;

// Get the docs URL from environment or use default
const docsUrl = process.env.DOCS_URL || 'http://localhost:4001';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Short Video Creator',
  tagline: 'Transform Your Content Creation with AI',
  favicon: 'img/favicon.ico',

  url: docsUrl,
  baseUrl: '/',

  organizationName: 'your-org',
  projectName: 'short-video-creator',

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',
          breadcrumbs: true,
          showLastUpdateTime: true,
          showLastUpdateAuthor: true,
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      docs: {
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
      metadata: [
        {name: 'keywords', content: 'video creation, AI video, content creation, automated video generation'},
        {name: 'description', content: 'Transform your content creation with AI-powered video generation'},
      ],
      navbar: {
        title: 'Short Video Creator',
        logo: {
          alt: 'Short Video Creator Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            to: '/introduction',
            position: 'left',
            label: 'Overview',
          },
          {
            to: '/features',
            position: 'left',
            label: 'Features',
          },
          {
            to: '/user-guide',
            position: 'left',
            label: 'User Guide',
          },
          {
            to: '/developer/getting-started',
            position: 'left',
            label: 'For Developers',
          },
          {
            to: '/api/overview',
            position: 'left',
            label: 'API',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Product',
            items: [
              {
                label: 'Overview',
                to: '/introduction',
              },
              {
                label: 'Features',
                to: '/features',
              },
              {
                label: 'Pricing',
                to: '/pricing',
              },
              {
                label: 'Enterprise',
                to: '/enterprise',
              },
            ],
          },
          {
            title: 'Resources',
            items: [
              {
                label: 'User Guide',
                to: '/user-guide',
              },
              {
                label: 'API Documentation',
                to: '/api/overview',
              },
              {
                label: 'Developer Guide',
                to: '/developer/getting-started',
              },
            ],
          },
          {
            title: 'Support',
            items: [
              {
                label: 'FAQ',
                to: '/faq',
              },
              {
                label: 'Help Center',
                to: '/help',
              },
              {
                label: 'Contact Sales',
                to: '/contact',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Short Video Creator`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
        additionalLanguages: ['bash', 'json', 'yaml'],
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 4,
      },
    }),
};

module.exports = config; 