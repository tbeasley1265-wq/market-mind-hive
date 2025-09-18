import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Badge } from "@/components/ui/badge";
import { Brain, Menu, X, TrendingUp, FileText, MessageSquare, Bell } from "lucide-react";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-card-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">Market Minds</span>
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </Link>

          {/* Desktop Navigation */}
          <NavigationMenu className="hidden lg:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <div className="row-span-3">
                      <NavigationMenuLink asChild>
                        <div className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-accent p-6 no-underline outline-none focus:shadow-md">
                          <Brain className="h-6 w-6 text-white" />
                          <div className="mb-2 mt-4 text-lg font-medium text-white">
                            AI Research Assistant
                          </div>
                          <p className="text-sm leading-tight text-white/80">
                            Powerful AI that understands financial content and provides intelligent insights.
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </div>
                    <div className="space-y-3">
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-accent" />
                            <div className="text-sm font-medium leading-none">Multi-Source Aggregation</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Connect YouTube, Twitter, Substack, and more.
                          </p>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-accent" />
                            <div className="text-sm font-medium leading-none">Smart Summaries</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Get key insights from any content format.
                          </p>
                        </div>
                      </NavigationMenuLink>
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-4 w-4 text-accent" />
                            <div className="text-sm font-medium leading-none">Interactive Chat</div>
                          </div>
                          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            Ask questions about any research content.
                          </p>
                        </div>
                      </NavigationMenuLink>
                    </div>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                  Pricing
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50">
                  About
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button variant="ghost">Sign In</Button>
            <Button variant="hero">Get Started</Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 border-t border-card-border">
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
                Features
              </a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
                Pricing
              </a>
              <a href="#" className="block px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md">
                About
              </a>
              <div className="pt-4 pb-2 border-t border-card-border mt-4">
                <div className="flex flex-col space-y-2">
                  <Button variant="ghost" className="justify-start">Sign In</Button>
                  <Button variant="hero" className="justify-start">Get Started</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;