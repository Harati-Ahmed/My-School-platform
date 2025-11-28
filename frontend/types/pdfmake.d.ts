declare module 'pdfmake/interfaces' {
  export interface Content {}
  export interface StyleDictionary {}
  export interface TDocumentDefinitions {}
}

declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: any;
  export default vfs;
}

