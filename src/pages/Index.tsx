import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedDoctors } from '@/components/home/FeaturedDoctors';
import { BlogSection } from '@/components/home/BlogSection';
import { FeaturesSection } from '@/components/home/FeaturesSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturedDoctors />
      <FeaturesSection />
      <BlogSection />
      
      {/* Footer */}
      <footer className="border-t border-border bg-card py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-serif text-lg font-bold text-foreground mb-4">CuraClinic</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered healthcare platform reducing missed appointments and improving patient outcomes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Find Doctors</li>
                <li>Book Appointment</li>
                <li>Health Reports</li>
                <li>Curax AI</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>support@curaclinic.com</li>
                <li>1-800-CURA-HELP</li>
                <li>24/7 AI Support Available</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 CuraClinic. All rights reserved. Built for better healthcare.
          </div>
        </div>
      </footer>
    </Layout>
  );
};

export default Index;
