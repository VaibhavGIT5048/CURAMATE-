import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BloodReport } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Trash2, Sparkles, AlertTriangle, Loader2, File } from 'lucide-react';
import { format } from 'date-fns';

export default function Reports() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [reports, setReports] = useState<BloodReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportName, setReportName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    async function fetchReports() {
      if (!user) return;
      
      const { data } = await supabase
        .from('blood_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });
      
      if (data) {
        setReports(data as BloodReport[]);
      }
      setLoading(false);
    }
    
    if (user) {
      fetchReports();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF file.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: 'File Too Large',
          description: 'Please upload a file smaller than 10MB.',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
      if (!reportName) {
        setReportName(file.name.replace('.pdf', ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !reportName.trim() || !user) return;

    setUploading(true);

    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('blood-reports')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      // Create record in database
      const { data, error } = await supabase
        .from('blood_reports')
        .insert({
          user_id: user.id,
          file_name: reportName.trim(),
          file_url: filePath,
          content: null, // Content will be extracted by AI
        })
        .select()
        .single();

      if (error) throw error;

      setReports(prev => [data as BloodReport, ...prev]);
      setReportName('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast({
        title: 'Report Uploaded',
        description: 'Your blood report has been uploaded successfully.',
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload report.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const analyzeReport = async (report: BloodReport) => {
    setAnalyzing(report.id);

    try {
      // Get the file from storage if we have a file_url
      let content = report.content;
      
      if (!content && report.file_url) {
        // For PDF files, we'll send the file path to the edge function
        // The edge function would need to extract text from PDF
        content = `PDF Report: ${report.file_name}. File located at: ${report.file_url}`;
      }

      const { data, error } = await supabase.functions.invoke('analyze-report', {
        body: { 
          reportId: report.id,
          content: content || 'No content available',
          fileUrl: report.file_url,
        },
      });

      if (error) throw error;

      // Update report with analysis
      await supabase
        .from('blood_reports')
        .update({ analysis: data.analysis })
        .eq('id', report.id);

      setReports(prev => 
        prev.map(r => r.id === report.id ? { ...r, analysis: data.analysis } : r)
      );

      toast({
        title: 'Analysis Complete',
        description: 'Your report has been analyzed by AI.',
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: 'Could not analyze the report. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAnalyzing(null);
    }
  };

  const deleteReport = async (reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    
    // Delete file from storage if exists
    if (report?.file_url) {
      await supabase.storage
        .from('blood-reports')
        .remove([report.file_url]);
    }

    const { error } = await supabase
      .from('blood_reports')
      .delete()
      .eq('id', reportId);

    if (error) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setReports(prev => prev.filter(r => r.id !== reportId));
    toast({
      title: 'Report Deleted',
      description: 'The report has been removed.',
    });
  };

  const downloadReport = async (report: BloodReport) => {
    if (!report.file_url) return;

    try {
      const { data, error } = await supabase.storage
        .from('blood-reports')
        .download(report.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.file_name}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download the report.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground mb-2">Health Reports</h1>
          <p className="text-muted-foreground">Upload your blood reports (PDF) for AI-powered analysis</p>
        </div>

        {/* Disclaimer */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Important Notice</p>
              <p className="text-muted-foreground">
                AI analysis provides general insights only. Always consult with your doctor 
                for proper medical interpretation and advice.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Report
              </CardTitle>
              <CardDescription>
                Upload your blood test report in PDF format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="reportName">Report Name</Label>
                <Input
                  id="reportName"
                  placeholder="e.g., Complete Blood Count - Jan 2026"
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="reportFile">PDF File</Label>
                <div className="mt-1">
                  <input
                    ref={fileInputRef}
                    id="reportFile"
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2">
                        <File className="h-5 w-5 text-primary" />
                        <span className="text-sm text-foreground truncate max-w-[200px]">
                          {selectedFile.name}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to select a PDF file
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Max size: 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={handleUpload}
                disabled={!reportName.trim() || !selectedFile || uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Report
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Reports List */}
          <div className="lg:col-span-2 space-y-4">
            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No reports yet</h3>
                  <p className="text-muted-foreground">
                    Upload your first blood report to get AI-powered insights
                  </p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <Card key={report.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{report.file_name}</CardTitle>
                          <CardDescription>
                            Uploaded on {format(new Date(report.uploaded_at!), 'MMMM d, yyyy')}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {report.file_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReport(report)}
                          >
                            <File className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                        {!report.analysis && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => analyzeReport(report)}
                            disabled={analyzing === report.id}
                          >
                            {analyzing === report.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-1" />
                                Analyze
                              </>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteReport(report.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {report.file_url && (
                      <div className="bg-muted/50 p-3 text-sm text-muted-foreground mb-4 flex items-center gap-2">
                        <File className="h-4 w-4" />
                        <span>PDF Report uploaded</span>
                      </div>
                    )}
                    {report.content && !report.file_url && (
                      <div className="bg-muted/50 p-3 text-sm text-muted-foreground mb-4 max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap font-mono text-xs">{report.content}</pre>
                      </div>
                    )}
                    {report.analysis && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-foreground flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Analysis
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {report.analysis}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}