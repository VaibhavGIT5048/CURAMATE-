import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

interface AddDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDoctorAdded: () => void;
}

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

export function AddDoctorDialog({ open, onOpenChange, onDoctorAdded }: AddDoctorDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    experience_years: 0,
    bio: '',
    consultation_fee: 0,
    availability: {} as Record<string, boolean>,
    is_featured: false,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      specialization: '',
      experience_years: 0,
      bio: '',
      consultation_fee: 0,
      availability: {},
      is_featured: false,
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const toggleAvailability = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [day]: !prev.availability[day],
      },
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!formData.name?.trim() || !formData.specialization) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in name and specialization.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from('doctors' as never)
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          specialization: formData.specialization,
          experience_years: formData.experience_years || 0,
          bio: formData.bio || '',
          consultation_fee: formData.consultation_fee || 0,
          availability: formData.availability || {},
          is_featured: formData.is_featured || false,
          rating: 5.0,
        } as never);

      if (error) throw error;

      toast({
        title: 'Doctor Added',
        description: 'The doctor profile has been created successfully.',
      });

      handleOpenChange(false);
      onDoctorAdded();
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'Failed to Add Doctor',
        description: error instanceof Error ? error.message : 'Could not add doctor.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add New Doctor
          </DialogTitle>
          <DialogDescription>
            Create a new doctor profile for the clinic
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="Dr. John Smith"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="specialization">Specialization *</Label>
            <Select
              value={formData.specialization}
              onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select specialization" />
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                placeholder="10"
                value={formData.experience_years || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
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
                value={formData.consultation_fee || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, consultation_fee: parseInt(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Brief description about the doctor..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label className="mb-3 block">Weekly Availability</Label>
            <div className="grid grid-cols-2 gap-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <Label htmlFor={day} className="cursor-pointer text-sm">
                    {day}
                  </Label>
                  <Switch
                    id={day}
                    checked={formData.availability[day] || false}
                    onCheckedChange={() => toggleAvailability(day)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border rounded">
            <div>
              <Label htmlFor="featured" className="cursor-pointer">Featured Doctor</Label>
              <p className="text-xs text-muted-foreground">Show on homepage</p>
            </div>
            <Switch
              id="featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Doctor
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}