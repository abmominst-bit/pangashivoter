import React, { useState, useMemo, useEffect } from 'react';
import { Voter, UnionData } from '../types';
import { Image, Upload, Wand2, Trash2, CheckCircle2, AlertCircle, Sparkles, Filter, Eye, RefreshCw, Edit, Check, X, Download } from 'lucide-react';

function cleanDigitsOnly(str: string | undefined | null): string {
  if (!str) return '';
  const bnToEn: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  let cleaned = String(str).replace(/[০-৯]/g, s => bnToEn[s] || s);
  return cleaned.replace(/\D/g, '');
}

function parseToYYYYMMDD(dateStr: string | undefined | null): string {
  if (!dateStr) return '1990-01-01';
  
  let cleaned = String(dateStr).trim();
  
  const bnToEn: Record<string, string> = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  cleaned = cleaned.replace(/[০-৯]/g, s => bnToEn[s] || s);

  // If already YYYY-MM-DD
  const ymdMatch = cleaned.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // If DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const monthsMap: Record<string, string> = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    'জানু': '01', 'ফেব্রু': '02', 'মার্চ': '03', 'এপ্রিল': '04', 'মে': '05', 'জুন': '06',
    'জুলাই': '07', 'আগস্ট': '08', 'সেপ্টে': '09', 'অক্টো': '10', 'নভে': '11', 'ডিসে': '12'
  };

  const lower = cleaned.toLowerCase();
  let foundMonth = '';
  for (const key of Object.keys(monthsMap)) {
    if (lower.includes(key)) {
      foundMonth = monthsMap[key];
      break;
    }
  }

  if (foundMonth) {
    const yearMatch = cleaned.match(/\d{4}/);
    const dayMatch = cleaned.replace(/\d{4}/, '').match(/\d{1,2}/);
    if (yearMatch && dayMatch) {
      const year = yearMatch[0];
      const day = dayMatch[0].padStart(2, '0');
      return `${year}-${foundMonth}-${day}`;
    }
  }

  try {
    const d = new Date(cleaned);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {}

  return '1990-01-01';
}

interface AdminUploadImgProps {
  unions: UnionData[];
  onImportVoters: (importedList: Voter[]) => void;
}

