import React, { useState, useMemo } from 'react';
import { Voter, UnionData } from '../types';
import { FileJson, Upload, Trash2, CheckCircle2, AlertTriangle, Filter, Eye, Plus } from 'lucide-react';

interface AdminUploadJsonProps {
  unions: UnionData[];
  voters: Voter[];
  onImportVoters: (importedList: Voter[]) => void;
}

export default function AdminUploadJson({ unions, voters, onImportVoters }: AdminUploadJsonProps) {
  const [dragActive, setDragActive] = useState(false);
  const [importedVoters, setImportedVoters] = useState<Voter[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Find duplicate voters (where voterNo or NID matches any voter currently in the database)
  const duplicateVoters = useMemo(() => {
    return importedVoters.filter(imp => 
      voters.some(v => v.voterNo === imp.voterNo || (imp.nid && v.nid === imp.nid))
    );
  }, [importedVoters, voters]);

  // Dropdown states for preview
  const [selectedUnion, setSelectedUnion] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  const filterVillages = useMemo(() => {
    if (!selectedUnion) return [];
    const found = unions.find(u => u.name === selectedUnion);
    return found ? found.villages : [];
  }, [selectedUnion, unions]);

  // Filtered preview rows
  const previewVoters = useMemo(() => {
    return importedVoters.filter(v => {
      const matchUnion = !selectedUnion || v.union === selectedUnion;
      const matchVillage = !selectedVillage || v.village === selectedVillage;
      const matchGender = !selectedGender || v.gender === selectedGender;
      return matchUnion && matchVillage && matchGender;
    });
  }, [importedVoters, selectedUnion, selectedVillage, selectedGender]);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Process file contents
  const processJsonFile = (file: File) => {
    setError('');
    setSuccess('');
    setFileName(file.name);

    if (!selectedUnion || !selectedVillage || !selectedGender) {
      setError("Please select Union, Village, and Gender from Step 1 before uploading.");
      return;
    }

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setError("Invalid file format. Please upload a valid .json file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        let listToLoad: any[] = [];
        if (Array.isArray(parsed)) {
          listToLoad = parsed;
        } else if (parsed && Array.isArray(parsed.voters)) {
          listToLoad = parsed.voters;
        } else {
          setError("Invalid JSON structure. It must be an array of voters or an object containing a 'voters' array.");
          return;
        }

        // Validate and clean up loaded items
        const validated: Voter[] = [];
        for (let i = 0; i < listToLoad.length; i++) {
          const item = listToLoad[i];
          if (!item.name || !item.nameBn || !item.voterNo || !item.dob) {
            setError(`Error at row ${i + 1}: Missing required fields (name, nameBn, voterNo, dob, nid).`);
            return;
          }

          validated.push({
            id: item.id || `json_${Date.now()}_${i}_${Math.floor(Math.random() * 1000)}`,
            sl: Number(item.sl) || i + 1,
            name: String(item.name),
            nameBn: String(item.nameBn),
            voterNo: String(item.voterNo),
            dob: String(item.dob),
            nid: String(item.nid),
            fatherName: String(item.fatherName || 'Late Abdul Khaleque'),
            fatherNameBn: String(item.fatherNameBn || 'মৃত আব্দুল খালেক'),
            motherName: String(item.motherName || 'Sufia Begum'),
            motherNameBn: String(item.motherNameBn || 'সুফিয়া বেগম'),
            gender: selectedGender,
            union: selectedUnion,
            village: selectedVillage,
            photo: item.photo || ''
          });
        }

        setImportedVoters(validated);
        setSuccess(`Successfully loaded ${validated.length} voter records from JSON! Review details in the table below, then click "Submit" to save.`);
      } catch (err: any) {
        setError(`JSON Parsing Error: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processJsonFile(e.dataTransfer.files[0]);
    }
  };

  // Handle input click file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processJsonFile(e.target.files[0]);
    }
    // Reset file input value to allow uploading the same file multiple times
    e.target.value = '';
  };

  // Submit imported list to main state
  const handleSubmit = () => {
    if (importedVoters.length === 0) {
      setError("Please import a valid JSON file first.");
      return;
    }

    // Filter out duplicates (already added data will not be added again)
    const finalUniqueVoters = importedVoters.filter(imp => 
      !voters.some(v => v.voterNo === imp.voterNo || (imp.nid && v.nid === imp.nid))
    );

    const dupCount = importedVoters.length - finalUniqueVoters.length;

    if (finalUniqueVoters.length === 0) {
      setError(`All ${importedVoters.length} voter records in this file already exist in the system. No new records were added.`);
      return;
    }

    onImportVoters(finalUniqueVoters);
    setImportedVoters([]);
    setFileName('');
    
    if (dupCount > 0) {
      setSuccess(`Successfully added ${finalUniqueVoters.length} new voters! ${dupCount} duplicate records were skipped.`);
    } else {
      setSuccess(`Successfully added all ${finalUniqueVoters.length} voter records to the database!`);
    }
  };

  // Download Sample JSON file
  const downloadSampleTemplate = () => {
    const sample = {
      voters: [
        {
          sl: 101,
          name: "Abdur Rahim",
          nameBn: "আব্দুর রহিম",
          voterNo: "384910283",
          dob: "1988-05-15",
          nid: "3849102834",
          fatherName: "Ali Ahmed",
          fatherNameBn: "আলী আহমেদ",
          motherName: "Sufia Begum",
          motherNameBn: "সুফিয়া বেগম",
          gender: "Male",
          union: "Baraikhali",
          village: "Baraikhali Village"
        },
        {
          sl: 102,
          name: "Mst. Fatima Begum",
          nameBn: "মোছাঃ ফাতেমা বেগম",
          voterNo: "839201948",
          dob: "1994-09-22",
          nid: "5829103948",
          fatherName: "Kalam Mia",
          fatherNameBn: "কালাম মিয়া",
          motherName: "Ayesha Bibi",
          motherNameBn: "আয়েশা বিবি",
          gender: "Female",
          union: "Baraikhali",
          village: "Chonbari"
        }
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sample, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "union_voters_sample.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const isSelectionComplete = !!selectedUnion && !!selectedVillage && !!selectedGender;

  return (
    <div className="space-y-6">
      
      {/* Sub-header Banner */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upload JSON Data</h2>
          <p className="text-sm text-slate-500 mt-1">Import bulk voter records instantly from a compliant JSON schema array.</p>
        </div>
        <button
          onClick={downloadSampleTemplate}
          className="shrink-0 px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl font-bold text-xs text-slate-700 flex items-center space-x-1.5 transition"
        >
          <FileJson size={14} />
          <span>Get Sample JSON</span>
        </button>
      </div>

      {/* Step 1: Selection Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
            <span className="bg-[#1a5f9c] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">১</span>
            <span>ইউনিয়ন, গ্রাম এবং লিঙ্গ সিলেক্ট করুন (Select Target Location & Gender)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 pl-7">আপলোড করার পূর্বে অবশ্যই ইউনিয়ন, গ্রাম এবং লিঙ্গ নির্ধারণ করতে হবে। সকল আপলোডকৃত ভোটার এই ক্যাটাগরিতে যুক্ত হবে।</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pl-7">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Select Union *</label>
            <select
              value={selectedUnion}
              onChange={(e) => {
                setSelectedUnion(e.target.value);
                setSelectedVillage('');
              }}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Union</option>
              {unions.map(u => (
                <option key={u.name} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Select Village *</label>
            <select
              value={selectedVillage}
              disabled={!selectedUnion}
              onChange={(e) => setSelectedVillage(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select Village</option>
              {filterVillages.map(v => (
                <option key={v.name} value={v.name}>{v.nameBn}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 pl-1">Select Gender *</label>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl font-bold text-xs flex items-center space-x-2">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl font-bold text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {duplicateVoters.length > 0 && (
        <div className="p-5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl space-y-3">
          <div className="flex items-center space-x-2 font-black text-xs text-amber-700">
            <AlertTriangle size={18} className="text-amber-500 animate-pulse" />
            <span>সতর্কতা: {duplicateVoters.length} টি ভোটার তথ্য আগে থেকেই ডাটাবেজে রয়েছে! (Duplicate Data Found)</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
            নিচের ভোটার নম্বর বা এনআইডি নম্বরগুলো আগে থেকেই সিস্টেমে যুক্ত রয়েছে। এগুলো পুনরায় যুক্ত করা হবে না (দ্বৈত এন্ট্রি রোধ করতে)। নিচে তাদের তথ্য দেওয়া হলো:
          </p>
          <div className="max-h-48 overflow-y-auto border border-amber-200 rounded-xl bg-white p-3 divide-y divide-amber-100/60 shadow-inner">
            {duplicateVoters.map((v, idx) => {
              // Find the existing voter in database to display their info
              const existing = voters.find(dbV => dbV.voterNo === v.voterNo || (v.nid && dbV.nid === v.nid));
              return (
                <div key={v.id || idx} className="py-2.5 px-1 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-extrabold text-[#1a5f9c] text-sm">{v.name}</span>
                    <span className="text-slate-400">({v.nameBn})</span>
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">Voter No: {v.voterNo}</span>
                    {v.nid && <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 font-bold">NID: {v.nid}</span>}
                  </div>
                  {existing && (
                    <div className="text-[10px] text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block"></span>
                      <span>সিস্টেমে আছে:</span>
                      <strong className="text-slate-700">{existing.union}</strong>
                      <span className="text-slate-400">({existing.village})</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drag & Drop Zone */}
      <div 
        onDragEnter={isSelectionComplete ? handleDrag : undefined}
        onDragOver={isSelectionComplete ? handleDrag : undefined}
        onDragLeave={isSelectionComplete ? handleDrag : undefined}
        onDrop={isSelectionComplete ? handleDrop : undefined}
        className={`border-4 border-dashed rounded-[30px] p-10 flex flex-col items-center justify-center text-center transition-all select-none ${
          !isSelectionComplete
            ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
            : dragActive 
              ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 shadow-inner scale-[0.99] cursor-pointer' 
              : 'border-[#1a5f9c] hover:border-[#1a5f9c]/80 bg-blue-50/20 text-slate-700 cursor-pointer'
        }`}
      >
        {!isSelectionComplete ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-4 bg-amber-50 text-amber-500 rounded-full mb-3 border border-amber-100">
              <AlertTriangle size={32} className="animate-bounce" />
            </div>
            <p className="font-extrabold text-base text-amber-700 max-w-md leading-relaxed">
              ফাইল আপলোড লক করা আছে! (Upload is Locked)
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              ফাইল আপলোড করার পূর্বে দয়া করে উপরে ইউনিয়ন, গ্রাম এবং লিঙ্গ সিলেক্ট করুন।
            </p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-blue-50 text-[#1a5f9c] rounded-full mb-4 shadow-sm">
              <FileJson size={40} className="animate-pulse" />
            </div>
            
            <p className="font-extrabold text-base leading-relaxed max-w-xl text-[#1a5f9c]">
              ভোটার JSON ফাইলটি এখানে ড্র্যাগ করুন অথবা ব্রাউজ করুন অবশ্যই বৈধ .json ফরম্যাট এবং voters অ্যারে যুক্ত হতে হবে
            </p>
            
            {fileName ? (
              <div className="mt-4 px-5 py-2 bg-emerald-100 text-emerald-800 rounded-full font-bold text-sm">
                Selected: {fileName}
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-2 font-medium">Supported sizes: any compliant .json file up to 5MB</p>
            )}

            <label className="mt-5 px-6 py-2.5 bg-[#1a5f9c] hover:bg-[#1a5f9c]/90 text-white font-extrabold rounded-full text-xs cursor-pointer shadow-md transition uppercase tracking-wider">
              Browse File
              <input 
                type="file" 
                accept=".json,application/json" 
                onChange={handleFileChange} 
                className="hidden" 
              />
            </label>
          </>
        )}
      </div>

      {/* Command Buttons & Filter Panel - Row below drop zone */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: Action Control Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (importedVoters.length > 0) {
                processJsonFile(new File([JSON.stringify(importedVoters)], fileName));
              } else {
                setError("Please upload a JSON file first.");
              }
            }}
            disabled={!isSelectionComplete}
            className="px-6 py-2.5 bg-sky-400 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5"
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
          <button
            onClick={handleSubmit}
            disabled={importedVoters.length === 0 || !isSelectionComplete}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5"
          >
            <CheckCircle2 size={14} />
            <span>Submit</span>
          </button>
        </div>

        {/* Right: Clear Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setImportedVoters([]);
              setFileName('');
              setError('');
              setSuccess('');
            }}
            disabled={importedVoters.length === 0}
            className="px-4 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white rounded-full font-bold text-xs transition"
          >
            Clear Import
          </button>
        </div>

      </div>

      {/* Preview Table of Imported Entries */}
      <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
        <div className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Eye size={14} className="text-blue-500" />
            <span>Import Preview Row ({previewVoters.length} entries shown)</span>
          </div>
          <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 uppercase font-black tracking-widest">JSON STAGING</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <th className="p-1.5 text-center">SL</th>
                <th className="p-1.5">Name</th>
                <th className="p-1.5 text-center">Voter No</th>
                <th className="p-1.5 text-center">DOB</th>
                <th className="p-1.5 text-center">NID</th>
                <th className="p-1.5">Father Name</th>
                <th className="p-1.5">Mother Name</th>
                <th className="p-1.5 text-center">Union / Village</th>
                <th className="p-1.5 text-center">Gender</th>
                <th className="p-1.5 text-center w-20">Staging Action</th>
              </tr>
            </thead>
            <tbody>
              {previewVoters.length > 0 ? (
                previewVoters.map((v, i) => {
                  const isDuplicate = voters.some(dbV => dbV.voterNo === v.voterNo || (v.nid && dbV.nid === v.nid));
                  return (
                    <tr key={v.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isDuplicate ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-1.5 text-center font-bold text-slate-500">{v.sl}</td>
                      <td className="p-1.5">
                        <div className="font-bold text-slate-800">{v.name}</div>
                        <div className="text-slate-400 font-semibold text-[9px] mt-0.5">{v.nameBn}</div>
                        {isDuplicate && (
                          <span className="mt-1 inline-block text-[8px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded leading-none">
                            ⚠️ Already Exists / আগে থেকেই আছে
                          </span>
                        )}
                      </td>
                      <td className="p-1.5 text-center font-mono font-bold text-slate-700">{v.voterNo}</td>
                      <td className="p-1.5 text-center text-slate-500 font-medium">{v.dob}</td>
                      <td className="p-1.5 text-center font-mono text-slate-700">{v.nid}</td>
                      <td className="p-1.5">
                        <div className="font-medium text-slate-700">{v.fatherName}</div>
                        <div className="text-slate-400 text-[9px] mt-0.5">{v.fatherNameBn}</div>
                      </td>
                      <td className="p-1.5">
                        <div className="font-medium text-slate-700">{v.motherName}</div>
                        <div className="text-slate-400 text-[9px] mt-0.5">{v.motherNameBn}</div>
                      </td>
                      <td className="p-1.5 text-center">
                        <div className="font-bold text-slate-600">{v.union}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{v.village}</div>
                      </td>
                      <td className="p-1.5 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                          v.gender === 'Female' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-sky-50 text-sky-500 border-sky-100'
                        }`}>{v.gender}</span>
                      </td>
                      <td className="p-1.5 text-center">
                        <button
                          onClick={() => {
                            setImportedVoters(prev => prev.filter(item => item.id !== v.id));
                          }}
                          className="text-red-500 hover:bg-red-50 p-1 rounded"
                          title="Remove from staging"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="p-10 text-center text-slate-400">
                    No JSON records staged. Upload or drag-and-drop a .json file to see imported voter records here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
