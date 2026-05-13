import LoginForm from "./login-form";

export const metadata = {
  title: "Login | Gym Tracker",
  description: "Secure, passwordless login to your fitness intelligence platform.",
};

export default function LoginPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4 relative overflow-hidden bg-background">
      {/* Sleek background glow animations */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[250px] h-[250px] bg-accent/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Main card wrapper */}
      <div className="z-10 w-full flex justify-center">
        <LoginForm />
      </div>

      {/* Bottom accent brand */}
      <div className="absolute bottom-6 text-center text-xs text-muted-foreground z-10 font-medium uppercase tracking-widest pointer-events-none opacity-40">
        ⚡ Gym Tracker Engine v1.0
      </div>
    </main>
  );
}
