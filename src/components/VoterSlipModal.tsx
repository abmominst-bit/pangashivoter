import React from 'react';
import { SystemSettings, Voter } from '../types';
import { Printer, X, User } from 'lucide-react';
import PhotoViewerModal from './PhotoViewerModal';

interface VoterSlipModalProps {
  voter: Voter | null;
  isOpen: boolean;
  onClose: () => void;
  settings?: SystemSettings;
}

export default function VoterSlipModal({
  voter,
  isOpen,
  onClose,
  settings
}: VoterSlipModalProps) {

  if (!isOpen || !voter) return null;

  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = React.useState(false);

  const formatDate = (dobString?: string | null) => {
    if (!dobString) return '';

    const match = dobString.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (match) {
      const [, year, month, day] = match;
      return `${day}-${month}-${year}`;
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

  const handlePrint = () => {
    window.print();
  };

  // Load Union-specific candidate details if set, otherwise fallback to global candidate details with defaults
  const unionName = voter?.union || '';

  const candidateName = (unionName && settings?.candidateNameByUnion?.[unionName]) || settings?.candidateName || 'মোঃ রেজাউল করিম (মুকুল)';
  const candidatePhoto = (unionName && settings?.candidatePhotoByUnion?.[unionName]) || settings?.candidatePhoto || '/mukul.png';
  const candidateSymbol = (unionName && settings?.candidateSymbolByUnion?.[unionName]) || settings?.candidateSymbol || '/marka.png';
  const candidateSymbolName = (unionName && settings?.candidateSymbolNameByUnion?.[unionName]) || settings?.candidateSymbolName || 'মোরগ';
  const candidateSlogan = (unionName && settings?.candidateSloganByUnion?.[unionName]) || settings?.candidateSlogan || 'আমাকে আপনার মূল্যবান ভোট দিয়ে জয়যুক্ত করুন।';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur overflow-y-auto no-print">

      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              #root, .no-print {
                display: none !important;
              }

              .print-slip-container {
                display: block !important;
                visibility: visible !important;
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                width: 100% !important;
                max-width: 600px !important;
              }

              .print-slip-card {
                background: linear-gradient(135deg, #0a0720 0%, #120c3a 50%, #060414 100%) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color: white !important;
                box-shadow: none !important;
                border: 3px double #f59e0b !important;
                border-radius: 24px !important;
                padding: 24px !important;
              }

              .print-bg-panel {
                background-color: rgba(255, 255, 255, 0.06) !important;
                border: 1px solid rgba(255, 255, 255, 0.12) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-bg-bar {
                background: linear-gradient(90deg, rgba(6, 182, 212, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%) !important;
                border: 1px solid rgba(6, 182, 212, 0.3) !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              .print-text-white {
                color: white !important;
              }

              .print-text-amber {
                color: #fbbf24 !important;
              }
            }
          `
        }}
      />

      <div className="bg-white rounded-3xl shadow-2xl border max-w-2xl w-full overflow-hidden print-slip-container">

        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 no-print">
          <div className="flex gap-2 items-center">
            <div className="bg-emerald-50 text-emerald-700 p-2 rounded-xl">
              <Printer size={18}/>
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-slate-800">
                ভোটার স্লিপ প্রিন্ট (Print Slip)
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Official Voter Slip Card
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 bg-slate-100 flex justify-center">

          {/* Premium styled card mimicking the reference screenshot exactly */}
          <div className="relative bg-gradient-to-br from-[#0a0720] via-[#120c3a] to-[#060414] border-[3px] border-double border-amber-500 rounded-3xl p-6 w-full max-w-xl shadow-xl overflow-hidden print-slip-card text-white">

            {/* Background Marka Watermark */}
            <div className="absolute inset-0 flex justify-center items-center pointer-events-none z-0">
              {candidateSymbol ? (
                <img
                  src={candidateSymbol}
                  alt="Marka Watermark"
                  className="w-72 h-72 object-contain opacity-[0.05]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <img
                  src="/marka.png"
                  alt="Marka Watermark"
                  className="w-72 h-72 object-contain opacity-[0.05]"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Top Bismillah Banner */}
            <div className="relative z-10 text-center mb-4 select-none">
              <span className="text-[10px] text-amber-400 font-bold block">بِسْمِ اللهِ الرَّحْمٰনِ الرَّحِيْمِ</span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wide block">বিসমিল্লাহির রাহমানির রাহিম</span>
            </div>

            {/* Candidate Header Area */}
            <div className="relative z-10 flex items-center justify-between mb-5 pb-3 border-b border-white/10">

              {/* Left Side: Photo & Name */}
              <div className="flex gap-3.5 items-center">
                
                {/* Profile Pic Ring */}
                <div className="relative shrink-0">
                  <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-sm"></div>
                  <div className="w-25 h-25 rounded-full border-2 border-cyan-400 p-0.5 bg-slate-900 overflow-hidden relative z-10">
                    {candidatePhoto ? (
                      <img
                        src={candidatePhoto}
                        alt="Candidate Profile"
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <img
                        src="/mukul.png"
                        alt="Candidate Profile"
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>

                {/* Name, Symbol/Marka Name */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base font-black text-white tracking-tight drop-shadow-sm">
                      {candidateName}
                    </h2>
                    <span className="w-5 h-5 rounded-full border border-amber-400 bg-amber-400/20 flex items-center justify-center text-[10px] font-extrabold text-amber-300 shrink-0 select-none">
                      কে
                    </span>
                  </div>
                  <p className="text-[10px] text-cyan-400 font-bold tracking-wide flex items-center gap-1">
                    <span className="opacity-80"></span>
                    <span className="text-amber-400 font-extrabold">{candidateSymbolName}</span>
                  </p>
                </div>

              </div>

              {/* Right Side: Symbol Image */}
              <div className="relative shrink-0 w-16 h-16 flex items-center justify-center">
                {candidateSymbol ? (
                  <img
                    src={candidateSymbol}
                    alt="Candidate Symbol"
                    className="w-50 h-50 object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img
                    src="/marka.png"
                    alt="Candidate Symbol"
                    className="w-50 h-50 object-contain filter drop-shadow-[0_0_6px_rgba(245,158,11,0.3)]"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>

            </div>

            {/* Glowing "ভোটারের তথ্য" Center Banner */}
            <div className="relative z-10 mb-5">
              <div className="relative overflow-hidden bg-gradient-to-r from-cyan-950/40 via-emerald-950/40 to-cyan-950/40 border border-cyan-500/30 px-4 py-2 rounded-xl text-center print-bg-bar">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent animate-pulse"></div>
                <h3 className="text-xs font-black tracking-widest text-cyan-300 font-sans">
                  ভোটারের তথ্য
                </h3>
              </div>
            </div>

            {/* Voter Details Block with Dual Columns: Info on Left, Voter Photo on Right */}
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 mb-6 text-sm">
              {/* Left side: Information Rows */}
              <div className="flex-1 space-y-3">
                {/* SL Row */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2 print-bg-panel hover:bg-white/10 transition duration-150">
                  <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                    সিরিয়াল নাম্বারঃ
                  </span>
                  <span className="font-extrabold text-white tracking-wide text-xs sm:text-sm">
                    {voter.sl}
                  </span>
                </div>

                {/* Name Row */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2 print-bg-panel hover:bg-white/10 transition duration-150">
                  <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                    নামঃ
                  </span>
                  <span className="font-extrabold text-white text-xs sm:text-sm">
                    {voter.nameBn}
                  </span>
                </div>

                {/* Birth Date Row */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2 print-bg-panel hover:bg-white/10 transition duration-150">
                  <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>
                    জন্ম তারিখঃ
                  </span>
                  <span className="font-extrabold text-white tracking-wide text-xs sm:text-sm">
                    {formatDate(voter.dob)}
                  </span>
                </div>

                {/* Dynamic Age Row */}
                {(() => {
                  const ageInfo = calculateAge(voter.dob);
                  return ageInfo ? (
                    <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-2 print-bg-panel hover:bg-white/10 transition duration-150">
                      <span className="text-slate-300 font-bold text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                        বয়স (Age)：
                      </span>
                      <span className="font-extrabold text-amber-300 tracking-wide text-xs sm:text-sm text-right">
                        {ageInfo.textBn} <span className="text-slate-400 text-[10px] font-normal font-sans">({ageInfo.text})</span>
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Right side: Voter Photo Framed elegantly */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <div className="relative">
                  <div className="absolute inset-0 rounded-2xl bg-cyan-500/10 blur-xs"></div>
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-white/20 p-1 bg-white/5 relative z-10 overflow-hidden flex items-center justify-center">
                    {voter.photo ? (
                      <button
                        type="button"
                        onClick={() => setIsPhotoViewerOpen(true)}
                        className="relative group w-full h-full block focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-xl overflow-hidden cursor-pointer"
                        title="Click to view and download photo / বড় করে দেখতে ও ডাউনলোড করতে ক্লিক করুন"
                      >
                        <img
                          src={voter.photo}
                          alt="Voter Profile"
                          className="w-full h-full object-cover rounded-xl transition duration-200 group-hover:scale-110 group-hover:brightness-95"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded-xl">
                          <span className="text-[9px] text-white font-extrabold select-none">VIEW</span>
                        </div>
                      </button>
                    ) : (
                      <div className="text-center text-slate-400 p-2 flex flex-col items-center justify-center">
                        <User size={36} className="text-slate-500" />
                        <span className="text-[9px] mt-1 font-bold text-slate-500 uppercase tracking-wider">No Photo</span>
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] text-cyan-400/80 font-bold mt-1.5 uppercase tracking-wider select-none">
                  ভোটার ছবি
                </span>
              </div>
            </div>

            {/* Footer Row */}
            <div className="relative z-10 border-t border-white/10 pt-4 flex items-center justify-between">

              {/* Campaign Slogan Message */}
              <div className="max-w-[280px]">
                <p className="text-[10px] text-amber-400/90 font-bold italic leading-relaxed">
                  * {candidateSlogan}
                </p>
              </div>

              {/* "ভোটার স্লিপ" Accent Badge */}
              <div className="text-center">
                <span className="px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[10px] font-black text-amber-400 tracking-wider">
                  ভোটার স্লিপ
                </span>
              </div>

              {/* Dynamic QR Code from official api */}
              <div className="bg-white p-1 rounded-lg border border-white/20 shrink-0 flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`Sl: ${voter.sl}\nName: ${voter.nameBn}\nNID: ${voter.nid}\nVoter No: ${voter.voterNo}\nUnion: ${voter.union}\nVillage: ${voter.village}`)}`}
                  alt="Voter QR"
                  className="w-11 h-11 object-contain select-none"
                />
              </div>

            </div>

          </div>

        </div>

        {/* Buttons */}
        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50 no-print">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition duration-150 cursor-pointer"
          >
            বন্ধ করুন (Close)
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition duration-150 cursor-pointer"
          >
            <Printer size={15}/>
            প্রিন্ট করুন (Print)
          </button>
        </div>

      </div>

      <PhotoViewerModal
        isOpen={isPhotoViewerOpen}
        photoUrl={voter.photo}
        voterName={voter.name}
        voterNameBn={voter.nameBn}
        voterNo={voter.voterNo}
        gender={voter.gender}
        onClose={() => setIsPhotoViewerOpen(false)}
      />

    </div>
  );
}
