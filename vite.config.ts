import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'
// import path from 'path'
// import dts from 'vite-plugin-dts'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Icons({
      autoInstall: true,
    }),
    Components({
      resolvers: [IconsResolver()],
    }),
    // dts(),
  ],
  /** Comment in to create a transpiled version of every component with typings
   ** that can be imported in javascript only environments
   ** Since I assume, that every project using vue has a build pipeline that understands vue and typescript files,
   ** the vue components can be imported direcly
   ** That way, they get transpiled using the users pipeline targeting their environment
   ** This is why I publish vue components only
   */
  // build: {
  //   lib: {
  //     entry: path.resolve('src/index.ts'),
  //     name: 'FuzzyUI',
  //     // fileName: (format) => `my-lib.${format}.js`
  //     formats: ['es'],
  //   },
  //   rollupOptions: {
  //     // input: entries,

  //     // make sure to externalize deps that shouldn't be bundled
  //     // into your library
  //     external: ['vue'],
  //     output: {
  //       // Provide global variables to use in the UMD build
  //       // for externalized deps
  //       globals: {
  //         vue: 'Vue',
  //       },
  //       // preserveModules: true,
  //       // entryFileNames: ({ name: fileName }) => {
  //       //   return `${fileName}.js`
  //       // },
  //       preserveModules: true,
  //       entryFileNames: '[name].js',
  //       format: 'es',
  //     },
  //   },
  // },
})
