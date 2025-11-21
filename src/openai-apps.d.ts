export type WidgetToastTone = "info" | "success" | "warning" | "error";

type OpenAIWebViewOptions = {
  url: string;
  title?: string;
};

type OpenAIToastOptions = {
  title: string;
  description?: string;
  tone?: WidgetToastTone;
};

export interface OpenAIClientBridge {
  callTool?: <T = unknown>(name: string, payload?: unknown) => Promise<T>;
  toolOutput?: Record<string, unknown>;
  ui?: {
    showToast?: (options: OpenAIToastOptions) => Promise<void> | void;
    openWebView?: (options: OpenAIWebViewOptions) => Promise<void> | void;
  };
}

declare global {
  interface Window {
    openai?: OpenAIClientBridge;
  }
}

export {};
