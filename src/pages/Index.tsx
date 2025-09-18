import { useState } from "react";
import { Link } from "react-router-dom";
import marketMindsLogo from "@/assets/market-minds-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Brain, 
  TrendingUp, 
  Zap, 
  Users, 
  Clock, 
  MessageSquare,
  Youtube,
  Mail,
  Twitter,
  FileText,
  Rss,
  ChevronRight,
  Play,
  Star,
  CheckCircle,
  BarChart3,
  Target,
  Sparkles
} from "lucide-react";

const Index = () => {
  const [email, setEmail] = useState("");

  const sources = [
    {
      name: "YouTube",
      icon: Youtube,
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-900/20",
      description: "AI-powered video summaries",
      count: "2.5K+ channels"
    },
    {
      name: "Gmail",
      icon: Mail,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      description: "Newsletter extraction",
      count: "10K+ emails processed"
    },
    {
      name: "Twitter/X",
      icon: Twitter,
      color: "text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-900/20",
      description: "Real-time sentiment",
      count: "50K+ tweets analyzed"
    },
    {
      name: "Substack",
      icon: FileText,
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      description: "Research articles",
      count: "1K+ publications"
    },
    {
      name: "RSS Feeds",
      icon: Rss,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      description: "News aggregation",
      count: "500+ feeds monitored"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Hedge Fund Manager",
      company: "Quantum Capital",
      avatar: "SC",
      content: "Market Minds has transformed how we consume research. We're now 3x faster at identifying market opportunities.",
      rating: 5
    },
    {
      name: "Michael Rodriguez",
      role: "Senior Analyst",
      company: "Goldman Sachs",
      avatar: "MR",
      content: "The AI summarization is incredibly accurate. It's like having a personal research assistant.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Portfolio Manager",
      company: "BlackRock",
      avatar: "ET",
      content: "Integration with our existing workflow was seamless. ROI was immediate.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Market Minds Logo - Top Left */}
      <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
        <img src={marketMindsLogo} alt="Market Minds Logo" className="w-10 h-10" />
        <span className="text-foreground text-2xl font-bold">
          Market Minds
        </span>
      </div>

      {/* Floating Background Elements */} 
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-3xl animate-float opacity-60" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full blur-3xl animate-float-delayed opacity-50" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-gradient-to-r from-accent/10 to-success/10 rounded-full blur-3xl animate-float opacity-40" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">
            
            
            <h2 className="mb-8 text-4xl font-bold text-foreground lg:text-6xl animate-fade-in-up leading-tight">
              All Your Financial Research,{" "}
              <span className="bg-gradient-to-r from-accent via-primary to-success bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient-shift">
                Summarized by AI in Real Time
              </span>
            </h2>
            
            <p className="mb-12 text-xl text-muted-foreground lg:text-2xl max-w-4xl mx-auto animate-fade-in-up leading-relaxed">
              We extract and analyze insights from the world's top financial minds across 
              YouTube, newsletters, Twitter, and private platforms — delivering instant summaries 
              the moment new content drops.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-scale-in">
              <div className="flex w-full sm:w-auto max-w-lg">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-6 py-4 rounded-l-xl bg-card/80 border border-border text-foreground placeholder-muted-foreground backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-300"
                />
                <Button 
                  size="lg" 
                  className="rounded-l-none px-8 bg-gradient-accent hover:scale-105 transition-all duration-300 shadow-elevated" 
                  asChild
                >
                  <Link to="/auth">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Sources Showcase Section */}
      <section className="py-16 lg:py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              We Monitor <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">Everything</span> For You
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto">
              <span className="font-semibold text-foreground">Automatic extraction</span> from every platform where financial insights live. 
              <span className="font-semibold text-accent">Instant summaries</span> ready the moment new content appears.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {sources.map((source, index) => {
              const IconComponent = source.icon;
              return (
                <Card 
                  key={source.name} 
                  className={`group hover:shadow-elevated transition-all duration-500 hover:-translate-y-2 cursor-pointer border-card-border/50 hover:border-accent/50 ${source.bgColor} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 rounded-2xl ${source.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-8 w-8 ${source.color}`} />
                    </div>
                    <h3 className="font-bold text-lg mb-2 text-foreground">{source.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{source.description}</p>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {source.count}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section with Enhanced Visuals */}
      <section className="py-16 lg:py-24 bg-gradient-card">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16 animate-fade-in-up">
            <h2 className="text-3xl lg:text-5xl font-bold text-foreground mb-6">
              Why Top Analysts Choose Market Minds
            </h2>
            <p className="text-lg lg:text-xl text-muted-foreground">
              Advanced AI capabilities designed specifically for financial research and market analysis.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-card-border/50 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 group animate-scale-in">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">AI-Powered Analysis</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Advanced NLP models extract key insights, sentiment, and market signals 
                  from unstructured content with 95%+ accuracy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Sentiment Analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-sm font-medium">Key Theme Extraction</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="text-sm font-medium">Price Target Detection</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border/50 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 group animate-scale-in" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Real-Time Aggregation</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Monitor thousands of sources simultaneously with instant updates 
                  on breaking news, research reports, and market movements.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Live Data Streams</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-sm font-medium">Smart Prioritization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="text-sm font-medium">Custom Alerts</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border/50 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 group animate-scale-in" style={{ animationDelay: '400ms' }}>
              <CardHeader className="pb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success to-accent flex items-center justify-center mb-6 group-hover:animate-pulse-glow">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl mb-3">Interactive Intelligence</CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  Chat with your research data to uncover hidden patterns, 
                  correlations, and actionable insights across all your sources.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-sm font-medium">Natural Language Queries</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-sm font-medium">Cross-Source Analysis</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                    <span className="text-sm font-medium">Predictive Insights</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5" />
        <div className="container mx-auto px-6 text-center relative">
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-8 leading-tight">
              Ready to Transform Your 
              <span className="block bg-gradient-to-r from-white to-accent-muted bg-clip-text text-transparent">
                Research Workflow?
              </span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                variant="secondary"
                className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300 shadow-elevated" 
                asChild
              >
                <Link to="/auth">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="ghost"
                className="px-8 py-4 text-lg font-semibold text-white border-white/20 hover:bg-white/10 transition-all duration-300" 
                asChild
              >
                <Link to="/auth?tab=signin">
                  Sign In
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;