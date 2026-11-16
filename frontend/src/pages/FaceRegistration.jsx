import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, CameraOff, RotateCcw, Zap, CheckCircle, AlertCircle, Video, Search } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const MAX_SAMPLES = 10;

export default function FaceRegistration() {
  const [searchParams] = useSearchParams();

  const [studentIdInput, setStudentIdInput] = useState(searchParams.get('student') || '');
  const [student, setStudent]               = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const [cameraDevices, setCameraDevices]   = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [cameraOn, setCameraOn]             = useState(false);
  const [cameraError, setCameraError]       = useState('');

  const [captured, setCaptured]       = useState([]);
  const [encoding, setEncoding]       = useState(false);
  const [encodingDone, setEncodingDone] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100 upload progress %

  // Student search autocomplete
  const [suggestions, setSuggestions]   = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef(null);

  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    enumerateWebcams();
    if (searchParams.get('student')) loadStudent(searchParams.get('student'));
    return () => stopCamera();
  }, []);

  /* ── Student search autocomplete ── */
  const handleStudentInput = (val) => {
    setStudentIdInput(val.toUpperCase());
    setShowSuggestions(true);
    clearTimeout(searchDebounceRef.current);
    if (val.length < 1) { setSuggestions([]); return; }
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/students', { params: { search: val, limit: 8 } });
        setSuggestions(res.data.data || []);
      } catch { setSuggestions([]); }
    }, 250);
  };

  const pickSuggestion = (s) => {
    setStudentIdInput(s.student_id);
    setSuggestions([]);
    setShowSuggestions(false);
    loadStudent(s.student_id);
  };

  /* ── Enumerate webcams (request permission first so labels show) ── */
  const enumerateWebcams = async () => {
    try {
      const tmp = await navigator.mediaDevices.getUserMedia({ video: true });
      tmp.getTracks().forEach(t => t.stop());
    } catch {}
    try {
      const all  = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === 'videoinput');
      setCameraDevices(cams);
      if (cams.length > 0) setSelectedDevice(cams[0].deviceId);
    } catch {}
  };

  const loadStudent = async (id) => {
    setLoadingStudent(true);
    setEncodingDone(false);
    setCaptured([]);
    try {
      const res = await api.get(`/students/${id.trim().toUpperCase()}`);
      setStudent(res.data.data);
    } catch { toast.error('Student not found'); setStudent(null); }
    finally { setLoadingStudent(false); }
  };

  /* ── Start webcam ── */
  const startCamera = async () => {
    setCameraError('');
    try {
      const constraints = {
        video: {
          width:  { ideal: 1280 },
          height: { ideal: 720  },
          ...(selectedDevice
            ? { deviceId: { exact: selectedDevice } }
            : { facingMode: 'user' }),
        },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);

      // Refresh device list so labels appear
      const all  = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === 'videoinput');
      setCameraDevices(cams);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'     ? 'Camera permission denied. Allow in browser settings.' :
        err.name === 'NotFoundError'       ? 'No webcam found. Connect a webcam and try again.' :
        err.name === 'OverconstrainedError' ? 'Selected camera unavailable. Choose another device.' :
        `Camera error: ${err.message}`;
      setCameraError(msg);
      toast.error(msg);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  /* Switch device live */
  const switchCamera = (deviceId) => {
    setSelectedDevice(deviceId);
    if (cameraOn) { stopCamera(); setTimeout(() => startCameraWithDevice(deviceId), 200); }
  };

  const startCameraWithDevice = async (deviceId) => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, deviceId: { exact: deviceId } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOn(true);
    } catch (err) { setCameraError(`Switch failed: ${err.message}`); }
  };

  /* ── Capture sample ── */
  const captureSample = () => {
    if (!cameraOn || !videoRef.current || !canvasRef.current) return;
    if (captured.length >= MAX_SAMPLES) { toast.error('Already captured 10 samples'); return; }
    const v = videoRef.current, c = canvasRef.current;
    c.width  = v.videoWidth  || 640;
    c.height = v.videoHeight || 480;
    c.getContext('2d').drawImage(v, 0, 0);
    const dataUrl = c.toDataURL('image/jpeg', 0.9);
    setCaptured(prev => [...prev, dataUrl]);
    toast.success(`Sample ${captured.length + 1}/${MAX_SAMPLES} captured`);
  };

  const retake = () => { setCaptured([]); setEncodingDone(false); };

  /* ── Generate encoding: step 1 upload each sample, step 2 encode ── */
  const generateEncoding = async () => {
    if (!student) { toast.error('Select a student first'); return; }
    if (captured.length < 3) { toast.error('Capture at least 3 samples first'); return; }
    setEncoding(true);
    setUploadProgress(0);
    try {
      // Step 1: Upload each captured sample one-by-one with live progress
      for (let i = 0; i < captured.length; i++) {
        const blob = await fetch(captured[i]).then(r => r.blob());
        const fd = new FormData();
        fd.append('student_id', student.student_id);
        fd.append('sample_index', String(i));
        fd.append('image', blob, `sample_${i}.jpg`);
        await api.post('/face/register', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        // Update progress: uploading takes 80%, encoding takes last 20%
        setUploadProgress(Math.round(((i + 1) / captured.length) * 80));
      }

      // Step 2: Generate encoding from all uploaded samples
      setUploadProgress(85);
      const fd2 = new FormData();
      fd2.append('student_id', student.student_id);
      await api.post('/face/encode', fd2, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadProgress(100);

      setEncodingDone(true);
      toast.success('✅ Face encoding generated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Encoding failed. Make sure your face is visible in the samples.');
    } finally { setEncoding(false); setUploadProgress(0); }
  };

  const deviceLabel = (d, i) => d.label || `Webcam ${i + 1}`;

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>
        {student
          ? `Face Registration — ${student.student_id} : ${student.name}`
          : 'Face Registration'}
      </h1>

      {/* Student search */}
      {!student && (
        <div className="card mb-4">
          <div className="card-body">
            <p style={{ marginBottom: 12, fontSize: 13, color: '#6b7280' }}>Search by Student ID or Name to begin:</p>
            <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                <input
                  className="form-control"
                  placeholder="Search Student ID or Name..."
                  value={studentIdInput}
                  onChange={e => handleStudentInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { setShowSuggestions(false); loadStudent(studentIdInput); } if (e.key === 'Escape') setShowSuggestions(false); }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  style={{ paddingLeft: 32 }}
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999,
                    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)', marginTop: 4, overflow: 'hidden',
                  }}>
                    {suggestions.map(s => (
                      <div
                        key={s.student_id}
                        onMouseDown={() => pickSuggestion(s)}
                        style={{
                          padding: '10px 14px', cursor: 'pointer', fontSize: 13,
                          borderBottom: '1px solid #f3f4f6',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                      >
                        <span style={{ fontWeight: 600, color: '#1d4ed8' }}>{s.student_id}</span>
                        <span style={{ color: '#374151' }}>{s.name}</span>
                        <span style={{ color: '#9ca3af', fontSize: 11 }}>{s.department}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-primary" onClick={() => { setShowSuggestions(false); loadStudent(studentIdInput); }} disabled={loadingStudent}>
                {loadingStudent
                  ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Loading...</>
                  : 'Load Student'}
              </button>
            </div>
          </div>
        </div>
      )}

      {student && (
        <>
          {/* Webcam picker — always visible above camera */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 240 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>📷 Webcam Device</label>
              <select
                className="form-control"
                value={selectedDevice}
                onChange={e => switchCamera(e.target.value)}
                disabled={cameraDevices.length === 0}
              >
                {cameraDevices.length === 0
                  ? <option value="">No webcam detected</option>
                  : cameraDevices.map((d, i) => (
                      <option key={d.deviceId} value={d.deviceId}>{deviceLabel(d, i)}</option>
                    ))
                }
              </select>
            </div>
            <button className="btn btn-outline-gray btn-sm" onClick={enumerateWebcams}>Refresh Devices</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
            {/* Camera area */}
            <div className="card">
              <div className="camera-container" style={{ height: 420 }}>
                <video
                  ref={videoRef}
                  className="camera-video"
                  autoPlay muted playsInline
                  style={{ display: cameraOn ? 'block' : 'none' }}
                />
                {!cameraOn && (
                  <div className="camera-overlay">
                    {cameraError
                      ? <><AlertCircle size={34} color="#dc2626" />
                          <span style={{ color: '#dc2626', fontSize: 13, maxWidth: 280, textAlign: 'center' }}>{cameraError}</span></>
                      : <><Video size={40} color="rgba(255,255,255,0.3)" />
                          <span style={{ fontSize: 13 }}>Select a webcam and click Start Camera</span></>
                    }
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} style={{ display: 'none' }} />

              {/* Buttons */}
              <div className="flex gap-2 flex-wrap" style={{ padding: '14px 16px' }}>
                {!cameraOn
                  ? <button className="btn btn-primary" onClick={startCamera} disabled={cameraDevices.length === 0}><Camera size={15} /> Start Camera</button>
                  : <button className="btn btn-danger"  onClick={stopCamera}><CameraOff size={15} /> Stop Camera</button>
                }
                <button className="btn btn-success" onClick={captureSample} disabled={!cameraOn || captured.length >= MAX_SAMPLES}>
                  <Camera size={15} /> Capture Sample ({captured.length}/{MAX_SAMPLES})
                </button>
                <button className="btn btn-warning" onClick={retake} disabled={captured.length === 0}>
                  <RotateCcw size={15} /> Retake
                </button>
                <button className="btn btn-purple" onClick={generateEncoding} disabled={encoding || captured.length < 3}>
                  {encoding
                    ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Generating...</>
                    : <><Zap size={15} /> Generate Encoding</>}
                </button>
              </div>

              {encodingDone && (
                <div className="alert alert-success" style={{ margin: '0 16px 14px' }}>
                  <CheckCircle size={16} /> Face Encoding Generated Successfully!
                </div>
              )}
              {/* Upload progress bar — shown while encoding */}
              {encoding && uploadProgress > 0 && (
                <div style={{ margin: '0 16px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    <span>{uploadProgress < 85 ? `Uploading samples…` : uploadProgress < 100 ? 'Generating encoding…' : 'Done!'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${uploadProgress}%`, background: uploadProgress === 100 ? '#16a34a' : '#2563eb', borderRadius: 99, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
            </div>

            {/* Right panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Instructions */}
              <div className="card">
                <div className="card-header"><span className="card-title">Instructions</span></div>
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  {['Look at the camera', 'Keep a neutral expression', 'Ensure good lighting', 'Stay within the frame'].map((txt, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: '50%', background: '#2563eb',
                        color: '#fff', fontSize: 11, fontWeight: 700,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: '#374151' }}>{txt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Captured Samples - thumbnails so user can verify quality */}
              <div className="card">
                <div className="card-header"><span className="card-title">Captured Samples ({captured.length}/{MAX_SAMPLES})</span></div>
                <div className="card-body" style={{ padding: '14px 16px' }}>
                  {captured.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, margin: 0 }}>
                      No samples yet. Start camera and click Capture.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                      {captured.map((dataUrl, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img src={dataUrl} alt={Sample }
                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 6, border: '2px solid #16a34a', display: 'block' }} />
                          <div style={{ position: 'absolute', bottom: 2, right: 4, background: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 3, padding: '1px 4px' }}>{i+1}</div>
                        </div>
                      ))}
                      {Array.from({ length: MAX_SAMPLES - captured.length }).map((_, i) => (
                        <div key={e} style={{ aspectRatio: '1', borderRadius: 6, border: '2px dashed #e5e7eb', background: '#f9fafb' }} />
                      ))}
                    </div>
                  )}
                  {captured.length === MAX_SAMPLES && (
                    <p style={{ textAlign: 'center', color: '#16a34a', fontSize: 12, fontWeight: 600, marginTop: 10, marginBottom: 0 }}>
                      All {MAX_SAMPLES} samples captured!
                    </p>
                  )}
                </div>
              </div>

              {/* Student info */}
              <div className="card">
                <div className="card-body" style={{ padding: '14px 16px', fontSize: 13 }}>
                  <div className="flex justify-between mb-2"><span style={{ color:'#6b7280' }}>Student ID</span><span style={{ fontWeight:600 }}>{student.student_id}</span></div>
                  <div className="flex justify-between mb-2"><span style={{ color:'#6b7280' }}>Name</span><span style={{ fontWeight:600 }}>{student.name}</span></div>
                  <div className="flex justify-between"><span style={{ color:'#6b7280' }}>Department</span><span style={{ fontWeight:600, textAlign:'right' }}>{student.department}</span></div>
                </div>
              </div>

              {/* Change student link */}
              <button
                className="btn btn-outline-gray w-full"
                style={{ justifyContent: 'center', fontSize: 12 }}
                onClick={() => { setStudent(null); setStudentIdInput(''); setCaptured([]); setEncodingDone(false); stopCamera(); }}
              >
                Change Student
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
