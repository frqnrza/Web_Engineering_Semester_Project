import { CheckCircle2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function VerifiedBadge() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="inline-flex items-center justify-center w-6 h-6 bg-[#008C7E] rounded-full">
            <CheckCircle2 className="text-white" size={16} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">Verified by TechConnect — Company registration & reference checks completed</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}