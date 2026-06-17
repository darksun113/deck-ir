export interface ParseOptions {
  /** Customize each image's src. Default: inline data: URL. */
  mediaResolver?: (id: string, media: { buffer: Uint8Array; mimeType: string }) => string;
  /** Warning sink. Default: swallow. */
  logger?: { warn: (msg: string) => void };
}

export interface ParsedDeck {
  slideSize: { w: number; h: number };
  slides: Array<{ html: string; warnings: string[] }>;
  media: Map<string, { buffer: Uint8Array; mimeType: string }>;
}
