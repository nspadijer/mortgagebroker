/**
 * Mock implementation of @openai/apps-sdk/react
 * This is a temporary mock until the official SDK is published.
 *
 * Replace this with the real SDK once available:
 * npm install @openai/apps-sdk
 */

interface OpenAIContextType {
  tools: {
    call: (toolName: string, input: any) => Promise<any>;
  };
  ui: {
    showToast: (options: { title: string; description?: string }) => Promise<void>;
    openWebView: (options: { url: string; title: string }) => Promise<void>;
  };
}

export function useOpenAI(): OpenAIContextType {
  return {
    tools: {
      call: async (toolName: string, input: any) => {
        console.log(`🔧 Tool called: ${toolName}`, input);

        // Mock implementation - in production, this will call the real MCP server via ChatGPT
        // For now, simulate success responses
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

        switch (toolName) {
          case "submitLead":
            console.log(`✅ Lead captured: ${input.email}`);
            return { ok: true, message: "Lead captured successfully" };

          case "saveIntake":
            console.log(`✅ Intake saved: ${input.purpose}`);
            return { ok: true, message: "Intake data saved successfully" };

          case "startPrequalSession":
            console.log("🔗 Generated prequal session URL");
            return {
              url: "https://apply.newamericanfunding.com/apply/nikola-spadijer/account?utm_source=mortgagebroker_app&utm_medium=chatgpt&utm_campaign=prequal_flow",
              label: "Continue / Create Account",
              message: "Ready to proceed to secure application portal"
            };

          default:
            throw new Error(`Unknown tool: ${toolName}`);
        }
      }
    },
    ui: {
      showToast: async (options) => {
        console.log(`📢 Toast: ${options.title}`, options.description);
        // In a real app, this would show a toast notification
        // For now, just log to console and show browser alert in dev
        if (typeof window !== "undefined") {
          const message = options.description
            ? `${options.title}\n\n${options.description}`
            : options.title;
          alert(message);
        }
      },
      openWebView: async (options) => {
        console.log(`🌐 Opening webview: ${options.title} - ${options.url}`);
        // In a real app, this would open a webview inside ChatGPT
        // For dev, open in new tab
        if (typeof window !== "undefined") {
          window.open(options.url, "_blank");
        }
      }
    }
  };
}
