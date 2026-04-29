import type { BunPressOptions } from '@stacksjs/bunpress'

const config: BunPressOptions = {
  verbose: false,
  docsDir: './docs',
  outDir: './dist',

  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/intro' },
    { text: 'Configuration', link: '/config' },
    { text: 'CLI', link: '/cli' },
    { text: 'API', link: '/api/logger' },
    {
      text: 'Ecosystem',
      items: [
        { text: 'STX Templating', link: 'https://stx.sh' },
        { text: 'Headwind CSS', link: 'https://headwind.sh' },
        { text: 'BunPress Docs', link: 'https://bunpress.sh' },
        { text: 'Pantry', link: 'https://pantry.sh' },
        { text: 'Stacks Framework', link: 'https://stacksjs.org' },
      ],
    },
    { text: 'GitHub', link: 'https://github.com/stacksjs/clarity' },
  ],

  markdown: {
    title: 'Clarity - Modern TypeScript Logging',
    meta: {
      description: 'A modern logging & debugging solution for TypeScript applications. Beautiful output, performance tracking, and production-ready features.',
      author: 'Stacks.js',
      keywords: 'logging, typescript, debugging, logger, console, performance',
    },

    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/intro' },
            { text: 'Installation', link: '/install' },
            { text: 'Configuration', link: '/config' },
          ],
        },
        {
          text: 'Usage',
          items: [
            { text: 'Basic Usage', link: '/usage' },
            { text: 'CLI Commands', link: '/cli' },
            { text: 'Library Usage', link: '/library' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Log Levels', link: '/features/logging' },
            { text: 'Formatting', link: '/features/formatting' },
            { text: 'Log Rotation', link: '/features/rotation' },
            { text: 'Encryption', link: '/features/encryption' },
            { text: 'Performance', link: '/features/performance' },
          ],
        },
        {
          text: 'API Reference',
          items: [
            { text: 'Logger', link: '/api/logger' },
            { text: 'Configuration', link: '/api/config' },
            { text: 'Colors', link: '/api/colors' },
            { text: 'Format', link: '/api/format' },
            { text: 'Types', link: '/api/types' },
            { text: 'Utilities', link: '/api/utils' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Formatters', link: '/advanced/formatters' },
            { text: 'Storage', link: '/advanced/storage' },
            { text: 'Configuration', link: '/advanced/configuration' },
            { text: 'Integrations', link: '/advanced/integrations' },
          ],
        },
        {
          text: 'Resources',
          items: [
            { text: 'Showcase', link: '/showcase' },
            { text: 'Team', link: '/team' },
            { text: 'Sponsors', link: '/sponsors' },
          ],
        },
      ],
    },

    toc: {
      enabled: true,
      position: 'sidebar',
      title: 'On this page',
      minDepth: 2,
      maxDepth: 4,
      smoothScroll: true,
      activeHighlight: true,
    },

    syntaxHighlightTheme: 'github-dark',

    features: {
      containers: true,
      githubAlerts: true,
      codeBlocks: {
        lineNumbers: true,
        lineHighlighting: true,
        focus: true,
        diffs: true,
        errorWarningMarkers: true,
      },
      codeGroups: true,
      emoji: true,
      badges: true,
    },
  },

  sitemap: {
    enabled: true,
    baseUrl: 'https://clarity.sh',
    priorityMap: {
      '/': 1.0,
      '/intro': 0.9,
      '/install': 0.9,
      '/usage': 0.8,
      '/config': 0.8,
      '/cli': 0.8,
      '/features/*': 0.7,
      '/api/*': 0.7,
      '/advanced/*': 0.6,
    },
  },

  robots: {
    enabled: true,
    rules: [
      {
        userAgent: '*',
        allow: ['/'],
        disallow: ['/draft/'],
      },
    ],
  },

  fathom: {
    enabled: true,
    siteId: 'CLARITY',
    honorDNT: true,
  },
}

export default config
