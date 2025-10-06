
"use client";

import { useUser } from "@/firebase/auth/use-user";
import StockReleaseApp from "@/components/stock-release-app";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex flex-col h-screen bg-muted/40">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
          <Skeleton className="h-8 w-8 rounded-md" />
          <div className="flex-1 flex items-center gap-2">
            <Skeleton className="h-6 w-6" />
            <Skeleton className="h-6 w-48" />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 overflow-auto pb-28">
           <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-72 mt-2" />
              </div>
              <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-10 w-full" />
            <div className="border rounded-lg">
              <Skeleton className="h-12 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full border-t" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return <StockReleaseApp />;
}
