import React, { useState, useMemo, useEffect } from 'react';
import { Voter, UnionData, VisitorTab, SystemSettings } from '../types';
import { 
  Home as HomeIcon, 
  Users, 
  Globe, 
  Key, 
  LogOut, 
  ShieldAlert, 
  Search, 
  Plus, 
  Info, 
  Edit, 
  Trash2, 
  User,
  ArrowUp,
  X,
  Printer
} from 'lucide-react';
import VoterSlipModal from './VoterSlipModal';
import PhotoViewerModal from './PhotoViewerModal';
import UnionVillageStats from './UnionVillageStats';
import VisitorDashboard from './VisitorDashboard';

interface VisitorPageProps {
  voters: Voter[];
  unions: UnionData[];
  settings: SystemSettings;
  isAdminLoggedIn: boolean;
  onAdminLogout: () => void;
  onGoToAdminLogin: () => void;
  onGoToAdminPanel: () => void;
  onAddNewVoterClick: () => void;
  onEditVoterClick: (v: Voter) => void;
  onDeleteVoterClick: (id: string) => void;
  onDeleteMultipleVoters?: (ids: string[]) => void;
  renderLogo: (isExpanded: boolean) => React.ReactNode;
}

export default function VisitorPage({
  voters,
  unions,
  settings,
  isAdminLoggedIn,
  onAdminLogout,
  onGoToAdminLogin,
  onGoToAdminPanel,
  onAddNewVoterClick,
  onEditVoterClick,
  onDeleteVoterClick,
  onDeleteMultipleVoters,
  renderLogo
}: VisitorPageProps) {
  // Helper to format YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dobString: string | undefined | null) => {
    if (!dobString) return '';
    const match = dobString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return dobString;
  };

  const calculateAge = (dobString: string | undefined | null) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return null;
    const today = new Date();
    
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    const translateToBangla = (num: number) => {
      const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().split('').map(char => banglaNumbers[parseInt(char)] || char).join('');
    };

    const yearsBn = translateToBangla(years);
    const monthsBn = translateToBangla(months);
    const daysBn = translateToBangla(days);

    let text = `${years} Years`;
    let textBn = `${yearsBn} বছর`;
    
    if (months > 0) {
      text += `, ${months} Months`;
      textBn += `, ${monthsBn} মাস`;
    }
    if (days > 0) {
      text += `, ${days} Days`;
      textBn += `, ${daysBn} দিন`;
    }

    return { years, months, days, text, textBn };
  };

  // Visitor Active Tab
  const [visitorActiveTab, setVisitorActiveTab] = useState<VisitorTab>('dashboard');
  const [visitorSidebarHovered, setVisitorSidebarHovered] = useState(false);

  // Selection state for admins on the public page
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Visitor filter state
  const [visitorSearchQuery, setVisitorSearchQuery] = useState('');
  const [visitorUnion, setVisitorUnion] = useState('');
  const [visitorVillage, setVisitorVillage] = useState('');
  const [visitorGender, setVisitorGender] = useState('');

  // Pagination limit state (100 items at a time)
  const [visibleCount, setVisibleCount] = useState(100);

  // Voter Slip modal state
  const [selectedSlipVoter, setSelectedSlipVoter] = useState<Voter | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Photo Viewer Modal state
  const [activePhotoVoter, setActivePhotoVoter] = useState<Voter | null>(null);

  // Filtered public voters list for the visitor UI
  const visitorFilteredVoters = useMemo(() => {
    return voters.filter(v => {
      const matchUnion = !visitorUnion || v.union === visitorUnion;
      const matchVillage = !visitorVillage || v.village === visitorVillage;
      const matchGender = !visitorGender || v.gender === visitorGender;
      if (!matchUnion || !matchVillage || !matchGender) return false;

      if (!visitorSearchQuery.trim()) return true;
      const q = visitorSearchQuery.toLowerCase().trim();
      return (
        v.sl.toString().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.nameBn.includes(q) ||
        v.voterNo.includes(q) ||
        v.nid.includes(q) ||
        v.dob.includes(q) ||
        v.fatherName.toLowerCase().includes(q) ||
        v.fatherNameBn.includes(q) ||
        v.motherName.toLowerCase().includes(q) ||
        v.motherNameBn.includes(q) ||
        v.union.toLowerCase().includes(q) ||
        v.village.toLowerCase().includes(q)
      );
    });
  }, [voters, visitorSearchQuery, visitorUnion, visitorVillage, visitorGender]);

  // Reset pagination limit when filters or active tab change
  useEffect(() => {
    setVisibleCount(100);
  }, [visitorSearchQuery, visitorUnion, visitorVillage, visitorGender, visitorActiveTab]);

  // Sliced list for display
  const visitorDisplayedVoters = useMemo(() => {
    return visitorFilteredVoters.slice(0, visibleCount);
  }, [visitorFilteredVoters, visibleCount]);

  const visitorVillagesList = useMemo(() => {
    if (!visitorUnion) return [];
    const found = unions.find(u => u.name === visitorUnion);
    return found ? found.villages : [];
  }, [visitorUnion, unions]);

  // Statistics for Dashboard
  const stats = useMemo(() => {
    const total = voters.length;
    const male = voters.filter(v => v.gender === 'Male').length;
    const female = voters.filter(v => v.gender === 'Female').length;
    return { total, male, female };
  }, [voters]);

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col md:flex-row font-sans">
      
      {/* Left Sidebar for Visitor navigation - Hover-based show/hide to maximize table area */}
      <aside 
        onMouseEnter={() => setVisitorSidebarHovered(true)}
        onMouseLeave={() => setVisitorSidebarHovered(false)}
        className={`hidden md:flex bg-white border-r border-slate-200 flex-col shrink-0 transition-all duration-300 ease-in-out md:fixed md:top-0 md:bottom-0 md:left-0 md:z-30 h-full ${
          visitorSidebarHovered ? 'md:w-52 shadow-xl' : 'md:w-14 shadow-xs'
        }`}
      >
        <div className="p-4 border-b border-slate-200">
          {renderLogo(visitorSidebarHovered)}
        </div>

        {/* Public Visitor tabs */}
        <nav className="p-2 flex-1 space-y-1 mt-2">
          <button
            onClick={() => setVisitorActiveTab('dashboard')}
            className={`w-full flex items-center rounded-xl text-xs font-black transition-all duration-150 cursor-pointer ${
              visitorSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
            } ${
              visitorActiveTab === 'dashboard'
                ? 'bg-blue-50 text-[#1a5f9c] border-l-4 border-[#1a5f9c]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title="Visitor Dashboard"
          >
            <HomeIcon size={14} className="shrink-0" />
            {visitorSidebarHovered && <span className="truncate">Visitor Dashboard</span>}
          </button>

          <button
            onClick={() => setVisitorActiveTab('voterList')}
            className={`w-full flex items-center rounded-xl text-xs font-black transition-all duration-150 cursor-pointer ${
              visitorSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
            } ${
              visitorActiveTab === 'voterList'
                ? 'bg-blue-50 text-[#1a5f9c] border-l-4 border-[#1a5f9c]'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
            title="Interactive Voter List"
          >
            <Users size={14} className="shrink-0" />
            {visitorSidebarHovered && <span className="truncate">Interactive Voter List</span>}
          </button>
        </nav>

        {/* Bottom indicator inside visitor sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest justify-center">
            <Globe size={12} className="text-emerald-500 animate-spin shrink-0" />
            {visitorSidebarHovered && <span className="truncate">Digital Registry Node</span>}
          </div>
        </div>
      </aside>

      {/* Primary Public Visitor Content area */}
      <main className="flex-1 flex flex-col min-w-0 md:ml-14 transition-all duration-300">
        
        {/* Public header with Admin entry portal link */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div>
            <h1 className="text-lg md:text-xl font-black text-[#1a5f9c] tracking-tight">
              Union Voter List Portal
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">Union Parishad Electoral Registry</p>
          </div>

          <div className="flex items-center space-x-3">
            {isAdminLoggedIn ? (
              <>
                <button
                  onClick={onGoToAdminPanel}
                  className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-black text-xs transition shadow-md flex items-center space-x-1.5 animate-pulse cursor-pointer"
                >
                  <ShieldAlert size={12} className="text-white" />
                  <span>Admin Panel</span>
                </button>
                <button
                  onClick={onAdminLogout}
                  className="p-2 bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-full transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={14} />
                </button>
              </>
            ) : (
              <button
                onClick={onGoToAdminLogin}
                className="px-4.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-black text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer"
              >
                <Key size={12} className="text-[#39ff14]" />
                <span>Admin Login</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Sticky Tab Switcher */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-20 flex space-x-2">
          <button
            onClick={() => setVisitorActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer ${
              visitorActiveTab === 'dashboard'
                ? 'bg-blue-50 text-[#1a5f9c] border border-blue-200/60 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HomeIcon size={14} />
            <span>ড্যাশবোর্ড (Dashboard)</span>
          </button>
          <button
            onClick={() => setVisitorActiveTab('voterList')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer ${
              visitorActiveTab === 'voterList'
                ? 'bg-blue-50 text-[#1a5f9c] border border-blue-200/60 shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users size={14} />
            <span>ভোটার তালিকা (Voter List)</span>
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6">

          {/* Top Banner stats indicator */}
          {visitorActiveTab === 'voterList' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-blue-50 text-[#1a5f9c] rounded-xl shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Registered Voters</span>
                  <span className="text-2xl font-black text-slate-800">{stats.total}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-sky-50 text-sky-600 rounded-xl shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Male Voters Count</span>
                  <span className="text-2xl font-black text-slate-800">{stats.male}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-4">
                <div className="p-3.5 bg-pink-50 text-pink-600 rounded-xl shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Female Voters Count</span>
                  <span className="text-2xl font-black text-slate-800">{stats.female}</span>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE TAB: VISITOR DASHBOARD */}
          {visitorActiveTab === 'dashboard' && (
            <VisitorDashboard voters={voters} unions={unions} settings={settings} />
          )}

          {/* ACTIVE TAB: VISITOR VOTER LIST (Interactive filtering) */}
          {visitorActiveTab === 'voterList' && (
            <div className="space-y-6">
              
              {/* Public filters panel */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col gap-5">
                
                {/* Realtime Search Input */}
                <div className="w-full">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                    ভোটার অনুসন্ধান করুন (Search Voter)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={visitorSearchQuery}
                      onChange={(e) => setVisitorSearchQuery(e.target.value)}
                      placeholder="এখানে নাম, ভোটার নম্বর, এনআইডি নম্বর, জন্ম তারিখ, অথবা পিতার নাম টাইপ করুন (Search by name, DOB, NID, Voter No...)"
                      className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 font-medium text-xs shadow-3xs"
                    />
                    <Search size={15} className="absolute left-4 top-3.5 text-slate-400" />
                    {visitorSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setVisitorSearchQuery('')}
                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Filter Union</label>
                    <select
                      value={visitorUnion}
                      onChange={(e) => {
                        setVisitorUnion(e.target.value);
                        setVisitorVillage('');
                      }}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs font-bold text-slate-700 bg-white"
                    >
                      <option value="">-- All Unions --</option>
                      {unions.map(u => (
                        <option key={u.name} value={u.name}>{u.name} ({u.nameBn})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Filter Village</label>
                    <select
                      value={visitorVillage}
                      disabled={!visitorUnion}
                      onChange={(e) => setVisitorVillage(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs font-bold text-slate-700 bg-white disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">-- All Villages --</option>
                      {visitorVillagesList.map(v => (
                        <option key={v.name} value={v.name}>{v.nameBn} ({v.name})</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Filter Gender</label>
                    <select
                      value={visitorGender}
                      onChange={(e) => setVisitorGender(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs font-bold text-slate-700 bg-white"
                    >
                      <option value="">-- All Genders --</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* Reset button */}
                  <button
                    type="button"
                    onClick={() => {
                      setVisitorSearchQuery('');
                      setVisitorUnion('');
                      setVisitorVillage('');
                      setVisitorGender('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition shrink-0 mt-4.5 cursor-pointer"
                  >
                    Clear Filters
                  </button>

                  {isAdminLoggedIn && (
                    <button
                      type="button"
                      onClick={onAddNewVoterClick}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shrink-0 mt-4.5 flex items-center space-x-1 shadow-sm cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add New Voter</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Admin Bulk Actions Panel on Public Visitor list */}
              {isAdminLoggedIn && (
                <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                      নির্বাচিত হয়েছে (Selected): <span className="text-red-600 font-extrabold text-sm">{selectedIds.length}</span> জন
                    </span>
                    {selectedIds.length > 0 && (
                      <button
                        onClick={() => setSelectedIds([])}
                        className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition cursor-pointer"
                        title="Clear selection"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => {
                        const filteredIds = visitorFilteredVoters.map(v => v.id);
                        setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                      }}
                      className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer shadow-3xs"
                    >
                      সব সিলেক্ট করুন (Select All)
                    </button>
                    {selectedIds.length > 0 && (
                      <button
                        onClick={() => {
                          if (selectedIds.length === 0) return;
                          const confirmDelete = window.confirm(`আপনি কি নিশ্চিত যে আপনি এই ${selectedIds.length} টি ভোটার তথ্য মুছে ফেলতে চান?\n(Are you sure you want to delete these ${selectedIds.length} selected voter records?)`);
                          if (confirmDelete) {
                            if (onDeleteMultipleVoters) {
                              onDeleteMultipleVoters(selectedIds);
                            }
                            setSelectedIds([]);
                          }
                        }}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl border border-red-700 transition-all cursor-pointer shadow-md inline-flex items-center justify-center space-x-1"
                      >
                        <Trash2 size={14} />
                        <span>নির্বাচিত ডাটা মুছুন (Delete Selected)</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Voter list Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                        {isAdminLoggedIn && (
                          <th className="p-3.5 text-center w-12 select-none">
                            <input
                              type="checkbox"
                              checked={visitorFilteredVoters.length > 0 && visitorFilteredVoters.every(v => selectedIds.includes(v.id))}
                              onChange={() => {
                                const filteredIds = visitorFilteredVoters.map(v => v.id);
                                const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
                                if (allSelected) {
                                  setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
                                } else {
                                  setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                                }
                              }}
                              className="rounded text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                            />
                          </th>
                        )}
                        <th className="p-3.5 text-center w-14">SL</th>
                        <th className="p-3.5">Name</th>
                        <th className="p-3.5 text-center">Voter No</th>
                        <th className="p-3.5 text-center">Date Of Birth</th>
                        <th className="p-3.5 text-center">NID Number</th>
                        <th className="p-3.5">Father Name</th>
                        <th className="p-3.5">Mother Name</th>
                        <th className="p-3.5 text-center">Union / Village</th>
                        <th className="p-3.5 text-center">Gender</th>
                        <th className="p-3.5 text-center w-28">স্লিপ (Slip)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitorDisplayedVoters.length > 0 ? (
                        visitorDisplayedVoters.map((v) => (
                          <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                            {isAdminLoggedIn && (
                              <td className="p-3.5 text-center border-r border-slate-100">
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(v.id)}
                                  onChange={() => {
                                    setSelectedIds(prev => 
                                      prev.includes(v.id) ? prev.filter(id => id !== v.id) : [...prev, v.id]
                                    );
                                  }}
                                  className="rounded text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                                />
                              </td>
                            )}
                            <td className="p-3.5 text-center font-bold text-slate-500">{v.sl}</td>
                            <td className="p-3.5">
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => setActivePhotoVoter(v)}
                                  className="relative group focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-full shrink-0 cursor-pointer text-left"
                                  title="Click to view and download photo / বড় করে দেখতে ও ডাউনলোড করতে ক্লিক করুন"
                                >
                                  {v.photo ? (
                                    <div className="relative overflow-hidden rounded-full w-10 h-10">
                                      <img
                                        src={v.photo}
                                        alt={v.name}
                                        referrerPolicy="no-referrer"
                                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0 shadow-xs transition duration-200 group-hover:scale-115 group-hover:brightness-95"
                                      />
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
                                        <span className="text-[7px] text-white font-extrabold select-none">VIEW</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-slate-200 text-xs font-bold shadow-inner shrink-0 transition duration-200 group-hover:scale-105 ${
                                      v.gender === 'Female' ? 'bg-pink-50 text-pink-500 border-pink-150' : 'bg-sky-50 text-sky-500 border-sky-150'
                                    }`}>
                                      <User size={15} />
                                    </div>
                                  )}
                                </button>
                                <div>
                                  <div className="font-bold text-slate-800 text-sm leading-snug">{v.name}</div>
                                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{v.nameBn}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-slate-600">{v.voterNo}</td>
                            <td className="p-3.5 text-center text-slate-500 font-semibold">
                              <div>{formatDate(v.dob)}</div>
                              {(() => {
                                const ageInfo = calculateAge(v.dob);
                                return ageInfo ? (
                                  <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100/70 px-1.5 py-0.5 rounded inline-block mt-1">
                                    {ageInfo.textBn}
                                  </div>
                                ) : null;
                              })()}
                            </td>
                            <td className="p-3.5 text-center font-mono text-slate-700 font-semibold">{v.nid}</td>
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-700">{v.fatherName}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{v.fatherNameBn}</div>
                            </td>
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-700">{v.motherName}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{v.motherNameBn}</div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600">
                                {v.union}
                              </span>
                              <div className="text-[9px] text-slate-400 mt-1">{v.village}</div>
                            </td>
                            <td className="p-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                v.gender === 'Female' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-sky-50 text-sky-500 border-sky-100'
                              }`}>{v.gender}</span>
                            </td>
                            <td className="p-3.5 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedSlipVoter(v);
                                    setIsSlipModalOpen(true);
                                  }}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded transition border border-emerald-200 cursor-pointer flex items-center space-x-1 text-[10px] font-bold"
                                  title="Print Voter Slip"
                                >
                                  <Printer size={11} />
                                  <span>স্লিপ</span>
                                </button>
                                {isAdminLoggedIn && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onEditVoterClick(v)}
                                      className="p-1 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded transition border border-amber-200 cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onDeleteVoterClick(v.id)}
                                      className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition border border-rose-200 cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={isAdminLoggedIn ? 11 : 9} className="p-10 text-center text-slate-400">
                            <Info size={28} className="mx-auto text-slate-300 mb-2" />
                            <p className="font-bold text-slate-500">No matching public voter records found.</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Try relaxing or modifying select filters above.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View Voter Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {visitorDisplayedVoters.length > 0 ? (
                    visitorDisplayedVoters.map((v) => (
                      <div key={v.id} className="p-4 bg-white hover:bg-slate-50/50 transition space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            {/* Photo if exists */}
                            {v.photo ? (
                              <img
                                src={v.photo}
                                alt={v.name}
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                              />
                            ) : (
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center border border-slate-200 text-xs font-bold shadow-inner shrink-0 ${
                                v.gender === 'Male' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'
                              }`}>
                                <User size={16} />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-slate-100 text-slate-700 font-extrabold text-[9px] rounded border border-slate-200">
                                  SL: {v.sl}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                  v.gender === 'Female' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-sky-50 text-sky-500 border-sky-100'
                                }`}>{v.gender === 'Female' ? 'মহিলা (Female)' : 'পুরুষ (Male)'}</span>
                              </div>
                              <h3 className="font-extrabold text-slate-800 text-sm mt-1 leading-snug">{v.name}</h3>
                              <p className="text-xs font-bold text-[#1a5f9c] mt-0.5">{v.nameBn}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSlipVoter(v);
                                setIsSlipModalOpen(true);
                              }}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition border border-emerald-200 cursor-pointer flex items-center justify-center"
                              title="Print Voter Slip"
                            >
                              <Printer size={13} />
                            </button>
                            {isAdminLoggedIn && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEditVoterClick(v)}
                                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition border border-amber-200 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit size={12} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteVoterClick(v.id)}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition border border-rose-200 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] border-t border-slate-100 pt-3">
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Voter No</span>
                            <span className="font-mono font-bold text-slate-700">{v.voterNo}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">NID Number</span>
                            <span className="font-mono font-bold text-slate-700">{v.nid}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth / Age</span>
                            <span className="font-semibold text-slate-600 block">{formatDate(v.dob)}</span>
                            {(() => {
                              const ageInfo = calculateAge(v.dob);
                              return ageInfo ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100/70 px-1 py-0.2 rounded block w-max mt-0.5">
                                  {ageInfo.textBn}
                                </span>
                              ) : null;
                            })()}
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Union & Village</span>
                            <span className="font-semibold text-slate-600 inline-block truncate max-w-full" title={`${v.union} / ${v.village}`}>
                              {v.union} / <span className="text-slate-500 font-normal">{v.village}</span>
                            </span>
                          </div>
                        </div>

                        {/* Parents Information */}
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] bg-slate-50/70 p-2 rounded-xl border border-slate-100/80">
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Father's Name</span>
                            <span className="font-bold text-slate-700 block truncate">{v.fatherName}</span>
                            <span className="text-[9px] text-slate-400 block truncate leading-tight">{v.fatherNameBn}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Mother's Name</span>
                            <span className="font-bold text-slate-700 block truncate">{v.motherName}</span>
                            <span className="text-[9px] text-slate-400 block truncate leading-tight">{v.motherNameBn}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-semibold text-xs">
                      <Info size={24} className="mx-auto text-slate-300 mb-1" />
                      কোনো ভোটার পাওয়া যায়নি (No voters found)
                    </div>
                  )}
                </div>

                {/* Show More Button inside Interactive Voter List */}
                {visitorFilteredVoters.length > visibleCount && (
                  <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col items-center justify-center space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + 100)}
                      className="px-6 py-2.5 bg-[#1a5f9c] hover:bg-[#124b7e] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer select-none"
                    >
                      <span>আরও দেখুন / Show More</span>
                    </button>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      Showing {visibleCount} of {visitorFilteredVoters.length} rows ({visitorFilteredVoters.length - visibleCount} remaining)
                    </span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Scroll to Top Button */}
          <div className="flex justify-center mt-6">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#1a5f9c] hover:bg-[#0f5298] text-white font-extrabold rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-sm cursor-pointer select-none border border-slate-300/10"
              title="Scroll to Top"
            >
              <ArrowUp size={16} />
              <span>উপরে যান (Scroll to Top)</span>
            </button>
          </div>

        </div>
      </main>

      {/* Voter Slip Modal */}
      <VoterSlipModal
        voter={selectedSlipVoter}
        isOpen={isSlipModalOpen}
        settings={settings}
        onClose={() => {
          setIsSlipModalOpen(false);
          setSelectedSlipVoter(null);
        }}
      />

      {/* Photo Viewer Modal */}
      <PhotoViewerModal
        isOpen={activePhotoVoter !== null}
        photoUrl={activePhotoVoter?.photo}
        voterName={activePhotoVoter?.name || ""}
        voterNameBn={activePhotoVoter?.nameBn}
        voterNo={activePhotoVoter?.voterNo}
        gender={activePhotoVoter?.gender}
        onClose={() => setActivePhotoVoter(null)}
      />
    </div>
  );
}
