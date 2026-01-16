import { Calendar, Bell, FileSearch, Bot, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Calendar,
    title: 'Easy Booking',
    description: 'Book appointments with your preferred doctors in seconds with our intuitive calendar system.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Never miss an appointment with automated email reminders at 1 hour, 30 min, and 10 min before.',
  },
  {
    icon: FileSearch,
    title: 'AI Report Analysis',
    description: 'Upload blood reports and get AI-powered insights with dietary and lifestyle recommendations.',
  },
  {
    icon: Bot,
    title: 'Curax AI Assistant',
    description: 'Chat with our medical AI buddy for personalized health guidance anytime, anywhere.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your health data is encrypted and protected with industry-leading security standards.',
  },
  {
    icon: Clock,
    title: '24/7 Access',
    description: 'Access your health records, appointments, and AI assistance around the clock.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-foreground">Why Choose CuraClinic?</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
            We combine cutting-edge AI technology with compassionate healthcare to deliver 
            an experience that reduces missed appointments and improves patient outcomes.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group hover:border-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
