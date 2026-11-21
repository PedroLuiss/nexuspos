/// <reference types="vite/client" />

declare module 'bwip-js' {
  export interface ToSvgOptions {
    bcid: string
    text: string
    scale?: number
    height?: number
    width?: number
    includetext?: boolean
    textxalign?: string
    textsize?: number
    padding?: number
    backgroundcolor?: string
    [key: string]: unknown
  }

  export function toSVG(opts: ToSvgOptions): string
  export function toCanvas(canvas: unknown, opts: ToSvgOptions): unknown

  const bwipjs: {
    toSVG(opts: ToSvgOptions): string
    toCanvas(canvas: unknown, opts: ToSvgOptions): unknown
  }

  export default bwipjs
}
