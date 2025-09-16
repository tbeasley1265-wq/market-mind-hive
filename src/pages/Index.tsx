import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Brain, TrendingUp, Zap, Users, Clock, MessageSquare } from "lucide-react";

const Index = () => {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative">
          <div className="container mx-auto px-6 py-20 lg:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
                <Zap className="mr-2 h-4 w-4 text-accent-muted" />
                <span className="text-sm font-medium text-white">AI-Powered Research Intelligence</span>
              </div>
              
              <h1 className="mb-6 text-4xl font-bold text-white lg:text-6xl">
                Stay Ahead of Markets with{" "}
                <span className="bg-gradient-to-r from-accent-muted to-white bg-clip-text text-transparent">
                  Market Minds
                </span>
              </h1>
              
              <p className="mb-8 text-lg text-white/80 lg:text-xl max-w-3xl mx-auto">
                Track, summarize, and surface insights from the world's top analysts across YouTube, Substack, 
                Twitter, newsletters, and your inbox — all powered by advanced AI.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <div className="flex w-full sm:w-auto max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-l-lg bg-white/10 border border-white/20 text-white placeholder-white/60 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-accent-muted"
                  />
                  <Button variant="hero" className="rounded-l-none px-6" asChild>
                    <Link to="/onboarding">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-8 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Trusted by 500+ analysts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Real-time insights</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Everything you need for market research
            </h2>
            <p className="text-lg text-muted-foreground">
              Aggregate content from multiple sources, get AI-powered summaries, and interact with insights through our advanced chat interface.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="border-card-border shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <CardTitle>AI-Powered Summaries</CardTitle>
                <CardDescription>
                  Get intelligent summaries of videos, articles, and newsletters with key insights highlighted.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">YouTube Transcripts</Badge>
                  <Badge variant="secondary">Substack Articles</Badge>
                  <Badge variant="secondary">Email Newsletters</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Multi-Source Aggregation</CardTitle>
                <CardDescription>
                  Connect Twitter, Reddit, private platforms, and more to get a comprehensive view of market sentiment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">Twitter/X</Badge>
                  <Badge variant="secondary">Reddit</Badge>
                  <Badge variant="secondary">Private Platforms</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border shadow-card hover:shadow-elevated transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-accent flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <CardTitle>Interactive Chat</CardTitle>
                <CardDescription>
                  Ask questions about any content, get clarifications, and explore deeper insights with our AI assistant.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">Content Q&A</Badge>
                  <Badge variant="secondary">Sentiment Analysis</Badge>
                  <Badge variant="secondary">Trend Tracking</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-card">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
            Ready to transform your research workflow?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join hundreds of analysts, fund managers, and researchers who trust Market Minds 
            to stay ahead of market trends.
          </p>
          <Button variant="hero" size="lg" asChild>
            <Link to="/onboarding">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;