import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  ArrowRight, 
  ArrowLeft, 
  Bitcoin, 
  TrendingUp, 
  Briefcase, 
  Zap,
  Brain,
  Bell,
  Users,
  CheckCircle2
} from "lucide-react";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [summaryLength, setSummaryLength] = useState<string>("standard");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    frequency: "daily"
  });

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const interests = [
    { id: "crypto", label: "Cryptocurrency", icon: Bitcoin, description: "Bitcoin, Ethereum, DeFi, NFTs" },
    { id: "macro", label: "Macroeconomics", icon: TrendingUp, description: "Fed policy, inflation, global economics" },
    { id: "equities", label: "Equity Markets", icon: Briefcase, description: "Stocks, earnings, sector analysis" },
    { id: "fintech", label: "FinTech", icon: Zap, description: "Digital banking, payments, lending" },
    { id: "ai", label: "Artificial Intelligence", icon: Brain, description: "AI companies, automation, tech trends" },
    { id: "vc", label: "Venture Capital", icon: Users, description: "Startups, funding rounds, innovation" },
  ];

  const influencers = [
    { id: "raoul-pal", name: "Raoul Pal", platform: "Real Vision", followers: "1.2M", category: "Macro" },
    { id: "anthony-pompliano", name: "Anthony Pompliano", platform: "YouTube", followers: "1.8M", category: "Crypto" },
    { id: "cathie-wood", name: "Cathie Wood", platform: "ARK Invest", followers: "2.1M", category: "Innovation" },
    { id: "michael-saylor", name: "Michael Saylor", platform: "Twitter", followers: "3.1M", category: "Bitcoin" },
    { id: "balaji-srinivasan", name: "Balaji Srinivasan", platform: "Twitter", followers: "920K", category: "Tech" },
    { id: "lyn-alden", name: "Lyn Alden", platform: "Substack", followers: "450K", category: "Finance" },
    { id: "preston-pysh", name: "Preston Pysh", platform: "The Investor's Podcast", followers: "680K", category: "Investing" },
    { id: "ryan-sean-adams", name: "Ryan Sean Adams", platform: "Bankless", followers: "750K", category: "DeFi" },
  ];

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleInfluencerToggle = (influencerId: string) => {
    setSelectedInfluencers(prev => 
      prev.includes(influencerId) 
        ? prev.filter(id => id !== influencerId)
        : [...prev, influencerId]
    );
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-card flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Progress Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Market Minds</h1>
          <p className="text-muted-foreground mb-6">Let's personalize your research experience</p>
          <div className="max-w-md mx-auto">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Step {currentStep}</span>
              <span>{totalSteps} Steps</span>
            </div>
          </div>
        </div>

        {/* Step 1: Interests */}
        {currentStep === 1 && (
          <Card className="border-card-border shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-accent" />
                What are your main interests?
              </CardTitle>
              <CardDescription>
                Select the areas you want to track and receive insights about
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {interests.map((interest) => {
                  const IconComponent = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);
                  
                  return (
                    <div
                      key={interest.id}
                      onClick={() => handleInterestToggle(interest.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-accent bg-accent/10 shadow-card' 
                          : 'border-card-border hover:border-accent/50 hover:bg-accent/5'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <IconComponent className={`h-6 w-6 mt-1 ${isSelected ? 'text-accent' : 'text-muted-foreground'}`} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-foreground">{interest.label}</h3>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-accent" />}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{interest.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Influencers */}
        {currentStep === 2 && (
          <Card className="border-card-border shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Users className="h-6 w-6 text-accent" />
                Follow Key Influencers
              </CardTitle>
              <CardDescription>
                Choose thought leaders and analysts you want to track
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {influencers.map((influencer) => {
                  const isSelected = selectedInfluencers.includes(influencer.id);
                  
                  return (
                    <div
                      key={influencer.id}
                      onClick={() => handleInfluencerToggle(influencer.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-accent bg-accent/10 shadow-card' 
                          : 'border-card-border hover:border-accent/50 hover:bg-accent/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-foreground">{influencer.name}</h3>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-accent" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{influencer.platform}</span>
                            <span>•</span>
                            <span>{influencer.followers}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {influencer.category}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Summary Preferences */}
        {currentStep === 3 && (
          <Card className="border-card-border shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <TrendingUp className="h-6 w-6 text-accent" />
                Summary Preferences
              </CardTitle>
              <CardDescription>
                Choose how detailed you want your content summaries to be
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  { id: "brief", label: "Brief", description: "Quick bullet points and key takeaways", time: "30 sec read" },
                  { id: "standard", label: "Standard", description: "Balanced overview with main insights", time: "2 min read" },
                  { id: "detailed", label: "Detailed", description: "Comprehensive analysis with full context", time: "5 min read" }
                ].map((option) => (
                  <div
                    key={option.id}
                    onClick={() => setSummaryLength(option.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      summaryLength === option.id 
                        ? 'border-accent bg-accent/10 shadow-card' 
                        : 'border-card-border hover:border-accent/50 hover:bg-accent/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground">{option.label}</h3>
                          {summaryLength === option.id && <CheckCircle2 className="h-4 w-4 text-accent" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{option.description}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {option.time}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Notifications */}
        {currentStep === 4 && (
          <Card className="border-card-border shadow-elevated">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Bell className="h-6 w-6 text-accent" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Choose how and when you want to be notified about new insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="email-notifications" 
                    checked={notifications.email}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: !!checked }))}
                  />
                  <Label htmlFor="email-notifications" className="text-sm font-medium">
                    Email notifications
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="push-notifications" 
                    checked={notifications.push}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: !!checked }))}
                  />
                  <Label htmlFor="push-notifications" className="text-sm font-medium">
                    Push notifications
                  </Label>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Notification frequency</Label>
                <div className="space-y-2">
                  {[
                    { id: "realtime", label: "Real-time", description: "Get notified instantly when new content arrives" },
                    { id: "daily", label: "Daily digest", description: "Receive a summary once per day" },
                    { id: "weekly", label: "Weekly rollup", description: "Get a comprehensive weekly summary" }
                  ].map((option) => (
                    <div
                      key={option.id}
                      onClick={() => setNotifications(prev => ({ ...prev, frequency: option.id }))}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        notifications.frequency === option.id 
                          ? 'border-accent bg-accent/10' 
                          : 'border-card-border hover:border-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground text-sm">{option.label}</h4>
                        {notifications.frequency === option.id && <CheckCircle2 className="h-4 w-4 text-accent" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i + 1 <= currentStep ? 'bg-accent' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {currentStep < totalSteps ? (
            <Button variant="hero" onClick={nextStep}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button variant="hero" asChild>
              <Link to="/dashboard">
                Complete Setup
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;