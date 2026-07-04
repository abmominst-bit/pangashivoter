import React, { useState } from 'react';
import { UnionData } from '../types';
import { Plus, Trash2, Home, Landmark, ShieldCheck, HelpCircle, Edit, Check, X } from 'lucide-react';

interface AdminUnionAddProps {
  unions: UnionData[];
  onUpdateUnions: (newUnions: UnionData[]) => void;
  onRenameUnionAndVillages?: (oldUnionName: string, newUnionName: string, oldVillageName?: string, newVillageName?: string) => void;
}

export default function AdminUnionAdd({ unions, onUpdateUnions, onRenameUnionAndVillages }: AdminUnionAddProps) {
  // Add Union Form States
  const [unionName, setUnionName] = useState('');
  const [unionNameBn, setUnionNameBn] = useState('');

  // Add Village Form States
  const [villageName, setVillageName] = useState('');
  const [villageNameBn, setVillageNameBn] = useState('');
  const [selectedUnionForVillage, setSelectedUnionForVillage] = useState('');

  // Union Editing States
  const [editingUnionName, setEditingUnionName] = useState<string | null>(null);
  const [editUnionNameEng, setEditUnionNameEng] = useState('');
  const [editUnionNameBn, setEditUnionNameBn] = useState('');

  // Village Editing States
  const [editingVillageKey, setEditingVillageKey] = useState<string | null>(null); // "unionName-villageName"
  const [editVillageNameEng, setEditVillageNameEng] = useState('');
  const [editVillageNameBn, setEditVillageNameBn] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleStartEditUnion = (u: UnionData) => {
    setEditingUnionName(u.name);
    setEditUnionNameEng(u.name);
    setEditUnionNameBn(u.nameBn);
    setEditingVillageKey(null);
  };

  const handleCancelEditUnion = () => {
    setEditingUnionName(null);
  };

  const handleSaveEditUnion = (originalName: string) => {
    setError('');
    setSuccess('');

    const cleanedNameEng = editUnionNameEng.trim();
    const cleanedNameBn = editUnionNameBn.trim();

    if (!cleanedNameEng || !cleanedNameBn) {
      setError('Union Name (English and Bengali) cannot be empty.');
      return;
    }

    // Check duplicate if name is changed
    if (cleanedNameEng.toLowerCase() !== originalName.toLowerCase()) {
      if (unions.some(u => u.name.toLowerCase() === cleanedNameEng.toLowerCase())) {
        setError('A Union with this English name already exists!');
        return;
      }
    }

    const updated = unions.map(u => {
      if (u.name === originalName) {
        return {
          ...u,
          name: cleanedNameEng,
          nameBn: cleanedNameBn
        };
      }
      return u;
    });

    onUpdateUnions(updated);
    if (onRenameUnionAndVillages) {
      onRenameUnionAndVillages(originalName, cleanedNameEng);
    }

    setEditingUnionName(null);
    setSuccess(`Union updated successfully!`);
  };

  const handleStartEditVillage = (unionName: string, vName: string, vNameBn: string) => {
    setEditingVillageKey(`${unionName}-${vName}`);
    setEditVillageNameEng(vName);
    setEditVillageNameBn(vNameBn);
    setEditingUnionName(null);
  };

  const handleCancelEditVillage = () => {
    setEditingVillageKey(null);
  };

  const handleSaveEditVillage = (unionName: string, originalVillageName: string) => {
    setError('');
    setSuccess('');

    const cleanedNameEng = editVillageNameEng.trim();
    const cleanedNameBn = editVillageNameBn.trim();

    if (!cleanedNameEng || !cleanedNameBn) {
      setError('Village Name (English and Bengali) cannot be empty.');
      return;
    }

    const targetUnion = unions.find(u => u.name === unionName);
    if (!targetUnion) {
      setError('Union not found!');
      return;
    }

    // Check duplicate if name is changed
    if (cleanedNameEng.toLowerCase() !== originalVillageName.toLowerCase()) {
      if (targetUnion.villages.some(v => v.name.toLowerCase() === cleanedNameEng.toLowerCase())) {
        setError(`A village named "${cleanedNameEng}" already exists in ${unionName}!`);
        return;
      }
    }

    const updated = unions.map(u => {
      if (u.name === unionName) {
        return {
          ...u,
          villages: u.villages.map(v => {
            if (v.name === originalVillageName) {
              return {
                name: cleanedNameEng,
                nameBn: cleanedNameBn
              };
            }
            return v;
          })
        };
      }
      return u;
    });

    onUpdateUnions(updated);
    if (onRenameUnionAndVillages) {
      onRenameUnionAndVillages(unionName, unionName, originalVillageName, cleanedNameEng);
    }

    setEditingVillageKey(null);
    setSuccess(`Village "${cleanedNameEng}" updated successfully!`);
  };

  const handleAddUnion = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!unionName.trim() || !unionNameBn.trim()) {
      setError('Please fill in both Union Name in English and Bengali.');
      return;
    }

    const cleanedName = unionName.trim();
    const cleanedNameBn = unionNameBn.trim();

    // Check if Union already exists
    if (unions.some(u => u.name.toLowerCase() === cleanedName.toLowerCase())) {
      setError('A Union with this English name already exists!');
      return;
    }

    const newUnion: UnionData = {
      name: cleanedName,
      nameBn: cleanedNameBn,
      villages: []
    };

    const updated = [...unions, newUnion];
    onUpdateUnions(updated);
    setUnionName('');
    setUnionNameBn('');
    setSuccess('Union added successfully!');
  };

  const handleAddVillage = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!villageName.trim() || !villageNameBn.trim() || !selectedUnionForVillage) {
      setError('Please fill in Village Name (English & Bengali) and select a Union.');
      return;
    }

    const cleanedVil = villageName.trim();
    const cleanedVilBn = villageNameBn.trim();

    const targetUnion = unions.find(u => u.name === selectedUnionForVillage);
    if (!targetUnion) {
      setError('Selected Union was not found!');
      return;
    }

    // Check duplicate village in this Union
    if (targetUnion.villages.some(v => v.name.toLowerCase() === cleanedVil.toLowerCase())) {
      setError(`A village named "${cleanedVil}" already exists in ${targetUnion.name}!`);
      return;
    }

    const updated = unions.map(u => {
      if (u.name === selectedUnionForVillage) {
        return {
          ...u,
          villages: [...u.villages, { name: cleanedVil, nameBn: cleanedVilBn }]
        };
      }
      return u;
    });

    onUpdateUnions(updated);
    setVillageName('');
    setVillageNameBn('');
    setSuccess('Village added successfully!');
  };

  const handleDeleteUnion = (name: string) => {
    const updated = unions.filter(u => u.name !== name);
    onUpdateUnions(updated);
    setSuccess(`Union "${name}" deleted successfully!`);
  };

  const handleDeleteVillage = (unionName: string, villageName: string) => {
    const updated = unions.map(u => {
      if (u.name === unionName) {
        return {
          ...u,
          villages: u.villages.filter(v => v.name !== villageName)
        };
      }
      return u;
    });
    onUpdateUnions(updated);
    setSuccess(`Village "${villageName}" deleted successfully!`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 rounded-2xl">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manage Unions (UP)</h2>
        <p className="text-sm text-slate-500 mt-1">Add or remove Unions and Villages from the system configuration.</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-bold text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl font-bold text-xs">
          {success}
        </div>
      )}

      {/* Adding Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Form: ADD UNION */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-red-600 font-bold text-base mb-2">
            <Landmark size={20} />
            <span>১. নতুন ইউনিয়ন যুক্ত করুন</span>
          </div>
          <form onSubmit={handleAddUnion} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Union Name (English)</label>
                <input
                  type="text"
                  value={unionName}
                  onChange={(e) => setUnionName(e.target.value)}
                  placeholder="e.g. Rajnagar"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ইউনিয়নের নাম (বাংলা)</label>
                <input
                  type="text"
                  value={unionNameBn}
                  onChange={(e) => setUnionNameBn(e.target.value)}
                  placeholder="উদাঃ রাজনগর"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide transition shadow-sm flex items-center justify-center space-x-1"
            >
              <Plus size={16} />
              <span>ADD UNION</span>
            </button>
          </form>
        </div>

        {/* Form: ADD VILLAGE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-red-600 font-bold text-base mb-2">
            <Home size={20} />
            <span>২. নতুন গ্রাম যুক্ত করুন</span>
          </div>
          <form onSubmit={handleAddVillage} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Village Name (English)</label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="e.g. Chandpur"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">গ্রামের নাম (বাংলা)</label>
                <input
                  type="text"
                  value={villageNameBn}
                  onChange={(e) => setVillageNameBn(e.target.value)}
                  placeholder="উদাঃ চাঁদপুর"
                  className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign to Union</label>
              <select
                value={selectedUnionForVillage}
                onChange={(e) => setSelectedUnionForVillage(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-semibold bg-white"
              >
                <option value="">-- Choose Assigned Union --</option>
                {unions.map(u => (
                  <option key={u.name} value={u.name}>
                    {u.name} ({u.nameBn})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide transition shadow-sm flex items-center justify-center space-x-1"
            >
              <Plus size={16} />
              <span>ADD VILLAGE</span>
            </button>
          </form>
        </div>

      </div>

      {/* Display Lists - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Union List Table */}
        <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#1a5f9c] text-white px-4 py-3 font-bold text-sm">
            Union Configuration list
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-600">Union Name (English)</th>
                  <th className="p-3 font-bold text-slate-600">Union Name (Bengali)</th>
                  <th className="p-3 font-bold text-slate-600 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {unions.length > 0 ? (
                  unions.map(u => {
                    const isEditing = editingUnionName === u.name;
                    return (
                      <tr key={u.name} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUnionNameEng}
                              onChange={(e) => setEditUnionNameEng(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                            />
                          ) : (
                            u.name
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editUnionNameBn}
                              onChange={(e) => setEditUnionNameBn(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                            />
                          ) : (
                            u.nameBn
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveEditUnion(u.name)}
                                className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition"
                                title="Save"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelEditUnion}
                                className="text-slate-400 hover:bg-slate-100 p-1.5 rounded transition"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleStartEditUnion(u)}
                                className="text-amber-500 hover:bg-amber-50 p-1.5 rounded transition"
                                title="Edit Union"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteUnion(u.name)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"
                                title="Delete Union"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-400">No unions registered.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Village List Table */}
        <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm flex flex-col">
          <div className="bg-[#1a5f9c] text-white px-4 py-3 font-bold text-sm">
            Village Configuration list
          </div>
          <div className="overflow-x-auto flex-1 max-h-[350px]">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-bold text-slate-600">Village Name (English)</th>
                  <th className="p-3 font-bold text-slate-600">Village Name (Bengali)</th>
                  <th className="p-3 font-bold text-slate-600">Assigned Union</th>
                  <th className="p-3 font-bold text-slate-600 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {unions.flatMap(u => u.villages.map(v => ({ union: u, village: v }))).length > 0 ? (
                  unions.flatMap(u => u.villages.map(v => ({ union: u, village: v }))).map(({ union, village }) => {
                    const uniqueKey = `${union.name}-${village.name}`;
                    const isEditing = editingVillageKey === uniqueKey;
                    return (
                      <tr key={uniqueKey} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editVillageNameEng}
                              onChange={(e) => setEditVillageNameEng(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-bold"
                            />
                          ) : (
                            village.name
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editVillageNameBn}
                              onChange={(e) => setEditVillageNameBn(e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-semibold"
                            />
                          ) : (
                            village.nameBn
                          )}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[10px] font-bold text-slate-600">
                            {union.name}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleSaveEditVillage(union.name, village.name)}
                                className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded transition"
                                title="Save"
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={handleCancelEditVillage}
                                className="text-slate-400 hover:bg-slate-100 p-1.5 rounded transition"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                onClick={() => handleStartEditVillage(union.name, village.name, village.nameBn)}
                                className="text-amber-500 hover:bg-amber-50 p-1.5 rounded transition"
                                title="Edit Village"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteVillage(union.name, village.name)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition"
                                title="Delete Village"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-400">No villages registered yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Info Count Panel - Matches Screenshot 3 */}
      <div className="bg-gradient-to-r from-[#1a5f9c]/10 to-sky-50 p-5 rounded-2xl border border-[#1a5f9c]/20">
        <h3 className="font-extrabold text-sm text-[#1a5f9c] uppercase tracking-wider mb-3">Info Count (Villages Per Union)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {unions.map(u => (
            <div key={u.name} className="bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-xs text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.name}</div>
              <div className="text-xl font-black text-slate-800 mt-1">{u.villages.length}</div>
              <div className="text-[10px] font-medium text-slate-500 mt-0.5">Villages</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
