import { BrowserRouter } from "react-router-dom";

import { PwaLifecycle } from "./components/PwaLifecycle";
import { AuthProvider } from "./contexts/AuthContext";
import { AppRouter } from "./router";

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PwaLifecycle />
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}
