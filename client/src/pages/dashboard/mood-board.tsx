import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { BOOK_CATEGORIES } from '@shared/schema';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Sparkle, Palette, Quote, PencilLine, Image, BookOpen } from 'lucide-react';

interface MoodBoardItem {
  type: 'quote' | 'prompt' | 'theme' | 'imagePrompt';
  content: string;
}

interface MoodBoardResponse {
  title: string;
  description: string;
  items: MoodBoardItem[];
  imagePrompts: string[];
  palette: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
}

const formSchema = z.object({
  genre: z.string().optional(),
  theme: z.string().optional(),
  setting: z.string().optional(),
  additionalContext: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function MoodBoardGenerator() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [moodBoard, setMoodBoard] = useState<MoodBoardResponse | null>(null);
  const [activeTab, setActiveTab] = useState('form');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genre: '',
      theme: '',
      setting: '',
      additionalContext: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsGenerating(true);
    setActiveTab('results');
    
    try {
      const response = await apiRequest<MoodBoardResponse>({
        url: '/api/mood-board/generate',
        method: 'POST',
        body: data,
      });
      
      if (response) {
        setMoodBoard(response);
        toast({
          title: 'Mood board generated!',
          description: 'Your writing inspiration is ready.',
        });
      }
    } catch (error) {
      console.error('Error generating mood board:', error);
      toast({
        title: 'Generation failed',
        description: 'Could not generate the mood board. Please try again.',
        variant: 'destructive',
      });
      setActiveTab('form');
    } finally {
      setIsGenerating(false);
    }
  };

  const groupedItems = moodBoard?.items.reduce<Record<string, MoodBoardItem[]>>((groups, item) => {
    const group = groups[item.type] || [];
    return { ...groups, [item.type]: [...group, item] };
  }, {}) || {};

  const quotes = groupedItems.quote || [];
  const prompts = groupedItems.prompt || [];
  const themes = groupedItems.theme || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: 'Text has been copied to your clipboard.',
    });
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center">
        <Sparkle className="mr-2 h-8 w-8 text-primary" />
        Writing Mood Board Generator
      </h1>
      
      <p className="text-muted-foreground mb-8">
        Generate a personalized writing mood board with inspiring themes, quotes, 
        and image prompts to kickstart your creative process.
      </p>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form">Create Mood Board</TabsTrigger>
          <TabsTrigger value="results" disabled={!moodBoard && !isGenerating}>
            View Results
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Generate Your Writing Mood Board</CardTitle>
              <CardDescription>
                Fill in as many fields as you like to customize your mood board.
                Leave fields blank for more surprising results.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="mood-board-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Select
                    onValueChange={(value) => form.setValue('genre', value)}
                    defaultValue={form.getValues('genre')}
                  >
                    <SelectTrigger id="genre">
                      <SelectValue placeholder="Select a genre (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Genres</SelectLabel>
                        {BOOK_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Input
                    id="theme"
                    placeholder="E.g., redemption, loss, coming-of-age (optional)"
                    {...form.register('theme')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="setting">Setting</Label>
                  <Input
                    id="setting"
                    placeholder="E.g., medieval Europe, dystopian future (optional)"
                    {...form.register('setting')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additionalContext">Additional Context</Label>
                  <Textarea
                    id="additionalContext"
                    placeholder="Any additional details about your story or characters (optional)"
                    {...form.register('additionalContext')}
                    rows={4}
                  />
                </div>
              </form>
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                form="mood-board-form" 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? 'Generating...' : 'Generate Mood Board'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="results">
          <AnimatePresence>
            {isGenerating ? (
              <MoodBoardSkeleton />
            ) : moodBoard ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="mb-8">
                  <CardHeader
                    style={{
                      background: `linear-gradient(to right, ${moodBoard.palette.primary}, ${moodBoard.palette.secondary})`,
                      borderRadius: '0.5rem 0.5rem 0 0',
                      padding: '2rem',
                    }}
                  >
                    <CardTitle className="text-white text-2xl">{moodBoard.title}</CardTitle>
                    <CardDescription className="text-white/90">
                      {moodBoard.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {Object.entries(moodBoard.palette).map(([name, color]) => (
                        <div 
                          key={name}
                          className="flex items-center space-x-2"
                          onClick={() => copyToClipboard(color)}
                          title="Click to copy color code"
                        >
                          <div 
                            className="w-6 h-6 rounded-full border" 
                            style={{ backgroundColor: color }}
                          />
                          <span className="capitalize">{name}:</span>
                          <code className="bg-muted px-2 py-1 rounded text-sm">{color}</code>
                        </div>
                      ))}
                    </div>
                    
                    <Tabs defaultValue="quotes" className="w-full">
                      <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="quotes" className="flex items-center">
                          <Quote className="mr-2 h-4 w-4" />
                          Quotes
                        </TabsTrigger>
                        <TabsTrigger value="prompts" className="flex items-center">
                          <PencilLine className="mr-2 h-4 w-4" />
                          Prompts
                        </TabsTrigger>
                        <TabsTrigger value="themes" className="flex items-center">
                          <BookOpen className="mr-2 h-4 w-4" />
                          Themes
                        </TabsTrigger>
                        <TabsTrigger value="images" className="flex items-center">
                          <Image className="mr-2 h-4 w-4" />
                          Images
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="quotes" className="space-y-4">
                        {quotes.map((item, index) => (
                          <blockquote 
                            key={index}
                            className="border-l-4 pl-4 italic"
                            style={{ borderColor: moodBoard.palette.primary }}
                          >
                            <p className="mb-2">{item.content}</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(item.content)}
                            >
                              Copy
                            </Button>
                          </blockquote>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="prompts" className="space-y-4">
                        {prompts.map((item, index) => (
                          <div 
                            key={index}
                            className="bg-muted p-4 rounded-md"
                          >
                            <p className="mb-2">{item.content}</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(item.content)}
                            >
                              Copy
                            </Button>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="themes" className="space-y-4">
                        {themes.map((item, index) => (
                          <div 
                            key={index}
                            className="bg-accent/30 p-4 rounded-md"
                          >
                            <p className="mb-2">{item.content}</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(item.content)}
                            >
                              Copy
                            </Button>
                          </div>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="images" className="space-y-4">
                        {moodBoard.imagePrompts.map((prompt, index) => (
                          <div 
                            key={index}
                            className="border p-4 rounded-md"
                          >
                            <p className="mb-2">{prompt}</p>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyToClipboard(prompt)}
                            >
                              Copy
                            </Button>
                          </div>
                        ))}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => setActiveTab('form')}>
                      Generate Another
                    </Button>
                    <Button 
                      onClick={() => copyToClipboard(JSON.stringify(moodBoard, null, 2))}
                    >
                      Export as JSON
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Mood Board Generated Yet</CardTitle>
                  <CardDescription>
                    Fill out the form to create your personalized writing mood board.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="mb-4">
                      Your mood board will appear here after generation.
                    </p>
                    <Button onClick={() => setActiveTab('form')}>
                      Go to Generator
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MoodBoardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="mb-8">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          
          <Tabs defaultValue="quotes" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="quotes" disabled>Quotes</TabsTrigger>
              <TabsTrigger value="prompts" disabled>Prompts</TabsTrigger>
              <TabsTrigger value="themes" disabled>Themes</TabsTrigger>
              <TabsTrigger value="images" disabled>Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="quotes" className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-4/6" />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Skeleton className="h-10 w-full" />
        </CardFooter>
      </Card>
    </motion.div>
  );
}