import StockReleaseApp from "@/components/stock-release-app";
import AuthGate from "@/components/auth-gate";
import { ErrorBoundary } from "@/components/error-boundary";

export default function Home() {
  return (
    <ErrorBoundary>
      <AuthGate>
        <StockReleaseApp />
      </AuthGate>
    </ErrorBoundary>
  );
}
