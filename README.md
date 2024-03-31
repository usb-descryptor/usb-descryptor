# USB Descryptor

This project aims to help developers compose USB descriptors for their USB devices. It is a web application that allows users to create USB descriptors by filling out forms and then generates the corresponding C code.

This project is very much a work in progress. The goal is to support all USB descriptors and provide a user-friendly interface for creating them.

Help is always welcome! If you would like to contribute, please file a pull request.

In particular, the following features are needed:

- Support for more USB descriptors
- Upload for JSON files
- Light UI mode
- More output formats
- Unit and integration tests

A compiled version is available at [https://usb-descryptor.github.io/](https://usb-descryptor.github.io/).

# Development

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