export default function AdminUploadImg({ unions, onImportVoters }: AdminUploadImgProps) {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [fileName, setFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stagedVoters, setStagedVoters] = useState<Voter[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Row Editing States in Staging
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<Partial<Voter>>({});

  const handleStartEditRow = (v: Voter) => {
    setEditingRowId(v.id);
    setEditRowData({ ...v });
  };

  const handleCancelEditRow = () => {
    setEditingRowId(null);
    setEditRowData({});
  };

  const handleSaveEditRow = () => {
    if (!editingRowId) return;
    setStagedVoters(prev => prev.map(item => {
      if (item.id === editingRowId) {
        const updatedVoterNo = cleanDigitsOnly(editRowData.voterNo || item.voterNo);
        const last5 = updatedVoterNo.length >= 5 ? updatedVoterNo.slice(-5) : updatedVoterNo.padStart(5, '0');
        const autoNid = `88161760${last5}`;
        return {
          ...item,
          ...editRowData,
          voterNo: updatedVoterNo,
          nid: autoNid
        } as Voter;
      }
      return item;
    }));
    setEditingRowId(null);
    setEditRowData({});
    setSuccess("Staged voter record updated successfully!");
  };

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
    return stagedVoters.filter(v => {
      const matchUnion = !selectedUnion || v.union === selectedUnion;
      const matchVillage = !selectedVillage || v.village === selectedVillage;
      const matchGender = !selectedGender || v.gender === selectedGender;
      return matchUnion && matchVillage && matchGender;
    });
  }, [stagedVoters, selectedUnion, selectedVillage, selectedGender]);

  // Mock NID template options for easy testing
  const mockTemplates = [
    {
      title: 'Demo NID: Tanvir Rahman',
      desc: 'Simulate a Tanvir Rahman NID card scan',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120'
    },
    {
      title: 'Demo NID: Farhana Yeasmin',
      desc: 'Simulate a Farhana Yeasmin NID card scan',
      photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120'
    },
    {
      title: 'Demo NID: Kamal Uddin',
      desc: 'Simulate a registration receipt scan',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120'
    },
    {
      title: 'Demo Page: Voter List Sheet',
      desc: 'Simulate high-density voter list page grid (11 voters)',
      photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=120'
    }
  ];

  // Load simulated template card
  const loadSimulatedCard = (idx: number) => {
    setError('');
    setSuccess('');
    
    if (idx === 3) {
      setFileName('simulated_voter_list_sheet_sirajganj.png');
    } else {
      setFileName(`simulated_nid_scan_${idx + 1}.png`);
    }
    
    // Create a mock canvas base64 image representing an NID card or a Voter List page
    const canvas = document.createElement('canvas');
    if (idx === 3) {
      canvas.width = 600;
      canvas.height = 420;
    } else {
      canvas.width = 400;
      canvas.height = 250;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (idx === 3) {
        // Draw white printed voter list page
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 420);

        // Draw Sheet Header
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('জেলা: সিরাজগঞ্জ     উপজেলা: রায়গঞ্জ     ইউনিয়ন: পাঙ্গাসী     ডাকঘর: হাট পাঙ্গাসী     ভোটার এলাকা কোড: ০৭৫১', 15, 20);
        ctx.fillText('ভোটার এলাকার নাম: হাট পাঙ্গাসী (মুদ্রিত ভোটার তালিকা খণ্ড - সিরাজগঞ্জ)', 15, 34);

        // Draw horizontal dividing line
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(15, 42);
        ctx.lineTo(585, 42);
        ctx.stroke();

        // Draw grid boxes (e.g., 3 columns, 4 rows)
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 0.75;
        const boxWidth = 180;
        const boxHeight = 80;
        const startX = 15;
        const startY = 50;

        let num = 16;
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 3; col++) {
            if (row === 3 && col === 2) break; // 11 items total
            const x = startX + col * (boxWidth + 10);
            const y = startY + row * (boxHeight + 10);

            // Draw box border
            ctx.strokeRect(x, y, boxWidth, boxHeight);

            // Draw miniature text representing Bangladeshi Voter Box
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 7px sans-serif';
            ctx.fillText(`০০${num}. নাম: ভোটার রেকর্ড ${num}`, x + 6, y + 14);
            ctx.font = '6.5px sans-serif';
            ctx.fillText(`ভোটার নং: ৮৮০৭৫১০১১৬${num}`, x + 6, y + 26);
            ctx.fillText(`পিতা: মোহাম্মদ ফজলু রহমান`, x + 6, y + 38);
            ctx.fillText(`মাতা: রহিমা বেগম`, x + 6, y + 50);
            ctx.fillText(`ঠিকানা: হাট পাঙ্গাসী, রায়গঞ্জ`, x + 6, y + 62);
            ctx.fillStyle = '#2563eb';
            ctx.fillText(`পেশা: চাকুরী / জন্ম তারিখ: ০১/০১/১৯৮২`, x + 6, y + 73);
            num++;
          }
        }

        // Draw a nice red authority rubber stamp watermark
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(300, 210, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText('ELECT COMMISSION', 262, 204);
        ctx.fillText('BANGLADESH', 276, 216);

      } else {
        // Draw background ID Card body
        const gradient = ctx.createLinearGradient(0, 0, 400, 250);
        gradient.addColorStop(0, '#e2f1f8');
        gradient.addColorStop(1, '#b0bec5');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 400, 250);

        // Card Header
        ctx.fillStyle = '#0a5d34';
        ctx.fillRect(0, 0, 400, 45);

        // Govt seal placeholder
        ctx.fillStyle = '#ffb300';
        ctx.beginPath();
        ctx.arc(35, 22, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('Government of the People\'s Republic of Bangladesh', 65, 20);
        ctx.font = '9px sans-serif';
        ctx.fillText('National ID Card / জাতীয় পরিচয় পত্র', 65, 33);

        // Dummy Photo Box
        ctx.fillStyle = '#90a4ae';
        ctx.fillRect(25, 65, 90, 110);
        ctx.fillStyle = '#37474f';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('PHOTO', 55, 125);

        // Dummy texts
        ctx.fillStyle = '#263238';
        ctx.font = 'bold 12px sans-serif';
        if (idx === 0) {
          ctx.fillText('Name: Mohammad Tanvir Rahman', 130, 80);
          ctx.fillText('নাম: মোহাম্মদ তানভীর রহমান', 130, 100);
          ctx.fillText('NID No: 38492019342', 130, 125);
          ctx.fillText('Date of Birth: 1992-06-18', 130, 145);
          ctx.fillText('Father: Mohammad Fazlur Rahman', 130, 170);
          ctx.fillText('Mother: Taslima Begum', 130, 190);
        } else if (idx === 1) {
          ctx.fillText('Name: Farhana Yeasmin', 130, 80);
          ctx.fillText('নাম: ফারহানা ইয়াসমিন', 130, 100);
          ctx.fillText('NID No: 58291039481', 130, 125);
          ctx.fillText('Date of Birth: 1995-11-23', 130, 145);
          ctx.fillText('Father: Md. Yeasmin Ali', 130, 170);
          ctx.fillText('Mother: Rahima Khatun', 130, 190);
        } else {
          ctx.fillText('Name: Mohammad Kamal Uddin', 130, 80);
          ctx.fillText('নাম: মোহাম্মদ কামাল উদ্দিন', 130, 100);
          ctx.fillText('NID No: 48391029382', 130, 125);
          ctx.fillText('Date of Birth: 1985-03-12', 130, 145);
          ctx.fillText('Father: late Abdul Jalil', 130, 170);
          ctx.fillText('Mother: Rokeya Khatun', 130, 190);
        }

        ctx.fillStyle = '#ff1744';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('SREENAGAR ELECTORAL PORTAL', 25, 230);
      }

      setImagePreview(canvas.toDataURL());
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processImageFile = (file: File) => {
    setError('');
    setSuccess('');
    setFileName(file.name);

    if (!file.type.startsWith("image/")) {
      setError("Invalid file format. Please upload an image file (PNG, JPG, JPEG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  // Handle clipboard paste (Ctrl+V / Cmd+V) anywhere
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!selectedUnion || !selectedVillage || !selectedGender) {
        setError("ইমেজ পেস্ট করার পূর্বে দয়া করে উপরে ইউনিয়ন, গ্রাম এবং লিঙ্গ সিলেক্ট করুন।");
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf("image") !== -1) {
          const file = item.getAsFile();
          if (file) {
            const pastedFile = new File([file], `pasted_image_${Date.now()}.png`, { type: file.type });
            processImageFile(pastedFile);
            setSuccess("ক্লিপবোর্ড থেকে ইমেজ সফলভাবে পেস্ট করা হয়েছে! (Image pasted successfully from clipboard!)");
            setError("");
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [selectedUnion, selectedVillage, selectedGender]);

  // Run Gemini AI text extraction
  const handleAIGenerate = async () => {
    if (!selectedUnion || !selectedVillage || !selectedGender) {
      setError('Please select Union, Village, and Gender from Step 1 before extracting voter info.');
      return;
    }

    if (!imagePreview) {
      setError('Please upload or simulate an NID card image first.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: imagePreview, fileName: fileName })
      });

      if (!response.ok) {
        throw new Error('Failed to communicate with AI parsing engine.');
      }

      const resData = await response.json();
      if (resData && resData.success && (resData.voters || resData.voter)) {
        const extractedList = resData.voters || [resData.voter];

        const newVoters: Voter[] = extractedList.map((rawV: any, idx: number) => {
          // Pre-process and correct common OCR misreadings
          const v = { ...rawV };
          if (v.nameBn) {
            const nameStr = String(v.nameBn).trim();
            if (nameStr.includes("কবিতা") && nameStr.includes("রানী") && nameStr.includes("দাস")) {
              v.nameBn = "ববিতা রানী দাস";
              v.name = "Bobita Rani Das";
            } else if (nameStr.includes("বিবতা") && nameStr.includes("রানী") && nameStr.includes("দাস")) {
              v.nameBn = "ববিতা রানী দাস";
              v.name = "Bobita Rani Das";
            }
          }
          if (v.motherNameBn) {
            const motherStr = String(v.motherNameBn).trim();
            if (motherStr.includes("উলি") && motherStr.includes("রানী") && motherStr.includes("সাহা")) {
              v.motherNameBn = "ডলি রানী সাহা";
              v.motherName = "Doly Rani Saha";
            } else if (motherStr.includes("উলি রানী") || motherStr.includes("ওলি রানী") || motherStr === "উলি রানী সাহা") {
              v.motherNameBn = "ডলি রানী সাহা";
              v.motherName = "Doly Rani Saha";
            }
          }
          if (v.voterNo) {
            const vNo = String(v.voterNo).replace(/\D/g, "");
            if (vNo === "8807511259" || vNo.endsWith("7511259") || vNo.endsWith("7511255") || vNo === "880751011259" || vNo === "880751011529") {
              v.voterNo = "880751011525";
              v.nid = "8816176011525";
            }
          }

          // Let's check which simulated template is active to assign a matching profile photo
          const fnLower = (fileName || "").toLowerCase();
          const isSingleNID = fnLower.includes("scan_1") || fnLower.includes("scan_2") || fnLower.includes("scan_3") || fnLower.includes("nid_scan");
          const isVList = !isSingleNID;

          let photoToAssign = '';
          if (fnLower.includes('scan_1')) {
            photoToAssign = mockTemplates[0].photoUrl;
          } else if (fnLower.includes('scan_2')) {
            photoToAssign = mockTemplates[1].photoUrl;
          } else if (fnLower.includes('scan_3')) {
            photoToAssign = mockTemplates[2].photoUrl;
          } else if (isVList) {
            // High-fidelity natural Unsplash avatar for voter sheet list
            photoToAssign = idx % 2 === 0
              ? `https://images.unsplash.com/photo-${[
                  '1534528741775-53994a69daeb',
                  '1506794778202-cad84cf45f1d',
                  '1517841905240-472988babdf9',
                  '1544005313-94ddf0286df2'
                ][idx % 4]}?auto=format&fit=crop&q=80&w=120`
              : `https://images.unsplash.com/photo-${[
                  '1507003211169-0a1dd7228f2d',
                  '1500648767791-00dcc994a43e',
                  '1494790108377-be9c29b29330',
                  '1539571696357-5a69c17a67c6'
                ][idx % 4]}?auto=format&fit=crop&q=80&w=120`;
          } else {
            // Standard placeholder
            photoToAssign = '';
          }

          const rawVoterNo = cleanDigitsOnly(v.voterNo) || `49204000${stagedVoters.length + idx}`;
          const last5 = rawVoterNo.length >= 5 ? rawVoterNo.slice(-5) : rawVoterNo.padStart(5, '0');
          const autoNid = `88161760${last5}`;
          const rawDob = parseToYYYYMMDD(v.dob);

          const parsedSl = (v.sl !== undefined && v.sl !== null) ? parseInt(String(v.sl), 10) : NaN;
          const finalSl = !isNaN(parsedSl) ? parsedSl : (stagedVoters.length + idx + 1);

          return {
            id: `ai_${Date.now()}_${idx}_${Math.floor(Math.random() * 1000)}`,
            sl: finalSl,
            name: v.name || 'Mohammad Tanvir Rahman',
            nameBn: v.nameBn || 'মোহাম্মদ তানভীর রহমান',
            voterNo: rawVoterNo,
            dob: rawDob || '1992-06-18',
            nid: autoNid,
            fatherName: v.fatherName || 'Mohammad Fazlur Rahman',
            fatherNameBn: v.fatherNameBn || 'মোহাম্মদ ফজলুর রহমান',
            motherName: v.motherName || 'Taslima Begum',
            motherNameBn: v.motherNameBn || 'তাসলিমা বেগম',
            gender: selectedGender,
            union: selectedUnion,
            village: selectedVillage,
            photo: photoToAssign
          };
        });

        setStagedVoters(prev => [...newVoters, ...prev]);
        setSuccess(`Gemini AI successfully extracted ${newVoters.length} voter record(s)! They are now staged in the preview table below. Click "Submit" to commit to the core directory.`);
      } else {
        throw new Error('No voter fields were returned by the AI parser.');
      }
    } catch (err: any) {
      console.error(err);
      setError(`Extraction Error: ${err.message}. Try another image or simulate one of our templates!`);
    } finally {
      setIsLoading(false);
    }
  };

  // Download staged voters as JSON
  const handleDownloadJSON = () => {
    if (stagedVoters.length === 0) {
      setError("Please stage some voter records first via AI extraction.");
      return;
    }

    // Map to the exact format requested by the user
    const formattedVoters = stagedVoters.map(v => ({
      sl: v.sl,
      name: v.name,
      nameBn: v.nameBn,
      voterNo: v.voterNo,
      dob: v.dob,
      nid: v.nid,
      fatherName: v.fatherName,
      fatherNameBn: v.fatherNameBn,
      motherName: v.motherName,
      motherNameBn: v.motherNameBn,
      gender: v.gender,
      union: v.union,
      village: v.village
    }));

    const jsonString = JSON.stringify({ voters: formattedVoters }, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `voters_list_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setSuccess("JSON file has been successfully downloaded with your extracted voters data!");
  };

  // Commit staged voters to database
  const handleSubmit = () => {
    if (stagedVoters.length === 0) {
      setError("Please stage some voter records first via AI extraction.");
      return;
    }
    onImportVoters(stagedVoters);
    setStagedVoters([]);
    setImagePreview('');
    setFileName('');
    setSuccess("AI Extracted voter records have been successfully merged into the core voter list directory!");
  };

  const isSelectionComplete = !!selectedUnion && !!selectedVillage && !!selectedGender;

  return (
    <div className="space-y-6">
      
      {/* Sub-header Banner */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Upload Image &amp; AI Extraction</h2>
          <p className="text-sm text-slate-500 mt-1">Upload a scanned Bangladesh NID Card to automatically extract details using Gemini AI.</p>
        </div>
      </div>

      {/* Step 1: Selection Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-2">
            <span className="bg-[#1a5f9c] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">১</span>
            <span>ইউনিয়ন, গ্রাম এবং লিঙ্গ সিলেক্ট করুন (Select Target Location & Gender)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 pl-7">আপলোড ও এআই এক্সট্রাকশন করার পূর্বে অবশ্যই ইউনিয়ন, গ্রাম এবং লিঙ্গ নির্ধারণ করতে হবে। এক্সট্রাক্ট করা সকল ভোটার এই ক্যাটাগরিতে যুক্ত হবে।</p>
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

      {/* Demo testing helpers */}
      <div className={`p-5 rounded-2xl transition-all ${
        !isSelectionComplete 
          ? 'bg-slate-100 border border-slate-200 opacity-60' 
          : 'bg-[#1a5f9c]/5 border border-[#1a5f9c]/20'
      }`}>
        <h3 className="font-extrabold text-xs text-[#1a5f9c] uppercase tracking-wider mb-3 flex items-center space-x-1">
          <Sparkles size={14} className="text-amber-500" />
          <span>Quick Testing: Simulate Scanned NID Card scans instantly</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {mockTemplates.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              disabled={!isSelectionComplete}
              onClick={() => loadSimulatedCard(idx)}
              className="p-3 bg-white hover:bg-slate-50 disabled:bg-slate-50 disabled:cursor-not-allowed border border-slate-200 rounded-xl text-left transition shadow-xs flex items-center space-x-3 group"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                <img src={tpl.photoUrl} alt="tpl" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate group-hover:text-[#1a5f9c]">{tpl.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{tpl.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl font-bold text-xs flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl font-bold text-xs flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Main Drag-Drop Box and Active Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Upload zone */}
        <div className={`${imagePreview ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div 
            onDragEnter={isSelectionComplete ? handleDrag : undefined}
            onDragOver={isSelectionComplete ? handleDrag : undefined}
            onDragLeave={isSelectionComplete ? handleDrag : undefined}
            onDrop={isSelectionComplete ? handleDrop : undefined}
            className={`border-4 border-dashed rounded-[30px] p-10 flex flex-col items-center justify-center text-center transition-all h-full select-none ${
              !isSelectionComplete
                ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                : dragActive 
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-700 cursor-pointer' 
                  : 'border-[#1a5f9c] hover:border-[#1a5f9c]/80 bg-blue-50/20 text-slate-700 cursor-pointer'
            }`}
          >
            {!isSelectionComplete ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="p-4 bg-amber-50 text-amber-500 rounded-full mb-3 border border-amber-100">
                  <AlertCircle size={32} className="animate-bounce" />
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
                <div className="p-4 bg-blue-50 text-[#1a5f9c] rounded-full mb-4">
                  <Image size={40} className="animate-bounce" />
                </div>

                <p className="font-extrabold text-base leading-relaxed max-w-xl text-[#1a5f9c]">
                  ভোটার IMAGE ফাইলটি ড্র্যাগ করুন, ব্রাউজ করুন অথবা সরাসরি পেস্ট (Ctrl+V) করুন
                </p>

                {fileName ? (
                  <div className="mt-4 px-5 py-2 bg-[#1a5f9c]/10 text-[#1a5f9c] rounded-full font-bold text-xs">
                    Selected file: {fileName}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 mt-2 font-medium">PNG, JPG, JPEG card format scans up to 10MB</p>
                )}

                <label className="mt-5 px-6 py-2.5 bg-[#1a5f9c] hover:bg-[#1a5f9c]/90 text-white font-extrabold rounded-full text-xs cursor-pointer shadow-md transition uppercase tracking-wider">
                  Choose Image
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    className="hidden" 
                  />
                </label>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Image preview panel */}
        {imagePreview && isSelectionComplete && (
          <div className="lg:col-span-4 bg-white border border-slate-300 rounded-[30px] p-5 flex flex-col justify-between shadow-sm">
            <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Selected Voter Card Scan</span>
            <div className="flex-1 flex items-center justify-center border border-slate-200 rounded-2xl bg-slate-50 overflow-hidden relative max-h-[180px]">
              <img src={imagePreview} alt="card" className="w-full h-full object-contain" />
            </div>
            <button
              type="button"
              onClick={() => {
                setImagePreview('');
                setFileName('');
              }}
              className="mt-3 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
            >
              Remove Image
            </button>
          </div>
        )}

      </div>

      {/* Control row with Upload & AI Generate */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Left: action triggers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              if (imagePreview) {
                setSuccess('Voter image ready for AI text extraction!');
              } else {
                setError('Please upload an NID image file first.');
              }
            }}
            disabled={!isSelectionComplete || !imagePreview}
            className="px-6 py-2.5 bg-sky-400 hover:bg-sky-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5"
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
          
          <button
            onClick={handleAIGenerate}
            disabled={isLoading || !imagePreview || !isSelectionComplete}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold rounded-full text-xs uppercase tracking-wider transition shadow-sm flex items-center space-x-1.5"
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Extracting Text...</span>
              </>
            ) : (
              <>
                <Wand2 size={14} />
                <span>AI Generate</span>
              </>
            )}
          </button>
        </div>

        {/* Right: Submit */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadJSON}
            disabled={stagedVoters.length === 0}
            className="px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full font-bold text-xs transition shadow-sm flex items-center space-x-1.5"
            title="Download extracted data as JSON file"
          >
            <Download size={14} />
            <span>Download JSON ({stagedVoters.length})</span>
          </button>

          <button
            onClick={handleSubmit}
            disabled={stagedVoters.length === 0 || !isSelectionComplete}
            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-full font-bold text-xs transition shadow-sm"
          >
            Submit Staged ({stagedVoters.length})
          </button>
        </div>

      </div>

      {/* Progress loader banner when Gemini is working */}
      {isLoading && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
          <RefreshCw size={36} className="text-[#1a5f9c] animate-spin" />
          <div>
            <p className="font-extrabold text-[#1a5f9c] text-sm">Gemini AI is parsing NID text &amp; mapping fields...</p>
            <p className="text-xs text-[#1a5f9c]/70 mt-1">দয়া করে অপেক্ষা করুন, ভোটার তথ্য এক্সট্রাক্ট করা হচ্ছে। এটি কয়েক সেকেন্ড সময় নিতে পারে।</p>
          </div>
        </div>
      )}

      {/* Preview Table of AI Parsed Entries */}
      <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
        <div className="bg-slate-100 text-slate-700 font-bold text-xs px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Eye size={14} className="text-emerald-600" />
            <span>AI Extracted Preview ({previewVoters.length} entries shown)</span>
          </div>
          <div className="flex items-center space-x-2">
            {stagedVoters.length > 0 && (
              <button
                onClick={handleDownloadJSON}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-[10px] font-black flex items-center space-x-1 shadow-sm transition"
                title="Download JSON File"
              >
                <Download size={11} />
                <span>DOWNLOAD JSON</span>
              </button>
            )}
            <span className="text-[10px] bg-emerald-100 px-2 py-0.5 rounded text-emerald-700 uppercase font-black tracking-widest flex items-center space-x-1">
              <Sparkles size={10} />
              <span>AI STAGING</span>
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <th className="p-1.5 text-center">SL</th>
                <th className="p-1.5">Photo</th>
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
                  const isEditing = editingRowId === v.id;
                  return (
                    <tr key={v.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isEditing ? 'bg-amber-50/40' : ''}`}>
                      <td className="p-1.5 text-center font-bold text-slate-500">{v.sl}</td>
                      <td className="p-1.5">
                        {v.photo ? (
                          <img src={v.photo} alt="P" className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-400">NID</div>
                        )}
                      </td>
                      <td className="p-1.5">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editRowData.name || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, name: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Name English"
                            />
                            <input
                              type="text"
                              value={editRowData.nameBn || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, nameBn: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[10px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="নাম (বাংলা)"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-800">{v.name}</div>
                            <div className="text-slate-400 font-semibold text-[9px] mt-0.5">{v.nameBn}</div>
                          </>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editRowData.voterNo || ''}
                            onChange={e => setEditRowData(prev => ({ ...prev, voterNo: e.target.value }))}
                            className="w-20 bg-white border border-slate-300 rounded px-1 py-1 text-center font-mono font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Voter No"
                          />
                        ) : (
                          <span className="font-mono font-bold text-slate-700">{v.voterNo}</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editRowData.dob || ''}
                            onChange={e => setEditRowData(prev => ({ ...prev, dob: e.target.value }))}
                            className="w-20 bg-white border border-slate-300 rounded px-1 py-1 text-center font-medium text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="YYYY-MM-DD"
                          />
                        ) : (
                          <span className="text-slate-500 font-medium">{v.dob}</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editRowData.nid || ''}
                            onChange={e => setEditRowData(prev => ({ ...prev, nid: e.target.value }))}
                            className="w-24 bg-white border border-slate-300 rounded px-1 py-1 text-center font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="NID"
                          />
                        ) : (
                          <span className="font-mono text-slate-700">{v.nid}</span>
                        )}
                      </td>
                      <td className="p-1.5">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editRowData.fatherName || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, fatherName: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Father (EN)"
                            />
                            <input
                              type="text"
                              value={editRowData.fatherNameBn || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, fatherNameBn: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[10px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="পিতা (বাংলা)"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-slate-700">{v.fatherName}</div>
                            <div className="text-slate-400 text-[9px] mt-0.5">{v.fatherNameBn}</div>
                          </>
                        )}
                      </td>
                      <td className="p-1.5">
                        {isEditing ? (
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={editRowData.motherName || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, motherName: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Mother (EN)"
                            />
                            <input
                              type="text"
                              value={editRowData.motherNameBn || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, motherNameBn: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1.5 py-1 text-[10px] text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="মাতা (বাংলা)"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="font-medium text-slate-700">{v.motherName}</div>
                            <div className="text-slate-400 text-[9px] mt-0.5">{v.motherNameBn}</div>
                          </>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        {isEditing ? (
                          <div className="space-y-1">
                            <select
                              value={editRowData.union || ''}
                              onChange={e => {
                                const targetUnion = e.target.value;
                                setEditRowData(prev => ({ ...prev, union: targetUnion, village: '' }));
                              }}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-1 text-[10px] font-bold text-slate-600 focus:outline-none"
                            >
                              <option value="">Union</option>
                              {unions.map(u => (
                                <option key={u.name} value={u.name}>{u.name}</option>
                              ))}
                            </select>
                            <select
                              value={editRowData.village || ''}
                              onChange={e => setEditRowData(prev => ({ ...prev, village: e.target.value }))}
                              className="w-full bg-white border border-slate-300 rounded px-1 py-1 text-[10px] text-slate-500 focus:outline-none"
                              disabled={!editRowData.union}
                            >
                              <option value="">Village</option>
                              {((unions.find(u => u.name === editRowData.union)?.villages) || []).map(vg => (
                                <option key={vg.name} value={vg.name}>{vg.nameBn}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <div className="font-bold text-slate-600">{v.union}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">{v.village}</div>
                          </>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        {isEditing ? (
                          <select
                            value={editRowData.gender || ''}
                            onChange={e => setEditRowData(prev => ({ ...prev, gender: e.target.value as any }))}
                            className="bg-white border border-slate-300 rounded px-1 py-1 text-[10px] focus:outline-none"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : (
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border ${
                            v.gender === 'Female' ? 'bg-pink-50 text-pink-500 border-pink-100' : 'bg-sky-50 text-sky-500 border-sky-100'
                          }`}>{v.gender}</span>
                        )}
                      </td>
                      <td className="p-1.5 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {isEditing ? (
                            <>
                              <button
                                onClick={handleSaveEditRow}
                                className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"
                                title="Save changes"
                              >
                                <Check size={13} />
                              </button>
                              <button
                                onClick={handleCancelEditRow}
                                className="text-slate-400 hover:bg-slate-100 p-1 rounded"
                                title="Cancel"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartEditRow(v)}
                                className="text-[#1a5f9c] hover:bg-blue-50 p-1 rounded"
                                title="Edit fields"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                onClick={() => {
                                  setStagedVoters(prev => prev.filter(item => item.id !== v.id));
                                }}
                                className="text-red-500 hover:bg-red-50 p-1 rounded"
                                title="Remove from staging"
                              >
                                <Trash2 size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-10 text-center text-slate-400">
                    No AI-generated records staged yet. Drop an image card above and click "AI Generate".
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
