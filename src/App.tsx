import React, { useState, useEffect, useMemo } from 'react';
import { getVoters, getUnions, getSystemSettings } from './voterData';
import { Voter, UnionData, VisitorTab, AdminTab, SystemSettings } from './types';
import { 
  Home as HomeIcon, 
  Settings as SettingsIcon, 
  Users, 
  Upload, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  ShieldAlert, 
  FileJson, 
  Image as ImageIcon, 
  Key, 
  LogOut, 
  User, 
  Search, 
  Filter, 
  Info, 
  Lock, 
  Globe, 
  CheckCircle, 
  AlertTriangle,
  Plus,
  Camera
} from 'lucide-react';

// Import our modular custom components
import VisitorPage from './components/VisitorPage';
import AdminLogin from './components/AdminLogin';
import AdminHome from './components/AdminHome';
import AdminUnionAdd from './components/AdminUnionAdd';
import AdminUploadJson from './components/AdminUploadJson';
import AdminUploadImg from './components/AdminUploadImg';
import AdminSettings from './components/AdminSettings';

export default function App() {
  // Core Voter and Union States loaded from localStorage
  const [voters, setVoters] = useState<Voter[]>([]);
  const [unions, setUnions] = useState<UnionData[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    maintenanceMode: false
  });

  // Session flags
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Shareable Voter Add/Edit modal state
  const [showVoterModal, setShowVoterModal] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [slForm, setSlForm] = useState('');
  const [nameForm, setNameForm] = useState('');
  const [nameBnForm, setNameBnForm] = useState('');
  const [voterNoForm, setVoterNoForm] = useState('');
  const [dobForm, setDobForm] = useState('1990-01-01');
  const [nidForm, setNidForm] = useState('');
  const [fatherNameForm, setFatherNameForm] = useState('');
  const [fatherNameBnForm, setFatherNameBnForm] = useState('');
  const [motherNameForm, setMotherNameForm] = useState('');
  const [motherNameBnForm, setMotherNameBnForm] = useState('');
  const [genderForm, setGenderForm] = useState<'Male' | 'Female'>('Male');
  const [unionForm, setUnionForm] = useState('');
  const [villageForm, setVillageForm] = useState('');
  const [photoForm, setPhotoForm] = useState('');
  const [modalError, setModalError] = useState('');

  // Form villages calculation
  const formVillages = useMemo(() => {
    if (!unionForm) return [];
    const found = unions.find(u => u.name === unionForm);
    return found ? found.villages : [];
  }, [unionForm, unions]);

  // Open modal for Adding new Voter
  const handleAddNewVoterClick = () => {
    const nextSl = voters.length > 0 ? Math.max(...voters.map(v => v.sl)) + 1 : 1;
    setEditingVoter(null);
    setSlForm(nextSl.toString());
    setNameForm('');
    setNameBnForm('');
    setVoterNoForm('');
    setDobForm('1990-01-01');
    setNidForm('');
    setFatherNameForm('');
    setFatherNameBnForm('');
    setMotherNameForm('');
    setMotherNameBnForm('');
    setGenderForm('Male');
    
    // Default Union/Village
    const defaultUnion = unions.length > 0 ? unions[0].name : '';
    const defaultVillage = unions.length > 0 && unions[0].villages.length > 0 ? unions[0].villages[0].name : '';
    setUnionForm(defaultUnion);
    setVillageForm(defaultVillage);
    setPhotoForm('');
    setModalError('');
    setShowVoterModal(true);
  };

  // Open modal for Editing existing Voter
  const handleEditVoterClick = (voter: Voter) => {
    setEditingVoter(voter);
    setSlForm(voter.sl.toString());
    setNameForm(voter.name);
    setNameBnForm(voter.nameBn);
    setVoterNoForm(voter.voterNo);
    setDobForm(voter.dob);
    setNidForm(voter.nid);
    setFatherNameForm(voter.fatherName);
    setFatherNameBnForm(voter.fatherNameBn);
    setMotherNameForm(voter.motherName);
    setMotherNameBnForm(voter.motherNameBn);
    setGenderForm(voter.gender);
    setUnionForm(voter.union);
    setVillageForm(voter.village);
    setPhotoForm(voter.photo || '');
    setModalError('');
    setShowVoterModal(true);
  };

  // Image Upload handler for Modal
  const handleModalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setModalError('Image file is too large (max 2MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoForm(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save the voter from modal
  const handleSaveVoterFromModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!slForm || !nameForm || !nameBnForm || !voterNoForm || !dobForm || !nidForm || !fatherNameForm || !motherNameForm) {
      setModalError('Please fill in all the required fields (*).');
      return;
    }

    if (voterNoForm.length < 8 || isNaN(Number(voterNoForm))) {
      setModalError('Voter Number must be a numeric string of at least 8 digits.');
      return;
    }

    if (nidForm.length < 10 || isNaN(Number(nidForm))) {
      setModalError('NID Number must be a numeric string of 10 or 13 digits.');
      return;
    }

    // Check duplicate VoterNo or NID in other entries
    const duplicateVoterNo = voters.some(v => v.voterNo === voterNoForm && (!editingVoter || v.id !== editingVoter.id));
    if (duplicateVoterNo) {
      setModalError('A voter with this Voter Number already exists.');
      return;
    }

    const duplicateNid = voters.some(v => v.nid === nidForm && (!editingVoter || v.id !== editingVoter.id));
    if (duplicateNid) {
      setModalError('A voter with this NID Number already exists.');
      return;
    }

    const savedVoter: Voter = {
      id: editingVoter ? editingVoter.id : 'voter_' + Date.now(),
      sl: Number(slForm),
      name: nameForm,
      nameBn: nameBnForm,
      voterNo: voterNoForm,
      dob: dobForm,
      nid: nidForm,
      fatherName: fatherNameForm,
      fatherNameBn: fatherNameBnForm,
      motherName: motherNameForm,
      motherNameBn: motherNameBnForm,
      gender: genderForm,
      union: unionForm,
      village: villageForm,
      photo: photoForm
    };

    if (editingVoter) {
      handleEditVoter(savedVoter);
    } else {
      handleAddVoter(savedVoter);
    }
    setShowVoterModal(false);
  };

  const handleDeleteVoterClick = (id: string) => {
    handleDeleteVoter(id);
  };
  
  // Current Navigation State
  const [activeView, setActiveView] = useState<'visitor' | 'admin' | 'adminLogin'>('visitor');
  const [adminActiveTab, setAdminActiveTab] = useState<AdminTab>('home');

  // Load initial data from in-memory fallback & backend database
  useEffect(() => {
    // Initial in-memory state setup
    setVoters(getVoters());
    setUnions(getUnions());
    setSettings(getSystemSettings());

    // Sync from Backend Database APIs
    fetch('/api/voters')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.voters) {
          setVoters(data.voters);
        }
      })
      .catch(err => console.error("Error loading voters from API:", err));

    fetch('/api/unions')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.unions) {
          setUnions(data.unions);
        }
      })
      .catch(err => console.error("Error loading unions from API:", err));

    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      })
      .catch(err => console.error("Error loading settings from API:", err));
  }, []);

  // Update unions state and persist to database
  const handleUpdateUnions = (newUnions: UnionData[]) => {
    setUnions(newUnions);

    fetch('/api/unions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUnions)
    }).catch(err => console.error("API Error updating unions:", err));
  };

  // Cascade union or village rename down to voter records
  const handleRenameUnionAndVillages = (oldUnionName: string, newUnionName: string, oldVillageName?: string, newVillageName?: string) => {
    if (oldUnionName && newUnionName && oldUnionName !== newUnionName && !oldVillageName) {
      // Renaming Union
      const updatedVoters = voters.map(v => {
        if (v.union === oldUnionName) {
          const updated = { ...v, union: newUnionName };
          fetch(`/api/voters/${v.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          }).catch(err => console.error("Error updating voter union:", err));
          return updated;
        }
        return v;
      });
      setVoters(updatedVoters);
    } else if (oldUnionName && oldVillageName && newVillageName && oldVillageName !== newVillageName) {
      // Renaming Village inside a Union
      const updatedVoters = voters.map(v => {
        if (v.union === oldUnionName && v.village === oldVillageName) {
          const updated = { ...v, village: newVillageName };
          fetch(`/api/voters/${v.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          }).catch(err => console.error("Error updating voter village:", err));
          return updated;
        }
        return v;
      });
      setVoters(updatedVoters);
    }
  };

  // Update settings and persist to database
  const handleUpdateSettings = (newSettings: SystemSettings) => {
    setSettings(newSettings);

    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings)
    }).catch(err => console.error("API Error updating settings:", err));
  };

  // Admin logout handler
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setActiveView('visitor');
  };

  // Switch to login view
  const handleGoToAdminLogin = () => {
    if (isAdminLoggedIn) {
      setActiveView('admin');
    } else {
      setActiveView('adminLogin');
    }
  };

  // Go back to visitor view
  const handleGoToVisitor = () => {
    setActiveView('visitor');
  };

  // Add a voter to database & local state
  const handleAddVoter = (newVoter: Voter) => {
    const updated = [newVoter, ...voters];
    setVoters(updated);

    fetch('/api/voters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVoter)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.voter) {
        setVoters(prev => prev.map(v => v.id === newVoter.id ? data.voter : v));
      }
    })
    .catch(err => console.error("API Error adding voter:", err));
  };

  // Edit a voter in database & local state
  const handleEditVoter = (updatedVoter: Voter) => {
    const updated = voters.map(v => v.id === updatedVoter.id ? updatedVoter : v);
    setVoters(updated);

    fetch(`/api/voters/${updatedVoter.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedVoter)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.voter) {
        setVoters(prev => prev.map(v => v.id === updatedVoter.id ? data.voter : v));
      }
    })
    .catch(err => console.error("API Error updating voter:", err));
  };

  // Delete a voter from database & local state
  const handleDeleteVoter = (id: string) => {
    const updated = voters.filter(v => v.id !== id);
    setVoters(updated);

    fetch(`/api/voters/${id}`, {
      method: 'DELETE'
    }).catch(err => console.error("API Error deleting voter:", err));
  };

  // Bulk delete multiple voters
  const handleDeleteMultipleVoters = (ids: string[]) => {
    const updated = voters.filter(v => !ids.includes(v.id));
    setVoters(updated);

    fetch('/api/voters/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    }).catch(err => console.error("API Error bulk deleting voters:", err));
  };

  // Integrate batch imported list to database & local state
  const handleImportVoters = (importedList: Voter[]) => {
    // Deduplicate on voterNo/NID against existing database records and also within the imported list itself
    const uniqueIncoming: Voter[] = [];
    const seenVoterNos = new Set(voters.map(v => v.voterNo));
    const seenNids = new Set(voters.map(v => v.nid));

    for (const imp of importedList) {
      if (!seenVoterNos.has(imp.voterNo) && !seenNids.has(imp.nid)) {
        uniqueIncoming.push(imp);
        seenVoterNos.add(imp.voterNo);
        seenNids.add(imp.nid);
      }
    }
    
    const updated = [...uniqueIncoming, ...voters];
    setVoters(updated);

    uniqueIncoming.forEach(v => {
      fetch('/api/voters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v)
      }).catch(err => console.error("API Error importing voter:", err));
    });
  };

  // Statistics for Dashboard
  const stats = useMemo(() => {
    const total = voters.length;
    const male = voters.filter(v => v.gender === 'Male').length;
    const female = voters.filter(v => v.gender === 'Female').length;
    return { total, male, female };
  }, [voters]);

  const [adminSidebarHovered, setAdminSidebarHovered] = useState(false);
  const [visitorSidebarHovered, setVisitorSidebarHovered] = useState(false);

  // Render responsive/collapsible logo
  const renderLogo = (isExpanded: boolean) => (
    <div className="flex items-center space-x-2 select-none shrink-0 overflow-hidden">
      <div className="relative w-8 h-8 bg-slate-950 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0">
        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping absolute opacity-70"></div>
        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full shadow-inner relative z-10"></div>
      </div>
      {isExpanded && (
        <div className="min-w-0 transition-opacity duration-200">
          <span className="font-sans font-black tracking-wider text-slate-900 text-xs uppercase block truncate">
            ELECT<span className="text-red-600">PORTAL</span>
          </span>
          <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest -mt-1 truncate">Digital Registry</span>
        </div>
      )}
    </div>
  );

  // Pure Vector circular logo representing Screenshot 2 & Screenshot 1
  const LogoElement = (
    <div className="flex items-center space-x-2 select-none shrink-0">
      <div className="relative w-8 h-8 bg-slate-950 rounded-full flex items-center justify-center border-2 border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0">
        <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping absolute opacity-70"></div>
        <div className="w-3.5 h-3.5 bg-gradient-to-tr from-emerald-600 to-teal-400 rounded-full shadow-inner relative z-10"></div>
      </div>
      <div className="min-w-0">
        <span className="font-sans font-black tracking-wider text-slate-900 text-xs sm:text-sm uppercase block truncate">
          ELECT<span className="text-red-600">PORTAL</span>
        </span>
        <span className="block text-[7px] font-black text-slate-400 uppercase tracking-widest -mt-1 truncate">Digital Registry</span>
      </div>
    </div>
  );

  // ===============================================================
  // CASE 1: SYSTEM MAINTENANCE MODE IS ACTIVE (Public viewers blocked)
  // ===============================================================
  if (settings.maintenanceMode && activeView === 'visitor') {
    // Read custom text and image from localStorage (won't affect database)
    const customTitle = localStorage.getItem('maintenance_title') || 'সিস্টেম রক্ষণাবেক্ষণ চলছে';
    const customDesc = localStorage.getItem('maintenance_desc') || 'প্রিয় নাগরিক, ডিজিটাল ভোটার ডিরেক্টরি পোর্টালটি বর্তমানে সিস্টেম রক্ষণাবেক্ষণ কাজের জন্য সাময়িকভাবে বন্ধ রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।\n\nThe public voter lookup registry is currently offline for database optimization and system-wide synchronization. We appreciate your patience.';
    const customImg = localStorage.getItem('maintenance_image');

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="bg-white rounded-3xl p-8 md:p-10 max-w-xl w-full text-center border border-slate-200 shadow-2xl relative overflow-hidden">
          
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-amber-500 to-yellow-400"></div>
          
          {customImg ? (
            <div className="mb-6 flex justify-center">
              <img 
                src={customImg} 
                alt="System Maintenance" 
                className="max-h-48 object-contain rounded-2xl border border-slate-100 shadow-xs"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-4 bg-amber-50 text-amber-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-amber-200 shadow-sm">
              <AlertTriangle size={42} className="animate-bounce" />
            </div>
          )}

          <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-relaxed">
            {customTitle}
          </h1>
          <h2 className="text-[11px] font-extrabold text-[#1a5f9c] mt-1.5 uppercase tracking-widest">
            Portal Under Scheduled Maintenance
          </h2>

          <div className="mt-5 p-5 bg-slate-50 border border-slate-100 rounded-2xl text-xs md:text-sm text-slate-600 leading-relaxed text-left space-y-3 font-medium whitespace-pre-line">
            {customDesc}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Secured Electoral Node v2.5
            </span>
            <button
              onClick={handleGoToAdminLogin}
              className="text-xs font-black text-[#1a5f9c] hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition flex items-center space-x-1"
            >
              <Key size={12} />
              <span>Login as Admin</span>
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ===============================================================
  // VIEW: ADMIN LOGIN PAGE
  // ===============================================================
  if (activeView === 'adminLogin') {
    return (
      <AdminLogin 
        onLoginSuccess={() => {
          setIsAdminLoggedIn(true);
          setActiveView('admin');
          setAdminActiveTab('home');
        }} 
        onGoToVisitor={handleGoToVisitor} 
        logoElement={LogoElement} 
      />
    );
  }

  // ===============================================================
  // VIEW: ADMIN CONTROL PANEL (Logged in Admin Dashboard)
  // ===============================================================
  if (activeView === 'admin' && isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col md:flex-row font-sans">
        
        {/* Left Side: Sidebar navigation - Hover-based show/hide to maximize table area */}
        <aside 
          onMouseEnter={() => setAdminSidebarHovered(true)}
          onMouseLeave={() => setAdminSidebarHovered(false)}
          className={`w-full bg-white border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 ease-in-out md:fixed md:top-0 md:bottom-0 md:left-0 md:z-30 h-full ${
            adminSidebarHovered ? 'md:w-52 shadow-xl' : 'md:w-14 shadow-xs'
          }`}
        >
          
          {/* Sidebar Brand header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            {renderLogo(adminSidebarHovered)}
          </div>

          {/* Navigation links */}
          <nav className="p-2 flex-1 space-y-1 mt-2">
            
            <button
              onClick={handleGoToVisitor}
              className={`w-full flex items-center rounded-xl text-xs font-black transition-all duration-150 cursor-pointer ${
                adminSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
              } text-slate-600 hover:bg-blue-50 hover:text-blue-800`}
              title="Visitor Page"
            >
              <Globe size={16} className="text-slate-400 shrink-0" />
              {adminSidebarHovered && <span className="truncate">Visitor Page (ভিজিটর পেজ)</span>}
            </button>

            <button
              onClick={() => setAdminActiveTab('home')}
              className={`w-full flex items-center rounded-xl text-xs font-extrabold transition-all duration-150 ${
                adminSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
              } ${
                adminActiveTab === 'home'
                  ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Home"
            >
              <HomeIcon size={16} className={`${adminActiveTab === 'home' ? 'text-red-600' : 'text-slate-400'} shrink-0`} />
              {adminSidebarHovered && <span className="truncate">Home</span>}
            </button>

            <button
              onClick={() => setAdminActiveTab('unionAdd')}
              className={`w-full flex items-center rounded-xl text-xs font-extrabold transition-all duration-150 ${
                adminSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
              } ${
                adminActiveTab === 'unionAdd'
                  ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Union Add"
            >
              <Users size={16} className={`${adminActiveTab === 'unionAdd' ? 'text-red-600' : 'text-slate-400'} shrink-0`} />
              {adminSidebarHovered && <span className="truncate">Union Add</span>}
            </button>

            <button
              onClick={() => setAdminActiveTab('uploadJson')}
              className={`w-full flex items-center rounded-xl text-xs font-extrabold transition-all duration-150 ${
                adminSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
              } ${
                adminActiveTab === 'uploadJson'
                  ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Upload Josn"
            >
              <FileJson size={16} className={`${adminActiveTab === 'uploadJson' ? 'text-red-600' : 'text-slate-400'} shrink-0`} />
              {adminSidebarHovered && <span className="truncate">Upload Josn</span>}
            </button>

            <button
              onClick={() => setAdminActiveTab('uploadImg')}
              className={`w-full flex items-center rounded-xl text-xs font-extrabold transition-all duration-150 ${
                adminSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
              } ${
                adminActiveTab === 'uploadImg'
                  ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Upload Img"
            >
              <ImageIcon size={16} className={`${adminActiveTab === 'uploadImg' ? 'text-red-600' : 'text-slate-400'} shrink-0`} />
              {adminSidebarHovered && <span className="truncate">Upload Img</span>}
            </button>

            <button
              onClick={() => setAdminActiveTab('settings')}
              className={`w-full flex items-center rounded-xl text-xs font-extrabold transition-all duration-150 ${
                adminSidebarHovered ? 'px-3 py-2 space-x-2.5' : 'px-1 py-2 justify-center'
              } ${
                adminActiveTab === 'settings'
                  ? 'bg-red-50 text-red-600 border-l-4 border-red-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Settings"
            >
              <SettingsIcon size={16} className={`${adminActiveTab === 'settings' ? 'text-red-600' : 'text-slate-400'} shrink-0`} />
              {adminSidebarHovered && <span className="truncate">Settings</span>}
            </button>

          </nav>

          {/* Logout Trigger at bottom of sidebar */}
          <div className="p-3 border-t border-slate-200">
            <button
              onClick={handleAdminLogout}
              className={`w-full flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-rose-200 font-black transition-all ${
                adminSidebarHovered ? 'px-4 py-2.5 space-x-2 text-xs rounded-xl' : 'p-2 rounded-lg'
              }`}
              title="Logout"
            >
              <LogOut size={14} className="shrink-0" />
              {adminSidebarHovered && <span>LOGOUT CONTROLLER</span>}
            </button>
          </div>

        </aside>

        {/* Right Side: Primary Content area */}
        <main className="flex-1 flex flex-col min-w-0 md:ml-14 transition-all duration-300">
          
          {/* Header - Matches Screenshot 2 */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs z-10">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-[#1a5f9c] tracking-tight">
                Union Voter Admin Control
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">Central Management Dashboard</p>
            </div>

            {/* Back to Visitor Button - Matches top right 'Visitor' blue button */}
            <div className="flex items-center space-x-3">
              <button
                onClick={handleGoToVisitor}
                className="px-5 py-2 rounded-full bg-[#1e40af] hover:bg-blue-800 text-white font-black text-xs transition shadow-sm"
              >
                Visitor
              </button>
            </div>
          </header>

          {/* Content container */}
          <div className="p-6 md:p-8 flex-1 overflow-y-auto">
            {adminActiveTab === 'home' && (
              <AdminHome 
                voters={voters} 
                unions={unions} 
                settings={settings}
                onAddVoter={handleAddVoter} 
                onEditVoter={handleEditVoter} 
                onDeleteVoter={handleDeleteVoter} 
                onDeleteMultipleVoters={handleDeleteMultipleVoters} 
              />
            )}
            
            {adminActiveTab === 'unionAdd' && (
              <AdminUnionAdd 
                unions={unions} 
                onUpdateUnions={handleUpdateUnions} 
                onRenameUnionAndVillages={handleRenameUnionAndVillages}
              />
            )}

            {adminActiveTab === 'uploadJson' && (
              <AdminUploadJson 
                unions={unions} 
                voters={voters}
                onImportVoters={handleImportVoters} 
              />
            )}

            {adminActiveTab === 'uploadImg' && (
              <AdminUploadImg 
                unions={unions} 
                onImportVoters={handleImportVoters} 
              />
            )}

            {adminActiveTab === 'settings' && (
              <AdminSettings 
                settings={settings} 
                onUpdateSettings={handleUpdateSettings} 
                unions={unions}
              />
            )}
          </div>

        </main>
      </div>
    );
  }

  // ===============================================================
  // VIEW: PUBLIC VISITOR DIRECTORY PORTAL
  // ===============================================================
  return (
    <>
      <VisitorPage
        voters={voters}
        unions={unions}
        settings={settings}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLogout={handleAdminLogout}
        onGoToAdminLogin={handleGoToAdminLogin}
        onGoToAdminPanel={() => setActiveView('admin')}
        onAddNewVoterClick={handleAddNewVoterClick}
        onEditVoterClick={handleEditVoterClick}
        onDeleteVoterClick={handleDeleteVoterClick}
        onDeleteMultipleVoters={handleDeleteMultipleVoters}
        renderLogo={renderLogo}
      />

      {/* Shareable Voter Add/Edit Modal */}
      {showVoterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#1a5f9c] text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg flex items-center space-x-2">
                  <User size={20} />
                  <span>{editingVoter ? 'Edit Voter Details' : 'Add New Voter'}</span>
                </h3>
                <p className="text-xs text-blue-100/80 font-medium mt-0.5">Please provide accurate information for the electoral directory</p>
              </div>
              <button 
                onClick={() => setShowVoterModal(false)}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveVoterFromModal} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center space-x-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SL & Voter No */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Serial No *</label>
                  <input
                    type="number"
                    required
                    value={slForm}
                    onChange={(e) => setSlForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Voter No (min 8 digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={voterNoForm}
                    onChange={(e) => setVoterNoForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none font-mono"
                    placeholder="e.g. 1992123456"
                  />
                </div>

                {/* Name EN & Name BN */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Full Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={nameForm}
                    onChange={(e) => setNameForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                    placeholder="e.g. Abul Kashem"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Full Name (Bengali) *</label>
                  <input
                    type="text"
                    required
                    value={nameBnForm}
                    onChange={(e) => setNameBnForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                    placeholder="যেমনঃ আবুল কাশেম"
                  />
                </div>

                {/* DOB & NID */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Date Of Birth *</label>
                  <input
                    type="date"
                    required
                    value={dobForm}
                    onChange={(e) => setDobForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">NID Number (10/13/17 digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={17}
                    value={nidForm}
                    onChange={(e) => setNidForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none font-mono"
                    placeholder="e.g. 1234567890"
                  />
                </div>

                {/* Father EN & BN */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Father's Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={fatherNameForm}
                    onChange={(e) => setFatherNameForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Father's Name (Bengali)</label>
                  <input
                    type="text"
                    value={fatherNameBnForm}
                    onChange={(e) => setFatherNameBnForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>

                {/* Mother EN & BN */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Mother's Name (English) *</label>
                  <input
                    type="text"
                    required
                    value={motherNameForm}
                    onChange={(e) => setMotherNameForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Mother's Name (Bengali)</label>
                  <input
                    type="text"
                    value={motherNameBnForm}
                    onChange={(e) => setMotherNameBnForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Gender *</label>
                  <select
                    value={genderForm}
                    onChange={(e) => setGenderForm(e.target.value as 'Male' | 'Female')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                {/* Union */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Union *</label>
                  <select
                    value={unionForm}
                    onChange={(e) => {
                      setUnionForm(e.target.value);
                      // Default first village of new union
                      const found = unions.find(u => u.name === e.target.value);
                      if (found && found.villages.length > 0) {
                        setVillageForm(found.villages[0].name);
                      } else {
                        setVillageForm('');
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    {unions.map(u => (
                      <option key={u.name} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                {/* Village */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Village *</label>
                  <select
                    value={villageForm}
                    onChange={(e) => setVillageForm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:outline-none"
                  >
                    {formVillages.map(v => (
                      <option key={v.name} value={v.name}>{v.nameBn} ({v.name})</option>
                    ))}
                  </select>
                </div>

                {/* Photo upload / preview */}
                <div className="md:col-span-2 flex items-center space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-200 relative flex items-center justify-center">
                    {photoForm ? (
                      <img src={photoForm} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={24} className="text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 pl-1">Profile Photo (Max 2MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleModalImageChange}
                      className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#1a5f9c]/10 file:text-[#1a5f9c] hover:file:bg-[#1a5f9c]/20 cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowVoterModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center space-x-1"
                >
                  <Check size={14} />
                  <span>Save Voter</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </>
  );
}
