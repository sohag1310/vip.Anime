import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, Loader2, Save, KeyRound, Plus, Video } from 'lucide-react';

export function AdminView({ onBack, adminPassword }: { onBack: () => void, adminPassword: string }) {
  const [activeTab, setActiveTab] = useState<'add' | 'settings'>('add');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add Anime State
  const [title, setTitle] = useState('');
  const [episode, setEpisode] = useState('');
  const [driveEmbedLink, setDriveEmbedLink] = useState('');

  // Settings State
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  async function handleAddAnime(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (!title || !episode || !driveEmbedLink) {
        throw new Error("Please fill all fields.");
      }
      
      const animeRef = collection(db, 'anime_data');
      await addDoc(animeRef, {
        title,
        episode,
        driveEmbedLink,
        adminPassword: adminPassword,
        createdAt: Date.now() // Simple timestamp for sorting
      });

      setSuccessMsg("Anime added successfully!");
      setTitle('');
      setEpisode('');
      setDriveEmbedLink('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add anime.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      if (!newPassword || newPassword.length < 4) {
        throw new Error("Password must be at least 4 characters long.");
      }
      const authRef = doc(db, 'admin_settings', 'auth');
      const docSnap = await getDoc(authRef);

      if (docSnap.exists()) {
        await updateDoc(authRef, {
          password: newPassword,
          oldPassword: adminPassword
        });
      } else {
        await setDoc(authRef, {
          password: newPassword
        });
      }
      setSuccessMsg("Password updated successfully!");
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 max-w-3xl mx-auto pb-24">
      <button onClick={onBack} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Site
      </button>

      <h1 className="text-2xl font-bold mb-6 text-primary flex items-center gap-2">
        Admin Panel
      </h1>

      <div className="flex gap-4 border-b border-zinc-800 mb-6">
        <button 
          onClick={() => setActiveTab('add')}
          className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'add' ? 'border-b-2 border-primary text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <span className="flex items-center gap-2"><Plus className="w-4 h-4"/> Add Anime</span>
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'border-b-2 border-primary text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <span className="flex items-center gap-2"><KeyRound className="w-4 h-4"/> Change Password</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-3 rounded-lg mb-6 text-sm">
          {successMsg}
        </div>
      )}

      {activeTab === 'add' && (
        <form onSubmit={handleAddAnime} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Anime Title</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[#181a20] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. Naruto Shippuden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Episode Number</label>
            <input 
              type="text" 
              value={episode}
              onChange={e => setEpisode(e.target.value)}
              className="w-full bg-[#181a20] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Google Drive Embed Link</label>
            <input 
              type="text" 
              value={driveEmbedLink}
              onChange={e => setDriveEmbedLink(e.target.value)}
              className="w-full bg-[#181a20] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="https://drive.google.com/file/d/..."
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-6 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Save className="w-5 h-5"/>}
            Submit Details
          </button>
        </form>
      )}

      {activeTab === 'settings' && (
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">New Admin Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-[#181a20] border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              placeholder="Enter new password"
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className="mt-6 w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <KeyRound className="w-5 h-5"/>}
            Update Password
          </button>
        </form>
      )}

    </div>
  );
}
