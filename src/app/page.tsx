import StockReleaseApp from "@/components/stock-release-app";
import AuthGate from "@/components/auth-gate";

export default function Home() {
  return (
    <AuthGate>
      <StockReleaseApp />
    </AuthGate>
  );
}
