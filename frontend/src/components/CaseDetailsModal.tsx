import React, { useEffect, useState } from 'react';
import {
  X,
  Eye,
  Pencil,
  Loader2,
  AlertCircle,
  Save
} from 'lucide-react';
import { api } from '../services/api';

interface CaseDetailsModalProps {
  isOpen: boolean;
  caseId: string;
  mode: 'view' | 'edit';
  onClose: () => void;
  onUpdated: () => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  isOpen,
  caseId,
  mode,
  onClose,
  onUpdated
}) => {
  const [caseCode, setCaseCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [district, setDistrict] = useState('');
  const [priority, setPriority] = useState('HIGH');
  const [status, setStatus] = useState('ACTIVE');

  const [createdBy, setCreatedBy] = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');

  const [entityCount, setEntityCount] = useState(0);
  const [relationshipCount, setRelationshipCount] = useState(0);
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !caseId) return;

    const loadCase = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.getCase(caseId);

        setCaseCode(data.case_code);
        setTitle(data.title || '');
        setDescription(data.description || '');
        setDistrict(data.district || '');
        setPriority(data.priority || 'HIGH');
        setStatus(data.status || 'ACTIVE');

        setCreatedBy(data.created_by || '');
        setCreatedAt(data.created_at || '');
        setUpdatedAt(data.updated_at || '');

        setEntityCount(data.entity_count || 0);
        setRelationshipCount(data.relationship_count || 0);
        setEvidenceCount(data.evidence_count || 0);
        setAlertCount(data.alert_count || 0);
      } catch (err: any) {
        setError(err.message || 'Failed to load case details.');
      } finally {
        setLoading(false);
      }
    };

    loadCase();
  }, [isOpen, caseId]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Case title is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await api.updateCase(caseId, {
        title: title.trim(),
        description,
        district,
        priority,
        status
      });

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update case.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value: string) => {
    if (!value) return '—';

    try {
      return new Date(value).toLocaleString();
    } catch {
      return value;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-[#BAE4F0]/60 flex items-center justify-center">
              {mode === 'view' ? (
                <Eye className="w-4 h-4 text-[#0091B9]" />
              ) : (
                <Pencil className="w-4 h-4 text-[#0091B9]" />
              )}
            </div>

            <div>
              <h2 className="text-base font-bold text-[#004E9B]">
                {mode === 'view' ? 'Case Details' : 'Edit Case Details'}
              </h2>

              <p className="text-xs text-slate-500">
                {mode === 'view'
                  ? 'View the complete investigation case file'
                  : 'Update investigation case information'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs flex items-center space-x-2 border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#0091B9] animate-spin" />
            </div>
          ) : (
            <>
              {/* Case Code */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Case Code
                </label>

                <input
                  type="text"
                  value={caseCode}
                  readOnly
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 font-mono"
                />
              </div>

              {/* Title + District */}
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Case Title
                  </label>

                  <input
                    type="text"
                    value={title}
                    disabled={mode === 'view'}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9] disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jurisdictional District
                  </label>

                  <input
                    type="text"
                    value={district}
                    disabled={mode === 'view'}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9] disabled:bg-slate-50 disabled:text-slate-600"
                  />
                </div>

              </div>

              {/* Priority + Status */}
              <div className="grid grid-cols-2 gap-3">

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Classification
                  </label>

                  <select
                    value={priority}
                    disabled={mode === 'view'}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9] disabled:bg-slate-50 disabled:text-slate-600"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Case Status
                  </label>

                  <select
                    value={status}
                    disabled={mode === 'view'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9] disabled:bg-slate-50 disabled:text-slate-600"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Incident Synopsis / Description
                </label>

                <textarea
                  rows={4}
                  value={description}
                  disabled={mode === 'view'}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0091B9] disabled:bg-slate-50 disabled:text-slate-600"
                />
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-2 pt-1">

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-[#004E9B]">
                    {entityCount}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Entities
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-[#004E9B]">
                    {relationshipCount}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Relationships
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-[#004E9B]">
                    {evidenceCount}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Evidence
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-lg font-bold text-[#004E9B]">
                    {alertCount}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Alerts
                  </p>
                </div>

              </div>

              {/* Metadata */}
              <div className="grid grid-cols-3 gap-3 pt-1">

                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Created By
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {createdBy || '—'}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Created
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {formatDate(createdAt)}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">
                    Last Updated
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {formatDate(updatedAt)}
                  </p>
                </div>

              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200"
          >
            Close
          </button>

          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0091B9] hover:bg-[#007f9f] rounded-lg shadow-sm flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}

              <span>
                {saving ? 'Saving...' : 'Save Changes'}
              </span>
            </button>
          )}

        </div>
      </div>
    </div>
  );
};