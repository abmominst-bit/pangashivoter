import React, { useMemo, useState } from 'react';
import { Voter, UnionData, SystemSettings } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  Users, 
  User, 
  MapPin, 
  TrendingUp, 
  PieChart as PieIcon, 
  BarChart3, 
  Info, 
  CalendarDays,
  Activity,
  Layers,
  Search,
  Printer,
  Eye,
  X
} from 'lucide-react';
import UnionVillageStats from './UnionVillageStats';
import VoterSlipModal from './VoterSlipModal';
import PhotoViewerModal from './PhotoViewerModal';

interface VisitorDashboardProps {
  voters: Voter[];
  unions: UnionData[];
  settings: SystemSettings;
}

export default function VisitorDashboard({ voters, unions, settings }: VisitorDashboardProps) {
  const [selectedUnionFilter, setSelectedUnionFilter] = useState<string>('');

  // Search states for Visitor Dashboard
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [dashboardSearchType, setDashboardSearchType] = useState<'all' | 'name' | 'nid' | 'voterNo' | 'dob'>('all');
  const [searchLimit, setSearchLimit] = useState(20);
  const [selectedSlipVoter, setSelectedSlipVoter] = useState<Voter | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [activePhotoVoter, setActivePhotoVoter] = useState<Voter | null>(null);

  // Date formatter helper
  const formatDate = (dobString: string | undefined | null) => {
    if (!dobString) return '';
    const match = dobString.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      return `${day}/${month}/${year}`;
    }
    return dobString;
  };

  // Filtered voters for dashboard search
  const dashboardFilteredVoters = useMemo(() => {
    if (!dashboardSearchQuery.trim()) return [];
    const q = dashboardSearchQuery.toLowerCase().trim();

    return voters.filter(v => {
      // Respect selected union filter first if set
      if (selectedUnionFilter && v.union !== selectedUnionFilter) return false;

      if (dashboardSearchType === 'name') {
        return v.name.toLowerCase().includes(q) || v.nameBn.includes(q);
      }
      if (dashboardSearchType === 'nid') {
        return v.nid.includes(q);
      }
      if (dashboardSearchType === 'voterNo') {
        return v.voterNo.includes(q);
      }
      if (dashboardSearchType === 'dob') {
        return v.dob?.includes(q);
      }

      // 'all' search
      return (
        v.sl.toString().includes(q) ||
        v.name.toLowerCase().includes(q) ||
        v.nameBn.includes(q) ||
        v.voterNo.includes(q) ||
        (v.nid && v.nid.includes(q)) ||
        (v.dob && v.dob.includes(q)) ||
        v.fatherName.toLowerCase().includes(q) ||
        v.fatherNameBn.includes(q) ||
        v.motherName.toLowerCase().includes(q) ||
        v.motherNameBn.includes(q) ||
        v.village.toLowerCase().includes(q) ||
        v.union.toLowerCase().includes(q)
      );
    });
  }, [voters, dashboardSearchQuery, dashboardSearchType, selectedUnionFilter]);

  // Display limited search results
  const displayedDashboardVoters = useMemo(() => {
    return dashboardFilteredVoters.slice(0, searchLimit);
  }, [dashboardFilteredVoters, searchLimit]);

  // 1. Core Counts and Stats
  const stats = useMemo(() => {
    // Filter voters based on selected union if any
    const activeVoters = selectedUnionFilter 
      ? voters.filter(v => v.union === selectedUnionFilter)
      : voters;

    const total = activeVoters.length;
    const male = activeVoters.filter(v => v.gender === 'Male').length;
    const female = activeVoters.filter(v => v.gender === 'Female').length;
    
    const malePercent = total > 0 ? ((male / total) * 100).toFixed(1) : '0';
    const femalePercent = total > 0 ? ((female / total) * 100).toFixed(1) : '0';

    // Total villages covered
    let totalVillages = 0;
    if (selectedUnionFilter) {
      const uObj = unions.find(u => u.name === selectedUnionFilter);
      totalVillages = uObj ? uObj.villages.length : 0;
    } else {
      totalVillages = unions.reduce((acc, curr) => acc + curr.villages.length, 0);
    }

    // Average Age Calculation
    let averageAge = 0;
    let validAgesCount = 0;
    let totalAgeSum = 0;
    const currentYear = 2026;

    // Age distribution categories
    let youthCount = 0; // 18 - 35
    let middleCount = 0; // 36 - 50
    let seniorCount = 0; // 51+

    activeVoters.forEach(v => {
      if (v.dob) {
        const match = v.dob.match(/^(\d{4})-\d{2}-\d{2}$/);
        if (match) {
          const birthYear = parseInt(match[1]);
          const age = currentYear - birthYear;
          if (age > 0 && age < 120) {
            totalAgeSum += age;
            validAgesCount++;

            if (age <= 35) youthCount++;
            else if (age <= 50) middleCount++;
            else seniorCount++;
          }
        }
      }
    });

    averageAge = validAgesCount > 0 ? Math.round(totalAgeSum / validAgesCount) : 0;

    return {
      total,
      male,
      female,
      malePercent,
      femalePercent,
      totalVillages,
      averageAge,
      ageGroupData: [
        { name: 'তরুণ (১৮-৩৫)', range: '18-35 yrs', count: youthCount, color: '#10b981' },
        { name: 'মধ্যবয়সী (৩৬-৫০)', range: '36-50 yrs', count: middleCount, color: '#f59e0b' },
        { name: 'প্রবীণ (৫১+)', range: '51+ yrs', count: seniorCount, color: '#ec4899' }
      ]
    };
  }, [voters, unions, selectedUnionFilter]);

  // 2. Union-wise Voter Count Distribution (Only relevant when viewing all unions)
  const unionChartData = useMemo(() => {
    return unions.map(union => {
      const unionVoters = voters.filter(v => v.union === union.name);
      return {
        name: union.name,
        nameBn: union.nameBn,
        votersCount: unionVoters.length,
        Male: unionVoters.filter(v => v.gender === 'Male').length,
        Female: unionVoters.filter(v => v.gender === 'Female').length,
      };
    }).sort((a, b) => b.votersCount - a.votersCount);
  }, [voters, unions]);

  // 3. Gender split data for Pie Chart
  const genderChartData = useMemo(() => {
    return [
      { name: 'Male (পুরুষ)', value: stats.male, color: '#1a5f9c' },
      { name: 'Female (মহিলা)', value: stats.female, color: '#ec4899' }
    ];
  }, [stats.male, stats.female]);

  return (
    <div className="space-y-6">
      
      {/* Dashboard Filter Hub */}
      <div className="bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
            <Activity size={16} className="text-[#1a5f9c]" />
            <span>লাইভ ড্যাশবোর্ড ফিল্টার (Dashboard Filter)</span>
          </h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
            Select a specific Union to refine metrics instantly
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <label className="text-xs font-bold text-slate-500 whitespace-nowrap">ইউনিয়ন:</label>
          <select
            value={selectedUnionFilter}
            onChange={(e) => setSelectedUnionFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-xs font-bold text-slate-700 bg-white"
          >
            <option value="">-- All Unions (সব ইউনিয়ন) --</option>
            {unions.map(u => (
              <option key={u.name} value={u.name}>{u.nameBn} ({u.name})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Voters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center space-x-4 relative overflow-hidden group hover:border-blue-300 transition duration-150">
          <div className="p-3 bg-blue-50 text-[#1a5f9c] rounded-xl shrink-0 group-hover:scale-105 transition">
            <Users size={22} />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Voters</span>
            <span className="text-xl font-black text-slate-800 font-mono tracking-tight">{stats.total}</span>
            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">নিবন্ধিত ভোটার</span>
          </div>
        </div>

        {/* Male Voters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center space-x-4 relative overflow-hidden group hover:border-sky-300 transition duration-150">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl shrink-0 group-hover:scale-105 transition">
            <User size={22} />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Male Voters</span>
            <span className="text-xl font-black text-slate-800 font-mono tracking-tight">{stats.male}</span>
            <span className="block text-[9px] text-sky-600 font-black mt-0.5">{stats.malePercent}% (পুরুষ)</span>
          </div>
        </div>

        {/* Female Voters */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center space-x-4 relative overflow-hidden group hover:border-pink-300 transition duration-150">
          <div className="p-3 bg-pink-50 text-pink-600 rounded-xl shrink-0 group-hover:scale-105 transition">
            <User size={22} />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Female Voters</span>
            <span className="text-xl font-black text-slate-800 font-mono tracking-tight">{stats.female}</span>
            <span className="block text-[9px] text-pink-500 font-black mt-0.5">{stats.femalePercent}% (মহিলা)</span>
          </div>
        </div>

        {/* Villages Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center space-x-4 relative overflow-hidden group hover:border-emerald-300 transition duration-150">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 group-hover:scale-105 transition">
            <MapPin size={22} />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total Villages</span>
            <span className="text-xl font-black text-slate-800 font-mono tracking-tight">{stats.totalVillages}</span>
            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">অন্তর্ভুক্ত গ্রামসমূহ</span>
          </div>
        </div>

        {/* Average Age */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs flex items-center space-x-4 relative overflow-hidden group hover:border-amber-300 transition duration-150">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0 group-hover:scale-105 transition">
            <CalendarDays size={22} />
          </div>
          <div>
            <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Average Age</span>
            <span className="text-xl font-black text-slate-800 font-mono tracking-tight">{stats.averageAge} Yrs</span>
            <span className="block text-[9px] text-slate-400 font-medium mt-0.5">গড় বয়স (আনুমানিক)</span>
          </div>
        </div>
      </div>

      {/* 🚀 INTERACTIVE VOTER SEARCH DIRECTORY */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header Block */}
        <div className="bg-gradient-to-r from-[#1a5f9c] to-[#2575bc] text-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 h-full w-1/3 bg-radial-gradient from-white/10 to-transparent pointer-events-none"></div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold flex items-center gap-2">
                <Search size={22} className="text-sky-300" />
                <span>দ্রুত ভোটার তথ্য ও স্লিপ অনুসন্ধান (Quick Voter Slip Search)</span>
              </h2>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed max-w-xl">
                আপনার নাম, ভোটার নং, জন্ম তারিখ, এনআইডি নম্বর, পিতা বা মাতার নাম টাইপ করে তাৎক্ষণিকভাবে ভোটার বিবরণী ও স্লিপ বের করুন।
              </p>
            </div>
            {dashboardSearchQuery && (
              <span className="px-3.5 py-1.5 bg-white/10 text-white rounded-xl text-xs font-bold shrink-0 self-start md:self-center">
                পাওয়া গেছে: {dashboardFilteredVoters.length} জন ভোটার
              </span>
            )}
          </div>

          {/* Quick Search Types Tabs */}
          <div className="flex flex-wrap gap-2 mt-5 border-t border-white/10 pt-4">
            <button
              onClick={() => { setDashboardSearchType('all'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardSearchType === 'all' 
                  ? 'bg-white text-[#1a5f9c] shadow-xs' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/15'
              }`}
            >
              সব তথ্য (All)
            </button>
            <button
              onClick={() => { setDashboardSearchType('name'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardSearchType === 'name' 
                  ? 'bg-white text-[#1a5f9c] shadow-xs' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/15'
              }`}
            >
              নাম দিয়ে (Name)
            </button>
            <button
              onClick={() => { setDashboardSearchType('voterNo'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardSearchType === 'voterNo' 
                  ? 'bg-white text-[#1a5f9c] shadow-xs' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/15'
              }`}
            >
              ভোটার নং (Voter No)
            </button>
            <button
              onClick={() => { setDashboardSearchType('nid'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardSearchType === 'nid' 
                  ? 'bg-white text-[#1a5f9c] shadow-xs' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/15'
              }`}
            >
              এনআইডি (NID)
            </button>
            <button
              onClick={() => { setDashboardSearchType('dob'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                dashboardSearchType === 'dob' 
                  ? 'bg-white text-[#1a5f9c] shadow-xs' 
                  : 'bg-white/10 text-blue-100 hover:bg-white/15'
              }`}
            >
              জন্ম তারিখ (DOB)
            </button>
          </div>

          {/* Search Box Input */}
          <div className="relative mt-4">
            <input
              type="text"
              value={dashboardSearchQuery}
              onChange={(e) => {
                setDashboardSearchQuery(e.target.value);
                setSearchLimit(20); // Reset limit on type
              }}
              placeholder={
                dashboardSearchType === 'name' ? "ইংলিশ অথবা বাংলা নাম টাইপ করুন..." :
                dashboardSearchType === 'voterNo' ? "ভোটার নম্বর টাইপ করুন..." :
                dashboardSearchType === 'nid' ? "এনআইডি নম্বর টাইপ করুন..." :
                dashboardSearchType === 'dob' ? "জন্ম তারিখ (যেমন: YYYY-MM-DD) টাইপ করুন..." :
                "অনুসন্ধান করুন (নাম, এনআইডি, ভোটার নং, জন্ম তারিখ বা পিতা/মাতার নাম)..."
              }
              className="w-full bg-white text-slate-900 rounded-2xl pl-12 pr-10 py-4 focus:outline-none focus:ring-2 focus:ring-sky-300 font-medium text-sm shadow-md"
            />
            <Search size={20} className="absolute left-4 top-4.5 text-[#1a5f9c]" />
            {dashboardSearchQuery && (
              <button 
                onClick={() => setDashboardSearchQuery('')} 
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition p-1 cursor-pointer font-bold"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Results Container */}
        <div className="p-5">
          {dashboardSearchQuery.trim() === '' ? (
            /* EMPTY STATE: Waiting to search */
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-blue-50 text-[#1a5f9c] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-3xs">
                <Search size={28} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">ভোটার তথ্য ও স্লিপ প্রিন্ট করুন</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                অনুগ্রহ করে উপরের সার্চ বক্সে আপনার প্রয়োজনীয় তথ্য টাইপ করুন। আপনি নাম, ভোটার নং বা এনআইডি ব্যবহার করে সার্চ করতে পারেন।
              </p>
              {selectedUnionFilter && (
                <div className="mt-4 inline-flex items-center space-x-1 bg-amber-50 text-amber-700 px-3 py-1 rounded-full border border-amber-200 text-[10px] font-black uppercase">
                  <span>ফিল্টার সক্রিয়: {unions.find(u => u.name === selectedUnionFilter)?.nameBn}</span>
                </div>
              )}
            </div>
          ) : dashboardFilteredVoters.length === 0 ? (
            /* NO RESULTS STATE */
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-3xs">
                <Info size={28} />
              </div>
              <h3 className="font-extrabold text-slate-800 text-sm">দুঃখিত, কোনো তথ্য পাওয়া যায়নি!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                "{dashboardSearchQuery}" এর সাথে মিলে যায় এমন কোনো পাবলিক ভোটার রেকর্ড নেই। আপনার টাইপিং বানান বা নাম্বার পুনরায় চেক করুন।
              </p>
            </div>
          ) : (
            /* MATCHES FOUND STATE */
            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3.5 text-center w-14">SL</th>
                      <th className="p-3.5">Name</th>
                      <th className="p-3.5 text-center">Voter No</th>
                      <th className="p-3.5 text-center">Date Of Birth</th>
                      <th className="p-3.5 text-center">NID Number</th>
                      <th className="p-3.5">Father & Mother Name</th>
                      <th className="p-3.5 text-center">Union / Village</th>
                      <th className="p-3.5 text-center w-28">স্লিপ (Slip)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedDashboardVoters.map((v) => (
                      <tr key={v.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="p-3.5 text-center font-bold text-slate-500">{v.sl}</td>
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            {/* Photo / Avatar */}
                            <button
                              type="button"
                              onClick={() => v.photo && setActivePhotoVoter(v)}
                              className={`relative group focus:outline-none rounded-full shrink-0 ${v.photo ? 'cursor-pointer' : 'cursor-default'}`}
                              disabled={!v.photo}
                              title={v.photo ? "বড় করে দেখতে ক্লিক করুন" : undefined}
                            >
                              {v.photo ? (
                                <div className="relative overflow-hidden rounded-full w-10 h-10 border border-slate-200">
                                  <img
                                    src={v.photo}
                                    alt={v.name}
                                    referrerPolicy="no-referrer"
                                    className="w-10 h-10 rounded-full object-cover transition group-hover:scale-110"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
                                    <Eye size={12} className="text-white" />
                                  </div>
                                </div>
                              ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border text-xs font-bold shadow-inner shrink-0 ${
                                  v.gender === 'Female' ? 'bg-pink-50 text-pink-500 border-pink-150' : 'bg-sky-50 text-sky-500 border-sky-150'
                                }`}>
                                  <User size={15} />
                                </div>
                              )}
                            </button>
                            <div>
                              <div className="font-extrabold text-slate-800 text-sm leading-snug">{v.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 mt-0.5">{v.nameBn}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-600">{v.voterNo}</td>
                        <td className="p-3.5 text-center text-slate-500 font-semibold">{formatDate(v.dob)}</td>
                        <td className="p-3.5 text-center font-mono text-slate-700 font-semibold">{v.nid}</td>
                        <td className="p-3.5">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Father:</span>
                            <span className="font-semibold text-slate-700 text-xs">{v.fatherName} ({v.fatherNameBn})</span>
                          </div>
                          <div className="mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Mother:</span>
                            <span className="font-semibold text-slate-700 text-xs">{v.motherName} ({v.motherNameBn})</span>
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-600 uppercase">
                            {v.union}
                          </span>
                          <div className="text-[10px] text-slate-500 font-semibold mt-1">{v.village}</div>
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSlipVoter(v);
                              setIsSlipModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center space-x-1 mx-auto text-[10px] font-bold"
                            title="Print Voter Slip"
                          >
                            <Printer size={12} />
                            <span>স্লিপ প্রিন্ট</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="md:hidden divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
                {displayedDashboardVoters.map((v) => (
                  <div key={v.id} className="p-4 space-y-3 hover:bg-slate-50/30 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {v.photo ? (
                          <button
                            onClick={() => setActivePhotoVoter(v)}
                            className="relative overflow-hidden rounded-full w-12 h-12 border border-slate-200 shrink-0"
                          >
                            <img
                              src={v.photo}
                              alt={v.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border text-xs font-bold shadow-inner shrink-0 ${
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
                            }`}>{v.gender === 'Female' ? 'মহিলা' : 'পুরুষ'}</span>
                          </div>
                          <h3 className="font-extrabold text-slate-800 text-sm mt-1 leading-snug">{v.name}</h3>
                          <p className="text-xs font-bold text-[#1a5f9c] mt-0.5">{v.nameBn}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlipVoter(v);
                          setIsSlipModalOpen(true);
                        }}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition border border-emerald-200 cursor-pointer flex items-center justify-center shrink-0 ml-2"
                        title="Print Voter Slip"
                      >
                        <Printer size={15} />
                      </button>
                    </div>

                    {/* Specifications Grid */}
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
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Date of Birth</span>
                        <span className="font-semibold text-slate-600">{formatDate(v.dob)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Union & Village</span>
                        <span className="font-semibold text-slate-600 block truncate" title={`${v.union} / ${v.village}`}>
                          {v.union} / <span className="text-slate-500 font-normal">{v.village}</span>
                        </span>
                      </div>
                    </div>

                    {/* Parents Info */}
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
                ))}
              </div>

              {/* Show More Button */}
              {dashboardFilteredVoters.length > searchLimit && (
                <div className="pt-3 flex flex-col items-center justify-center space-y-1">
                  <button
                    type="button"
                    onClick={() => setSearchLimit(prev => prev + 20)}
                    className="px-5 py-2 bg-[#1a5f9c] hover:bg-[#124b7e] text-white rounded-xl font-bold text-xs transition shadow-md cursor-pointer select-none"
                  >
                    আরও দেখুন / Show More
                  </button>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                    Showing {searchLimit} of {dashboardFilteredVoters.length} matches
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Union-wise distribution or detail widget */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={16} className="text-blue-600" />
                <span>Electoral Demographics breakdown</span>
              </h4>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">
                {selectedUnionFilter ? 'Village stats' : 'Union distribution'}
              </span>
            </div>

            {stats.total === 0 ? (
              <div className="h-[240px] flex flex-col items-center justify-center text-slate-400 text-xs">
                <Info size={32} className="text-slate-300 mb-2" />
                <p className="font-bold">No voter data available to display charts</p>
              </div>
            ) : selectedUnionFilter ? (
              // Selected Union: Render beautiful local horizontal stats bar for top villages
              <div className="space-y-4 max-h-[260px] overflow-y-auto pr-1">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-0.5">
                  Top Villages by Voter Density (গ্রাম অনুযায়ী ভোটার ঘনত্ব)
                </div>
                {unions.find(u => u.name === selectedUnionFilter)?.villages.map(v => {
                  const vVoters = voters.filter(vot => vot.union === selectedUnionFilter && vot.village === v.name);
                  const count = vVoters.length;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={v.name} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="truncate">{v.nameBn} <span className="text-[10px] font-normal font-mono text-slate-400">({v.name})</span></span>
                        <span className="font-mono">{count} voters ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-[#1a5f9c] h-full rounded-full transition-all duration-500" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // All Unions view: Render majestic Stacked Bar Chart
              <div className="h-[260px] w-full text-xs font-semibold">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={unionChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickFormatter={(v) => {
                        const found = unions.find(u => u.name === v);
                        return found ? found.nameBn : v;
                      }}
                    />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        fontFamily: 'inherit',
                        fontSize: '11px'
                      }}
                      formatter={(value: any, name: string) => [value, name === 'Male' ? 'পুরুষ (Male)' : 'মহিলা (Female)']}
                      labelFormatter={(label) => {
                        const found = unions.find(u => u.name === label);
                        return found ? `${found.nameBn} (${found.name})` : label;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={32} 
                      iconType="circle" 
                      iconSize={8}
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="Male" stackId="a" fill="#1a5f9c" name="Male" />
                    <Bar dataKey="Female" stackId="a" fill="#ec4899" name="Female" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Gender ratio donut + Age segments */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[350px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <PieIcon size={16} className="text-pink-500" />
                <span>Gender Ratio Overview</span>
              </h4>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 uppercase">
                লিঙ্গ অনুপাত
              </span>
            </div>

            {stats.total === 0 ? (
              <div className="h-[200px] flex flex-col items-center justify-center text-slate-400 text-xs">
                <Info size={32} className="text-slate-300 mb-2" />
                <p className="font-bold">No data available</p>
              </div>
            ) : (
              <div className="relative h-[200px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#ffffff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '12px',
                        fontSize: '11px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute text-center flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Voters</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight font-mono">{stats.total}</span>
                </div>
              </div>
            )}
          </div>

          {stats.total > 0 && (
            <div className="border-t border-slate-100 pt-4 flex items-center justify-around text-xs font-bold">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1a5f9c] inline-block"></span>
                <span className="text-slate-500">পুরুষ:</span>
                <span className="text-slate-800 font-mono">{stats.male} ({stats.malePercent}%)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] inline-block"></span>
                <span className="text-slate-500">মহিলা:</span>
                <span className="text-slate-800 font-mono">{stats.female} ({stats.femalePercent}%)</span>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Age Demographics Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Layers size={18} />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider leading-none">
                Age Segment Demographics (বয়স ভিত্তিক ভোটার বণ্টন)
              </h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Distribution of voters across primary age divisions
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 uppercase">
            Demographics
          </span>
        </div>

        {stats.total === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            কোনো তথ্য নেই (No data available)
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.ageGroupData.map((group) => {
              const percentage = stats.total > 0 ? ((group.count / stats.total) * 100).toFixed(1) : '0';
              return (
                <div 
                  key={group.name} 
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-800">{group.name}</span>
                    <span className="text-[10px] font-bold font-mono text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                      {group.range}
                    </span>
                  </div>

                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-black text-slate-800 font-mono">{group.count}</span>
                    <span className="text-xs font-black text-slate-500 font-mono">({percentage}%)</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300" 
                      style={{ 
                        backgroundColor: group.color,
                        width: `${percentage}%` 
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UnionVillageStats breakdown widget natively shown on Dashboard */}
      <UnionVillageStats voters={voters} unions={unions} />

      {/* Modals for voter details / slips / photos inside dashboard search */}
      <VoterSlipModal
        voter={selectedSlipVoter}
        isOpen={isSlipModalOpen}
        settings={settings}
        onClose={() => {
          setIsSlipModalOpen(false);
          setSelectedSlipVoter(null);
        }}
      />

      <PhotoViewerModal
        isOpen={activePhotoVoter !== null}
        onClose={() => setActivePhotoVoter(null)}
        photoUrl={activePhotoVoter?.photo || ''}
        voterName={activePhotoVoter?.name || ''}
      />

    </div>
  );
}
