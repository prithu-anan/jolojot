import React from "react";
import { CloudRain, Umbrella, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NavBar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudRain className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">জলজট</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <nav>
            <ul className="flex space-x-6">
              <li><Link to="/" className="font-medium hover:text-primary">Home</Link></li>
              <li><Link to="/map" className="font-medium hover:text-primary">Map</Link></li>
              <li><Link to="/routes" className="font-medium hover:text-primary">Route Planner</Link></li>
              <li><Link to="/safety" className="font-medium hover:text-primary">Safety Tips</Link></li>
            </ul>
          </nav>
          <Link to="/predict">
            <Button className="bg-primary hover:bg-primary/90 flex items-center gap-1">
              <Umbrella className="mr-1 h-4 w-4" />
              Predict Water-Level
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden container py-4 border-t bg-background">
          <nav>
            <ul className="flex flex-col space-y-4">
              <li><Link to="/" className="block font-medium hover:text-primary">Home</Link></li>
              <li><Link to="/map" className="block font-medium hover:text-primary">Map</Link></li>
              <li><Link to="/routes" className="block font-medium hover:text-primary">Route Planner</Link></li>
              <li><Link to="/safety" className="block font-medium hover:text-primary">Safety Tips</Link></li>
            </ul>
          </nav>
          <div className="mt-4">
            <Link to="/predict">
              <Button className="w-full bg-primary hover:bg-primary/90 flex items-center justify-center gap-1">
                <Umbrella className="mr-1 h-4 w-4" />
                Predict Water-Level
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
