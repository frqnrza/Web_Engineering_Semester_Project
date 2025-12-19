import { Star, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { VerifiedBadge } from "./VerifiedBadge";

export function CompanyCard({
  logo,
  name,
  verified = false,
  tagline = '',
  services = [],
  rating = 0,
  reviewCount = 0,
  startingPrice = '',
  matchCount = 0,
  onViewProfile = () => {},
  onInviteToBid = () => {},
  variant = 'grid'
}) {
  if (variant === 'list') {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 hover:shadow-lg transition-shadow">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Logo */}
          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
            {logo ? (
              <img src={logo} alt={name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-gray-400 text-xs">Logo</span>
            )}
          </div>

          {/* Center Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-[#0A2540] font-semibold">{name}</h3>
              {verified && <VerifiedBadge />}
            </div>
            <p className="text-sm text-gray-600 mb-2">{tagline}</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {services?.map((service, idx) => (
                <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                  {service}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                  />
                ))}
                <span className="text-gray-600 ml-1">({reviewCount})</span>
              </div>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex flex-col md:items-end justify-between gap-3">
            <div className="text-left md:text-right">
              <div className="text-sm text-gray-600">Starting at</div>
              <div className="text-[#0A2540] font-semibold">{startingPrice}</div>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={onViewProfile}
                className="border-[#0A2540] text-[#0A2540] hover:bg-[#0A2540] hover:text-white flex-1 md:flex-none"
              >
                View Profile
              </Button>
              <Button
                size="sm"
                onClick={onInviteToBid}
                className="bg-[#008C7E] hover:bg-[#007a6d] flex-1 md:flex-none"
              >
                Invite to Bid
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-lg hover:border-[#008C7E] transition-all cursor-pointer group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-cover rounded-lg" />
          ) : (
            <span className="text-gray-400 text-xs">Logo</span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-[#0A2540] font-semibold">{name}</h4>
            {verified && <VerifiedBadge />}
          </div>
          {matchCount > 0 && (
            <span className="text-xs text-[#008C7E]">{matchCount} matches</span>
          )}
        </div>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{tagline}</p>
      
      <div className="flex flex-wrap gap-1.5 mb-3">
        {services?.slice(0, 3).map((service, idx) => (
          <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
            {service}
          </Badge>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
            />
          ))}
          <span className="text-xs text-gray-600 ml-1">({reviewCount})</span>
        </div>
        <span className="text-sm text-[#0A2540] font-semibold">{startingPrice}</span>
      </div>

      <div className="flex gap-2">
        <Button
          variant="link"
          size="sm"
          onClick={onViewProfile}
          className="text-[#0A2540] hover:text-[#008C7E] p-0"
        >
          View Profile
        </Button>
        <Button
          size="sm"
          onClick={onInviteToBid}
          className="bg-[#008C7E] hover:bg-[#007a6d] flex-1"
        >
          Invite to Bid
        </Button>
      </div>
    </div>
  );
}