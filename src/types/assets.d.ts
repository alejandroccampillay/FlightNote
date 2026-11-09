// Declaraciones de assets que Metro resuelve como módulos.
declare module '*.css';

declare module '*.sqlite' {
  const assetId: number;
  export default assetId;
}
