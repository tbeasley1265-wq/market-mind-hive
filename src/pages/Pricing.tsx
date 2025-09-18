import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, Star, Zap, Crown } from "lucide-react";
import marketMindsLogo from "@/assets/market-minds-logo.png";

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Perfect for individual analysts and small teams",
      icon: Star,
      features: [
        "Up to 50 sources monitored",
        "Real-time AI summaries",
        "Basic chat interface",
        "Email alerts",
        "7-day content history",
        "Standard support"
      ],
      popular: false,
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "$149",
      period: "/month",
      description: "Advanced features for growing investment teams",
      icon: Zap,
      features: [
        "Up to 200 sources monitored",
        "Advanced AI analysis",
        "Priority chat interface",
        "Custom alerts & triggers",
        "30-day content history",
        "API access",
        "Priority support",
        "Team collaboration tools"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations",
      icon: Crown,
      features: [
        "Unlimited sources",
        "Custom AI model training",
        "White-label solution",
        "Advanced integrations",
        "Unlimited history",
        "Dedicated API",
        "24/7 dedicated support",
        "Custom deployment options",
        "SLA guarantees"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="container mx-auto px-6 pt-6 pb-4 border-b border-border/50">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={marketMindsLogo} alt="Market Minds Logo" className="w-12 h-12" />
            <span className="text-foreground text-2xl font-bold">
              Market Minds
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-accent transition-colors font-medium">
              Use Cases
            </Link>
            <Link to="/" className="text-muted-foreground hover:text-accent transition-colors font-medium">
              About
            </Link>
            <span className="text-foreground font-medium">
              Pricing
            </span>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth?tab=signin">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Choose the Right Plan for{" "}
              <span className="bg-gradient-to-r from-accent via-primary to-success bg-clip-text text-transparent">
                Your Research Needs
              </span>
            </h1>
            <p className="text-xl text-muted-foreground lg:text-2xl max-w-3xl mx-auto">
              Start with our free trial and scale as your team grows. No hidden fees, cancel anytime.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => {
              const IconComponent = plan.icon;
              return (
                <Card 
                  key={plan.name}
                  className={`relative border-card-border/50 shadow-card hover:shadow-elevated transition-all duration-500 hover:-translate-y-1 ${
                    plan.popular ? 'border-accent/50 shadow-lg scale-105' : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-accent text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center pb-8">
                    <div className={`w-16 h-16 rounded-2xl ${
                      plan.popular ? 'bg-gradient-accent' : 'bg-gradient-primary'
                    } flex items-center justify-center mx-auto mb-6`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription className="text-base mb-6">
                      {plan.description}
                    </CardDescription>
                    
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-lg text-muted-foreground">{plan.period}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-4">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-accent hover:scale-105' 
                          : 'bg-gradient-primary hover:scale-105'
                      } transition-all duration-300`}
                      size="lg"
                      asChild
                    >
                      <Link to={plan.cta === "Contact Sales" ? "/contact" : "/auth"}>
                        {plan.cta}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-3xl mx-auto mt-24">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Frequently Asked Questions
            </h2>
            
            <div className="space-y-6">
              <Card className="border-card-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">What's included in the free trial?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your 14-day free trial includes full access to all Starter plan features, including up to 50 sources, 
                    real-time AI summaries, and email alerts. No credit card required.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Can I upgrade or downgrade my plan?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes, you can change your plan at any time. Upgrades take effect immediately, while downgrades 
                    take effect at the start of your next billing cycle.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We accept all major credit cards, PayPal, and wire transfers for Enterprise customers. 
                    All payments are secured with enterprise-grade encryption.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-card-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Is there a setup fee?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    No setup fees for Starter and Professional plans. Enterprise customers may have 
                    custom setup costs depending on integration requirements.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-bold text-white mb-8">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join thousands of analysts who trust Market Minds for their research workflow.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg font-semibold hover:scale-105 transition-all duration-300" 
              asChild
            >
              <Link to="/auth">
                Start Your Free Trial Today
                <ArrowRight className="ml-2 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;