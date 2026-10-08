import React, { useState } from 'react';
import { X, Upload, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Case } from '../types';
import { api } from '../services/api';

interface UploadEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cases: Case[];
  activeCaseId: string;
  onEvidenceUploaded: () => void;
}

export const UploadEvidenceModal: React.FC<UploadEvidenceModalProps> = ({
  isOpen,
  onClose,
  cases,
  activeCaseId,
  onEvidenceUploaded
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState(activeCaseId || (cases[0]?.id || ''));
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an evidence file to upload.');
      return;
    }
    if (!selectedCaseId) {
      setError('Please specify a target case docket.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.uploadEvidence(selectedCaseId, file, notes);
      setFile(null);
      setNotes('');
      onEvidenceUploaded();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Evidence upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center text-[#004E9B]">
              <Upload className="w-4 h-4 text-[#0091B9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#004E9B]">Deposit Evidence Artifact</h2>
              <p className="text-xs text-slate-500">Cryptographically seal in tamper-evident ledger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Destination Case Docket *
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
              required
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.case_code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Evidence File *
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
              <input
                type="file"
                id="modal-evd-file"
                className="hidden"
                accept=".txt,.csv,.json,.pdf,.docx,.xlsx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="modal-evd-file" className="cursor-pointer block">
                {file ? (
                  <div className="flex items-center justify-center space-x-2 text-[#0091B9]">
                    <CheckCircle2 className="w-5 h-5 text-[#0091B9]" />
                    <span className="text-xs font-semibold text-slate-800">{file.name}</span>
                    <span className="text-[10px] text-slate-500">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <>
                    <FileText className="w-8 h-8 text-[#0091B9] mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-700">
                      Click to browse or drop an investigative file
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      PDF, CSV, TXT, DOCX, XLSX (Automatic schema detection & SHA-256 seal)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chain of Custody Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Seized CDR logs received from Telecom Enforcement Division"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Seal & Process File</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
