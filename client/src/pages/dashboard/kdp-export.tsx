import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Book } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Download, DownloadCloud, ExternalLink, BookOpen, FileText, Image } from "lucide-react";

// KDP specifications from Amazon
const KDP_SPECS = {
  coverRatio: "1.6:1 (height:width)",
  minDimensions: "1000px x 1600px",
  recommendedDimensions: "2560px x 1600px",
  acceptedFormats: "JPG or TIFF with 300 DPI",
  interiorFormats: "PDF for print, EPUB for ebook",
  colorSpace: "RGB for ebook covers, CMYK for print covers"
};

const KdpExport: React.FC = () => {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedBook, setSelectedBook] = useState<number | null>(null);
  const [exportType, setExportType] = useState<"print" | "ebook">("ebook");
  const [includeCover, setIncludeCover] = useState(true);
  const [includeManuscript, setIncludeManuscript] = useState(true);
  const [optimizeImages, setOptimizeImages] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get author's books
  const userId = 1; // In a real app, this would come from auth context
  const { data: books, isLoading: booksLoading } = useQuery<Book[]>({
    queryKey: [`/api/books/author/${userId}`],
    enabled: !!userId,
  });

  // Mutation for exporting to KDP
  const exportMutation = useMutation({
    mutationFn: async (params: {
      bookId: number;
      exportType: "print" | "ebook";
      includeCover: boolean;
      includeManuscript: boolean;
      optimizeImages: boolean;
    }) => {
      const response = await apiRequest({
        url: `/api/books/${params.bookId}/kdp-export`,
        method: "POST",
        data: { exportType: params.exportType },
      });
      return response.json();
    },
    onSuccess: (data: { exportUrl: string; fileName: string; message: string }) => {
      // Trigger download of the exported files
      if (data.exportUrl) {
        // Create a temporary link to trigger the download
        const downloadLink = document.createElement("a");
        downloadLink.href = data.exportUrl;
        downloadLink.download = data.fileName || "kdp-export.zip";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }

      setIsProcessing(false);
      
      toast({
        title: "Export completed",
        description: "Your book has been successfully prepared for KDP. Download should start automatically.",
      });
    },
    onError: (error) => {
      setIsProcessing(false);

      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not prepare your book for KDP export. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (!selectedBook) {
      toast({
        title: "No book selected",
        description: "Please select a book to export for KDP.",
        variant: "destructive",
      });
      return;
    }

    if (!includeCover && !includeManuscript) {
      toast({
        title: "Export options required",
        description: "Please select at least one item to export (cover or manuscript).",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    exportMutation.mutate({
      bookId: selectedBook,
      exportType,
      includeCover,
      includeManuscript,
      optimizeImages,
    });
  };

  const getSelectedBookData = () => {
    if (!selectedBook || !books) return null;
    return books.find(book => book.id === selectedBook);
  };

  const selectedBookData = getSelectedBookData();

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold serif text-primary">KDP Export Tool</h1>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export for Amazon KDP</CardTitle>
              <CardDescription>
                Prepare your book for publishing on Amazon Kindle Direct Publishing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="book-select">Select Book</Label>
                <Select 
                  value={selectedBook?.toString() || ""} 
                  onValueChange={(value) => setSelectedBook(parseInt(value))}
                  disabled={booksLoading || isProcessing}
                >
                  <SelectTrigger id="book-select" className="w-full">
                    <SelectValue placeholder="Select a book to export" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Your Books</SelectLabel>
                      {books?.map(book => (
                        <SelectItem key={book.id} value={book.id.toString()}>
                          {book.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="export-type">Export Format</Label>
                <Select 
                  value={exportType} 
                  onValueChange={(value) => setExportType(value as "print" | "ebook")}
                  disabled={isProcessing}
                >
                  <SelectTrigger id="export-type" className="w-full">
                    <SelectValue placeholder="Select export format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>KDP Format</SelectLabel>
                      <SelectItem value="ebook">Kindle eBook</SelectItem>
                      <SelectItem value="print">Print Book</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-2">
                  {exportType === "ebook" ? 
                    "Optimized for Kindle devices and apps" : 
                    "Optimized for paperback printing"
                  }
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Export Options</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-cover" 
                    checked={includeCover}
                    onCheckedChange={(checked) => setIncludeCover(!!checked)}
                    disabled={isProcessing}
                  />
                  <Label 
                    htmlFor="include-cover" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Include cover image (optimized for KDP)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-manuscript" 
                    checked={includeManuscript}
                    onCheckedChange={(checked) => setIncludeManuscript(!!checked)}
                    disabled={isProcessing}
                  />
                  <Label 
                    htmlFor="include-manuscript" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Include manuscript (formatted for KDP)
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="optimize-images" 
                    checked={optimizeImages}
                    onCheckedChange={(checked) => setOptimizeImages(!!checked)}
                    disabled={isProcessing}
                  />
                  <Label 
                    htmlFor="optimize-images" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Optimize images for KDP requirements
                  </Label>
                </div>
              </div>

              <Button 
                onClick={handleExport} 
                disabled={isProcessing || !selectedBook || (!includeCover && !includeManuscript)}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="mr-2 h-4 w-4" />
                    Export for KDP
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* KDP Guidelines Card */}
          <Card>
            <CardHeader>
              <CardTitle>KDP Guidelines</CardTitle>
              <CardDescription>
                Amazon Kindle Direct Publishing requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Cover Image</h3>
                  <ul className="mt-2 space-y-1">
                    <li className="text-sm">• Ratio: {KDP_SPECS.coverRatio}</li>
                    <li className="text-sm">• Minimum: {KDP_SPECS.minDimensions}</li>
                    <li className="text-sm">• Recommended: {KDP_SPECS.recommendedDimensions}</li>
                    <li className="text-sm">• Format: {KDP_SPECS.acceptedFormats}</li>
                    <li className="text-sm">• Color: {KDP_SPECS.colorSpace}</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-medium">Manuscript</h3>
                  <ul className="mt-2 space-y-1">
                    <li className="text-sm">• Format: {KDP_SPECS.interiorFormats}</li>
                    <li className="text-sm">• Margins: At least 0.5 inches (print)</li>
                    <li className="text-sm">• Images: 300 DPI resolution</li>
                  </ul>
                </div>
                <div className="pt-2">
                  <a 
                    href="https://kdp.amazon.com/en_US/help/topic/G200645690" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View complete KDP guidelines
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {selectedBookData ? selectedBookData.title : "Book Preview"}
              </CardTitle>
              <CardDescription>
                {selectedBookData
                  ? `Preview your book before exporting for KDP`
                  : `Select a book to see a preview`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedBookData ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Cover Preview */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <Image className="h-4 w-4 mr-2" />
                        Cover Image
                      </h3>
                      <div className="relative aspect-[1/1.6] max-w-[240px] mx-auto border border-neutral-200 rounded-md overflow-hidden shadow-md">
                        {selectedBookData.coverImage ? (
                          <img
                            src={selectedBookData.coverImage}
                            alt={`Cover for ${selectedBookData.title}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
                            <BookOpen className="h-12 w-12" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        {includeCover ? "Will be optimized for KDP" : "Not included in export"}
                      </p>
                    </div>

                    {/* Manuscript Preview */}
                    <div className="flex-1">
                      <h3 className="text-sm font-medium mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Manuscript
                      </h3>
                      <div className="relative aspect-[1/1.4] max-w-[240px] mx-auto border border-neutral-200 rounded-md overflow-hidden bg-white shadow-md">
                        <div className="absolute inset-0 flex flex-col">
                          {/* Simulated manuscript page */}
                          <div className="p-4 text-[6px] sm:text-[8px] overflow-hidden">
                            <div className="font-bold text-center text-[10px] sm:text-[12px] mb-2">{selectedBookData.title}</div>
                            <div className="h-[2px] w-10 mx-auto bg-neutral-300 mb-2"></div>
                            <p className="text-justify leading-tight mb-2">
                              {selectedBookData.description?.substring(0, 150)}...
                            </p>
                            <div className="space-y-1">
                              {Array.from({ length: 10 }).map((_, i) => (
                                <div key={i} className="w-full h-[2px] bg-neutral-100"></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-center mt-2 text-muted-foreground">
                        {includeManuscript ? 
                          `Will be formatted for ${exportType === 'ebook' ? 'Kindle' : 'print'}` : 
                          "Not included in export"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-md">
                    <h3 className="font-medium text-blue-800 mb-2">What happens during export?</h3>
                    <ul className="space-y-2 text-sm text-blue-700">
                      <li className="flex items-start">
                        <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-center mr-2 flex-shrink-0">1</span>
                        <span>Your book files are analyzed for KDP compatibility</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-center mr-2 flex-shrink-0">2</span>
                        <span>Cover image is resized and formatted to KDP specifications</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-center mr-2 flex-shrink-0">3</span>
                        <span>Manuscript is converted to {exportType === 'ebook' ? 'EPUB (ebook)' : 'PDF (print)'} format</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block h-5 w-5 rounded-full bg-blue-100 text-blue-800 text-center mr-2 flex-shrink-0">4</span>
                        <span>All files are packaged in a ZIP file ready for upload to KDP</span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="h-[400px] flex flex-col items-center justify-center text-neutral-400">
                  <BookOpen className="h-16 w-16 mb-4" />
                  <p>Select a book to preview and export</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KdpExport;