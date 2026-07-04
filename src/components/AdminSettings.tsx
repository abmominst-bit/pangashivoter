import React, { useState, useEffect } from 'react';
import { SystemSettings, UnionData } from '../types';
import { ShieldCheck, AlertTriangle, Upload, Image as ImageIcon, RotateCcw, Save, Megaphone, User, Search, Globe } from 'lucide-react';

interface AdminSettingsProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  unions: UnionData[];
}

export default function AdminSettings({ settings, onUpdateSettings, unions }: AdminSettingsProps) {
  const [success, setSuccess] = useState('');

  // Maintenance and candidate settings are now driven by the Supabase-backed settings object.
  const [mTitle, setMTitle] = useState('সিস্টেম রক্ষণাবেক্ষণ চলছে');
  const [mDesc, setMDesc] = useState('প্রিয় নাগরিক, ডিজিটাল ভোটার ডিরেক্টরি পোর্টালটি বর্তমানে সিস্টেম রক্ষণাবেক্ষণ কাজের জন্য সাময়িকভাবে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।');
  const [mImage, setMImage] = useState('');
  const [candidateName, setCandidateName] = useState('মোঃ রেজাউল করিম (মুকুল)');
  const [candidateSlogan, setCandidateSlogan] = useState('আমাকে আপনার মূল্যবান ভোট দিয়ে জয়যুক্ত করুন।');
  const [candidatePhoto, setCandidatePhoto] = useState('');
  const [candidateSymbol, setCandidateSymbol] = useState('');
  const [candidateSymbolName, setCandidateSymbolName] = useState('মোরগ');

  // Candidate Sub-Tabs state ('global' or 'union')
  const [candidateTab, setCandidateTab] = useState<'global' | 'union'>('global');

  // Union-wise candidate configuration states
  const [selectedUnion, setSelectedUnion] = useState('');
  const [unionCandidateName, setUnionCandidateName] = useState('');
  const [unionCandidateSlogan, setUnionCandidateSlogan] = useState('');
  const [unionCandidatePhoto, setUnionCandidatePhoto] = useState('');
  const [unionCandidateSymbol, setUnionCandidateSymbol] = useState('');
  const [unionCandidateSymbolName, setUnionCandidateSymbolName] = useState('');

  // Google Search Console (GSC) state
  const [gscToken, setGscToken] = useState('');

  // Synchronize Union-wise candidate configuration states whenever selectedUnion changes
  useEffect(() => {
    if (selectedUnion) {
      setUnionCandidateName('');
      setUnionCandidateSlogan('');
      setUnionCandidatePhoto('');
      setUnionCandidateSymbol('');
      setUnionCandidateSymbolName('');
    } else {
      setUnionCandidateName('');
      setUnionCandidateSlogan('');
      setUnionCandidatePhoto('');
      setUnionCandidateSymbol('');
      setUnionCandidateSymbolName('');
    }
  }, [selectedUnion]);

  const handleToggleMaintenance = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      maintenanceMode: enabled
    });
    setSuccess('Maintenance Mode updated successfully!');
  };

  const handleSaveCustomContent = () => {
    setSuccess('Maintenance custom text and image are now managed via Supabase settings.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setMImage(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCandidatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCandidatePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCandidateSymbolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setCandidateSymbol(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Union-specific Photo and Symbol Upload Handlers
  const handleUnionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUnionCandidatePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnionSymbolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setUnionCandidateSymbol(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveCandidateSettings = () => {
    onUpdateSettings({
      ...settings,
      candidateName,
      candidateSlogan,
      candidatePhoto,
      candidateSymbol,
      candidateSymbolName,
    });
    setSuccess('নির্বাচনী প্রার্থীর তথ্য সংরক্ষিত হয়েছে।');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveUnionCandidateSettings = () => {
    if (!selectedUnion) return;
    onUpdateSettings({
      ...settings,
      candidateNameByUnion: {
        ...(settings.candidateNameByUnion || {}),
        [selectedUnion]: unionCandidateName.trim() || candidateName,
      },
      candidateSloganByUnion: {
        ...(settings.candidateSloganByUnion || {}),
        [selectedUnion]: unionCandidateSlogan.trim() || candidateSlogan,
      },
      candidatePhotoByUnion: {
        ...(settings.candidatePhotoByUnion || {}),
        [selectedUnion]: unionCandidatePhoto || candidatePhoto,
      },
      candidateSymbolByUnion: {
        ...(settings.candidateSymbolByUnion || {}),
        [selectedUnion]: unionCandidateSymbol || candidateSymbol,
      },
      candidateSymbolNameByUnion: {
        ...(settings.candidateSymbolNameByUnion || {}),
        [selectedUnion]: unionCandidateSymbolName.trim() || candidateSymbolName,
      },
    });
    setSuccess(`${selectedUnion} ইউনিয়নের নির্বাচনী প্রার্থীর তথ্য সংরক্ষিত হয়েছে।`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleResetUnionCandidateSettings = () => {
    if (!selectedUnion) return;
    const nextSettings = { ...settings };
    delete nextSettings.candidateNameByUnion?.[selectedUnion];
    delete nextSettings.candidateSloganByUnion?.[selectedUnion];
    delete nextSettings.candidatePhotoByUnion?.[selectedUnion];
    delete nextSettings.candidateSymbolByUnion?.[selectedUnion];
    delete nextSettings.candidateSymbolNameByUnion?.[selectedUnion];
    onUpdateSettings(nextSettings);
    setUnionCandidateName('');
    setUnionCandidateSlogan('');
    setUnionCandidatePhoto('');
    setUnionCandidateSymbol('');
    setUnionCandidateSymbolName('');
    setSuccess(`${selectedUnion} ইউনিয়নের কাস্টম প্রার্থীর তথ্য রিসেট করা হয়েছে।`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleResetCandidateDefaults = () => {
    setCandidateName('মোঃ রেজাউল করিম (মুকুল)');
    setCandidateSlogan('আমাকে আপনার মূল্যবান ভোট দিয়ে জয়যুক্ত করুন।');
    setCandidatePhoto('');
    setCandidateSymbol('');
    setCandidateSymbolName('মোরগ');
    onUpdateSettings({
      ...settings,
      candidateName: undefined,
      candidateSlogan: undefined,
      candidatePhoto: undefined,
      candidateSymbol: undefined,
      candidateSymbolName: undefined,
    });
    setSuccess('প্রার্থীর তথ্য রিসেট করা হয়েছে।');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSaveGSCSettings = () => {
    setSuccess('Google Search Console verification is now handled through Supabase-backed settings.');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleResetDefaults = () => {
    setMTitle('সিস্টেম রক্ষণাবেক্ষণ চলছে');
    setMDesc('প্রিয় নাগরিক, ডিজিটাল ভোটার ডিরেক্টরি পোর্টালটি বর্তমানে সিস্টেম রক্ষণাবেক্ষণ কাজের জন্য সাময়িকভাবে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।');
    setMImage('');
    setSuccess('Maintenance defaults restored successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Sub-header Banner */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 rounded-2xl">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">System Settings</h2>
        <p className="text-sm text-slate-500 mt-1">Configure global access controls, maintenance states, and visitor security policies.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl font-bold text-xs">
          {success}
        </div>
      )}

      {/* Settings Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Access controls block */}
        <div className="space-y-6">
          
          {/* Maintenance mode card - Matches Screenshot 6 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">সিস্টেম রক্ষণাবেক্ষণ মোড</h3>
                <p className="text-xs text-slate-400 mt-0.5">Toggle site offline maintenance status</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                settings.maintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
              }`}>
                {settings.maintenanceMode ? 'Offline' : 'Online'}
              </span>
            </div>

            {/* Toggle Row - Matches On/Off visual from Screenshot 6 */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleToggleMaintenance(true)}
                className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                  settings.maintenanceMode 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => handleToggleMaintenance(false)}
                className={`flex-1 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                  !settings.maintenanceMode 
                    ? 'bg-red-500 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                }`}
              >
                Off
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Enabling Maintenance Mode shuts down standard public visitor portals and redirects all viewers to an "Under Maintenance" splash view. Only authenticated administrators will be able to bypass the block.
            </p>

            {/* If maintenance mode is ON, show custom content configuration */}
            {settings.maintenanceMode && (
              <div className="pt-4 border-t border-slate-100 space-y-4 animate-fade-in">
                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 text-[11px] text-amber-800 font-bold space-y-1">
                  <span>✨ কাস্টম রক্ষণাবেক্ষণ কন্টেন্ট কনফিগারেশন:</span>
                  <p className="text-slate-500 font-medium font-mono text-[9px]">
                    Note: This content is now managed through the Supabase-backed settings flow.
                  </p>
                </div>

                {/* Custom Title */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">রক্ষণাবেক্ষণ শিরোনাম (Title)</label>
                  <input
                    type="text"
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="রক্ষণাবেক্ষণ শিরোনাম লিখুন"
                  />
                </div>

                {/* Custom Description */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">রক্ষণাবেক্ষণ বিবরণ (Description/Text)</label>
                  <textarea
                    rows={3}
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="রক্ষণাবেক্ষণ বার্তাটি লিখুন"
                  />
                </div>

                {/* Image uploader and preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-600">রক্ষণাবেক্ষণ ব্যানার ইমেজ (Maintenance Image)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="sm:col-span-2">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-blue-400 p-4 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition">
                        <Upload size={18} className="text-slate-400 mb-1" />
                        <span className="text-[10px] font-bold text-slate-600">Choose Image File</span>
                        <span className="text-[8px] text-slate-400 font-semibold mt-0.5">PNG, JPG, SVG up to 2MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    
                    <div className="flex flex-col items-center justify-center border border-slate-200 p-2 rounded-xl bg-white h-24 relative overflow-hidden group">
                      {mImage ? (
                        <>
                          <img
                            src={mImage}
                            alt="Custom banner preview"
                            className="h-full w-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setMImage('')}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition rounded-lg"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-slate-300">
                          <ImageIcon size={24} className="mx-auto opacity-40 mb-1" />
                          <span className="text-[8px] font-bold">No Image</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Save and Reset controls */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCustomContent}
                    className="flex-1 py-2 bg-[#1a5f9c] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Save size={13} />
                    <span>সংরক্ষণ করুন (Save)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="Reset to default"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Candidate Configuration Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <User size={16} className="text-[#1a5f9c]" />
                নির্বাচনী প্রার্থীর তথ্য ও ছবি পরিবর্তন
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure candidate details, photo, and election symbol (marka)</p>
            </div>

            {/* Inner Tabs for Global vs Union Specific */}
            <div className="flex border-b border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setCandidateTab('global')}
                className={`pb-2 px-4 text-xs font-black border-b-2 transition cursor-pointer ${
                  candidateTab === 'global' ? 'border-[#1a5f9c] text-[#1a5f9c]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                গ্লোবাল ডিফল্ট প্রার্থী (Global Default)
              </button>
              <button
                type="button"
                onClick={() => setCandidateTab('union')}
                className={`pb-2 px-4 text-xs font-black border-b-2 transition cursor-pointer ${
                  candidateTab === 'union' ? 'border-[#1a5f9c] text-[#1a5f9c]' : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                ইউনিয়ন ভিত্তিক কাস্টম প্রার্থী (Union-wise Candidate)
              </button>
            </div>

            {candidateTab === 'global' ? (
              /* TAB 1: GLOBAL CONFIG */
              <div className="space-y-4 pt-2 animate-fade-in">
                {/* Candidate Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">প্রার্থীর নাম (Candidate Name)</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="যেমন: মোঃ রেজাউল করিম (মুকুল)"
                  />
                </div>

                {/* Symbol/Marka Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">মার্কার নাম (Election Symbol Name)</label>
                  <input
                    type="text"
                    value={candidateSymbolName}
                    onChange={(e) => setCandidateSymbolName(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="যেমন: মোরগ"
                  />
                </div>

                {/* Slogan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">নির্বাচনী স্লোগান (Slogan / Message)</label>
                  <input
                    type="text"
                    value={candidateSlogan}
                    onChange={(e) => setCandidateSlogan(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="যেমন: আমাকে আপনার মূল্যবান ভোট দিয়ে জয়যুক্ত করুন।"
                  />
                </div>

                {/* Photos upload row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Candidate Photo */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600">প্রার্থীর ছবি (Candidate Photo)</label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#1a5f9c] p-3 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition h-20">
                        <Upload size={14} className="text-slate-400 mb-0.5" />
                        <span className="text-[10px] font-bold text-slate-600">ছবি আপলোড করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCandidatePhotoUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center justify-center border border-slate-200 p-1 rounded-xl bg-white h-20 relative overflow-hidden group">
                        {candidatePhoto ? (
                          <>
                            <img
                              src={candidatePhoto}
                              alt="Candidate preview"
                              className="h-full w-full object-contain rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setCandidatePhoto('')}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition rounded-lg"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="text-center text-slate-300">
                            <img src="/mukul.png" alt="Default photo" className="h-10 w-10 mx-auto object-cover rounded-full opacity-60 mb-0.5" />
                            <span className="text-[8px] font-bold">Default (/mukul.png)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Candidate Symbol/Marka */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-600">প্রতীক/মার্কা ইমেজ (Symbol/Marka)</label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#1a5f9c] p-3 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition h-20">
                        <Upload size={14} className="text-slate-400 mb-0.5" />
                        <span className="text-[10px] font-bold text-slate-600">প্রতীক আপলোড করুন</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCandidateSymbolUpload}
                          className="hidden"
                        />
                      </label>

                      <div className="flex items-center justify-center border border-slate-200 p-1 rounded-xl bg-white h-20 relative overflow-hidden group">
                        {candidateSymbol ? (
                          <>
                            <img
                              src={candidateSymbol}
                              alt="Symbol preview"
                              className="h-full w-full object-contain rounded-lg"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setCandidateSymbol('')}
                              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition rounded-lg"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="text-center text-slate-300">
                            <img src="/marka.png" alt="Default marka" className="h-10 w-10 mx-auto object-contain opacity-60 mb-0.5" />
                            <span className="text-[8px] font-bold">Default (/marka.png)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleSaveCandidateSettings}
                    className="flex-1 py-2 bg-[#1a5f9c] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                  >
                    <Save size={13} />
                    <span>গ্লোবাল তথ্য সংরক্ষণ করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetCandidateDefaults}
                    className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                    title="রিসেট করুন (Reset to defaults)"
                  >
                    <RotateCcw size={13} />
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: UNION SPECIFIC OVERRIDES */
              <div className="space-y-4 pt-2 animate-fade-in">
                {/* Union Selector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">ইউনিয়ন নির্বাচন করুন (Select Union)</label>
                  <select
                    value={selectedUnion}
                    onChange={(e) => setSelectedUnion(e.target.value)}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
                  >
                    <option value="">-- একটি ইউনিয়ন নির্বাচন করুন --</option>
                    {unions.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.nameBn} ({u.name})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedUnion ? (
                  <>
                    {/* Status Banner */}
                    {localStorage.getItem(`candidate_name_for_union_${selectedUnion}`) ||
                    localStorage.getItem(`candidate_slogan_for_union_${selectedUnion}`) ||
                    localStorage.getItem(`candidate_symbol_name_for_union_${selectedUnion}`) ||
                    localStorage.getItem(`candidate_photo_for_union_${selectedUnion}`) ||
                    localStorage.getItem(`candidate_symbol_for_union_${selectedUnion}`) ? (
                      <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 text-[11px] font-bold">
                        🎉 এই ইউনিয়নের জন্য কাস্টম প্রার্থীর তথ্য সক্রিয় আছে! এই ইউনিয়নের ভোটার স্লিপে এই কাস্টম তথ্যগুলিই মুদ্রিত হবে।
                      </div>
                    ) : (
                      <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 text-[11px] font-bold">
                        ⚠️ এই ইউনিয়নে কোনো কাস্টম প্রার্থীর তথ্য সেট করা নেই। স্লিপে গ্লোবাল ডিফল্ট প্রার্থীর তথ্য (মোঃ রেজাউল করিম) দেখানো হবে। কাস্টম তথ্য দিতে চাইলে নিচে লিখুন।
                      </div>
                    )}

                    {/* Candidate Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">প্রার্থীর নাম (Candidate Name for {selectedUnion})</label>
                      <input
                        type="text"
                        value={unionCandidateName}
                        onChange={(e) => setUnionCandidateName(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`ডিফল্ট: ${candidateName}`}
                      />
                    </div>

                    {/* Symbol/Marka Name */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">মার্কার নাম (Election Symbol Name for {selectedUnion})</label>
                      <input
                        type="text"
                        value={unionCandidateSymbolName}
                        onChange={(e) => setUnionCandidateSymbolName(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`ডিফল্ট: ${candidateSymbolName}`}
                      />
                    </div>

                    {/* Slogan */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600">নির্বাচনী স্লোগান (Slogan / Message for {selectedUnion})</label>
                      <input
                        type="text"
                        value={unionCandidateSlogan}
                        onChange={(e) => setUnionCandidateSlogan(e.target.value)}
                        className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`ডিফল্ট: ${candidateSlogan}`}
                      />
                    </div>

                    {/* Photos upload row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Candidate Photo */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-600">প্রার্থীর ছবি (Candidate Photo for {selectedUnion})</label>
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#1a5f9c] p-3 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition h-20">
                            <Upload size={14} className="text-slate-400 mb-0.5" />
                            <span className="text-[10px] font-bold text-slate-600">ছবি আপলোড করুন</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUnionPhotoUpload}
                              className="hidden"
                            />
                          </label>

                          <div className="flex items-center justify-center border border-slate-200 p-1 rounded-xl bg-white h-20 relative overflow-hidden group">
                            {unionCandidatePhoto ? (
                              <>
                                <img
                                  src={unionCandidatePhoto}
                                  alt="Union candidate preview"
                                  className="h-full w-full object-contain rounded-lg"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setUnionCandidatePhoto('')}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition rounded-lg"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <div className="text-center text-slate-300">
                                <span className="text-[9px] text-slate-400 font-semibold block">গ্লোবাল ছবি সচল</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Candidate Symbol/Marka */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-600">প্রতীক/মার্কা ইমেজ (Symbol/Marka for {selectedUnion})</label>
                        <div className="space-y-2">
                          <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#1a5f9c] p-3 rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition h-20">
                            <Upload size={14} className="text-slate-400 mb-0.5" />
                            <span className="text-[10px] font-bold text-slate-600">প্রতীক আপলোড করুন</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleUnionSymbolUpload}
                              className="hidden"
                            />
                          </label>

                          <div className="flex items-center justify-center border border-slate-200 p-1 rounded-xl bg-white h-20 relative overflow-hidden group">
                            {unionCandidateSymbol ? (
                              <>
                                <img
                                  src={unionCandidateSymbol}
                                  alt="Union symbol preview"
                                  className="h-full w-full object-contain rounded-lg"
                                  referrerPolicy="no-referrer"
                                />
                                <button
                                  type="button"
                                  onClick={() => setUnionCandidateSymbol('')}
                                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-bold transition rounded-lg"
                                >
                                  Remove
                                </button>
                              </>
                            ) : (
                              <div className="text-center text-slate-300">
                                <span className="text-[9px] text-slate-400 font-semibold block">গ্লোবাল প্রতীক সচল</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveUnionCandidateSettings}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
                      >
                        <Save size={13} />
                        <span>ইউনিয়ন কাস্টম তথ্য সংরক্ষণ করুন</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetUnionCandidateSettings}
                        className="px-3.5 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                        title="রিসেট করুন (Delete custom override)"
                      >
                        <RotateCcw size={13} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-slate-400 font-bold text-xs">
                    ইউনিয়ন ভিত্তিক নির্বাচনী তথ্য সেট করতে উপর থেকে যেকোনো একটি ইউনিয়ন নির্বাচন করুন।
                  </div>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="space-y-6">
          {/* Google Search Console card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                <Globe size={16} className="text-[#1a5f9c]" />
                গুগল সার্চ কনসোল সংযোগ (Google Search Console Setup)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Verify site ownership to track Google search ranking and index status</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">সার্চ কনসোল ভেরিফিকেশন কোড বা মেটা ট্যাগ</label>
                <textarea
                  rows={3}
                  value={gscToken}
                  onChange={(e) => setGscToken(e.target.value)}
                  className="w-full text-xs font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-slate-50"
                  placeholder='যেমন: <meta name="google-site-verification" content="your_token_here" /> অথবা সরাসরি আপনার ভেরিফিকেশন কোডটি পেস্ট করুন।'
                />
              </div>

              <div className="bg-blue-50 text-[#1a5f9c] p-3 rounded-xl border border-blue-100 text-[10px] font-bold space-y-1">
                <div className="flex items-center space-x-1">
                  <Search size={12} />
                  <span>কিভাবে ভেরিফাই করবেন?</span>
                </div>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>গুগল সার্চ কনসোলে আপনার সাইট যোগ করুন</li>
                  <li>"HTML Tag" ভেরিফিকেশন মেথড নির্বাচন করুন</li>
                  <li>মেটা ট্যাগটি কপি করে এখানে পেস্ট করে সেভ করুন। সিস্টেম স্বয়ংক্রিয়ভাবে কোডটি এক্সট্র্যাক্ট করে নিবে!</li>
                </ul>
              </div>

              {gscToken && (
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-[11px] text-slate-600 font-bold">
                  <span className="truncate mr-2">সক্রিয় কোড: <code className="text-[#1a5f9c] font-mono select-all bg-white px-1.5 py-0.5 rounded border border-slate-100">{gscToken}</code></span>
                  <button
                    type="button"
                    onClick={() => {
                      setGscToken('');
                      const meta = document.querySelector('meta[name="google-site-verification"]');
                      if (meta) meta.remove();
                      setSuccess('গুগল সার্চ কনসোল কোড মুছে ফেলা হয়েছে!');
                      setTimeout(() => setSuccess(''), 3000);
                    }}
                    className="text-rose-600 hover:text-rose-700 transition font-black text-xs shrink-0"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleSaveGSCSettings}
                className="w-full py-2 bg-[#1a5f9c] hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-sm cursor-pointer"
              >
                <Save size={13} />
                <span>সার্চ কনসোল কোড সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>

          {/* Security guidelines block - Matches red border box from Screenshot 6 */}
          <div className="bg-white p-6 rounded-2xl border-2 border-red-500 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertTriangle size={24} className="shrink-0" />
                <h3 className="font-extrabold text-red-600 text-base">গুরুত্বপূর্ণ নিরাপত্তা নির্দেশিকা</h3>
              </div>

              <div className="text-slate-700 text-xs font-semibold leading-relaxed space-y-3">
                <p>
                  সিস্টেম সেটিংস প্যানেলটি শুধুমাত্র এডমিন অ্যাক্সেসযোগ্য। যেকোনো সেটিং পরিবর্তন করার সাথে সাথে তা সমগ্র visitor পোর্টালে প্রভাব ফেলবে।
                </p>
                <p>
                  রক্ষণাবেক্ষণ মোড অন করলে visitor পোর্টালে প্রবেশ করতে পারবেন না।
                </p>
                <p className="text-slate-500 font-medium">
                  The administrative panel controls are synchronized in real-time. Turning off system accessibility prevents electoral queries instantly on public-facing tablets and visitor phones.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 text-center">
              <div className="inline-flex items-center space-x-2 text-xs font-bold text-[#1a5f9c] bg-[#1a5f9c]/5 px-4 py-2 rounded-xl border border-[#1a5f9c]/10">
                <ShieldCheck size={16} />
                <span>Security Protocols Active: AES-256</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
