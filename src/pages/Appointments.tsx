import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Appointment, Doctor } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { CalendarCheck, Clock, Stethoscope, X, AlertCircle, CalendarPlus } from 'lucide-react';
import { CreateAppointmentDialog } from '@/components/appointments/CreateAppointmentDialog';

export default function Appointments() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<(Appointment & { doctor: Doctor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('appointments' as never)
      .select(`
        *,
        doctor:doctors(*)
      `)
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: true });
    
    if (!error && data) {
      setAppointments(data as unknown as (Appointment & { doctor: Doctor })[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const cancelAppointment = async (appointmentId: string) => {
    const { error } = await supabase
      .from('appointments' as never)
      .update({ status: 'cancelled' } as never)
      .eq('id', appointmentId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel appointment',
        variant: 'destructive',
      });
      return;
    }

    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'cancelled' } : apt
      )
    );
    
    toast({
      title: 'Appointment Cancelled',
      description: 'Your appointment has been cancelled successfully.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="secondary">Scheduled</Badge>;
      case 'confirmed':
        return <Badge className="bg-primary">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingAppointments = appointments.filter(
    apt => apt.status !== 'cancelled' && apt.status !== 'completed' && 
    new Date(`${apt.appointment_date}T${apt.appointment_time}`) >= new Date()
  );
  
  const pastAppointments = appointments.filter(
    apt => apt.status === 'completed' || apt.status === 'cancelled' ||
    new Date(`${apt.appointment_date}T${apt.appointment_time}`) < new Date()
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-4 w-1/3" />
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground mb-2">My Appointments</h1>
            <p className="text-muted-foreground">Manage your upcoming and past appointments</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Create Appointment
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="upcoming" className="gap-2">
              <CalendarCheck className="h-4 w-4" />
              Upcoming ({upcomingAppointments.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              <Clock className="h-4 w-4" />
              Past ({pastAppointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcomingAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground mb-4">Book an appointment with one of our doctors</p>
                  <Button onClick={() => navigate('/doctors')}>Find Doctors</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 bg-primary/10 flex-shrink-0 flex items-center justify-center">
                            <Stethoscope className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {appointment.doctor?.name || 'Doctor'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {appointment.doctor?.specialization}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1">
                                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                {appointment.appointment_time.slice(0, 5)}
                              </span>
                            </div>
                            {appointment.notes && (
                              <p className="mt-2 text-sm text-muted-foreground bg-muted/50 p-2">
                                {appointment.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(appointment.status)}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => cancelAppointment(appointment.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {pastAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No past appointments</h3>
                  <p className="text-muted-foreground">Your completed appointments will appear here</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {pastAppointments.map((appointment) => (
                  <Card key={appointment.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 bg-muted flex-shrink-0 flex items-center justify-center">
                            <Stethoscope className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {appointment.doctor?.name || 'Doctor'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {appointment.doctor?.specialization}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarCheck className="h-4 w-4" />
                                {format(new Date(appointment.appointment_date), 'MMMM d, yyyy')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {appointment.appointment_time.slice(0, 5)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <CreateAppointmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onAppointmentCreated={fetchAppointments}
        />
      </div>
    </Layout>
  );
}
