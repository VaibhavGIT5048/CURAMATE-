import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Doctor, Profile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, Search, Stethoscope, Clock, DollarSign, UserPlus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { BookingDialog } from '@/components/doctors/BookingDialog';
import { AddDoctorDialog } from '@/components/doctors/AddDoctorDialog';

const specializations = [
  'All Specializations',
  'Cardiologist',
  'General Physician',
  'Dermatologist',
  'Orthopedic Surgeon',
  'Pediatrician',
  'Neurologist',
  'Gynecologist',
  'Psychiatrist',
  'Endocrinologist',
  'Ophthalmologist',
  'Pulmonologist',
  'Gastroenterologist',
];

export default function Doctors() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialization, setSpecialization] = useState('All Specializations');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [addDoctorOpen, setAddDoctorOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchDoctors() {
      const { data, error } = await supabase
        .from('doctors' as never)
        .select('*')
        .order('is_featured', { ascending: false });
      
      if (!error && data) {
        setDoctors(data as unknown as Doctor[]);
      }
      setLoading(false);
    }
    fetchDoctors();
  }, []);

  useEffect(() => {
    async function fetchUserRole() {
      if (!user) return;
      const { data } = await supabase
        .from('profiles' as never)
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setUserRole((data as { role: string }).role);
      }
    }
    fetchUserRole();
  }, [user]);

  const refreshDoctors = async () => {
    const { data, error } = await supabase
      .from('doctors' as never)
      .select('*')
      .order('is_featured', { ascending: false });
    
    if (!error && data) {
      setDoctors(data as unknown as Doctor[]);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialization = specialization === 'All Specializations' || 
      doctor.specialization === specialization;
    return matchesSearch && matchesSpecialization;
  });

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setBookingOpen(true);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Find Your Doctor</h1>
            <p className="text-muted-foreground">Browse our expert healthcare professionals and book your appointment</p>
          </div>
          {userRole === 'doctor' && (
            <Button onClick={() => setAddDoctorOpen(true)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Doctor
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search doctors by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={specialization} onValueChange={setSpecialization}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              {specializations.map((spec) => (
                <SelectItem key={spec} value={spec}>
                  {spec}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No doctors found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="h-16 w-16 bg-primary/10 flex-shrink-0 flex items-center justify-center">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{doctor.name}</h3>
                        {doctor.is_featured && (
                          <Badge variant="secondary" className="text-xs">Featured</Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="mt-1">
                        {doctor.specialization}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {doctor.bio}
                  </p>
                  
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium text-foreground">{doctor.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {doctor.experience_years} years
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      ${doctor.consultation_fee}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => handleBookAppointment(doctor)}
                  >
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <BookingDialog
        doctor={selectedDoctor}
        open={bookingOpen}
        onOpenChange={setBookingOpen}
      />

      <AddDoctorDialog
        open={addDoctorOpen}
        onOpenChange={setAddDoctorOpen}
        onDoctorAdded={refreshDoctors}
      />
    </Layout>
  );
}
