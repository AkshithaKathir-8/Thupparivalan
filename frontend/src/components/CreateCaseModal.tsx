import React, { useState } from 'react';
import { X, FolderPlus, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCaseId: string) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('Chennai South');
  const [priority, setPriority] = useState('HIGH');
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Case title is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const createdCase = await api.createCase({
        title,
        description,
        district,
        priority,
        notes
      });

      if (selectedFile) {
        await api.uploadEvidence(createdCase.id, selectedFile, notes);
      }

      setTitle('');
      setDescription('');
      setNotes('');
      setSelectedFile(null);
      onCaseCreated(createdCase.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create case');
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
              <FolderPlus className="w-4 h-4 text-[#0091B9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#004E9B]">Register Investigation Case</h2>
              <p className="text-xs text-slate-500">Initiate a formal case file in the intelligence database</p>
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
              Case Title / Incident Heading *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Special Cargo Divergence & Intercept"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jurisdictional District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Priority Classification
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Incident Synopsis / Preliminary Brief
            </label>
            <textarea
              rows={3}
              placeholder="Provide context on initial FIR, suspect movements, or financial abnormalities..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9]"
            />
          </div>

          {/* Initial Evidence Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Evidence Artifact (Optional)
            </label>
            <div className="border border-dashed border-slate-200 rounded-lg p-3 text-center bg-slate-50/50 hover:bg-slate-50 cursor-pointer">
              <input
                type="file"
                id="case-evd-file"
                className="hidden"
                accept=".txt,.csv,.json,.pdf,.docx,.xlsx"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
              />
              <label htmlFor="case-evd-file" className="cursor-pointer block">
                <Upload className="w-5 h-5 text-[#0091B9] mx-auto mb-1" />
                <span className="text-xs font-medium text-slate-600">
                  {selectedFile ? selectedFile.name : 'Attach FIR, CDR CSV, or Intelligence Note'}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Supported formats: PDF, CSV, TXT, DOCX, JSON
                </p>
              </label>
            </div>
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
              <span>Register & Process Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
