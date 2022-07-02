import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Fuzzy UI',
  lang: 'en-US',
  description: 'A minimal vue component library',
  base: '/fuzzy-ui/',
  lastUpdated: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/fuzzyma/fuzzy-ui' },
    ],
    nav: [
      {
        text: 'Home',
        link: '/',
      },
      {
        text: 'Docs',
        link: '/docs.md',
      },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2022-present Ulrich-Matthias Schäfer'
    },
    editLink: {
      pattern: 'https://github.com/fuzzyma/fuzzy-ui/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    },
    lastUpdatedText: 'Updated Date'
  },
})
