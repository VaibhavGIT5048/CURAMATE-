import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Blog } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export function BlogSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBlogs() {
      const { data, error } = await supabase
        .from('blogs' as never)
        .select('*')
        .eq('is_featured', true)
        .order('published_at', { ascending: false })
        .limit(3);
      
      if (!error && data) {
        setBlogs(data as unknown as Blog[]);
      }
      setLoading(false);
    }
    fetchBlogs();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold text-foreground">Health Insights</h2>
            <p className="text-muted-foreground mt-2">Expert advice from our medical professionals</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-40 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl font-bold text-foreground">Health Insights</h2>
          <p className="text-muted-foreground mt-2">Expert advice from our medical professionals</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {blogs.map((blog) => (
            <Card key={blog.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
              <CardHeader className="p-0">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary/40" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {blog.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(blog.published_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {blog.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {blog.excerpt}
                </p>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">By {blog.author_name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-10">
          <Button variant="outline" className="gap-2">
            View All Articles
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
