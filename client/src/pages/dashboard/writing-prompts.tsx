import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Define type for writing prompt data
interface WritingPrompt {
  title: string;
  prompt: string;
  context?: string;
  examples?: string[];
  tips?: string[];
}

interface WritingPromptResponse {
  prompts: WritingPrompt[];
  relatedIdeas: string[];
}

// Define form schema for validation
const formSchema = z.object({
  genre: z.string().optional(),
  toneOrMood: z.string().optional(),
  type: z.enum([
    "scene",
    "character",
    "plot",
    "setting",
    "dialogue",
    "conflict",
    "random",
  ]),
  targetAudience: z.string().optional(),
  additionalContext: z.string().optional(),
  includeExamples: z.boolean().default(true),
  count: z.number().min(1).max(5).default(3),
});

type FormValues = z.infer<typeof formSchema>;

const WritingPrompts: React.FC = () => {
  const { toast } = useToast();
  const [generatedPrompts, setGeneratedPrompts] = useState<WritingPromptResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Define form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      genre: "",
      toneOrMood: "",
      type: "random",
      targetAudience: "",
      additionalContext: "",
      includeExamples: true,
      count: 3,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsGenerating(true);
    setGeneratedPrompts(null);
    
    try {
      const response = await apiRequest("POST", "/api/writing-prompts/generate", values);
      const data = await response.json();
      setGeneratedPrompts(data);
      toast({
        title: "Writing prompts generated",
        description: "Your custom writing prompts are ready to inspire your creativity.",
      });
    } catch (error) {
      console.error("Error generating writing prompts:", error);
      toast({
        title: "Generation failed",
        description: "There was an error generating your writing prompts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary serif">Writing Prompts Generator</h1>
        <p className="text-neutral-600 mt-2">
          Generate creative writing prompts tailored to your preferences to overcome writer's block and spark new ideas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Customize Your Prompts</CardTitle>
              <CardDescription>
                Adjust these parameters to generate writing prompts that fit your creative needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Fantasy, Sci-Fi, Mystery, Romance"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The literary genre for your writing
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toneOrMood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone/Mood</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Dark, Humorous, Whimsical, Serious"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The emotional tone for your writing
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select prompt type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="random">Random (Mixed)</SelectItem>
                            <SelectItem value="character">Character-focused</SelectItem>
                            <SelectItem value="plot">Plot-focused</SelectItem>
                            <SelectItem value="setting">Setting-focused</SelectItem>
                            <SelectItem value="dialogue">Dialogue-focused</SelectItem>
                            <SelectItem value="scene">Scene-focused</SelectItem>
                            <SelectItem value="conflict">Conflict-focused</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Focus area for your writing prompt
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetAudience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Audience</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Young Adult, Children, Adults"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The intended audience for your writing
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="additionalContext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Context</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any specific elements you'd like included in your prompts"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Special requirements or themes
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="includeExamples"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Include Examples</FormLabel>
                          <FormDescription>
                            Include example scenarios with each prompt
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Prompts: {field.value}</FormLabel>
                        <FormControl>
                          <Slider
                            value={[field.value]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={(vals) => field.onChange(vals[0])}
                          />
                        </FormControl>
                        <FormDescription>
                          How many writing prompts to generate (1-5)
                        </FormDescription>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isGenerating}>
                    {isGenerating ? "Generating..." : "Generate Writing Prompts"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Your Writing Prompts</CardTitle>
              <CardDescription>
                Use these prompts to spark your creativity and overcome writer's block
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] overflow-y-auto">
              {isGenerating ? (
                // Loading state
                <div className="space-y-8">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-20 w-full" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  ))}
                </div>
              ) : generatedPrompts ? (
                // Results state
                <div className="space-y-8">
                  {generatedPrompts.prompts.map((prompt, index) => (
                    <div key={index} className="border border-border rounded-lg p-5 shadow-sm">
                      <h3 className="text-xl font-semibold text-primary mb-3">{prompt.title}</h3>
                      <p className="mb-4 text-neutral-700">{prompt.prompt}</p>
                      
                      {prompt.context && (
                        <div className="mb-4">
                          <h4 className="font-medium text-neutral-700 mb-1">Context:</h4>
                          <p className="text-neutral-600 text-sm italic">{prompt.context}</p>
                        </div>
                      )}
                      
                      {prompt.examples && prompt.examples.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-neutral-700 mb-1">Examples:</h4>
                          <ul className="list-disc list-inside text-neutral-600 text-sm space-y-1">
                            {prompt.examples.map((example, i) => (
                              <li key={i}>{example}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {prompt.tips && prompt.tips.length > 0 && (
                        <div>
                          <h4 className="font-medium text-neutral-700 mb-1">Writing Tips:</h4>
                          <ul className="list-disc list-inside text-neutral-600 text-sm space-y-1">
                            {prompt.tips.map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {generatedPrompts.relatedIdeas && generatedPrompts.relatedIdeas.length > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-3">Related Ideas</h3>
                      <div className="flex flex-wrap gap-2">
                        {generatedPrompts.relatedIdeas.map((idea, i) => (
                          <Badge key={i} variant="outline" className="text-sm py-1">
                            {idea}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Empty state
                <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
                  <div className="rounded-full bg-primary/10 p-4 mb-4">
                    <i className="fas fa-pen-nib text-primary text-2xl"></i>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No prompts generated yet</h3>
                  <p className="text-sm max-w-md">
                    Adjust the parameters on the left and click "Generate Writing Prompts" to create
                    personalized writing prompts that match your creative needs.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WritingPrompts;