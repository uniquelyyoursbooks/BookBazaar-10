import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { BOOK_CATEGORIES } from "@shared/schema";
import { Loader2, RefreshCw, Download } from "lucide-react";

// Color options for the book cover
const COLOR_OPTIONS = [
  { value: "blue", label: "Blue", hex: "#3b82f6" },
  { value: "red", label: "Red", hex: "#ef4444" },
  { value: "green", label: "Green", hex: "#10b981" },
  { value: "purple", label: "Purple", hex: "#8b5cf6" },
  { value: "pink", label: "Pink", hex: "#ec4899" },
  { value: "yellow", label: "Yellow", hex: "#f59e0b" },
  { value: "teal", label: "Teal", hex: "#14b8a6" },
  { value: "orange", label: "Orange", hex: "#f97316" },
  { value: "gray", label: "Gray", hex: "#6b7280" },
];

// Style options for the book cover
const STYLE_OPTIONS = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "illustrated", label: "Illustrated" },
  { value: "photographic", label: "Photographic" },
  { value: "vintage", label: "Vintage" },
  { value: "abstract", label: "Abstract" },
  { value: "geometric", label: "Geometric" },
  { value: "typography", label: "Typography" },
];

// Mood options for the book cover
const MOOD_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "dramatic", label: "Dramatic" },
  { value: "playful", label: "Playful" },
  { value: "mysterious", label: "Mysterious" },
  { value: "elegant", label: "Elegant" },
  { value: "vibrant", label: "Vibrant" },
  { value: "serene", label: "Serene" },
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
];

// Interface for the cover parameters
interface CoverParams {
  title: string;
  author?: string;
  genre?: string;
  description?: string;
  style?: string;
  mood?: string;
  color?: string;
}

// Interface for the cover variation parameters
interface VariationParams {
  imageUrl: string;
  modificationPrompt: string;
}

