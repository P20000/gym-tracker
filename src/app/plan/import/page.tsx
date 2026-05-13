import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportPageClient from "./ImportPageClient";

export const metadata = {
  title: "Import Workout Plan | Gym Tracker",
  description: "Paste raw workout notes and bulk-import your weekly split via regex parsing.",
};

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden p-6">
      {/* Background radial accent */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <ImportPageClient />
    </main>
  );
}
