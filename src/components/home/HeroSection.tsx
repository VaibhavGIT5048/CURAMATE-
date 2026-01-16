import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Bot, Shield } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/10 py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              AI-Powered Healthcare
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Your Health, <br />
              <span className="text-primary">Our Priority</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-lg">
              Experience seamless healthcare with AI-powered appointment booking, 
              personalized health insights, and 24/7 access to your medical AI assistant.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/doctors">
                <Button size="lg" className="gap-2">
                  Book Appointment
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/curax">
                <Button size="lg" variant="outline" className="gap-2">
                  <Bot className="h-4 w-4" />
                  Chat with Curax AI
                </Button>
              </Link>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-foreground">12+</div>
                <div className="text-sm text-muted-foreground">Expert Doctors</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-3xl font-bold text-foreground">0%</div>
                <div className="text-sm text-muted-foreground">Missed Appointments</div>
              </div>
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 blur-3xl" />
            <div className="relative bg-card border border-border p-8 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground">Quick Booking</div>
                  <div className="text-sm text-muted-foreground">Book in under 60 seconds</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-3 bg-primary/20 w-full" />
                <div className="h-3 bg-primary/10 w-3/4" />
                <div className="h-3 bg-primary/10 w-1/2" />
              </div>
              <div className="mt-6 flex gap-2">
                <div className="h-10 w-10 bg-secondary" />
                <div className="h-10 w-10 bg-secondary" />
                <div className="h-10 w-10 bg-secondary" />
                <div className="h-10 w-10 bg-primary" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
