/// <reference types="vite/client" />

declare module 'virtual:library' {
  const library: import('./lib/library').LibraryData;
  export default library;
}
