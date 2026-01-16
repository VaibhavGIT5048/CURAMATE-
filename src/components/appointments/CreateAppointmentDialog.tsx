import { useState, useEffect } from 'react';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Doctor } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, Clock, Stethoscope, CheckCircle, DollarSign, Star, Filter } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface CreateAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAppointmentCreated: () => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

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

export function CreateAppointmentDialog({ open, onOpenChange, onAppointmentCreated }: CreateAppointmentDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'criteria' | 'doctor' | 'date' | 'time' | 'confirm' | 'success'>('criteria');
  
  // Criteria state
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [maxFee, setMaxFee] = useState([500]);
  const [minRating, setMinRating] = useState([3]);
  const [minExperience, setMinExperience] = useState([0]);
  
  // Filtered doctors
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  
  // Booking state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const resetState = () => {
    setStep('criteria');
    setSelectedSpecialization('All Specializations');
    setMaxFee([500]);
    setMinRating([3]);
    setMinExperience([0]);
    setDoctors([]);
    setSelectedDoctor(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
    setNotes('');
    setBookedSlots([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const fetchFilteredDoctors = async () => {
    setLoadingDoctors(true);
    
    let query = supabase
      .from('doctors' as never)
      .select('*')
      .lte('consultation_fee', maxFee[0])
      .gte('rating', minRating[0])
      .gte('experience_years', minExperience[0]);
    
    if (selectedSpecialization !== 'All Specializations') {
      query = query.eq('specialization', selectedSpecialization);
    }
    
    const { data, error } = await query.order('rating', { ascending: false });
    
    if (!error && data) {
      setDoctors(data as unknown as Doctor[]);
    }
    setLoadingDoctors(false);
  };

  const fetchBookedSlots = async (date: Date) => {
    if (!selectedDoctor) return;
    
    const { data } = await supabase
      .from('appointments' as never)
      .select('appointment_time')
      .eq('doctor_id', selectedDoctor.id)
      .eq('appointment_date', format(date, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');
    
    if (data) {
      setBookedSlots((data as { appointment_time: string }[]).map(a => a.appointment_time.slice(0, 5)));
    }
  };

  const handleApplyCriteria = async () => {
    await fetchFilteredDoctors();
    setStep('doctor');
  };

  const handleSelectDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setStep('date');
  };

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      await fetchBookedSlots(date);
      setStep('time');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('confirm');
  };

  const handleBooking = async () => {
    if (!user || !selectedDoctor || !selectedDate || !selectedTime) return;

    setLoading(true);
    
    const { error } = await supabase
      .from('appointments' as never)
      .insert({
        patient_id: user.id,
        doctor_id: selectedDoctor.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        notes: notes || null,
      } as never);

    setLoading(false);

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Slot Unavailable',
          description: 'This time slot has just been booked. Please choose another.',
          variant: 'destructive',
        });
        setStep('time');
        await fetchBookedSlots(selectedDate);
      } else {
        toast({
          title: 'Booking Failed',
          description: error.message,
          variant: 'destructive',
        });
      }
      return;
    }

    setStep('success');
    toast({
      title: 'Appointment Booked!',
      description: `Your appointment with ${selectedDoctor.name} is confirmed.`,
    });
    onAppointmentCreated();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            {step === 'success' ? 'Appointment Confirmed!' : 'Create Appointment'}
          </DialogTitle>
          <DialogDescription>
            {step === 'criteria' && 'Set your preferences to find the right doctor'}
            {step === 'doctor' && `${doctors.length} doctor(s) match your criteria`}
            {step === 'date' && selectedDoctor && `Booking with ${selectedDoctor.name}`}
            {step === 'time' && 'Select an available time slot'}
            {step === 'confirm' && 'Review and confirm your appointment'}
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Criteria */}
        {step === 'criteria' && (
          <div className="py-4 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter doctors by your preferences</span>
            </div>

            <div>
              <Label>Specialization</Label>
              <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
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

            <div>
              <div className="flex justify-between mb-2">
                <Label>Maximum Consultation Fee</Label>
                <span className="text-sm font-medium">${maxFee[0]}</span>
              </div>
              <Slider
                value={maxFee}
                onValueChange={setMaxFee}
                max={1000}
                min={0}
                step={10}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label>Minimum Rating</Label>
                <span className="text-sm font-medium flex items-center gap-1">
                  <Star className="h-3 w-3 fill-primary text-primary" />
                  {minRating[0]}+
                </span>
              </div>
              <Slider
                value={minRating}
                onValueChange={setMinRating}
                max={5}
                min={1}
                step={0.5}
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label>Minimum Experience (Years)</Label>
                <span className="text-sm font-medium">{minExperience[0]}+ years</span>
              </div>
              <Slider
                value={minExperience}
                onValueChange={setMinExperience}
                max={30}
                min={0}
                step={1}
                className="mt-2"
              />
            </div>

            <Button className="w-full" onClick={handleApplyCriteria}>
              Find Doctors
            </Button>
          </div>
        )}

        {/* Step 2: Select Doctor */}
        {step === 'doctor' && (
          <div className="py-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('criteria')} className="mb-4">
              ← Change Criteria
            </Button>
            
            {loadingDoctors ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No doctors match your criteria</p>
                <Button variant="outline" className="mt-4" onClick={() => setStep('criteria')}>
                  Adjust Criteria
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {doctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleSelectDoctor(doctor)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 bg-primary/10 flex-shrink-0 flex items-center justify-center rounded">
                        <Stethoscope className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{doctor.name}</h4>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            {doctor.rating}
                          </div>
                        </div>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {doctor.specialization}
                        </Badge>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{doctor.experience_years} years exp.</span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${doctor.consultation_fee}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Select Date */}
        {step === 'date' && (
          <div className="py-4">
            <Button variant="ghost" size="sm" onClick={() => setStep('doctor')} className="mb-4">
              ← Choose Another Doctor
            </Button>
            <Label className="text-sm font-medium mb-3 block">Select a Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => isBefore(date, startOfToday()) || isBefore(addDays(new Date(), 30), date)}
              className="rounded-md border mx-auto"
            />
          </div>
        )}

        {/* Step 4: Select Time */}
        {step === 'time' && selectedDate && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Select a Time Slot</Label>
              <Badge variant="outline">
                {format(selectedDate, 'MMM d, yyyy')}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((time) => {
                const isBooked = bookedSlots.includes(time);
                return (
                  <Button
                    key={time}
                    variant={selectedTime === time ? 'default' : 'outline'}
                    size="sm"
                    disabled={isBooked}
                    onClick={() => handleTimeSelect(time)}
                    className="gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {time}
                  </Button>
                );
              })}
            </div>
            <Button variant="ghost" className="mt-4" onClick={() => setStep('date')}>
              ← Change Date
            </Button>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 'confirm' && selectedDoctor && selectedDate && selectedTime && (
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 p-4 space-y-2 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor</span>
                <span className="font-medium">{selectedDoctor.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Specialization</span>
                <span className="font-medium">{selectedDoctor.specialization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">${selectedDoctor.consultation_fee}</span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="notes" className="text-sm font-medium">
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                placeholder="Describe your symptoms or reason for visit..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('time')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleBooking} disabled={loading}>
                {loading ? 'Booking...' : 'Confirm Booking'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 6: Success */}
        {step === 'success' && selectedDoctor && selectedDate && selectedTime && (
          <div className="py-8 text-center">
            <div className="h-16 w-16 bg-primary/10 mx-auto flex items-center justify-center mb-4 rounded-full">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground mb-4">
              Your appointment with {selectedDoctor.name} is scheduled for{' '}
              <span className="font-medium text-foreground">
                {format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              You'll receive email reminders before your appointment.
            </p>
            <Button onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}