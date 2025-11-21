declare module "pdf-parse" {
  interface PdfParseResult {
    text: string;
    info?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
    [key: string]: unknown;
  }

  function pdfParse(data: Buffer, options?: Record<string, unknown>): Promise<PdfParseResult>;

  export default pdfParse;
}

declare module "pdf-parse/lib/pdf-parse.js" {
  import pdfParse from "pdf-parse";
  export default pdfParse;
}
