import { useState, useRef, useCallback } from 'react';
import {
  Upload, X, FileSpreadsheet, FileText, CheckCircle,
  AlertCircle, Download, RotateCcw, Users, ChevronDown, ChevronUp,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const SUPPORTED = '.xlsx, .xls, .csv, .pdf';

/* ── small helpers ─────────────────────────────────────────────────────────── */
function FileIcon({ name }) {
  const ext = (name || '').split('.').pop().toLowerCase();
  const color = ext === 'pdf' ? '#ef4444' : ext === 'csv' ? '#16a34a' : '#2563eb';
  return ext === 'pdf'
    ? <FileText size={32} color={color} />
    : <FileSpreadsheet size={32} color={color} />;
}

function StatusBadge({ valid, errors }) {
  return valid
    ? <span className="badge badge-present" style={{ fontSize: 11 }}>✓ Valid</span>
    : (
      <span className="badge badge-danger" style={{ fontSize: 11 }} title={errors.join(', ')}>
        ✗ {errors.length} error{errors.length > 1 ? 's' : ''}
      </span>
    );
}

/* ── main component ────────────────────────────────────────────────────────── */
export default function BulkImport({ onClose, onImported }) {
  const fileRef = useRef();
  const [file, setFile]             = useState(null);
  const [dragging, setDragging]     = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting]   = useState(false);
  const [preview, setPreview]       = useState(null);   // { total, valid, invalid, rows }
  const [skipDups, setSkipDups]     = useState(true);
  const [showAll, setShowAll]       = useState(false);
  const [result, setResult]         = useState(null);   // import result

  /* ── drag-and-drop ────────────────────────────────────────────────────── */
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer?.files[0];
    if (f) pickFile(f);
  }, []);

  const pickFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv', 'pdf'].includes(ext)) {
      toast.error(`Unsupported format: .${ext}  (use Excel, CSV or PDF)`);
      return;
    }
    setFile(f);
    setPreview(null);
    setResult(null);
    setShowAll(false);
  };

  /* ── preview (dry run) ────────────────────────────────────────────────── */
  const handlePreview = async () => {
    if (!file) return;
    setPreviewing(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dry_run', 'true');
      fd.append('skip_duplicates', String(skipDups));
      const res = await api.post('/students/bulk-import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(res.data);
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Could not parse file');
    } finally { setPreviewing(false); }
  };

  /* ── actual import ────────────────────────────────────────────────────── */
  const handleImport = async () => {
    if (!file || !preview) return;
    if (preview.valid === 0) { toast.error('No valid rows to import'); return; }
    setImporting(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('dry_run', 'false');
      fd.append('skip_duplicates', String(skipDups));
      const res = await api.post('/students/bulk-import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(res.data);
      toast.success(`✅ Imported ${res.data.imported} student(s)!`);
      onImported?.();   // refresh parent list
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Import failed');
    } finally { setImporting(false); }
  };

  /* ── template download ────────────────────────────────────────────────── */
  const downloadTemplate = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/students/bulk-import/template', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = 'student_import_template.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Download failed'); }
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setShowAll(false); };

  const visibleRows = preview?.rows
    ? (showAll ? preview.rows : preview.rows.slice(0, 10))
    : [];

  /* ── render ──────────────────────────────────────────────────────────────*/
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 24px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Bulk Import Students</h2>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
              Upload an Excel, CSV, or PDF file to add multiple students at once
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={downloadTemplate}
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              <Download size={13} /> Sample Template
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <X size={20} color="#6b7280" />
            </button>
          </div>
        </div>

        {/* Body — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>

          {/* ── Result screen ── */}
          {result ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CheckCircle size={56} color="#16a34a" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Import Complete!</h3>
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Imported',    value: result.imported,     color: '#16a34a' },
                  { label: 'Duplicates',  value: result.duplicates,   color: '#f59e0b' },
                  { label: 'Invalid rows',value: result.invalid_rows, color: '#ef4444' },
                  { label: 'Errors',      value: result.errors?.length ?? 0, color: '#ef4444' },
                ].map(s => (
                  <div key={s.label} style={{
                    background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10,
                    padding: '14px 24px', minWidth: 120, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {result.errors?.length > 0 && (
                <div style={{ marginTop: 20, textAlign: 'left', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 14 }}>
                  <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: 8, fontSize: 13 }}>Row Errors:</p>
                  {result.errors.map((e, i) => (
                    <p key={i} style={{ fontSize: 12, color: '#7f1d1d', margin: '2px 0' }}>
                      Row {e.row} ({e.student_id}): {e.error}
                    </p>
                  ))}
                </div>
              )}
              <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button className="btn btn-outline-gray" onClick={reset}><RotateCcw size={14} /> Import Another</button>
                <button className="btn btn-primary" onClick={onClose}><Users size={14} /> View Students</button>
              </div>
            </div>
          ) : (
            <>
              {/* ── Drop zone ── */}
              {!file ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: `2px dashed ${dragging ? '#2563eb' : '#d1d5db'}`,
                    borderRadius: 12, padding: '48px 24px', textAlign: 'center',
                    cursor: 'pointer', background: dragging ? '#eff6ff' : '#fafafa',
                    transition: 'all 0.2s',
                  }}
                >
                  <Upload size={40} color={dragging ? '#2563eb' : '#9ca3af'} style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 15, fontWeight: 600, color: dragging ? '#2563eb' : '#374151' }}>
                    {dragging ? 'Drop your file here' : 'Drag & drop or click to browse'}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>
                    Supported: Excel (.xlsx, .xls), CSV, PDF
                  </p>
                  <input ref={fileRef} type="file" accept={SUPPORTED} style={{ display: 'none' }}
                    onChange={e => e.target.files[0] && pickFile(e.target.files[0])} />
                </div>
              ) : (
                /* ── File selected ── */
                <div style={{
                  border: '1px solid #e5e7eb', borderRadius: 12, padding: 16,
                  display: 'flex', alignItems: 'center', gap: 14, background: '#f9fafb',
                  marginBottom: 16,
                }}>
                  <FileIcon name={file.name} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{file.name}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                    <X size={18} color="#9ca3af" />
                  </button>
                </div>
              )}

              {/* Options row */}
              {file && !preview && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="checkbox" checked={skipDups} onChange={e => setSkipDups(e.target.checked)}
                      style={{ accentColor: '#2563eb', width: 15, height: 15 }} />
                    Skip duplicate Student IDs
                  </label>
                  <button className="btn btn-primary" onClick={handlePreview} disabled={previewing}>
                    {previewing
                      ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Parsing...</>
                      : <><Upload size={14} /> Preview Import</>}
                  </button>
                </div>
              )}

              {/* ── Preview table ── */}
              {preview && (
                <>
                  {/* Summary row */}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      { label: 'Total rows',   value: preview.total,   color: '#2563eb' },
                      { label: 'Valid',         value: preview.valid,   color: '#16a34a' },
                      { label: 'Invalid',       value: preview.invalid, color: '#ef4444' },
                    ].map(s => (
                      <div key={s.label} style={{
                        background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8,
                        padding: '10px 18px', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{s.label}</div>
                      </div>
                    ))}
                    <div style={{ flex: 1 }} />
                    <button className="btn btn-outline-gray" onClick={reset} style={{ fontSize: 12 }}>
                      <RotateCcw size={13} /> Change File
                    </button>
                  </div>

                  {/* Table */}
                  <div style={{ overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                          {['Row', 'Status', 'Student ID', 'Name', 'Department', 'Course', 'Sem', 'Section', 'Phone', 'Email'].map(h => (
                            <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {visibleRows.map((r, i) => (
                          <tr key={i} style={{ background: r.valid ? '#fff' : '#fef2f2', borderTop: '1px solid #f0f0f0' }}>
                            <td style={{ padding: '7px 10px', color: '#9ca3af' }}>{r.row}</td>
                            <td style={{ padding: '7px 10px' }}><StatusBadge valid={r.valid} errors={r.errors} /></td>
                            <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.student_id || '—'}</td>
                            <td style={{ padding: '7px 10px' }}>{r.name || '—'}</td>
                            <td style={{ padding: '7px 10px', color: '#6b7280' }}>{r.department || '—'}</td>
                            <td style={{ padding: '7px 10px', color: '#6b7280' }}>{r.course || '—'}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>{r.semester || '—'}</td>
                            <td style={{ padding: '7px 10px', textAlign: 'center' }}>{r.section || '—'}</td>
                            <td style={{ padding: '7px 10px', color: '#6b7280' }}>{r.phone || '—'}</td>
                            <td style={{ padding: '7px 10px', color: '#6b7280', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {preview.rows?.length > 10 && (
                    <button
                      onClick={() => setShowAll(v => !v)}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, cursor: 'pointer', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {showAll ? <><ChevronUp size={14} /> Show less</> : <><ChevronDown size={14} /> Show all {preview.rows.length} rows</>}
                    </button>
                  )}

                  {preview.invalid > 0 && (
                    <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 12, fontSize: 12 }}>
                      <AlertCircle size={14} color="#d97706" style={{ verticalAlign: 'middle', marginRight: 6 }} />
                      <strong>{preview.invalid}</strong> invalid row(s) will be skipped. Fix errors in your file and re-upload, or proceed to import only the valid rows.
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!result && preview && (
          <div style={{
            padding: '14px 24px', borderTop: '1px solid #f0f0f0',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
          }}>
            <button className="btn btn-outline-gray" onClick={onClose}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleImport}
              disabled={importing || preview.valid === 0}
            >
              {importing
                ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Importing...</>
                : <><Users size={14} /> Import {preview.valid} Student{preview.valid !== 1 ? 's' : ''}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