const CoverDesigner: React.FC = () => {
  const { toast } = useToast();
  const [coverParams, setCoverParams] = useState<CoverParams>({
    title: "",
    author: "",
    genre: "",
    description: "",
    style: "modern",
    mood: "professional",
    color: "",
  });
  const [generatedCover, setGeneratedCover] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);
  const [modificationPrompt, setModificationPrompt] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("design");
  const [savedCovers, setSavedCovers] = useState<string[]>([]);

  // Mutation for generating the initial cover
  const coverMutation = useMutation({
    mutationFn: async (params: CoverParams) => {
      const response = await apiRequest({
        url: "/api/book-covers/generate",
        method: "POST",
        body: params,
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedCover(data.imageUrl);
      setPrompt(data.prompt);
      setActiveTab("preview");
      toast({
        title: "Cover generated successfully",
        description: "Your book cover has been created. You can now refine it or save it.",
      });
    },
    onError: (error) => {
      toast({
        title: "Cover generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Mutation for generating cover variations
  const variationMutation = useMutation({
    mutationFn: async (params: VariationParams) => {
      const response = await apiRequest({
        url: "/api/book-covers/variations",
        method: "POST",
        body: params,
      });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedCover(data.imageUrl);
      setPrompt(data.prompt);
      toast({
        title: "Variation generated",
        description: "Your book cover variation has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Variation generation failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Handle generating the initial cover
  const handleGenerateCover = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coverParams.title) {
      toast({
        title: "Title required",
        description: "Please enter a title for your book",
        variant: "destructive",
      });
      return;
    }
    
    coverMutation.mutate(coverParams);
  };

  // Handle generating a variation
  const handleGenerateVariation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!generatedCover) {
      toast({
        title: "No cover generated yet",
        description: "Please generate a cover first",
        variant: "destructive",
      });
      return;
    }
    
    if (!modificationPrompt.trim()) {
      toast({
        title: "Modification prompt required",
        description: "Please enter a description of the changes you want",
        variant: "destructive",
      });
      return;
    }
    
    variationMutation.mutate({
      imageUrl: generatedCover,
      modificationPrompt,
    });
  };

  // Save the current cover design
  const handleSaveCover = () => {
    if (generatedCover) {
      setSavedCovers([...savedCovers, generatedCover]);
      toast({
        title: "Cover saved",
        description: "Your book cover has been saved to your collection.",
      });
    }
  };

  // Download the current cover
  const handleDownloadCover = () => {
    if (generatedCover) {
      const link = document.createElement('a');
      link.href = generatedCover;
      link.download = `${coverParams.title}-cover.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold serif text-primary">Book Cover Designer</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Design Your Cover</CardTitle>
              <CardDescription>
                Fill in the details below to generate an AI-powered book cover design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4 w-full">
                  <TabsTrigger value="design" className="flex-1">Design</TabsTrigger>
                  <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
                  <TabsTrigger value="customize" className="flex-1">Customize</TabsTrigger>
                </TabsList>

                <TabsContent value="design">
                  <form onSubmit={handleGenerateCover} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Book Title</Label>
                      <Input
                        id="title"
                        value={coverParams.title}
                        onChange={(e) => setCoverParams({ ...coverParams, title: e.target.value })}
                        placeholder="Enter your book title"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="author">Author Name</Label>
                      <Input
                        id="author"
                        value={coverParams.author}
                        onChange={(e) => setCoverParams({ ...coverParams, author: e.target.value })}
                        placeholder="Your name or pen name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="genre">Genre</Label>
                      <Select
                        value={coverParams.genre}
                        onValueChange={(value) => setCoverParams({ ...coverParams, genre: value })}
                      >
                        <SelectTrigger id="genre">
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Book Genres</SelectLabel>
                            {BOOK_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={coverParams.description}
                        onChange={(e) => setCoverParams({ ...coverParams, description: e.target.value })}
                        placeholder="Brief description of your book (plot, themes, etc.)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="style">Visual Style</Label>
                      <Select
                        value={coverParams.style}
                        onValueChange={(value) => setCoverParams({ ...coverParams, style: value })}
                      >
                        <SelectTrigger id="style">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent>
                          {STYLE_OPTIONS.map((style) => (
                            <SelectItem key={style.value} value={style.value}>
                              {style.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="mood">Mood</Label>
                      <Select
                        value={coverParams.mood}
                        onValueChange={(value) => setCoverParams({ ...coverParams, mood: value })}
                      >
                        <SelectTrigger id="mood">
                          <SelectValue placeholder="Select a mood" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOOD_OPTIONS.map((mood) => (
                            <SelectItem key={mood.value} value={mood.value}>
                              {mood.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="color">Dominant Color</Label>
                      <div className="flex space-x-1 mt-2">
                        {COLOR_OPTIONS.map((color) => (
                          <div
                            key={color.value}
                            className={`h-8 w-8 rounded-full cursor-pointer ${
                              coverParams.color === color.value ? "ring-2 ring-primary ring-offset-2" : ""
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.label}
                            onClick={() => setCoverParams({ ...coverParams, color: color.value })}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-secondary hover:bg-secondary-dark"
                        disabled={coverMutation.isPending}
                      >
                        {coverMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Cover"
                        )}
                      </Button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="preview">
                  <div className="flex flex-col space-y-4 items-center">
                    {generatedCover ? (
                      <>
                        <div className="border border-neutral-200 shadow-lg rounded-lg overflow-hidden bg-white">
                          <img
                            src={generatedCover}
                            alt="Generated book cover"
                            className="w-full aspect-[2/3] object-cover"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={handleSaveCover}
                            className="flex items-center"
                          >
                            <i className="fas fa-bookmark mr-2"></i>
                            Save Cover
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleDownloadCover}
                            className="flex items-center"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-neutral-500">
                          Generate a cover from the Design tab to see a preview here
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="customize">
                  <form onSubmit={handleGenerateVariation} className="space-y-4">
                    <div>
                      <Label htmlFor="modificationPrompt">Modification Instructions</Label>
                      <Textarea
                        id="modificationPrompt"
                        value={modificationPrompt}
                        onChange={(e) => setModificationPrompt(e.target.value)}
                        placeholder="Describe the changes you want, e.g., 'Make it more dramatic with darker colors' or 'Add a mountain landscape in the background'"
                        rows={4}
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full bg-secondary hover:bg-secondary-dark"
                        disabled={variationMutation.isPending || !generatedCover}
                      >
                        {variationMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating Variation...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Generate Variation
                          </>
                        )}
                      </Button>
                    </div>
                  </form>

                  {prompt && (
                    <div className="mt-6">
                      <Label>Current Design Prompt</Label>
                      <div className="p-3 rounded bg-neutral-100 mt-2 text-sm">
                        {prompt}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {generatedCover ? "Your Book Cover" : "Cover Preview"}
              </CardTitle>
              <CardDescription>
                {generatedCover
                  ? "Here's your AI-generated book cover design"
                  : "Your cover will appear here after generation"}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              {generatedCover ? (
                <div className="relative mx-auto max-w-md">
                  <div className="relative shadow-xl rounded-lg overflow-hidden border border-neutral-200 transition-all duration-300 transform hover:shadow-2xl hover:scale-102">
                    <img
                      src={generatedCover}
                      alt="Generated book cover"
                      className="w-full aspect-[2/3] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                      <h3 className="text-xl font-bold mb-1 text-shadow">
                        {coverParams.title}
                      </h3>
                      {coverParams.author && (
                        <p className="text-sm opacity-90 text-shadow">
                          By {coverParams.author}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md aspect-[2/3] rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center p-8 text-center text-neutral-500">
                  Fill in the details and generate a cover to see a preview here
                </div>
              )}
            </CardContent>
            {savedCovers.length > 0 && (
              <CardFooter className="flex-col items-start">
                <h3 className="text-lg font-medium mb-3">Saved Covers</h3>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {savedCovers.map((coverUrl, index) => (
                    <div
                      key={index}
                      className="relative aspect-[2/3] rounded-md overflow-hidden border border-neutral-200 cursor-pointer"
                      onClick={() => setGeneratedCover(coverUrl)}
                    >
                      <img
                        src={coverUrl}
                        alt={`Saved cover ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoverDesigner;