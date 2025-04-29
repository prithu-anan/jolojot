
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "@/components/ui/sonner";

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully!");
    } catch (error: any) {
      toast.error(error.message || "Error signing out");
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-background border-b border-border">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Rain Route Refuge</h1>
          <nav className="flex gap-4 items-center">
            <Link to="/forum" className="hover:text-primary transition-colors">
              Forum
            </Link>
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden md:inline-block">
                      {user.email}
                    </span>
                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 bg-background">
          <div className="container mx-auto text-center px-4">
            <h2 className="text-4xl font-bold mb-6">Share & Discover Location Conditions</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with others to share real-time information about weather conditions,
              road status, and safety alerts in different locations.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/forum')}
                className="px-8"
              >
                Browse Forum
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/forum/create')}
                className="px-8"
              >
                Share Condition
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center">Features</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Location Conditions</h3>
                <p>
                  Get real-time updates about weather conditions, road status,
                  and safety alerts from community members.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Community Voting</h3>
                <p>
                  Vote on posts to highlight the most accurate and helpful information
                  about different locations.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3">Visual Evidence</h3>
                <p>
                  Share and view images of current conditions to get a clear picture
                  of what to expect at your destination.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card border-t border-border py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            © 2025 Rain Route Refuge | Community-powered location conditions
          </p>
        </div>
      </footer>
    </div>
  );
}
