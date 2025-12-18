export function CategoryCard({ icon: Icon, title, count, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg hover:border-[#008C7E] transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-[#008C7E] bg-opacity-10 rounded-lg flex items-center justify-center group-hover:bg-opacity-20 transition-all">
          <Icon className="text-[#008C7E]" size={24} />
        </div>
        <div>
          <div className="text-[#0A2540] font-medium">{title}</div>
          <span className="text-sm text-gray-500">{count} companies</span>
        </div>
      </div>
    </div>
  );
}