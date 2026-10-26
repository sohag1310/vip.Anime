import { motion } from "motion/react";
import { Download, Search } from "lucide-react";

export const DownloadView = ({ onSearch }: { onSearch: () => void }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 pb-32 min-h-[80vh] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xl">A</div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Download</h1>
        </div>
        <button onClick={onSearch} className="text-white hover:text-gray-300">
          <Search className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div className="w-48 h-48 mb-6 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 w-32 h-32 text-primary opacity-80 flex items-center justify-center">
            {/* Custom Empty State Illustration */}
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 12L12 16L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-primary mb-3">Your Download is Empty</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          It seems that you haven't downloaded any anime. Download your favorite animes to watch them offline.
        </p>
      </div>
    </motion.div>
  );
};
