
import React from 'react';
import { Warning, CloudRain } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SafetyTip {
  id: number;
  title: string;
  description: string;
}

const safetyTips: SafetyTip[] = [
  {
    id: 1,
    title: "Turn Around, Don't Drown",
    description: "Never drive through flooded roadways – just 6 inches of water can cause you to lose control of your vehicle."
  },
  {
    id: 2,
    title: "Stay Informed",
    description: "Keep checking the app for updates on rainfall intensity and flooded areas in real-time."
  },
  {
    id: 3,
    title: "Avoid Low-Lying Areas",
    description: "Areas under bridges, underpasses, and low-lying roads are especially vulnerable to flash flooding."
  },
  {
    id: 4,
    title: "Prepare an Emergency Kit",
    description: "Include water, non-perishable food, flashlight, first aid supplies, and a charged portable power bank."
  }
];

interface SafetyAlertProps {
  level?: 'warning' | 'danger' | 'info';
  message?: string;
}

const SafetyAlert: React.FC<SafetyAlertProps> = ({ 
  level = 'warning',
  message = 'Heavy rain expected in your area. Consider postponing non-essential travel.'
}) => {
  const alertClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    danger: 'bg-red-50 border-red-200 text-red-800 animate-pulse-alert'
  };

  const iconClasses = {
    info: 'text-blue-500',
    warning: 'text-amber-500',
    danger: 'text-red-500'
  };

  return (
    <div className="space-y-6">
      <Alert className={cn("border-l-4", alertClasses[level])}>
        <div className="flex items-start">
          <Warning className={cn("h-5 w-5 mr-2", iconClasses[level])} />
          <div>
            <AlertTitle className="text-lg font-semibold">Weather Alert</AlertTitle>
            <AlertDescription className="mt-1">{message}</AlertDescription>
          </div>
        </div>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudRain className="h-5 w-5 text-primary" />
            Safety Tips for Heavy Rain
          </CardTitle>
          <CardDescription>Important guidelines to keep you safe during extreme weather</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safetyTips.map((tip) => (
              <div key={tip.id} className="border rounded-lg p-4 bg-background">
                <h3 className="font-medium text-lg mb-1">{tip.title}</h3>
                <p className="text-sm text-muted-foreground">{tip.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <Button variant="outline" className="w-full sm:w-auto">
              View All Safety Guidelines
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SafetyAlert;
