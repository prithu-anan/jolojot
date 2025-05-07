
import React from 'react';
import { CloudRain } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t mt-16 py-8 bg-background">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <CloudRain className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">RainRoute</span>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
            <nav>
              <ul className="flex flex-wrap justify-center gap-6">
                <li><a href="#" className="text-sm hover:text-primary">Home</a></li>
                <li><a href="#" className="text-sm hover:text-primary">About</a></li>
                <li><a href="#" className="text-sm hover:text-primary">Safety</a></li>
                <li><a href="#" className="text-sm hover:text-primary">Contact</a></li>
              </ul>
            </nav>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">© 2025 RainRoute. All rights reserved.</p>
            <div className="mt-4 md:mt-0">
              <p className="text-xs text-muted-foreground">
                For emergencies, always call your local emergency services. This app provides guidance but does not replace official warnings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
