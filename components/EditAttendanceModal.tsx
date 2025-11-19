import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Clock, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AttendanceRecord, Worker } from '../types';

interface EditAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  worker: Worker;
  date: string;
  existingRecord?: AttendanceRecord;
}

const EditAttendanceModal: React.FC<EditAttendanceModalProps> = ({
  isOpen,
  onClose,
  worker,
  date,
  existingRecord
}) => {
  const { upsertRecord, deleteRecord, sites } = useAppStore();
  
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [siteId, setSiteId] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingRecord) {
        const start = existingRecord.checkInTime ? new Date(existingRecord.checkInTime) : null;
        const end = existingRecord.checkOutTime ? new Date(existingRecord.checkOutTime) : null;
        
        setCheckInTime(start ? start.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '');
        setCheckOutTime(end ? end.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '');
        setSiteId(existingRecord.siteId);
      } else {
        setCheckInTime('');
        setCheckOutTime('');
        setSiteId(sites[0]?.id || '');
      }
    }
  }, [isOpen, existingRecord, sites]);

  const handleSave = () => {
    if (!siteId) return;

    // Helper to combine YYYY-MM-DD and HH:MM into ISO string
    const toIso = (timeStr: string) => {
      if (!timeStr) return undefined;
      return new Date(`${date}T${timeStr}:00`).toISOString();
    };

    const startIso = checkInTime ? toIso(checkInTime) : undefined;
    const endIso = checkOutTime ? toIso(checkOutTime) : undefined;

    // Only save if at least check-in is present
    if (startIso) {
      upsertRecord({
        id: existingRecord?.id,
        workerId: worker.id,
        date: date,
        siteId: siteId,
        checkInTime: startIso,
        checkOutTime: endIso,
        status: 'CHECKED_IN' // Simplified for demo
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (existingRecord) {
      deleteRecord(existingRecord.id);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            <Clock size={18} className="text-indigo-400" />
            勤怠修正
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Worker Info */}
          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <img src={worker.avatarUrl} alt={worker.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{worker.company}</div>
              <div className="text-lg font-bold text-slate-800">{worker.name}</div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Date Display */}
            <div className="text-sm font-bold text-slate-500 border-b border-slate-100 pb-2">
              対象日: {date}
            </div>

            {/* Site Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                 <MapPin size={12} /> 現場
              </label>
              <select 
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">入場時間</label>
                <input 
                  type="time" 
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">退場時間</label>
                <input 
                  type="time" 
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {existingRecord && (
              <button 
                onClick={handleDelete}
                className="flex items-center justify-center p-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                title="削除"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button 
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-bold transition shadow-lg shadow-indigo-200"
            >
              <Save size={18} />
              保存する
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAttendanceModal;
