import React from "react";
import { motion } from "motion/react";
import { User, Bell, Download, Shield, Globe, Moon, HelpCircle, FileText, LogOut, Crown, ChevronRight, Edit3 } from "lucide-react";

export const SettingsView = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-[#181a20] overflow-y-auto custom-scrollbar pb-32 pt-12">
      <div className="flex items-center justify-between px-6 mb-8">
        <div className="w-8 h-8 flex items-center justify-center font-bold text-white text-xl">A</div>
        <h1 className="text-xl md:text-2xl font-bold text-white uppercase tracking-widest hidden md:block">Profile</h1>
        <div className="w-6 h-6"></div> {/* Spacer for centering */}
      </div>

      <div className="px-6 flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-green-500 mb-4 border-2 border-[#181a20] relative overflow-hidden flex items-center justify-center text-3xl font-bold text-white shadow-lg">
          <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" className="w-full h-full object-cover" />
          <button className="absolute bottom-0 right-0 bg-primary p-1.5 rounded-full text-white m-1">
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Andrew Ainsley</h2>
        <p className="text-gray-400 text-sm font-medium">andrew.ainsley@yourdomain.com</p>
      </div>

      <div className="px-6 mb-8 max-w-md mx-auto">
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:bg-primary/20 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-primary font-bold text-lg">Join Premium!</h3>
              <p className="text-gray-300 text-xs mt-0.5 leading-snug">Enjoy watching Full-HD animes,<br/>without restrictions and without ads</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-primary" />
        </div>
      </div>

      <div className="px-6 space-y-2 max-w-md mx-auto">
        <SettingItem icon={<User className="w-5 h-5 text-gray-300" />} label="Edit Profile" />
        <SettingItem icon={<Bell className="w-5 h-5 text-gray-300" />} label="Notification" />
        <SettingItem icon={<Download className="w-5 h-5 text-gray-300" />} label="Download" />
        <SettingItem icon={<Shield className="w-5 h-5 text-gray-300" />} label="Security" />
        <SettingItem icon={<Globe className="w-5 h-5 text-gray-300" />} label="Language" value="English (US)" />
        
        {/* Dark Mode Toggle */}
        <div className="flex items-center justify-between py-3 cursor-pointer group">
          <div className="flex items-center gap-4">
            <Moon className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors" />
            <span className="text-white font-medium group-hover:text-primary transition-colors">Dark Mode</span>
          </div>
          <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer shadow-[0_0_10px_rgba(6,193,73,0.3)]">
            <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-all"></div>
          </div>
        </div>

        <SettingItem icon={<HelpCircle className="w-5 h-5 text-gray-300" />} label="Help Center" />
        <SettingItem icon={<FileText className="w-5 h-5 text-gray-300" />} label="Privacy Policy" />
        
        <div className="flex items-center justify-between py-3 cursor-pointer group">
          <div className="flex items-center gap-4">
            <LogOut className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors" />
            <span className="text-red-500 font-medium group-hover:text-red-400 transition-colors">Logout</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SettingItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => (
  <div className="flex items-center justify-between py-3 cursor-pointer group">
    <div className="flex items-center gap-4">
      <div className="group-hover:text-primary transition-colors">
        {icon}
      </div>
      <span className="text-white font-medium group-hover:text-primary transition-colors">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      {value && <span className="text-gray-400 text-sm">{value}</span>}
      <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-primary transition-colors" />
    </div>
  </div>
);
