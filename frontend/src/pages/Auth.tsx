
import AuthForm from "@/components/auth/AuthForm";

export default function Auth() {
  return (
    <div className="container mx-auto py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Rain Route Refuge</h1>
        <p className="text-center mb-8 text-muted-foreground">
          Join our community to share and find information about location conditions
        </p>
        <AuthForm />
      </div>
    </div>
  );
}
