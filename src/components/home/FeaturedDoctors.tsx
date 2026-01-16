import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Doctor } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ArrowRight, Stethoscope } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedDoctors() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctors() {
      const { data, error } = await supabase
        .from('doctors' as never)
        .select('*')
        .eq('is_featured', true)
        .limit(4);
      
      if (!error && data) {
        setDoctors(data as unknown as Doctor[]);
      }
      setLoading(false);
    }
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-foreground">Top Doctors</h2>
              <p className="text-muted-foreground mt-2">Meet our featured healthcare professionals</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="font-serif text-3xl font-bold text-foreground">Top Doctors</h2>
            <p className="text-muted-foreground mt-2">Meet our featured healthcare professionals</p>
          </div>
          <Link to="/doctors">
            <Button variant="outline" className="gap-2">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.map((doctor) => (
            <Card key={doctor.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className="h-20 w-20 bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg">{doctor.name}</h3>
                <Badge variant="secondary" className="mt-2">
                  {doctor.specialization}
                </Badge>
                <div className="flex items-center justify-center gap-1 mt-3">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="text-sm font-medium text-foreground">{doctor.rating}</span>
                  <span className="text-sm text-muted-foreground">• {doctor.experience_years} yrs</span>
                </div>
                <Link to="/doctors" className="block mt-4">
                  <Button variant="secondary" size="sm" className="w-full">
                    Book Appointment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
