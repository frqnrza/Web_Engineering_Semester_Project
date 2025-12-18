import { FileText } from "lucide-react";
import { Button } from "./ui/button";
import PropTypes from 'prop-types';

export function TemplateCard({ title, description, onUseTemplate }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex-1 min-w-[250px]">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 bg-[#0A2540] bg-opacity-10 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="text-[#0A2540]" size={20} />
        </div>
        <div className="flex-1">
          <div className="font-semibold text-sm text-[#0A2540] mb-1">{title}</div>
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onUseTemplate}
        className="w-full border-[#0A2540] text-[#0A2540] hover:bg-[#0A2540] hover:text-white transition-colors"
      >
        Use Template
      </Button>
    </div>
  );
}

TemplateCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  onUseTemplate: PropTypes.func.isRequired
};