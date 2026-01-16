import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Doctor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, Save, Loader2 } from 'lucide-react';

const specializations = [
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

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorProfile() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<Partial<Doctor>>({
    name: '',
    specialization: '',
    experience_years: 0,
    bio: '',
    consultation_fee: 0,
    availability: {},
    is_featured: false,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?role=doctor');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchDoctorProfile() {
      if (!user) return;
      
      const { data } = await supabase
        .from('doctors' as never)
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setDoctorProfile(data as unknown as Doctor);
      } else {
        // Get user's full name from profiles
        const { data: profileData } = await supabase
          .from('profiles' as never)
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        
        if (profileData) {
          setDoctorProfile(prev => ({
            ...prev,
            name: (profileData as { full_name: string }).full_name || '',
          }));
        }
      }
      setLoading(false);
    }
    
    if (user) {
      fetchDoctorProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    
    if (!doctorProfile.name?.trim() || !doctorProfile.specialization) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in your name and specialization.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const doctorData = {
        user_id: user.id,
        name: doctorProfile.name.trim(),
        specialization: doctorProfile.specialization,
        experience_years: doctorProfile.experience_years || 0,
        bio: doctorProfile.bio || '',
        consultation_fee: doctorProfile.consultation_fee || 0,
        availability: doctorProfile.availability || {},
        is_featured: doctorProfile.is_featured || false,
        rating: doctorProfile.rating || 5.0,
      };

      if (doctorProfile.id) {
        // Update existing profile
        const { error } = await supabase
          .from('doctors' as never)
          .update(doctorData as never)
          .eq('id', doctorProfile.id);

        if (error) throw error;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('doctors' as never)
          .insert(doctorData as never)
          .select()
          .single();

        if (error) throw error;
        setDoctorProfile(data as unknown as Doctor);
      }

      toast({
        title: 'Profile Saved',
        description: 'Your doctor profile has been updated successfully.',
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Could not save profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = (day: string) => {
    setDoctorProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability?.[day],
      },
    }));
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Doctor Profile</h1>
          <p className="text-muted-foreground">Manage your professional profile and availability</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Your professional details visible to patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Dr. John Smith"
                  value={doctorProfile.name || ''}
                  onChange={(e) => setDoctorProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Select
                  value={doctorProfile.specialization || ''}
                  onValueChange={(value) => setDoctorProfile(prev => ({ ...prev, specialization: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select your specialization" />
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

              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min="0"
                  placeholder="10"
                  value={doctorProfile.experience_years || ''}
                  onChange={(e) => setDoctorProfile(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fee">Consultation Fee ($)</Label>
                <Input
                  id="fee"
                  type="number"
                  min="0"
                  placeholder="100"
                  value={doctorProfile.consultation_fee || ''}
                  onChange={(e) => setDoctorProfile(prev => ({ ...prev, consultation_fee: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell patients about your experience, qualifications, and approach to care..."
                  value={doctorProfile.bio || ''}
                  onChange={(e) => setDoctorProfile(prev => ({ ...prev, bio: e.target.value }))}
                  className="mt-1 min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Availability</CardTitle>
              <CardDescription>
                Set your available days for appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center justify-between">
                  <Label htmlFor={day} className="cursor-pointer">
                    {day}
                  </Label>
                  <Switch
                    id={day}
                    checked={doctorProfile.availability?.[day] || false}
                    onCheckedChange={() => toggleAvailability(day)}
                  />
                </div>
              ))}

              <Button 
                className="w-full mt-6" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}