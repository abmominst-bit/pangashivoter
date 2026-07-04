import React, { useState, useMemo } from 'react';
import { Voter, UnionData } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  MapPin, 
  Users, 
  Search, 
  BarChart2, 
  Info
} from 'lucide-react';

interface UnionVillageStatsProps {
  voters: Voter[];
  unions: UnionData[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function UnionVillageStats({
  voters,
  unions,
  title = "ইউনিয়ন ও গ্রাম ভিত্তিক ভোটার সংখ্যা",
  subtitle = "Union & Village Wise Voter Count Breakdown",
  className = ""
}: UnionVillageStatsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnions, setExpandedUnions] = useState<Record<string, boolean>>({});

  const toggleUnion = (unionName: string) => {
    setExpandedUnions(prev => ({
      ...prev,
      [unionName]: !prev[unionName]
    }));
  };

  // Precompute stats to avoid repeated scanning
  const statsData = useMemo(() => {
    return unions.map(u => {
      const unionVoters = voters.filter(v => v.union === u.name);
      const unionTotal = unionVoters.length;
      const unionMale = unionVoters.filter(v => v.gender === 'Male').length;
      const unionFemale = unionVoters.filter(v => v.gender === 'Female').length;

      const villagesStats = u.villages.map(vil => {
        const villageVoters = unionVoters.filter(v => v.village === vil.name);
        const vilTotal = villageVoters.length;
        const vilMale = villageVoters.filter(v => v.gender === 'Male').length;
        const vilFemale = villageVoters.filter(v => v.gender === 'Female').length;

        return {
          name: vil.name,
          nameBn: vil.nameBn,
          total: vilTotal,
          male: vilMale,
          female: vilFemale
        };
      }).sort((a, b) => b.total - a.total); // Sort villages by highest voter count

      return {
        name: u.name,
        nameBn: u.nameBn,
        total: unionTotal,
        male: unionMale,
        female: unionFemale,
        villages: villagesStats
      };
    }).sort((a, b) => b.total - a.total); // Sort unions by highest voter count
  }, [voters, unions]);

  // Filter based on search query (Union name or Village name)
  const filteredStats = useMemo(() => {
    if (!searchQuery.trim()) return statsData;
    const q = searchQuery.toLowerCase();

    return statsData.map(u => {
      const matchesUnion = u.name.toLowerCase().includes(q) || u.nameBn.toLowerCase().includes(q);
      
      const filteredVillages = u.villages.filter(vil => 
        vil.name.toLowerCase().includes(q) || vil.nameBn.toLowerCase().includes(q)
      );

      // If union matches, include all villages, otherwise only matching villages
      const finalVillages = matchesUnion ? u.villages : filteredVillages;

      if (matchesUnion || filteredVillages.length > 0) {
        return {
          ...u,
          villages: finalVillages,
          isMatch: true,
          matchedByVillageOnly: !matchesUnion && filteredVillages.length > 0
        };
      }
      return null;
    }).filter(Boolean) as any[];
  }, [statsData, searchQuery]);

  // Auto-expand unions that have matching villages when searching
  React.useEffect(() => {
    if (searchQuery.trim()) {
      const newExpanded: Record<string, boolean> = {};
      filteredStats.forEach(u => {
        newExpanded[u.name] = true;
      });
      setExpandedUnions(newExpanded);
    }
  }, [searchQuery, filteredStats]);

  return (
    <div className={`bg-white border border-slate-200 rounded-3xl p-6 shadow-xs ${className}`}>
      {/* Header section with badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-50 text-[#1a5f9c] rounded-2xl shrink-0">
            <BarChart2 size={22} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide leading-tight">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400 font-extrabold uppercase tracking-widest mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Search for Stats */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ইউনিয়ন বা গ্রামের নাম লিখুন... (Search Union/Gram)"
            className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl pl-9 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-xs font-semibold shadow-3xs"
          />
          <Search size={13} className="absolute left-3 top-3 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main distribution list */}
      <div className="space-y-4">
        {filteredStats.length > 0 ? (
          filteredStats.map((u) => {
            const isExpanded = !!expandedUnions[u.name];
            return (
              <div 
                key={u.name}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  isExpanded ? 'border-blue-200 bg-blue-50/5/30 shadow-xs' : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                {/* Union Header Clickable bar */}
                <button
                  type="button"
                  onClick={() => toggleUnion(u.name)}
                  className="w-full flex items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 transition text-left cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 border border-blue-200/50 flex items-center justify-center text-[#1a5f9c] shrink-0 font-bold text-xs">
                      UP
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                        <span>{u.nameBn}</span>
                        <span className="text-xs text-slate-400 font-medium font-mono">({u.name})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                        <MapPin size={10} className="text-slate-400" />
                        <span>{u.villages.length} Villages (গ্রামসমূহ)</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Counter pill with Chevron */}
                  <div className="flex items-center space-x-4">
                    <div className="hidden sm:flex items-center space-x-3 text-right">
                      <div className="text-[11px] font-bold">
                        <span className="text-slate-400 block uppercase tracking-wider text-[8px]">Male/Female</span>
                        <span className="text-slate-700 font-mono">
                          M: <span className="text-sky-600">{u.male}</span> | F: <span className="text-pink-500">{u.female}</span>
                        </span>
                      </div>
                    </div>

                    <div className="px-3.5 py-1.5 bg-[#1a5f9c] text-white rounded-xl font-black text-xs font-mono flex items-center gap-1 shadow-sm shrink-0">
                      <Users size={12} />
                      <span>{u.total}</span>
                    </div>

                    <div className="text-slate-400 bg-white border border-slate-200 rounded-lg p-1">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                </button>

                {/* Expanded Villages Breakdown list */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4 bg-white space-y-3">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">
                      Village-wise Breakdown (গ্রাম ভিত্তিক বিস্তারিত ভোটার তালিকা)
                    </div>

                    {u.villages.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {u.villages.map((vil: any) => {
                          const percent = u.total > 0 ? Math.round((vil.total / u.total) * 100) : 0;
                          return (
                            <div 
                              key={vil.name} 
                              className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 hover:border-slate-200 transition duration-150 flex flex-col justify-between"
                            >
                              <div className="flex justify-between items-start mb-2.5">
                                <div className="truncate pr-2">
                                  <div className="font-extrabold text-slate-800 text-xs truncate">
                                    {vil.nameBn}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-semibold truncate font-mono">
                                    {vil.name}
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 bg-blue-50 text-[#1a5f9c] rounded-full text-[10px] font-black font-mono shrink-0">
                                  {percent}%
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {/* Total Voter Row */}
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-white/60 px-2 py-1 rounded border border-slate-100">
                                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Total:</span>
                                  <span className="font-mono font-black text-slate-800">{vil.total}</span>
                                </div>

                                {/* Gender details */}
                                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                                  <div className="bg-sky-50/50 border border-sky-100/80 rounded px-2 py-0.5 text-center">
                                    <span className="text-slate-400 block text-[8px] uppercase font-bold tracking-wider">Male (পুরুষ)</span>
                                    <span className="text-sky-600 font-mono font-black">{vil.male}</span>
                                  </div>
                                  <div className="bg-pink-50/50 border border-pink-100/80 rounded px-2 py-0.5 text-center">
                                    <span className="text-slate-400 block text-[8px] uppercase font-bold tracking-wider">Female (মহিলা)</span>
                                    <span className="text-pink-600 font-mono font-black">{vil.female}</span>
                                  </div>
                                </div>

                                {/* Simple progress bar relative to Union */}
                                <div className="w-full bg-slate-200 rounded-full h-1 mt-1 overflow-hidden">
                                  <div 
                                    className="bg-[#1a5f9c] h-1 rounded-full" 
                                    style={{ width: `${percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs font-semibold text-slate-400">
                        এই ইউনিয়নে কোনো গ্রাম পাওয়া যায়নি (No villages found)
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-slate-400 font-semibold text-xs border border-dashed border-slate-200 rounded-2xl">
            <Info size={24} className="mx-auto text-slate-300 mb-1" />
            কোনো ইউনিয়ন বা গ্রাম পাওয়া যায়নি (No Unions or Villages match search)
          </div>
        )}
      </div>
    </div>
  );
}
