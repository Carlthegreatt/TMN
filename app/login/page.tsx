import Mark from "@/components/Mark";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ground p-4">
      <div className="flex items-center gap-2 text-lg font-semibold"><Mark />TMN HR</div>
      <LoginForm />
    </main>
  );
}
