import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  CheckCircle2,
  Search
} from "lucide-react";

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedInfluencers, setSelectedInfluencers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    frequency: "daily"
  });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const interests = [
    { id: "crypto", label: "Cryptocurrency", icon: Bitcoin, description: "Bitcoin, Ethereum, DeFi, NFTs" },
    { id: "macro", label: "Macroeconomics", icon: TrendingUp, description: "Fed policy, inflation, global economics" },
    { id: "equities", label: "Equity Markets", icon: Briefcase, description: "Stocks, earnings, sector analysis" },
    { id: "fintech", label: "FinTech", icon: Zap, description: "Digital banking, payments, lending" },
    { id: "ai", label: "Artificial Intelligence", icon: Brain, description: "AI companies, automation, tech trends" },
    { id: "vc", label: "Venture Capital", icon: Users, description: "Startups, funding rounds, innovation" },
    { id: "personal-finance", label: "Personal Finance", icon: TrendingUp, description: "Budgeting, investing, retirement planning" },
    { id: "blockchain", label: "Blockchain Technology", icon: Bitcoin, description: "Distributed ledgers, smart contracts, Web3" },
    { id: "quantitative", label: "Quantitative Trading", icon: TrendingUp, description: "Algorithmic trading, quant strategies, data analysis" },
    { id: "esg", label: "ESG & Sustainable Investing", icon: Brain, description: "Environmental, social, governance investing" },
    { id: "derivatives", label: "Options & Derivatives", icon: Briefcase, description: "Options, futures, risk management" },
    { id: "forex", label: "Forex & Currencies", icon: TrendingUp, description: "Currency trading, exchange rates, monetary policy" },
    { id: "commodities", label: "Commodities & Energy", icon: Zap, description: "Oil, gold, agriculture, renewable energy" },
    { id: "real-estate", label: "Real Estate Investment", icon: Briefcase, description: "REITs, property investment, commercial real estate" },
    { id: "alternatives", label: "Alternative Investments", icon: Users, description: "Private equity, hedge funds, art, collectibles" },
    { id: "psychology", label: "Market Psychology", icon: Brain, description: "Behavioral finance, sentiment analysis, trading psychology" },
    { id: "regulatory", label: "Regulatory & Compliance", icon: Briefcase, description: "SEC regulations, compliance, legal frameworks" },
    { id: "defi", label: "DeFi & Web3", icon: Bitcoin, description: "Decentralized finance, yield farming, liquidity mining" },
    { id: "nfts", label: "NFTs & Digital Assets", icon: Zap, description: "Non-fungible tokens, digital art, metaverse" },
    { id: "cbdc", label: "Central Bank Digital Currencies", icon: TrendingUp, description: "Digital dollars, monetary innovation, CBDCs" },
    { id: "fixed-income", label: "Fixed Income & Bonds", icon: Briefcase, description: "Treasury bonds, corporate bonds, yield analysis, credit spreads" },
    { id: "dividend-investing", label: "Dividend Investing", icon: TrendingUp, description: "Dividend aristocrats, REIT dividends, income strategies" },
    { id: "value-investing", label: "Value Investing", icon: Brain, description: "Undervalued stocks, fundamental analysis, Buffett-style investing" },
    { id: "growth-investing", label: "Growth Investing", icon: Zap, description: "High-growth companies, momentum stocks, disruptive innovation" },
    { id: "technical-analysis", label: "Technical Analysis", icon: TrendingUp, description: "Chart patterns, indicators, trading signals, price action" },
    { id: "ipos-spacs", label: "IPOs & SPACs", icon: Users, description: "Initial public offerings, SPAC mergers, new listings" },
    { id: "ma-activity", label: "Mergers & Acquisitions", icon: Briefcase, description: "Corporate deals, takeovers, consolidation trends" },
    { id: "small-mid-cap", label: "Small & Mid-Cap Stocks", icon: TrendingUp, description: "Emerging companies, growth potential, Russell 2000" },
    { id: "international", label: "International Markets", icon: Brain, description: "Global investing, emerging markets, currency hedging" },
    { id: "sector-rotation", label: "Sector Analysis", icon: Zap, description: "Technology, healthcare, financials, energy sectors" },
    { id: "risk-management", label: "Risk Management", icon: Briefcase, description: "Portfolio hedging, volatility control, position sizing" },
    { id: "wealth-management", label: "Wealth Management", icon: Users, description: "Financial planning, tax strategies, estate planning" },
    { id: "credit-markets", label: "Credit Markets", icon: TrendingUp, description: "Corporate credit, high-yield bonds, distressed debt" },
    { id: "emerging-markets", label: "Emerging Markets", icon: Brain, description: "Developing economies, frontier markets, growth opportunities" },
    { id: "biotech-healthcare", label: "Biotech & Healthcare", icon: Zap, description: "Pharmaceutical companies, medical devices, clinical trials" },
    { id: "tax-strategy", label: "Tax Strategy & Planning", icon: Briefcase, description: "Tax-efficient investing, capital gains, retirement accounts" },
  ];

  const influencers = [
    // Crypto & Bitcoin
    { id: "raoul-pal", name: "Raoul Pal", platform: "Real Vision", followers: "1.2M", category: "Macro" },
    { id: "anthony-pompliano", name: "Anthony Pompliano", platform: "YouTube", followers: "1.8M", category: "Crypto" },
    { id: "michael-saylor", name: "Michael Saylor", platform: "Twitter", followers: "3.1M", category: "Bitcoin" },
    { id: "balaji-srinivasan", name: "Balaji Srinivasan", platform: "Twitter", followers: "920K", category: "Tech" },
    { id: "ryan-sean-adams", name: "Ryan Sean Adams", platform: "Bankless", followers: "750K", category: "DeFi" },
    { id: "coin-bureau", name: "Coin Bureau (Guy)", platform: "YouTube", followers: "2.1M", category: "Crypto" },
    { id: "benjamin-cowen", name: "Benjamin Cowen", platform: "YouTube", followers: "1.8M", category: "Crypto" },
    { id: "lark-davis", name: "Lark Davis", platform: "YouTube", followers: "520K", category: "Crypto" },
    { id: "altcoin-daily", name: "Altcoin Daily", platform: "YouTube", followers: "1.3M", category: "Crypto" },
    { id: "ivan-on-tech", name: "Ivan on Tech", platform: "YouTube", followers: "620K", category: "Crypto" },
    { id: "andreas-antonopoulos", name: "Andreas Antonopoulos", platform: "YouTube", followers: "380K", category: "Bitcoin" },
    { id: "robert-breedlove", name: "Robert Breedlove", platform: "Podcast", followers: "340K", category: "Bitcoin" },
    { id: "preston-pysh", name: "Preston Pysh", platform: "The Investor's Podcast", followers: "680K", category: "Investing" },
    { id: "nic-carter", name: "Nic Carter", platform: "Twitter", followers: "480K", category: "Bitcoin" },
    { id: "plan-b", name: "PlanB", platform: "Twitter", followers: "1.8M", category: "Bitcoin" },
    { id: "willy-woo", name: "Willy Woo", platform: "Twitter", followers: "1.1M", category: "Bitcoin" },
    { id: "vijay-boyapati", name: "Vijay Boyapati", platform: "Twitter", followers: "280K", category: "Bitcoin" },
    { id: "jeff-booth", name: "Jeff Booth", platform: "Twitter", followers: "520K", category: "Bitcoin" },
    { id: "saifedean-ammous", name: "Saifedean Ammous", platform: "Twitter", followers: "340K", category: "Bitcoin" },
    { id: "parker-lewis", name: "Parker Lewis", platform: "Twitter", followers: "180K", category: "Bitcoin" },
    
    // Traditional Finance & Macro
    { id: "cathie-wood", name: "Cathie Wood", platform: "ARK Invest", followers: "2.1M", category: "Innovation" },
    { id: "lyn-alden", name: "Lyn Alden", platform: "Substack", followers: "450K", category: "Finance" },
    { id: "ray-dalio", name: "Ray Dalio", platform: "LinkedIn", followers: "3.2M", category: "Macro" },
    { id: "howard-marks", name: "Howard Marks", platform: "Oaktree Capital", followers: "890K", category: "Investing" },
    { id: "warren-buffett", name: "Warren Buffett", platform: "Berkshire Hathaway", followers: "4.2M", category: "Investing" },
    { id: "charlie-munger", name: "Charlie Munger", platform: "Berkshire Hathaway", followers: "1.8M", category: "Investing" },
    { id: "bill-ackman", name: "Bill Ackman", platform: "Twitter", followers: "1.2M", category: "Investing" },
    { id: "carl-icahn", name: "Carl Icahn", platform: "Twitter", followers: "280K", category: "Investing" },
    { id: "david-einhorn", name: "David Einhorn", platform: "Greenlight Capital", followers: "180K", category: "Investing" },
    { id: "stanley-druckenmiller", name: "Stanley Druckenmiller", platform: "Duquesne Family Office", followers: "340K", category: "Macro" },
    { id: "paul-tudor-jones", name: "Paul Tudor Jones", platform: "Tudor Investment", followers: "220K", category: "Macro" },
    { id: "jim-rogers", name: "Jim Rogers", platform: "Rogers Holdings", followers: "450K", category: "Commodities" },
    { id: "marc-faber", name: "Marc Faber", platform: "Gloom Boom Doom Report", followers: "180K", category: "Macro" },
    { id: "nouriel-roubini", name: "Nouriel Roubini", platform: "Twitter", followers: "680K", category: "Economics" },
    { id: "peter-schiff", name: "Peter Schiff", platform: "SchiffGold", followers: "890K", category: "Gold" },
    { id: "jim-cramer", name: "Jim Cramer", platform: "CNBC", followers: "1.9M", category: "Stocks" },
    { id: "cathie-duddy", name: "Cathie Duddy", platform: "ARK Invest", followers: "420K", category: "Innovation" },
    { id: "tom-lee", name: "Tom Lee", platform: "Fundstrat", followers: "380K", category: "Stocks" },
    { id: "kathy-lien", name: "Kathy Lien", platform: "BK Asset Management", followers: "290K", category: "Forex" },
    
    // Tech & Innovation
    { id: "elon-musk", name: "Elon Musk", platform: "Twitter", followers: "150M", category: "Tech" },
    { id: "tim-cook", name: "Tim Cook", platform: "Apple", followers: "13M", category: "Tech" },
    { id: "satya-nadella", name: "Satya Nadella", platform: "Microsoft", followers: "2.8M", category: "Tech" },
    { id: "sundar-pichai", name: "Sundar Pichai", platform: "Google", followers: "5.2M", category: "Tech" },
    { id: "mark-zuckerberg", name: "Mark Zuckerberg", platform: "Meta", followers: "120M", category: "Tech" },
    { id: "jensen-huang", name: "Jensen Huang", platform: "NVIDIA", followers: "680K", category: "AI" },
    { id: "sam-altman", name: "Sam Altman", platform: "OpenAI", followers: "2.1M", category: "AI" },
    { id: "demis-hassabis", name: "Demis Hassabis", platform: "DeepMind", followers: "420K", category: "AI" },
    { id: "yann-lecun", name: "Yann LeCun", platform: "Meta AI", followers: "680K", category: "AI" },
    { id: "andrew-ng", name: "Andrew Ng", platform: "Stanford/Coursera", followers: "890K", category: "AI" },
    { id: "geoffrey-hinton", name: "Geoffrey Hinton", platform: "Google", followers: "340K", category: "AI" },
    { id: "fei-fei-li", name: "Fei-Fei Li", platform: "Stanford HAI", followers: "280K", category: "AI" },
    { id: "ilya-sutskever", name: "Ilya Sutskever", platform: "OpenAI", followers: "520K", category: "AI" },
    { id: "lex-fridman", name: "Lex Fridman", platform: "MIT/Podcast", followers: "2.8M", category: "AI" },
    { id: "garry-kasparov", name: "Garry Kasparov", platform: "Twitter", followers: "680K", category: "AI" },
    
    // Venture Capital & Startups
    { id: "marc-andreessen", name: "Marc Andreessen", platform: "a16z", followers: "1.8M", category: "VC" },
    { id: "ben-horowitz", name: "Ben Horowitz", platform: "a16z", followers: "920K", category: "VC" },
    { id: "reid-hoffman", name: "Reid Hoffman", platform: "Greylock Partners", followers: "3.2M", category: "VC" },
    { id: "peter-thiel", name: "Peter Thiel", platform: "Founders Fund", followers: "1.1M", category: "VC" },
    { id: "keith-rabois", name: "Keith Rabois", platform: "Founders Fund", followers: "450K", category: "VC" },
    { id: "chamath-palihapitiya", name: "Chamath Palihapitiya", platform: "Social Capital", followers: "1.6M", category: "VC" },
    { id: "naval-ravikant", name: "Naval Ravikant", platform: "AngelList", followers: "2.1M", category: "VC" },
    { id: "jason-calacanis", name: "Jason Calacanis", platform: "Launch", followers: "680K", category: "VC" },
    { id: "tim-draper", name: "Tim Draper", platform: "Draper Fisher Jurvetson", followers: "380K", category: "VC" },
    { id: "kevin-rose", name: "Kevin Rose", platform: "True Ventures", followers: "1.2M", category: "VC" },
    { id: "chris-sacca", name: "Chris Sacca", platform: "Lowercase Capital", followers: "890K", category: "VC" },
    { id: "dave-mcclure", name: "Dave McClure", platform: "500 Startups", followers: "520K", category: "VC" },
    { id: "brad-feld", name: "Brad Feld", platform: "Foundry Group", followers: "340K", category: "VC" },
    { id: "fred-wilson", name: "Fred Wilson", platform: "Union Square Ventures", followers: "680K", category: "VC" },
    
    // Economics & Policy
    { id: "paul-krugman", name: "Paul Krugman", platform: "New York Times", followers: "5.2M", category: "Economics" },
    { id: "janet-yellen", name: "Janet Yellen", platform: "US Treasury", followers: "1.8M", category: "Policy" },
    { id: "jerome-powell", name: "Jerome Powell", platform: "Federal Reserve", followers: "2.1M", category: "Policy" },
    { id: "christine-lagarde", name: "Christine Lagarde", platform: "ECB", followers: "1.2M", category: "Policy" },
    { id: "mark-carney", name: "Mark Carney", platform: "Bank of England", followers: "450K", category: "Policy" },
    { id: "larry-summers", name: "Larry Summers", platform: "Harvard", followers: "890K", category: "Economics" },
    { id: "joseph-stiglitz", name: "Joseph Stiglitz", platform: "Columbia", followers: "680K", category: "Economics" },
    { id: "thomas-piketty", name: "Thomas Piketty", platform: "Paris School of Economics", followers: "420K", category: "Economics" },
    { id: "ken-rogoff", name: "Ken Rogoff", platform: "Harvard", followers: "280K", category: "Economics" },
    { id: "carmen-reinhart", name: "Carmen Reinhart", platform: "Harvard", followers: "180K", category: "Economics" },
    
    // Financial Media & Analysts
    { id: "maria-bartiromo", name: "Maria Bartiromo", platform: "Fox Business", followers: "2.8M", category: "Media" },
    { id: "becky-quick", name: "Becky Quick", platform: "CNBC", followers: "1.2M", category: "Media" },
    { id: "andrew-ross-sorkin", name: "Andrew Ross Sorkin", platform: "CNBC", followers: "890K", category: "Media" },
    { id: "joe-kernen", name: "Joe Kernen", platform: "CNBC", followers: "520K", category: "Media" },
    { id: "carl-quintanilla", name: "Carl Quintanilla", platform: "CNBC", followers: "380K", category: "Media" },
    { id: "scott-wapner", name: "Scott Wapner", platform: "CNBC", followers: "290K", category: "Media" },
    { id: "melissa-lee", name: "Melissa Lee", platform: "CNBC", followers: "420K", category: "Media" },
    { id: "katie-stockton", name: "Katie Stockton", platform: "Fairlead Strategies", followers: "180K", category: "Technical Analysis" },
    { id: "tom-demark", name: "Tom DeMark", platform: "DeMark Analytics", followers: "120K", category: "Technical Analysis" },
    { id: "larry-williams", name: "Larry Williams", platform: "Trading", followers: "340K", category: "Trading" },
    
    // Alternative Assets & Real Estate
    { id: "robert-kiyosaki", name: "Robert Kiyosaki", platform: "Rich Dad", followers: "3.8M", category: "Real Estate" },
    { id: "grant-cardone", name: "Grant Cardone", platform: "Cardone Capital", followers: "2.1M", category: "Real Estate" },
    { id: "barbara-corcoran", name: "Barbara Corcoran", platform: "Shark Tank", followers: "1.8M", category: "Real Estate" },
    { id: "ryan-serhant", name: "Ryan Serhant", platform: "SERHANT", followers: "920K", category: "Real Estate" },
    { id: "biggerpockets", name: "BiggerPockets", platform: "Real Estate Network", followers: "1.2M", category: "Real Estate" },
    { id: "david-greene", name: "David Greene", platform: "BiggerPockets", followers: "680K", category: "Real Estate" },
    
    // Commodities & Energy
    { id: "daniel-yergin", name: "Daniel Yergin", platform: "IHS Markit", followers: "280K", category: "Energy" },
    { id: "helima-croft", name: "Helima Croft", platform: "RBC Capital", followers: "180K", category: "Energy" },
    { id: "jeff-currie", name: "Jeff Currie", platform: "Goldman Sachs", followers: "220K", category: "Commodities" },
    { id: "francisco-blanch", name: "Francisco Blanch", platform: "Bank of America", followers: "150K", category: "Commodities" },
    
    // International Markets
    { id: "ray-dalio-china", name: "Ray Dalio (China Focus)", platform: "Bridgewater", followers: "890K", category: "China" },
    { id: "jim-oneill", name: "Jim O'Neill", platform: "Chatham House", followers: "340K", category: "Global Markets" },
    { id: "mark-mobius", name: "Mark Mobius", platform: "Mobius Capital", followers: "420K", category: "Emerging Markets" },
    { id: "ruchir-sharma", name: "Ruchir Sharma", platform: "Rockefeller International", followers: "280K", category: "Emerging Markets" },
    
    // Fintech & Digital Banking
    { id: "brian-armstrong", name: "Brian Armstrong", platform: "Coinbase", followers: "1.8M", category: "Fintech" },
    { id: "changpeng-zhao", name: "Changpeng Zhao (CZ)", platform: "Binance", followers: "8.2M", category: "Crypto" },
    { id: "jack-dorsey", name: "Jack Dorsey", platform: "Block (Square)", followers: "5.8M", category: "Fintech" },
    { id: "patrick-collison", name: "Patrick Collison", platform: "Stripe", followers: "680K", category: "Fintech" },
    { id: "john-collison", name: "John Collison", platform: "Stripe", followers: "420K", category: "Fintech" },
    { id: "vlad-tenev", name: "Vlad Tenev", platform: "Robinhood", followers: "280K", category: "Fintech" },
    { id: "baiju-bhatt", name: "Baiju Bhatt", platform: "Robinhood", followers: "180K", category: "Fintech" },
    { id: "max-levchin", name: "Max Levchin", platform: "Affirm", followers: "340K", category: "Fintech" },
    { id: "david-velez", name: "David Vélez", platform: "Nubank", followers: "520K", category: "Fintech" },
    
    // Trading & Technical Analysis
    { id: "peter-brandt", name: "Peter Brandt", platform: "Twitter", followers: "680K", category: "Trading" },
    { id: "linda-raschke", name: "Linda Raschke", platform: "LBRGroup", followers: "280K", category: "Trading" },
    { id: "john-bollinger", name: "John Bollinger", platform: "Bollinger Bands", followers: "420K", category: "Technical Analysis" },
    { id: "ralph-elliott", name: "Ralph Elliott", platform: "Elliott Wave", followers: "180K", category: "Technical Analysis" },
    { id: "steve-nison", name: "Steve Nison", platform: "Candlestick Charting", followers: "220K", category: "Technical Analysis" }
  ];

  const filteredInfluencers = influencers.filter(influencer =>
    influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    influencer.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              {/* Search Input */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search for influencers, categories, or platforms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="default">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Results count */}
              <p className="text-sm text-muted-foreground">
                Showing {filteredInfluencers.length} of {influencers.length} influencers
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredInfluencers.map((influencer) => {
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

        {/* Step 3: Notifications */}
        {currentStep === 3 && (
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