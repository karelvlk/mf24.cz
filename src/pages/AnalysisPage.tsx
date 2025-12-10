import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

const AnalysisPage = () => {
  const navigate = useNavigate();
  const { tab } = useParams();

  // Import all png images from data/analysis
  // The path is relative to this file: ../../data/analysis
  const images = import.meta.glob('../../data/analysis/*/*.png', { eager: true, as: 'url' });
  const csvFiles = import.meta.glob('../../data/analysis/*.csv', { eager: true, as: 'url' });

  const categories = useMemo(() => {
    const cats = new Set<string>();
    const imagesByCategory: Record<string, string[]> = {};

    Object.keys(images).forEach((path) => {
      // path looks like "../../data/analysis/category/image.png"
      const parts = path.split('/');
      // parts: ["..", "..", "data", "analysis", "category", "image.png"]
      // The category is at index 4 (if split by /)
      // Let's be more robust
      const match = path.match(/data\/analysis\/([^/]+)\/([^/]+)$/);
      if (match) {
        const category = match[1];
        // const filename = match[2];
        cats.add(category);

        if (!imagesByCategory[category]) {
          imagesByCategory[category] = [];
        }
        // @ts-ignore - import.meta.glob with as: 'url' returns string
        imagesByCategory[category].push(images[path]);
      }
    });

    return {
      list: Array.from(cats).sort(),
      data: imagesByCategory
    };
  }, [images]);

  const allTabs = useMemo(() => [...categories.list, 'raw'], [categories.list]);

  // Redirect to the first category if no tab is selected
  useEffect(() => {
    if (!tab && allTabs.length > 0) {
      navigate(`/analysis/${allTabs[0]}`, { replace: true });
    }
  }, [tab, allTabs, navigate]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-3xl font-bold">Analysis</h1>
      </div>

      {allTabs.length > 0 ? (
        <Tabs
          value={tab || allTabs[0]}
          onValueChange={(value) => navigate(`/analysis/${value}`)}
          className="w-full"
        >
          <TabsList className="mb-8 flex w-full flex-wrap justify-start gap-2 bg-transparent p-0">
            {allTabs.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.list.map((category) => (
            <TabsContent key={category} value={category} className="mt-0">
              <div className="flex flex-col items-center gap-8">
                {categories.data[category].map((imgSrc, index) => (
                  <Dialog key={index}>
                    <DialogTrigger asChild>
                      <Card className="overflow-hidden cursor-pointer hover:opacity-90 transition-opacity w-full max-w-[1024px]">
                        <CardContent className="p-0">
                          <img
                            src={imgSrc}
                            alt={`${category} analysis ${index + 1}`}
                            className="h-auto w-full object-contain"
                            loading="lazy"
                          />
                        </CardContent>
                      </Card>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] w-fit h-fit p-0 border-none bg-transparent shadow-none flex flex-col items-center justify-center gap-4">
                      <img
                        src={imgSrc}
                        alt={`${category} analysis ${index + 1}`}
                        className="max-w-full max-h-[85vh] object-contain rounded-md"
                      />
                      <Button
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = imgSrc;
                          link.download = `${category}-analysis-${index + 1}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Stáhnout
                      </Button>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="raw" className="mt-0">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(csvFiles).map(([path, url]) => {
                const filename = path.split('/').pop();
                return (
                  <Card key={path}>
                    <CardContent className="flex flex-col items-center justify-center p-6 gap-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <span className="font-medium">{filename}</span>
                      <Button asChild variant="outline">
                        <a href={url as string} download={filename}>
                          <Download className="mr-2 h-4 w-4" />
                          Stáhnout
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex h-64 items-center justify-center text-muted-foreground">
          No analysis data found.
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;
