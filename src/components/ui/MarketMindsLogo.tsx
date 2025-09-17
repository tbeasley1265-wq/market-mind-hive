import { TrendingUp } from "lucide-react";

interface MarketMindsLogoProps {
  size?: number;
  className?: string;
}

const MarketMindsLogo = ({ size = 16, className = "" }: MarketMindsLogoProps) => {
  return (
    <div 
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="flex items-center justify-center relative">
        <span className="text-xs font-extrabold tracking-tight">
          MM
        </span>
        <TrendingUp className="absolute -top-0.5 -right-0.5 w-2 h-2 opacity-80" />
      </div>
    </div>
  );
};

export default MarketMindsLogo;