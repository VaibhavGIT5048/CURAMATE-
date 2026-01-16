import { useState } from 'react';
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
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Clock, Stethoscope, CheckCircle } from 'lucide-react';

interface BookingDialogProps {
  doctor: Doctor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

export function BookingDialog({ doctor, open, onOpenChange }: BookingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'date' | 'time' | 'confirm' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  const resetState = () => {
    setStep('date');
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

  const fetchBookedSlots = async (date: Date) => {
    if (!doctor) return;
    
    const { data } = await supabase
      .from('appointments' as never)
      .select('appointment_time')
      .eq('doctor_id', doctor.id)
      .eq('appointment_date', format(date, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');
    
    if (data) {
      setBookedSlots((data as { appointment_time: string }[]).map(a => a.appointment_time.slice(0, 5)));
    }
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
    if (!user || !doctor || !selectedDate || !selectedTime) return;

    setLoading(true);
    
    const { error } = await supabase
      .from('appointments' as never)
      .insert({
        patient_id: user.id,
        doctor_id: doctor.id,
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
      description: `Your appointment with ${doctor.name} is confirmed.`,
    });
  };

  if (!doctor) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {step === 'success' ? 'Appointment Confirmed!' : 'Book Appointment'}
          </DialogTitle>
          <DialogDescription>
            {step !== 'success' && (
              <div className="flex items-center gap-3 mt-2">
                <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{doctor.name}</div>
                  <div className="text-sm">{doctor.specialization}</div>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === 'date' && (
          <div className="py-4">
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

        {step === 'time' && selectedDate && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-sm font-medium">Select a Time Slot</Label>
              <Badge variant="outline">
                <CalendarCheck className="h-3 w-3 mr-1" />
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

        {step === 'confirm' && selectedDate && selectedTime && (
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 p-4 space-y-2">
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
                <span className="font-medium">${doctor.consultation_fee}</span>
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

        {step === 'success' && selectedDate && selectedTime && (
          <div className="py-8 text-center">
            <div className="h-16 w-16 bg-primary/10 mx-auto flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Booking Confirmed!</h3>
            <p className="text-muted-foreground mb-4">
              Your appointment with {doctor.name} is scheduled for{' '}
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
