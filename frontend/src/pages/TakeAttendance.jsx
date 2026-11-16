import { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, CameraOff, CheckCircle, AlertCircle, Video, Users, Upload, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// Minimum confidence (%) we accept for uploaded-image results.
// Matches backend _UPLOAD_COSINE_THRESHOLD * 100 = 50%.
// SFace cosine similarity for genuine matches in real photos is ~55-85%,
// so 50 is the practical floor; the backend rejects anything below this.
const UPLOAD_MIN_CONFIDENCE = 50;

/** Parse a '640x480' string from settings into a getUserMedia video constraints object. */
function resolutionConstraints(resStr) {
  try {
    const [w, h] = resStr.toLowerCase().split('x').map(Number);
    if (w && h) return { width: { ideal: w }, height: { ideal: h } };
  } catch {}
  return { width: { ideal: 640 }, height: { ideal: 480 } };
}

export default function TakeAttendance() {
  const [subjects, setSubjects]               = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sessions, setSessions]               = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [cameraDevices, setCameraDevices]     = useState([]);
  const [selectedDevice, setSelectedDevice]   = useState('');
  const [cameraOn, setCameraOn]               = useState(false);
  const [recognizing, setRecognizing]         = useState(false);
  const [recognition, setRecognition]         = useState(null);
  const [frameResults, setFrameResults]       = useState([]);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [manualStudentId, setManualStudentId]   = useState('');
  const [manualSaving, setManualSaving]         = useState(false);
  const [cameraError, setCameraError]         = useState('');
  // Resolution loaded from Settings — applied to getUserMedia
  const [cameraResolution, setCameraResolution] = useState('640x480');

  // ── Upload-image mode ──────────────────────────────────────────────────────
  const [uploadedImage, setUploadedImage]   = useState(null);   // { url, file }
  const [uploadResults, setUploadResults]   = useState([]);     // face results from API
  const [uploadProcessing, setUploadProcessing] = useState(false);
  const [uploadImgSize, setUploadImgSize]   = useState({ w: 0, h: 0 });
  const [uploadConfirmPending, setUploadConfirmPending] = useState(false); // anti-spoof warning gate
  const uploadImgRef  = useRef(null);
  const uploadFileRef = useRef(null);
  // ──────────────────────────────────────────────────────────────────────────

  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const intervalRef = useRef(null);

  /* ── On mount: load subjects, enumerate webcams, load settings ── */
  useEffect(() => {
    loadSubjects();
    loadSessions();
    enumerateWebcams();
    loadCameraSettings();
    return () => { stopCamera(); };
  }, []);

  const loadCameraSettings = async () => {
    try {
      const res = await api.get('/settings');
      const data = res.data.data;
      if (data?.camera_resolution) {
        setCameraResolution(data.camera_resolution);
      }
    } catch {}
  };

  const loadSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      const data = res.data.data || [];
      setSubjects(data);
      if (data.length) setSelectedSubject(String(data[0].id));
    } catch {}
  };

  const loadSessions = async () => {
    try {
      const res = await api.get('/attendance/sessions', { params: { status_filter: 'ACTIVE' } });
      setSessions(res.data.data || []);
    } catch { setSessions([]); }
  };

  /* Request permission then list webcam devices */
  const enumerateWebcams = async () => {
    try {
      // Trigger permission prompt first so labels are visible
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

  /* ── Start the selected webcam ── */
  const startCamera = async () => {
    setCameraError('');
    try {
      // Apply resolution from Settings page
      const resCons = resolutionConstraints(cameraResolution);
      const constraints = {
        video: {
          ...resCons,
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
      // Re-enumerate after stream starts so labels refresh
      const all  = await navigator.mediaDevices.enumerateDevices();
      const cams = all.filter(d => d.kind === 'videoinput');
      setCameraDevices(cams);

      // Auto-scan every 3 seconds
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(captureAndRecognize, 3000);
    } catch (err) {
      const msg =
        err.name === 'NotAllowedError'     ? 'Camera permission denied. Allow camera access in browser settings.' :
        err.name === 'NotFoundError'       ? 'No webcam found. Please connect a webcam.' :
        err.name === 'OverconstrainedError'? 'Selected camera not available. Try another device.' :
        `Camera error: ${err.message}`;
      setCameraError(msg);
      toast.error(msg);
    }
  };

  const stopCamera = () => {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  };

  /* Switch webcam device */
  const switchCamera = async (deviceId) => {
    setSelectedDevice(deviceId);
    if (cameraOn) {
      stopCamera();
      // slight delay so old stream fully stops before restarting
      setTimeout(() => startCameraWithDevice(deviceId), 200);
    }
  };

  const startCameraWithDevice = async (deviceId) => {
    setCameraError('');
    try {
      // Apply saved resolution setting on device switch too
      const resCons = resolutionConstraints(cameraResolution);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { ...resCons, deviceId: { exact: deviceId } },
      });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setCameraOn(true);
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(captureAndRecognize, 3000);
    } catch (err) {
      setCameraError(`Camera switch failed: ${err.message}`);
    }
  };

  /* ── Face recognition & attendance marking ── */
  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current || recognizing) return;
    const v = videoRef.current;
    if (v.readyState < 2) return;  // not ready yet
    setRecognizing(true);
    try {
      const c = canvasRef.current;
      c.width  = v.videoWidth  || 640;
      c.height = v.videoHeight || 480;
      c.getContext('2d').drawImage(v, 0, 0);
      const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.92));
      if (!blob) return;

      const fd = new FormData();
      fd.append('image', blob, 'frame.jpg');
      if (selectedSubject) fd.append('subject_id', selectedSubject);

      const res  = await api.post('/face/recognize-multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data;
      const now  = new Date();

      // A single classroom frame can contain several students. The server removes
      // duplicate matches; mark each unique recognized student independently.
      const recognized = (data.faces || []).filter(face => face.recognized && face.student_id);
      setFrameResults((data.faces || []).map(face => ({ ...face, attendance: face.recognized ? 'marking' : 'unknown' })));
      if (!recognized.length) {
        setAttendanceStatus('not_recognized');
        if (data.faces) return;
      }

      setRecognition({
        ...recognized[0],
        date: now.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-'),
        time: now.toLocaleTimeString('en-IN'),
        status: 'Present',
      });

      const marks = await Promise.all(recognized.map(async face => {
        try {
          const mark = await api.post('/attendance/mark', {
            student_id: face.student_id,
            subject_id: selectedSubject ? parseInt(selectedSubject) : null,
            session_id: selectedSession ? parseInt(selectedSession) : null,
            confidence: face.confidence,
            recognition_method: 'face_recognition',
            match_score: face.confidence ? face.confidence / 100 : null,
            status: 'Present',
          });
          return { student_id: face.student_id, attendance: mark.data.success ? 'marked' : 'already' };
        } catch (error) {
          return { student_id: face.student_id, attendance: 'error', error: error.response?.data?.detail };
        }
      }));
      const resultByStudent = Object.fromEntries(marks.map(mark => [mark.student_id, mark]));
      setFrameResults(previous => previous.map(face => resultByStudent[face.student_id]
        ? { ...face, ...resultByStudent[face.student_id] } : face));
      const markedCount = marks.filter(mark => mark.attendance === 'marked').length;
      const alreadyCount = marks.filter(mark => mark.attendance === 'already').length;
      setAttendanceStatus(markedCount ? 'marked' : (alreadyCount ? 'already' : 'not_recognized'));
      if (markedCount) toast.success(`Attendance marked for ${markedCount} student${markedCount === 1 ? '' : 's'}.`);
      if (data.faces) return;

      if (data.recognized) {
        const info = {
          student_id:   data.student_id,
          student_name: data.student_name,
          department:   data.department,
          confidence:   data.confidence,
          date: now.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-'),
          time: now.toLocaleTimeString('en-IN'),
          status: 'Present',
        };
        setRecognition(info);

        const mark = await api.post('/attendance/mark', {
          student_id: data.student_id,
          subject_id: selectedSubject ? parseInt(selectedSubject) : null,
          session_id: selectedSession ? parseInt(selectedSession) : null,
          confidence: data.confidence,
          recognition_method: 'face_recognition',
          match_score: data.confidence ? data.confidence / 100 : null,
          status: 'Present',
        });

        if (mark.data.success) {
          setAttendanceStatus('marked');
          toast.success(`✓ Attendance marked for ${data.student_name}!`);
        } else if (mark.data.already_marked) {
          setAttendanceStatus('already');
        }
      } else {
        // Only set not_recognized if no previous recognition shown
        if (!recognition) setAttendanceStatus('not_recognized');
      }
    } catch (e) { console.error('Recognition error:', e); }
    finally { setRecognizing(false); }
  };

  const deviceLabel = (d, i) => d.label || `Webcam ${i + 1}`;

  // The API returns boxes in the original camera-frame coordinates.  Convert
  // them to the visible video area, including the crop created by object-fit:
  // cover, so a label remains attached to the correct face.
  const getFaceOverlay = (box) => {
    if (!box || !videoRef.current) return null;
    const [top, right, bottom, left] = Array.isArray(box)
      ? box
      : [box.top, box.right, box.bottom, box.left];
    const video = videoRef.current;
    if (![top, right, bottom, left].every(Number.isFinite) || !video.videoWidth || !video.videoHeight) return null;

    const viewWidth = video.clientWidth;
    const viewHeight = video.clientHeight;
    if (!viewWidth || !viewHeight) return null;
    const scale = Math.max(viewWidth / video.videoWidth, viewHeight / video.videoHeight);
    const offsetX = (viewWidth - video.videoWidth * scale) / 2;
    const offsetY = (viewHeight - video.videoHeight * scale) / 2;
    return {
      left: offsetX + left * scale,
      top: offsetY + top * scale,
      width: Math.max(0, (right - left) * scale),
      height: Math.max(0, (bottom - top) * scale),
      labelInside: offsetY + top * scale < 30,
    };
  };

  // ── Upload Image handlers ─────────────────────────────────────────────────

  /** Called when user picks a file from the input. */
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPEG, PNG, etc.)');
      return;
    }
    const url = URL.createObjectURL(file);
    setUploadedImage({ url, file });
    setUploadResults([]);
    setAttendanceStatus(null);
    // Stop live camera if it was running
    if (cameraOn) stopCamera();
  };

  /** Clear the uploaded image and reset to camera mode. */
  const clearUploadedImage = () => {
    if (uploadedImage?.url) URL.revokeObjectURL(uploadedImage.url);
    setUploadedImage(null);
    setUploadResults([]);
    setAttendanceStatus(null);
    if (uploadFileRef.current) uploadFileRef.current.value = '';
  };

  /** Send the uploaded image to /face/recognize-multiple and mark attendance. */
  const processUploadedImage = async () => {
    if (!uploadedImage?.file) return;
    setUploadProcessing(true);
    setUploadResults([]);
    setAttendanceStatus(null);
    try {
      const fd = new FormData();
      fd.append('image', uploadedImage.file);
      if (selectedSubject) fd.append('subject_id', selectedSubject);
      // Tell the backend this is a static-image upload so it applies the
      // stricter confidence threshold (anti-spoofing measure).
      fd.append('source', 'upload');

      const res  = await api.post('/face/recognize-multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = res.data;
      const now  = new Date();

      // Front-end confidence guard: reject any face below UPLOAD_MIN_CONFIDENCE
      // even if the backend returned it (belt-and-suspenders).
      const allFaces = (data.faces || []).map(f => {
        if (f.recognized && (f.confidence || 0) < UPLOAD_MIN_CONFIDENCE) {
          return { ...f, recognized: false, _rejectedLowConf: true };
        }
        return f;
      });

      const recognized = allFaces.filter(f => f.recognized && f.student_id);
      setUploadResults(allFaces.map(f => ({ ...f, attendance: f.recognized ? 'marking' : 'unknown' })));

      if (!recognized.length) {
        setAttendanceStatus('not_recognized');
        const hadLowConf = allFaces.some(f => f._rejectedLowConf);
        toast(
          hadLowConf
            ? `⚠️ Face detected but confidence too low (< ${UPLOAD_MIN_CONFIDENCE}%). Use a clearer photo or live camera.`
            : 'No registered face found in the uploaded image.',
          { icon: '🛡️' }
        );
        return;
      }

      // Set recognition panel from first result
      setRecognition({
        ...recognized[0],
        date: now.toLocaleDateString('en-IN', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g, '-'),
        time: now.toLocaleTimeString('en-IN'),
        status: 'Present',
      });

      // Mark attendance — tag every record as 'image_upload' so admins can
      // identify potentially spoofed records in the attendance table.
      const marks = await Promise.all(recognized.map(async face => {
        try {
          const mark = await api.post('/attendance/mark', {
            student_id: face.student_id,
            subject_id: selectedSubject ? parseInt(selectedSubject) : null,
            session_id: selectedSession ? parseInt(selectedSession) : null,
            confidence: face.confidence,
            recognition_method: 'image_upload',   // ← anti-spoof flag
            match_score: face.confidence ? face.confidence / 100 : null,
            status: 'Present',
          });
          return { student_id: face.student_id, attendance: mark.data.success ? 'marked' : 'already' };
        } catch (error) {
          return { student_id: face.student_id, attendance: 'error', error: error.response?.data?.detail };
        }
      }));

      const resultByStudent = Object.fromEntries(marks.map(m => [m.student_id, m]));
      setUploadResults(prev => prev.map(face =>
        resultByStudent[face.student_id] ? { ...face, ...resultByStudent[face.student_id] } : face
      ));

      const markedCount  = marks.filter(m => m.attendance === 'marked').length;
      const alreadyCount = marks.filter(m => m.attendance === 'already').length;
      setAttendanceStatus(markedCount ? 'marked' : (alreadyCount ? 'already' : 'not_recognized'));
      if (markedCount)  toast.success(`Attendance marked for ${markedCount} student${markedCount === 1 ? '' : 's'}. Record flagged as ⚠️ image upload.`);
      if (alreadyCount && !markedCount) toast('Attendance already marked for today.', { icon: '⚠️' });
    } catch (e) {
      console.error('Upload recognition error:', e);
      toast.error('Failed to process image. Please try again.');
    } finally {
      setUploadProcessing(false);
    }
  };

  /** Compute the pixel position of a face box on the <img> element (same
   *  math as getFaceOverlay but for a static <img> with object-fit: contain).
   *
   *  Key fix: the <img> is flex-centered inside its container (position:relative).
   *  The face-box divs are absolute children of that container, so we must add
   *  img.offsetLeft / img.offsetTop to translate from "img-space" to
   *  "container-space".  Without this the boxes always appear at the container
   *  origin (top-left black area) regardless of where the image actually is.
   */
  const getUploadFaceOverlay = (box) => {
    if (!box || !uploadImgRef.current) return null;
    const [top, right, bottom, left] = Array.isArray(box)
      ? box : [box.top, box.right, box.bottom, box.left];
    if (![top, right, bottom, left].every(Number.isFinite)) return null;

    const img = uploadImgRef.current;
    const viewW = img.clientWidth;
    const viewH = img.clientHeight;
    const natW  = uploadImgSize.w || img.naturalWidth;
    const natH  = uploadImgSize.h || img.naturalHeight;
    if (!viewW || !viewH || !natW || !natH) return null;

    // Scale factor for object-fit: contain within the img element layout box
    const scale   = Math.min(viewW / natW, viewH / natH);
    // Letterbox offsets inside the img element (may be 0 when img has natural ratio)
    const padX    = (viewW - natW * scale) / 2;
    const padY    = (viewH - natH * scale) / 2;
    // img element position inside the flex-centered container (this was the missing piece)
    const imgLeft = img.offsetLeft;
    const imgTop  = img.offsetTop;

    const boxLeft = imgLeft + padX + left  * scale;
    const boxTop  = imgTop  + padY + top   * scale;
    return {
      left:        boxLeft,
      top:         boxTop,
      width:       Math.max(0, (right  - left) * scale),
      height:      Math.max(0, (bottom - top)  * scale),
      labelInside: boxTop < 30,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────

  const markManualAttendance = async () => {
    const studentId = manualStudentId.trim().toUpperCase();
    if (!studentId) { toast.error('Enter a student ID for manual attendance.'); return; }
    setManualSaving(true);
    try {
      const response = await api.post('/attendance/mark', {
        student_id: studentId,
        subject_id: selectedSubject ? parseInt(selectedSubject) : null,
        session_id: selectedSession ? parseInt(selectedSession) : null,
        status: 'Present', recognition_method: 'manual', confidence: null,
      });
      if (response.data.success) {
        toast.success(`Manual attendance marked for ${studentId}.`);
        setManualStudentId(''); setAttendanceStatus('marked');
      } else { toast(response.data.message || 'Attendance was already marked.'); }
    } catch (error) { toast.error(error.response?.data?.detail || 'Could not mark manual attendance.'); }
    finally { setManualSaving(false); }
  };

  return (
    <div>
      <h1 className="page-title" style={{ marginBottom: 20 }}>Take Attendance</h1>

      {/* ── Controls bar ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-end', marginBottom: 16 }}>
        {/* Webcam selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            📷 Webcam Device
          </label>
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

        {/* Subject selector */}
        {subjects.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 220 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Subject</label>
            <select className="form-control" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              <option value="">No Subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} – {s.subject_name}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 250 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Attendance session</label>
          <select className="form-control" value={selectedSession} onChange={e => { const id = e.target.value; setSelectedSession(id); const session = sessions.find(item => String(item.id) === id); if (session?.subject_id) setSelectedSubject(String(session.subject_id)); }}>
            <option value="">Quick attendance (no session)</option>
            {sessions.map(s => <option key={s.id} value={s.id}>#{s.id} · {s.class_name || s.department || 'Class'} · {s.session_date}</option>)}
          </select>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Only active sessions are listed.</span>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Left: Camera */}
        <div className="card">
          {/* Video feed */}
          <div className="camera-container" style={{ height: 420 }}>
            <video
              ref={videoRef}
              className="camera-video"
              autoPlay muted playsInline
              style={{ display: cameraOn ? 'block' : 'none' }}
            />

            {/* Live face boxes: one overlay for every face detected in this frame. */}
            {cameraOn && frameResults.map((face, index) => {
              const overlay = getFaceOverlay(face.box);
              if (!overlay) return null;
              const tone = !face.recognized ? '#f59e0b'
                : face.attendance === 'error' ? '#ef4444'
                : face.attendance === 'already' ? '#f59e0b'
                : face.attendance === 'marked' ? '#22c55e' : '#38bdf8';
              const label = face.recognized
                ? `${face.student_name || face.student_id} · ${face.confidence?.toFixed(0) || 0}%`
                : 'Unknown face';
              return (
                <div
                  key={`face-box-${face.student_id || 'unknown'}-${index}`}
                  style={{
                    position: 'absolute', left: overlay.left, top: overlay.top,
                    width: overlay.width, height: overlay.height,
                    border: `3px solid ${tone}`, borderRadius: 8,
                    boxShadow: `0 0 0 1px rgba(0,0,0,0.35), 0 0 18px ${tone}88`,
                    pointerEvents: 'none', boxSizing: 'border-box', zIndex: 3,
                  }}
                >
                  <div style={{
                    position: 'absolute', left: -3,
                    top: overlay.labelInside ? 0 : -27,
                    maxWidth: Math.max(120, overlay.width + 20),
                    padding: '4px 7px', borderRadius: '6px 6px 6px 0',
                    background: tone, color: '#fff', fontWeight: 700,
                    fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap',
                    overflow: 'hidden', textOverflow: 'ellipsis',
                    textShadow: '0 1px 1px rgba(0,0,0,0.28)',
                  }}>
                    {label}
                  </div>
                </div>
              );
            })}

            {/* Name label overlay on recognition */}
            {cameraOn && recognition && frameResults.length === 0 && (
              <div style={{
                position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
                background: '#16a34a', color: '#fff', borderRadius: 8,
                padding: '6px 18px', fontWeight: 700, fontSize: 14, textAlign: 'center',
                pointerEvents: 'none',
              }}>
                {recognition.student_name}<br />
                <span style={{ fontSize: 11, fontWeight: 500 }}>{recognition.student_id}</span>
              </div>
            )}

            {/* Scanning indicator */}
            {cameraOn && recognizing && (
              <div style={{
                position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 20,
                padding: '4px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                Scanning...
              </div>
            )}

            {!cameraOn && !uploadedImage && (
              <div className="camera-overlay">
                {cameraError ? (
                  <><AlertCircle size={34} color="#dc2626" />
                    <span style={{ color: '#dc2626', fontSize: 13, maxWidth: 280, textAlign: 'center' }}>{cameraError}</span></>
                ) : (
                  <><Video size={40} color="rgba(255,255,255,0.3)" />
                    <span style={{ fontSize: 13 }}>Select a webcam and click Start Camera, or upload an image</span></>
                )}
              </div>
            )}

            {/* ── Uploaded image preview with face-box overlays ── */}
            {uploadedImage && (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111' }}>
                <img
                  ref={uploadImgRef}
                  src={uploadedImage.url}
                  alt="Uploaded for recognition"
                  onLoad={e => setUploadImgSize({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
                />

                {/* Face boxes overlaid on the static image */}
                {uploadResults.map((face, index) => {
                  const overlay = getUploadFaceOverlay(face.box);
                  if (!overlay) return null;
                  const tone = !face.recognized ? '#f59e0b'
                    : face.attendance === 'error'   ? '#ef4444'
                    : face.attendance === 'already' ? '#f59e0b'
                    : face.attendance === 'marked'  ? '#22c55e' : '#38bdf8';
                  const label = face.recognized
                    ? `${face.student_name || face.student_id} · ${face.confidence?.toFixed(0) || 0}%`
                    : 'Unknown face';
                  return (
                    <div
                      key={`upload-box-${face.student_id || 'unk'}-${index}`}
                      style={{
                        position: 'absolute',
                        left: overlay.left, top: overlay.top,
                        width: overlay.width, height: overlay.height,
                        border: `3px solid ${tone}`, borderRadius: 8,
                        boxShadow: `0 0 0 1px rgba(0,0,0,0.35), 0 0 18px ${tone}88`,
                        pointerEvents: 'none', boxSizing: 'border-box', zIndex: 3,
                      }}
                    >
                      <div style={{
                        position: 'absolute', left: -3,
                        top: overlay.labelInside ? 0 : -27,
                        maxWidth: Math.max(120, overlay.width + 20),
                        padding: '4px 7px', borderRadius: '6px 6px 6px 0',
                        background: tone, color: '#fff', fontWeight: 700,
                        fontSize: 11, lineHeight: 1.2, whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        textShadow: '0 1px 1px rgba(0,0,0,0.28)',
                      }}>
                        {label}
                      </div>
                    </div>
                  );
                })}

                {/* Scanning spinner over image */}
                {uploadProcessing && (
                  <div style={{
                    position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 20,
                    padding: '4px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                    Scanning image…
                  </div>
                )}

                {/* Upload-mode badge */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  background: '#7c3aed', color: '#fff', borderRadius: 6,
                  padding: '3px 10px', fontSize: 11, fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Upload size={11} /> Image Upload Mode
                </div>
              </div>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Camera control buttons */}
          <div className="flex gap-2" style={{ padding: '14px 16px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-success"
              onClick={startCamera}
              disabled={cameraOn || cameraDevices.length === 0 || !!uploadedImage}
            >
              <Camera size={15} /> Start Camera
            </button>
            <button
              className="btn btn-danger"
              onClick={stopCamera}
              disabled={!cameraOn}
            >
              <CameraOff size={15} /> Stop Camera
            </button>

            {/* ── Upload Image button ── */}
            <button
              className="btn"
              style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
              onClick={() => uploadFileRef.current?.click()}
              disabled={cameraOn}
              title="Upload a photo to take attendance"
            >
              <Upload size={15} /> Upload Image
            </button>
            <input
              ref={uploadFileRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleImageFileChange}
            />

            {/* Process / Clear buttons shown only when an image is loaded */}
            {uploadedImage && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setUploadConfirmPending(true)}
                  disabled={uploadProcessing}
                  style={{ marginLeft: 4 }}
                >
                  {uploadProcessing
                    ? <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> Scanning…</>
                    : <><CheckCircle size={15} /> Scan &amp; Mark</>
                  }
                </button>
                <button
                  className="btn btn-outline-gray"
                  onClick={clearUploadedImage}
                  title="Remove uploaded image"
                >
                  <X size={15} /> Clear
                </button>
              </>
            )}
          </div>

          {/* Status alert */}
          {attendanceStatus && (
            <div
              className={`alert ${
                attendanceStatus === 'marked'  ? 'alert-success' :
                attendanceStatus === 'already' ? 'alert-warning'  : 'alert-danger'
              }`}
              style={{ margin: '0 16px 14px' }}
            >
              <CheckCircle size={16} />
              {attendanceStatus === 'marked'
                ? 'Recognized Successfully and Attendance Marked!'
                : attendanceStatus === 'already'
                  ? 'Attendance already marked for today.'
                  : 'Face not recognized — please look at the camera.'}
            </div>
          )}
        </div>

        {/* Right: Recognition Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="recognition-panel">
            <div className="card-header"><span className="card-title">Recognition Info</span></div>
            {[
              { label: 'Student ID',       value: recognition?.student_id   || '—' },
              { label: 'Student Name',     value: recognition?.student_name || '—' },
              { label: 'Department',       value: recognition?.department   || '—' },
              {
                label: 'Match Confidence',
                value: recognition?.confidence
                  ? <span style={{ color: '#16a34a', fontWeight: 700 }}>{recognition.confidence.toFixed(2)}%</span>
                  : '—',
              },
              {
                label: 'Status',
                value: recognition?.status
                  ? <span className="status-present">{recognition.status}</span>
                  : '—',
              },
              { label: 'Date', value: recognition?.date || new Date().toLocaleDateString('en-IN') },
              { label: 'Time', value: recognition?.time || new Date().toLocaleTimeString('en-IN')  },
            ].map(({ label, value }) => (
              <div key={label} className="recognition-field">
                <span className="recognition-field-label">{label}</span>
                <span className="recognition-field-value">{value}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title"><Users size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                {uploadedImage ? 'Image scan results' : 'Classroom frame results'}
              </span>
            </div>
            <div className="card-body" style={{ padding: (uploadedImage ? uploadResults : frameResults).length ? 0 : 16 }}>
              {uploadedImage ? (
                /* ── Upload results ── */
                !uploadResults.length ? (
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
                    Click <strong>Scan &amp; Mark</strong> to detect faces in the uploaded image.
                  </p>
                ) : uploadResults.map((face, index) => (
                  <div key={`up-${face.student_id || 'unknown'}-${index}`} style={{ padding: '11px 14px', borderBottom: index < uploadResults.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    {face.recognized ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700, fontSize: 13 }}>
                          <span>{face.student_name}</span>
                          <span style={{ color: face.attendance === 'marked' ? '#15803d' : '#a16207' }}>
                            {face.attendance === 'marked' ? 'Marked' : face.attendance === 'already' ? 'Already marked' : face.attendance === 'error' ? 'Could not mark' : 'Marking…'}
                          </span>
                        </div>
                        <div style={{ marginTop: 3, color: '#6b7280', fontSize: 12 }}>{face.student_id} · {face.confidence?.toFixed(1)}% match</div>
                      </>
                    ) : <div style={{ color: '#b45309', fontSize: 12 }}>Unknown face {index + 1} — not marked</div>}
                  </div>
                ))
              ) : (
                /* ── Live camera results ── */
                !frameResults.length ? (
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 12 }}>
                    Start the camera to scan everyone visible in the frame. Each recognized student is marked once.
                  </p>
                ) : frameResults.map((face, index) => (
                  <div key={`${face.student_id || 'unknown'}-${index}`} style={{ padding: '11px 14px', borderBottom: index < frameResults.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                    {face.recognized ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontWeight: 700, fontSize: 13 }}>
                          <span>{face.student_name}</span>
                          <span style={{ color: face.attendance === 'marked' ? '#15803d' : '#a16207' }}>
                            {face.attendance === 'marked' ? 'Marked' : face.attendance === 'already' ? 'Already marked' : face.attendance === 'error' ? 'Could not mark' : 'Marking…'}
                          </span>
                        </div>
                        <div style={{ marginTop: 3, color: '#6b7280', fontSize: 12 }}>{face.student_id} · {face.confidence?.toFixed(1)}% match</div>
                      </>
                    ) : <div style={{ color: '#b45309', fontSize: 12 }}>Unknown face {index + 1} — not marked</div>}
                  </div>
                ))
              )}
            </div>
          </div>

          {attendanceStatus === 'marked' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16a34a', fontWeight: 700, fontSize: 15, padding: '4px 0' }}>
              <CheckCircle size={22} /> Attendance Marked
            </div>
          )}

          <div className="card">
            <div className="card-header"><span className="card-title">Manual fallback</span></div>
            <div className="card-body">
              <p style={{ color: '#6b7280', fontSize: 12, marginTop: 0 }}>Use only when the student cannot be recognized. The record is tagged as manual in the audit trail.</p>
              <input className="form-control" placeholder="Student ID" value={manualStudentId} onChange={e => setManualStudentId(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && markManualAttendance()} />
              <button className="btn btn-outline-gray w-full" style={{ justifyContent: 'center', marginTop: 10 }} onClick={markManualAttendance} disabled={manualSaving}>{manualSaving ? 'Saving…' : 'Mark manual attendance'}</button>
            </div>
          </div>

          {/* Webcam info box */}
          {cameraOn && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#15803d' }}>
              <strong>Webcam Active</strong>
              {selectedDevice && cameraDevices.length > 0 && (
                <div style={{ marginTop: 4, color: '#166534' }}>
                  {deviceLabel(cameraDevices.find(d => d.deviceId === selectedDevice) || {}, 0)}
                </div>
              )}
              <div style={{ marginTop: 4, color: '#6b7280' }}>Auto-scanning every 3 seconds</div>
            </div>
          )}

          {/* Upload mode info box */}
          {uploadedImage && (
            <div style={{ background: '#faf5ff', border: '1px solid #d8b4fe', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6d28d9' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Upload size={13} /> Image Upload Mode</strong>
              <div style={{ marginTop: 4, color: '#7c3aed' }}>{uploadedImage.file.name}</div>
              <div style={{ marginTop: 3, color: '#6b7280' }}>Click <strong>Scan &amp; Mark</strong> to run face recognition on this image.</div>
            </div>
          )}
        </div>
      </div>
      {/* ── Anti-Spoofing Confirmation Modal ── */}
      {uploadConfirmPending && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)', borderRadius: 16, padding: 32,
            width: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            border: '2px solid #f59e0b',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <ShieldAlert size={26} color="#f59e0b" />
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
                Anti-Spoofing Warning
              </h3>
            </div>

            {/* Body */}
            <p style={{ margin: '0 0 10px', color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              You are about to mark attendance using a <strong>static image file</strong>.
              This method can be misused with printed photos or screen captures.
            </p>
            <ul style={{ margin: '0 0 14px', paddingLeft: 18, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.8 }}>
              <li>Minimum <strong>{UPLOAD_MIN_CONFIDENCE}% confidence</strong> required (stricter than live camera).</li>
              <li>The record will be tagged <strong>⚠️ image_upload</strong> in the audit trail.</li>
              <li>Admins can review flagged records in Attendance Records.</li>
            </ul>
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              color: '#92400e', fontSize: 12,
            }}>
              <AlertTriangle size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
              Misuse of this feature may constitute academic fraud. All uploads are logged.
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                style={{
                  padding: '10px 20px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer',
                }}
                onClick={() => setUploadConfirmPending(false)}
              >
                Cancel
              </button>
              <button
                style={{
                  padding: '10px 22px', borderRadius: 8, border: 'none',
                  background: '#f59e0b', color: '#fff', cursor: 'pointer', fontWeight: 700,
                }}
                onClick={() => { setUploadConfirmPending(false); processUploadedImage(); }}
              >
                I Understand — Scan &amp; Mark
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
