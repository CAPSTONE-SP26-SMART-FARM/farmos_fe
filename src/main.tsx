import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
// Apply Zod global error map sang tiếng Việt — phải import trước App để
// các form khởi tạo schema sau khi locale đã set.
import "./lib/zod-locale";
import App from "./App.tsx";
import { Toaster } from "./components/ui/sonner.tsx";
import RefreshToken from "./components/auth/RefreshToken.tsx";
import { ThemeProvider } from "./components/common/theme-provider.tsx";
import { queryClient } from "./lib/queryClient.ts";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider
    defaultTheme="light"
    storageKey="vite-ui-theme"
  >
    <QueryClientProvider client={queryClient}>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      <BrowserRouter>
        <App />
        <Toaster position="top-center" />
        <RefreshToken />
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>,
);
