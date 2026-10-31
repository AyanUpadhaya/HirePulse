import React from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { ToastProvider } from "@/components/ui/Toast";
import { AuthGate } from "@/features/auth/AuthGate";

export function Providers({ children }) {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AuthGate>{children}</AuthGate>
      </ToastProvider>
    </Provider>
  );
}

