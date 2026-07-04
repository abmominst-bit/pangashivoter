import React, { useState, useMemo, useEffect } from 'react';
import { Voter, UnionData, SystemSettings } from '../types';
import { 
  Plus, Edit, Trash2, Search, Filter, Info, User, Check, X, Camera, ArrowUp,
  Users, Map, BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle, ChevronDown, ChevronUp,
  Printer
} from 'lucide-react';
import VoterSlipModal from './VoterSlipModal';
import PhotoViewerModal from './PhotoViewerModal';
import UnionVillageStats from './UnionVillageStats';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';

interface AdminHomeProps {
  voters: Voter[];
  unions: UnionData[];
  settings: SystemSettings;
  onAddVoter: (voter: Voter) => void;
  onEditVoter: (voter: Voter) => void;
  onDeleteVoter: (id: string) => void;
  onDeleteMultipleVoters?: (ids: string[]) => void;
}

export default function AdminHome({ voters, unions, settings, onAddVoter, onEditVoter, onDeleteVoter, onDeleteMultipleVoters }: AdminHomeProps) {
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

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Voter Slip Modal state
  const [selectedSlipVoter, setSelectedSlipVoter] = useState<Voter | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  // Photo Viewer Modal state
  const [activePhotoVoter, setActivePhotoVoter] = useState<Voter | null>(null);

  // Filter States
  const [selectedUnion, setSelectedUnion] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  // Pagination limit state (100 items at a time)
  const [visibleCount, setVisibleCount] = useState(100);

  // Collapsible toggle for summary charts
  const [showSummary, setShowSummary] = useState(true);

  // Computed dashboard analytics
  const totalVoters = voters.length;
  const maleCount = useMemo(() => voters.filter(v => v.gender === 'Male').length, [voters]);
  const femaleCount = useMemo(() => voters.filter(v => v.gender === 'Female').length, [voters]);
  const totalUnionsCount = unions.length;

  // Union distribution chart data
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
    });
  }, [voters, unions]);

  // Gender split data for Pie Chart
  const genderChartData = useMemo(() => {
    return [
      { name: 'Male (পুরুষ)', value: maleCount, color: '#1a5f9c' },
      { name: 'Female (মহিলা)', value: femaleCount, color: '#ec4899' }
    ];
  }, [maleCount, femaleCount]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);

  // Form states
  const [sl, setSl] = useState('');
  const [name, setName] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [voterNo, setVoterNo] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [nid, setNid] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherNameBn, setFatherNameBn] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherNameBn, setMotherNameBn] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [unionForm, setUnionForm] = useState('');
  const [villageForm, setVillageForm] = useState('');
  const [photo, setPhoto] = useState('');
  const [error, setError] = useState('');

  // State for multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selection toggle for individual rows
  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle selection for all currently filtered voters
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredVoters.map(v => v.id);
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Select all currently filtered voters
  const selectAllFiltered = () => {
    const filteredIds = filteredVoters.map(v => v.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
  };

  // Delete all selected voters
  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const confirmDelete = window.confirm(`আপনি কি নিশ্চিত যে আপনি এই ${selectedIds.length} টি ভোটার তথ্য মুছে ফেলতে চান?\n(Are you sure you want to delete these ${selectedIds.length} selected voter records?)`);
    if (confirmDelete) {
      if (onDeleteMultipleVoters) {
        onDeleteMultipleVoters(selectedIds);
      } else {
        selectedIds.forEach(id => onDeleteVoter(id));
      }
      setSelectedIds([]);
    }
  };

  // Dynamically compute villages for filters
  const filterVillages = useMemo(() => {
    if (!selectedUnion) return [];
    const found = unions.find(u => u.name === selectedUnion);
    return found ? found.villages : [];
  }, [selectedUnion, unions]);

  // Dynamically compute villages for Form
  const formVillages = useMemo(() => {
    if (!unionForm) return [];
    const found = unions.find(u => u.name === unionForm);
    return found ? found.villages : [];
  }, [unionForm, unions]);

  // Filter & Search Logic
  const filteredVoters = useMemo(() => {
    return voters.filter(voter => {
      // Filter constraints
      const matchUnion = !selectedUnion || voter.union === selectedUnion;
      const matchVillage = !selectedVillage || voter.village === selectedVillage;
      const matchGender = !selectedGender || voter.gender === selectedGender;

      if (!matchUnion || !matchVillage || !matchGender) return false;

      // Search query constraint
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        voter.sl.toString().includes(q) ||
        voter.name.toLowerCase().includes(q) ||
        voter.nameBn.includes(q) ||
        voter.voterNo.includes(q) ||
        voter.nid.includes(q) ||
        voter.dob.includes(q) ||
        voter.fatherName.toLowerCase().includes(q) ||
        voter.fatherNameBn.includes(q) ||
        voter.motherName.toLowerCase().includes(q) ||
        voter.motherNameBn.includes(q) ||
        voter.union.toLowerCase().includes(q) ||
        voter.village.toLowerCase().includes(q)
      );
    });
  }, [voters, searchQuery, selectedUnion, selectedVillage, selectedGender]);

  // Reset pagination limit when filters or search change
  useEffect(() => {
    setVisibleCount(100);
  }, [searchQuery, selectedUnion, selectedVillage, selectedGender]);

  // Sliced list for display
  const displayedVoters = useMemo(() => {
    return filteredVoters.slice(0, visibleCount);
  }, [filteredVoters, visibleCount]);

  // Open modal for Adding new Voter
  const handleAddNewClick = () => {
    const nextSl = voters.length > 0 ? Math.max(...voters.map(v => v.sl)) + 1 : 1;
    setEditingVoter(null);
    setSl(nextSl.toString());
    setName('');
    setNameBn('');
    setVoterNo('');
    setDob('1990-01-01');
    setNid('');
    setFatherName('');
    setFatherNameBn('');
    setMotherName('');
    setMotherNameBn('');
    setGender('Male');
    
    // Choose default Union/Village
    const defaultUnion = unions.length > 0 ? unions[0].name : '';
    const defaultVillage = unions.length > 0 && unions[0].villages.length > 0 ? unions[0].villages[0].name : '';
    setUnionForm(defaultUnion);
    setVillageForm(defaultVillage);
    setPhoto('');
    setError('');
    setShowModal(true);
  };

  // Open modal for Editing existing Voter
  const handleEditClick = (voter: Voter) => {
    setEditingVoter(voter);
    setSl(voter.sl.toString());
    setName(voter.name);
    setNameBn(voter.nameBn);
    setVoterNo(voter.voterNo);
    setDob(voter.dob);
    setNid(voter.nid);
    setFatherName(voter.fatherName);
    setFatherNameBn(voter.fatherNameBn);
    setMotherName(voter.motherName);
    setMotherNameBn(voter.motherNameBn);
    setGender(voter.gender);
    setUnionForm(voter.union);
    setVillageForm(voter.village);
    setPhoto(voter.photo || '');
    setError('');
    setShowModal(true);
  };

  // Handle image upload converting to base64
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image file is too large (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save the voter
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!sl || !name || !nameBn || !voterNo || !dob || !nid || !fatherName || !motherName) {
      setError('Please fill in all the required fields (*).');
      return;
    }

    if (voterNo.length < 8 || isNaN(Number(voterNo))) {
      setError('Voter Number must be a numeric string of at least 8 digits.');
      return;
    }

    if (nid.length < 10 || isNaN(Number(nid))) {
      setError('NID Number must be a numeric string of 10 or 13 digits.');
      return;
    }

    // Check duplicate VoterNo or NID in other entries
    const duplicateVoterNo = voters.some(v => v.voterNo === voterNo && (!editingVoter || v.id !== editingVoter.id));
    if (duplicateVoterNo) {
      setError('A voter with this Voter Number already exists in the system.');
      return;
    }

    const duplicateNid = voters.some(v => v.nid === nid && (!editingVoter || v.id !== editingVoter.id));
    if (duplicateNid) {
      setError('A voter with this NID Number already exists in the system.');
      return;
    }

    const newVoter: Voter = {
      id: editingVoter ? editingVoter.id : 'voter_' + Date.now(),
      sl: Number(sl),
      name,
      nameBn,
      voterNo,
      dob,
      nid,
      fatherName,
      fatherNameBn,
      motherName,
      motherNameBn,
      gender,
      union: unionForm,
      village: villageForm,
      photo
    };

    if (editingVoter) {
      onEditVoter(newVoter);
    } else {
      onAddVoter(newVoter);
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Sub-header Badge - Matches Screenshot 2 */}
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="inline-flex border-2 border-red-600 bg-white rounded-full px-12 py-2 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-red-600 tracking-wide select-none">
            ভোটার তালিকা
          </h2>
        </div>
      </div>

      {/* Visual Analytics Summary Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-100 rounded-xl text-red-600">
              <BarChart3 size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                Dashboard Summary
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                ভোটার সংখ্যা ও ইউনিয়ন ভিত্তিক পরিসংখ্যান (Voter Analytics & Distributions)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 transition shadow-3xs cursor-pointer"
          >
            {showSummary ? (
              <>
                <span>Hide Summary</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>Show Summary</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>

        {showSummary && (
          <div className="space-y-6">
            {/* 1. Stats Counter Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Voters */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center space-x-3.5 shadow-3xs hover:shadow-xs transition duration-150">
                <div className="p-3 bg-blue-50 rounded-xl text-[#1a5f9c]">
                  <Users size={22} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Voters</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight font-mono">{totalVoters}</span>
                  <span className="block text-[9px] text-slate-500 font-medium">নিবন্ধিত ভোটার</span>
                </div>
              </div>

              {/* Card 2: Male Voters */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center space-x-3.5 shadow-3xs hover:shadow-xs transition duration-150">
                <div className="p-3 bg-indigo-50 rounded-xl text-[#1a5f9c]">
                  <User size={22} className="stroke-[2.5px]" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Male Voters</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight font-mono">{maleCount}</span>
                  <span className="block text-[9px] text-indigo-500 font-semibold">
                    {totalVoters > 0 ? Math.round((maleCount / totalVoters) * 100) : 0}% পুরুষ ভোটার
                  </span>
                </div>
              </div>

              {/* Card 3: Female Voters */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center space-x-3.5 shadow-3xs hover:shadow-xs transition duration-150">
                <div className="p-3 bg-pink-50 rounded-xl text-pink-600">
                  <User size={22} className="stroke-[2.5px]" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Female Voters</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight font-mono">{femaleCount}</span>
                  <span className="block text-[9px] text-pink-500 font-semibold">
                    {totalVoters > 0 ? Math.round((femaleCount / totalVoters) * 100) : 0}% মহিলা ভোটার
                  </span>
                </div>
              </div>

              {/* Card 4: Total Unions */}
              <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex items-center space-x-3.5 shadow-3xs hover:shadow-xs transition duration-150">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                  <Map size={22} />
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Unions</span>
                  <span className="text-xl font-black text-slate-800 tracking-tight font-mono">{totalUnionsCount}</span>
                  <span className="block text-[9px] text-slate-500 font-medium">সিস্টেমের মোট ইউনিয়ন</span>
                </div>
              </div>
            </div>

            {/* 2. Graphical Charts Container */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Union Distribution Bar Chart Card */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <BarChart3 size={15} className="text-red-500" />
                      <span>Union-wise Voter Distribution</span>
                    </h4>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      ইউনিয়ন ভিত্তিক বণ্টন
                    </span>
                  </div>

                  {totalVoters === 0 ? (
                    <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 text-xs">
                      <AlertTriangle size={32} className="text-slate-300 mb-2" />
                      <p className="font-bold">No voter data available to display charts</p>
                      <p className="text-[10px] mt-0.5">Add or upload voter records first</p>
                    </div>
                  ) : (
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

              {/* Gender Ratio Donut Chart Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <PieIcon size={15} className="text-red-500" />
                      <span>Gender Ratio Overview</span>
                    </h4>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      লিঙ্গ অনুপাত
                    </span>
                  </div>

                  {totalVoters === 0 ? (
                    <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 text-xs">
                      <AlertTriangle size={32} className="text-slate-300 mb-2" />
                      <p className="font-bold">No data available</p>
                    </div>
                  ) : (
                    <div className="relative h-[220px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={genderChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
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
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total</span>
                        <span className="text-xl font-black text-slate-800 tracking-tight font-mono">{totalVoters}</span>
                      </div>
                    </div>
                  )}
                </div>

                {totalVoters > 0 && (
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-around text-[11px] font-bold">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1a5f9c] inline-block"></span>
                      <span className="text-slate-500">পুরুষ:</span>
                      <span className="text-slate-800 font-mono">{maleCount}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ec4899] inline-block"></span>
                      <span className="text-slate-500">মহিলা:</span>
                      <span className="text-slate-800 font-mono">{femaleCount}</span>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Union & Village wise Voter Count Breakdown */}
            <UnionVillageStats voters={voters} unions={unions} className="mt-6 border-slate-200" />

          </div>
        )}
      </div>

      {/* Main Filter / Add Row - Matches Screenshots */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Select Union Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedUnion}
              onChange={(e) => {
                setSelectedUnion(e.target.value);
                setSelectedVillage(''); // Reset village
              }}
              className="w-full appearance-none bg-white border-2 border-red-600 rounded-full px-5 py-2.5 pr-10 text-xs font-bold text-gray-800 cursor-pointer hover:bg-red-50/40 transition-all focus:outline-none focus:ring-2 focus:ring-red-400 select-none text-center"
            >
              <option value="">Select Union</option>
              {unions.map(u => (
                <option key={u.name} value={u.name}>
                  {u.name} ({u.nameBn})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-red-600">
              <Filter size={12} />
            </div>
          </div>

          {/* Select Village Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedVillage}
              onChange={(e) => setSelectedVillage(e.target.value)}
              disabled={!selectedUnion}
              className="w-full appearance-none bg-white border-2 border-red-600 disabled:border-slate-300 disabled:text-slate-400 rounded-full px-5 py-2.5 pr-10 text-xs font-bold text-gray-800 cursor-pointer hover:bg-red-50/40 disabled:hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-red-400 select-none text-center text-ellipsis overflow-hidden"
            >
              <option value="">Select Village</option>
              {filterVillages.map(v => (
                <option key={v.name} value={v.name}>
                  {v.nameBn} ({v.name})
                </option>
              ))}
            </select>
            <div className={`absolute inset-y-0 right-4 flex items-center pointer-events-none ${selectedUnion ? 'text-red-600' : 'text-slate-400'}`}>
              <Filter size={12} />
            </div>
          </div>

          {/* Select Gender Dropdown */}
          <div className="relative min-w-[150px]">
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full appearance-none bg-white border-2 border-red-600 rounded-full px-5 py-2.5 pr-10 text-xs font-bold text-gray-800 cursor-pointer hover:bg-red-50/40 transition-all focus:outline-none focus:ring-2 focus:ring-red-400 select-none text-center"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-red-600">
              <Filter size={12} />
            </div>
          </div>

          {/* Reset Filters button */}
          {(selectedUnion || selectedVillage || selectedGender) && (
            <button
              onClick={() => {
                setSelectedUnion('');
                setSelectedVillage('');
                setSelectedGender('');
              }}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Clear Filters
            </button>
          )}

        </div>

        {/* Right: Add New Button with Red Border */}
        <div className="shrink-0">
          <button
            onClick={handleAddNewClick}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-1.5 px-6 py-2.5 border-2 border-red-600 hover:bg-red-50 text-red-600 font-extrabold rounded-xl text-sm transition-all duration-150 active:scale-95 shadow-sm"
          >
            <Plus size={16} />
            <span>Add New</span>
          </button>
        </div>

      </div>

      {/* Real-time Search Box inside Home Panel */}
      <div className="relative max-w-xl">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} className="text-red-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter table rows in real-time by NID, SL, name..."
          className="w-full pl-11 pr-4 py-2.5 rounded-full border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm bg-white shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Bulk Actions Panel */}
      <div className="bg-slate-50 border border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            নির্বাচিত হয়েছে (Selected): <span className="text-red-600 font-extrabold text-sm">{selectedIds.length}</span> জন
          </span>
          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 transition cursor-pointer"
              title="নির্বাচন বাতিল করুন (Clear selection)"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={selectAllFiltered}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 transition-all cursor-pointer shadow-3xs"
          >
            সব সিলেক্ট করুন (Select All)
          </button>
          {selectedIds.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold rounded-xl border border-red-700 transition-all cursor-pointer shadow-md inline-flex items-center justify-center space-x-1"
            >
              <Trash2 size={14} />
              <span>নির্বাচিত ডাটা মুছুন (Delete Selected)</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Voter list Table */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1a5f9c] text-white">
                <th className="py-2 px-2 text-center text-xs font-bold border-r border-slate-400/50 w-12 select-none">
                  <input
                    type="checkbox"
                    checked={filteredVoters.length > 0 && filteredVoters.every(v => selectedIds.includes(v.id))}
                    onChange={handleSelectAllFiltered}
                    className="rounded text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                  />
                </th>
                <th className="py-2 px-2 text-center text-xs font-bold border-r border-slate-400/50 w-12 select-none">SL</th>
                <th className="py-2 px-2 text-center text-xs font-bold border-r border-slate-400/50 w-20 select-none">Photo</th>
                <th className="py-2 px-3 text-left text-xs font-bold border-r border-slate-400/50 select-none">Name</th>
                <th className="py-2 px-3 text-center text-xs font-bold border-r border-slate-400/50 w-28 select-none">Voter Number</th>
                <th className="py-2 px-3 text-center text-xs font-bold border-r border-slate-400/50 w-28 select-none">Date Of Birth</th>
                <th className="py-2 px-3 text-center text-xs font-bold border-r border-slate-400/50 w-36 select-none">NID Number</th>
                <th className="py-2 px-3 text-left text-xs font-bold border-r border-slate-400/50 select-none">Father Name</th>
                <th className="py-2 px-3 text-left text-xs font-bold border-r border-slate-400/50 select-none">Mother Name</th>
                <th className="py-2 px-3 text-center text-xs font-bold select-none w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedVoters.length > 0 ? (
                displayedVoters.map((voter) => (
                  <tr key={voter.id} className="border-b border-slate-300 hover:bg-slate-50/70 transition duration-150">
                    
                    {/* Select Checkbox */}
                    <td className="py-1.5 px-2 text-center border-r border-slate-300">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(voter.id)}
                        onChange={() => handleSelectToggle(voter.id)}
                        className="rounded text-red-600 focus:ring-red-500 cursor-pointer h-4 w-4"
                      />
                    </td>

                    {/* SL */}
                    <td className="py-1.5 px-2 text-center font-bold text-slate-700 text-xs border-r border-slate-300">{voter.sl}</td>
                    
                    {/* Photo */}
                    <td className="py-1.5 px-2 border-r border-slate-300">
                      <div className="flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setActivePhotoVoter(voter)}
                          className="relative group focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-full shrink-0 cursor-pointer"
                          title="Click to view and download photo / বড় করে দেখতে ও ডাউনলোড করতে ক্লিক করুন"
                        >
                          {voter.photo ? (
                            <div className="relative overflow-hidden rounded-full w-16 h-16">
                              <img
                                src={voter.photo}
                                alt={voter.name}
                                referrerPolicy="no-referrer"
                                className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-sm transition duration-200 group-hover:scale-115 group-hover:brightness-95"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-full">
                                <span className="text-[9px] text-white font-extrabold select-none">VIEW</span>
                              </div>
                            </div>
                          ) : (
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 border-slate-200 text-[10px] font-bold shadow-inner transition duration-200 group-hover:scale-105 ${
                              voter.gender === 'Male' ? 'bg-sky-50 text-sky-600' : 'bg-pink-50 text-pink-600'
                            }`}>
                              <User size={20} />
                            </div>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Name */}
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <div className="font-bold text-slate-900 leading-tight text-xs">{voter.name}</div>
                      <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{voter.nameBn}</div>
                      
                      {/* Union + Village + Gender Tags */}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold border border-slate-200">
                          {voter.union}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold border border-slate-200 text-ellipsis overflow-hidden max-w-[100px] whitespace-nowrap">
                          {voter.village}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                          voter.gender === 'Male' 
                            ? 'bg-blue-50 text-blue-600 border-blue-100' 
                            : 'bg-pink-50 text-pink-600 border-pink-100'
                        }`}>
                          {voter.gender}
                        </span>
                      </div>
                    </td>

                    {/* Voter Number */}
                    <td className="py-1.5 px-2 text-center font-mono text-xs text-slate-800 font-bold border-r border-slate-300">
                      {voter.voterNo}
                    </td>

                    {/* Date of Birth */}
                    <td className="py-1.5 px-2 text-center text-xs text-slate-700 border-r border-slate-300 font-semibold">
                      <div>{formatDate(voter.dob)}</div>
                      {(() => {
                        const ageInfo = calculateAge(voter.dob);
                        return ageInfo ? (
                          <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded inline-block mt-1">
                            {ageInfo.textBn}
                          </div>
                        ) : null;
                      })()}
                    </td>

                    {/* NID Number */}
                    <td className="py-1.5 px-2 text-center font-mono text-xs text-slate-800 font-bold border-r border-slate-300">
                      {voter.nid}
                    </td>

                    {/* Father Name */}
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <div className="font-semibold text-slate-800 text-xs">{voter.fatherName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{voter.fatherNameBn}</div>
                    </td>

                    {/* Mother Name */}
                    <td className="py-1.5 px-3 border-r border-slate-300">
                      <div className="font-semibold text-slate-800 text-xs">{voter.motherName}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{voter.motherNameBn}</div>
                    </td>

                    {/* Edit, Delete & Print Actions */}
                    <td className="py-1.5 px-2 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSlipVoter(voter);
                            setIsSlipModalOpen(true);
                          }}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 rounded transition border border-emerald-100 cursor-pointer"
                          title="Print Voter Slip"
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(voter)}
                          className="p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded transition border border-blue-100 cursor-pointer"
                          title="Edit Voter details"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteVoter(voter.id);
                          }}
                          className="p-1 text-red-600 hover:bg-rose-50 hover:text-red-700 rounded transition border border-rose-100 cursor-pointer"
                          title="Delete Voter"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 bg-slate-50/50">
                    <Info className="mx-auto mb-2 text-slate-300" size={36} />
                    <p className="font-bold text-slate-600 text-sm">No voter records matched your current query.</p>
                    <p className="text-xs text-slate-400 mt-1">Try relaxing filters or changing your search terms.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Show More Button inside Admin Table Panel */}
        {filteredVoters.length > visibleCount && (
          <div className="bg-slate-50 p-4 border-t border-slate-300 flex flex-col items-center justify-center space-y-1.5">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => prev + 100)}
              className="px-6 py-2.5 bg-[#1a5f9c] hover:bg-[#124b7e] text-white rounded-xl font-bold text-xs transition shadow-md flex items-center space-x-1.5 cursor-pointer select-none"
            >
              <span>আরও দেখুন / Show More</span>
            </button>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
              Showing {visibleCount} of {filteredVoters.length} rows ({filteredVoters.length - visibleCount} remaining)
            </span>
          </div>
        )}
      </div>

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

      {/* =============================================================== */}
      {/* MODAL: ADD / EDIT VOTER                                          */}
      {/* =============================================================== */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-2xl w-full my-8 overflow-hidden animate-zoomIn flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#1a5f9c] to-[#0f5298] p-5 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-1.5 bg-white/10 rounded-lg">
                  <User size={20} className="text-sky-200" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide">
                    {editingVoter ? 'Edit Registered Voter' : 'Add New Union Voter'}
                  </h3>
                  <p className="text-[11px] text-sky-100/90 font-medium">Please match values with official National Identity Card documents</p>
                </div>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-full"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Error Callout */}
              {error && (
                <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200 text-xs font-bold text-center">
                  {error}
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="relative">
                  {photo ? (
                    <img
                      src={photo}
                      alt="Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-red-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center border-2 border-slate-300 text-slate-400">
                      <Camera size={24} />
                    </div>
                  )}
                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto('')}
                      className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Voter Profile Photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">PNG, JPG format up to 2MB. Optional placeholder used if none chosen.</p>
                </div>
              </div>

              {/* SL, Voter Number & NID Number Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Serial No (SL) *
                  </label>
                  <input
                    type="number"
                    required
                    value={sl}
                    onChange={(e) => setSl(e.target.value)}
                    placeholder="e.g. 16"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Voter Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={12}
                    value={voterNo}
                    onChange={(e) => setVoterNo(e.target.value.replace(/\D/g, ''))}
                    placeholder="digits only"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono font-bold text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    NID Number *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={nid}
                    onChange={(e) => setNid(e.target.value.replace(/\D/g, ''))}
                    placeholder="digits only"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono font-bold text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Names (English & Bengali) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Voter Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abul Kalam Azad"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    ভোটের নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameBn}
                    onChange={(e) => setNameBn(e.target.value)}
                    placeholder="উদাঃ আবুল কালাম আজাদ"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Gender *
                  </label>
                  <div className="flex space-x-3 mt-1">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`flex-1 py-2 rounded-xl border font-bold text-sm transition-all ${
                        gender === 'Male'
                          ? 'bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`flex-1 py-2 rounded-xl border font-bold text-sm transition-all ${
                        gender === 'Female'
                          ? 'bg-pink-50 text-pink-600 border-pink-300 ring-2 ring-pink-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>
              </div>

              {/* Father Name (English & Bengali) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Father's Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Father's name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    পিতার নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={fatherNameBn}
                    onChange={(e) => setFatherNameBn(e.target.value)}
                    placeholder="পিতার নাম বাংলায়"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Mother Name (English & Bengali) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Mother's Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Mother's name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    মাতার নাম (বাংলা) *
                  </label>
                  <input
                    type="text"
                    required
                    value={motherNameBn}
                    onChange={(e) => setMotherNameBn(e.target.value)}
                    placeholder="মাতার নাম বাংলায়"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Union & Village Select */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Union Assignment *
                  </label>
                  <select
                    value={unionForm}
                    onChange={(e) => {
                      const selectedUnionName = e.target.value;
                      setUnionForm(selectedUnionName);
                      // Auto pick first village of new union
                      const found = unions.find(u => u.name === selectedUnionName);
                      if (found && found.villages.length > 0) {
                        setVillageForm(found.villages[0].name);
                      } else {
                        setVillageForm('');
                      }
                    }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm bg-white"
                  >
                    <option value="">Select Union</option>
                    {unions.map(u => (
                      <option key={u.name} value={u.name}>
                        {u.name} ({u.nameBn})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                    Village Assignment *
                  </label>
                  <select
                    value={villageForm}
                    onChange={(e) => setVillageForm(e.target.value)}
                    disabled={!unionForm}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold text-slate-800 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">Select Village</option>
                    {formVillages.map(v => (
                      <option key={v.name} value={v.name}>
                        {v.nameBn} ({v.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-500 hover:to-blue-600 text-white font-extrabold rounded-xl text-sm shadow-md transition-all duration-150 active:scale-95"
                >
                  Save Voter Record
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
