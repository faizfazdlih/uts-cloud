import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { api, resolveAssetUrl } from './api';

const initialReportForm = {
  reporter_name: '',
  description: '',
  latitude: '',
  longitude: '',
  address: '',
};

const initialScheduleForm = {
  area: '',
  pickup_date: '',
  start_time: '',
  end_time: '',
  notes: '',
};

const initialOfficerForm = {
  name: '',
  phone: '',
  zone: '',
};

const initialLogForm = {
  officerId: '',
  latitude: '',
  longitude: '',
  status: '',
  notes: '',
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const defaultLatitude = -6.2;
const defaultLongitude = 106.816666;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── tokens ────────────────────────────────────────────────────────────────────

const T = {
  // Brand greens
  green50:  '#f0f9f4',
  green100: '#d1eedb',
  green200: '#a3ddb8',
  green500: '#2e9e5e',
  green600: '#1f7a47',
  green700: '#155c35',
  green800: '#0d3f24',
  green900: '#071f12',

  // Neutrals
  white:   '#ffffff',
  gray50:  '#f8f8f7',
  gray100: '#f0efec',
  gray200: '#e2e0da',
  gray300: '#c8c5bc',
  gray400: '#9e9b92',
  gray500: '#6e6b62',
  gray700: '#3a3832',
  gray900: '#1a1916',

  // Status
  blue50:   '#eff6ff',
  blue600:  '#1d4ed8',
  blue800:  '#1e3a8a',
  amber50:  '#fffbeb',
  amber600: '#d97706',
  amber800: '#92400e',
  red50:    '#fef2f2',
  red600:   '#dc2626',
  red800:   '#991b1b',
  teal50:   '#f0fdfa',
  teal600:  '#0d9488',
  teal800:  '#134e4a',
};

// ── small reusable ────────────────────────────────────────────────────────────

function Badge({ children, color = 'gray' }) {
  const map = {
    gray:  { bg: T.gray100, color: T.gray700, border: T.gray200 },
    blue:  { bg: T.blue50,  color: T.blue800, border: '#bfdbfe' },
    green: { bg: T.green50, color: T.green700, border: T.green100 },
    amber: { bg: T.amber50, color: T.amber800, border: '#fde68a' },
    red:   { bg: T.red50,   color: T.red800,  border: '#fecaca' },
    teal:  { bg: T.teal50,  color: T.teal800, border: '#99f6e4' },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontSize: 11, fontWeight: 600, letterSpacing: '0.04em',
      textTransform: 'uppercase',
      padding: '3px 8px', borderRadius: 4,
      backgroundColor: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
    }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    baru:     { label: 'Baru',     color: 'blue' },
    diproses: { label: 'Diproses', color: 'amber' },
    selesai:  { label: 'Selesai',  color: 'green' },
  };
  const cfg = map[status] || { label: status, color: 'gray' };
  return <Badge color={cfg.color}>{cfg.label}</Badge>;
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{
      backgroundColor: T.white,
      border: `1px solid ${T.gray200}`,
      borderRadius: 10,
      padding: '16px 18px',
      borderTop: `3px solid ${accent || T.gray300}`,
    }}>
      <p style={{
        margin: '0 0 10px', fontSize: 11, fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: T.gray500,
      }}>{label}</p>
      <p style={{ margin: 0, fontSize: 30, fontWeight: 700, lineHeight: 1, color: T.gray900, fontVariantNumeric: 'tabular-nums' }}>{value}</p>
    </div>
  );
}

// inputs
const inp = {
  base: {
    height: 38, padding: '0 12px', fontSize: 13,
    color: T.gray900, backgroundColor: T.white,
    border: `1px solid ${T.gray200}`,
    borderRadius: 7, outline: 'none',
    width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  },
  textarea: {
    padding: '9px 12px', fontSize: 13,
    color: T.gray900, backgroundColor: T.white,
    border: `1px solid ${T.gray200}`,
    borderRadius: 7, outline: 'none',
    width: '100%', minHeight: 84,
    resize: 'vertical', boxSizing: 'border-box',
    fontFamily: 'inherit', lineHeight: 1.65,
  },
};

function Input({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inp.base,
        ...(focused ? { borderColor: T.green500, boxShadow: `0 0 0 3px ${T.green50}` } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Textarea({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inp.textarea,
        ...(focused ? { borderColor: T.green500, boxShadow: `0 0 0 3px ${T.green50}` } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Select({ style, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inp.base,
        cursor: 'pointer', appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236e6b62' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: 32,
        ...(focused ? { borderColor: T.green500, boxShadow: `0 0 0 3px ${T.green50}` } : {}),
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 5,
      gridColumn: full ? '1 / -1' : undefined,
    }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: T.gray500, letterSpacing: '0.02em' }}>{label}</label>
      {children}
    </div>
  );
}

function BtnPrimary({ children, style, ...props }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...props}
      style={{
        height: 38, padding: '0 18px', fontSize: 13, fontWeight: 600,
        backgroundColor: hover ? T.green700 : T.green600,
        color: T.white, border: 'none',
        borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background-color 0.15s',
        letterSpacing: '0.01em',
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

function BtnSecondary({ children, style, ...props }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      {...props}
      style={{
        height: 38, padding: '0 14px', fontSize: 13, fontWeight: 500,
        backgroundColor: hover ? T.gray100 : T.white,
        color: T.gray700,
        border: `1px solid ${T.gray200}`,
        borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background-color 0.15s',
        ...style,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
    </button>
  );
}

function Divider({ style }) {
  return <div style={{ height: 1, backgroundColor: T.gray100, margin: '20px 0', ...style }} />;
}

// ── card ──────────────────────────────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div style={{
      backgroundColor: T.white,
      border: `1px solid ${T.gray200}`,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({ icon, title, badge, badgeColor }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px',
      borderBottom: `1px solid ${T.gray100}`,
      backgroundColor: T.gray50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          backgroundColor: T.green600,
          color: T.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, flexShrink: 0,
        }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.gray900 }}>{title}</h2>
      </div>
      <Badge color={badgeColor}>{badge}</Badge>
    </div>
  );
}

function CardBody({ children, style }) {
  return <div style={{ padding: '20px 24px', ...style }}>{children}</div>;
}

// ── sub-form box ──────────────────────────────────────────────────────────────

function SubForm({ title, children }) {
  return (
    <div style={{
      backgroundColor: T.gray50,
      border: `1px solid ${T.gray200}`,
      borderRadius: 9,
      padding: '16px 18px',
      marginBottom: 16,
    }}>
      <p style={{
        margin: '0 0 14px', fontSize: 11, fontWeight: 700,
        color: T.green600, letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>{title}</p>
      {children}
    </div>
  );
}

// ── list item ─────────────────────────────────────────────────────────────────

function ListItem({ children, style }) {
  return (
    <div style={{
      backgroundColor: T.white,
      border: `1px solid ${T.gray200}`,
      borderRadius: 9,
      padding: '14px 16px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── map ───────────────────────────────────────────────────────────────────────

function LocationPickerMap({ latitude, longitude, onPick }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const map = L.map(mapContainerRef.current).setView([defaultLatitude, defaultLongitude], 12);
    mapInstanceRef.current = map;
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    map.on('click', (event) => {
      const { lat, lng } = event.latlng;
      if (!markerRef.current) {
        markerRef.current = L.marker([lat, lng]).addTo(map);
      } else {
        markerRef.current.setLatLng([lat, lng]);
      }
      onPick(lat, lng);
    });
    return () => { map.remove(); mapInstanceRef.current = null; markerRef.current = null; };
  }, [onPick]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!markerRef.current) {
      markerRef.current = L.marker([lat, lng]).addTo(map);
    } else {
      markerRef.current.setLatLng([lat, lng]);
    }
    map.setView([lat, lng], 15);
  }, [latitude, longitude]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: '100%', height: 280,
        borderRadius: 8, overflow: 'hidden',
        border: `1px solid ${T.gray200}`,
      }}
    />
  );
}

// ── alert ─────────────────────────────────────────────────────────────────────

function Alert({ message, type }) {
  if (!message) return null;
  const map = {
    success: { bg: T.green50, border: T.green100, color: T.green700, icon: '✓' },
    error:   { bg: T.red50,   border: '#fecaca',  color: T.red800,  icon: '✕' },
    info:    { bg: T.blue50,  border: '#bfdbfe',  color: T.blue800, icon: 'i' },
  };
  const s = map[type] || map.info;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      margin: '0 0 16px', padding: '11px 14px',
      borderRadius: 8, fontSize: 13, fontWeight: 500,
      backgroundColor: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
    }}>
      <span style={{
        width: 20, height: 20, borderRadius: 4,
        backgroundColor: s.color, color: T.white,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>{s.icon}</span>
      {message}
    </div>
  );
}

// ── formGrid helper ───────────────────────────────────────────────────────────

const formGrid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 14,
  marginBottom: 16,
};

// ── main app ──────────────────────────────────────────────────────────────────

export default function App() {
  const [role, setRole] = useState('masyarakat');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');

  const [reports, setReports] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [monitoring, setMonitoring] = useState([]);

  const [reportForm, setReportForm] = useState(initialReportForm);
  const [reportPhoto, setReportPhoto] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(initialScheduleForm);
  const [officerForm, setOfficerForm] = useState(initialOfficerForm);
  const [logForm, setLogForm] = useState(initialLogForm);

  const isAdmin = useMemo(() => role === 'admin', [role]);
  const todayDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const dashboardStats = useMemo(() => {
    const laporanBaru    = reports.filter((r) => r.status === 'baru').length;
    const laporanSelesai = reports.filter((r) => r.status === 'selesai').length;
    const jadwalHariIni  = schedules.filter((s) => s.pickup_date?.slice(0, 10) === todayDate).length;
    const petugasAktif   = monitoring.filter((m) => Boolean(m.is_active)).length;
    return { totalLaporan: reports.length, laporanBaru, laporanSelesai, jadwalHariIni, petugasAktif };
  }, [monitoring, reports, schedules, todayDate]);

  async function loadAllData() {
    setLoading(true);
    try {
      const [reportsData, schedulesData, officersData, monitoringData] = await Promise.all([
        api.getReports(), api.getSchedules(), api.getOfficers(), api.getMonitoring(),
      ]);
      setReports(reportsData);
      setSchedules(schedulesData);
      setOfficers(officersData);
      setMonitoring(monitoringData);
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAllData(); }, []);

  function showMessage(text, type = 'info') {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 4000);
  }

  async function handleCreateReport(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('reporter_name', reportForm.reporter_name);
      formData.append('description', reportForm.description);
      formData.append('latitude', String(reportForm.latitude));
      formData.append('longitude', String(reportForm.longitude));
      formData.append('address', reportForm.address || '');
      if (reportPhoto) formData.append('photo', reportPhoto);
      await api.createReport(formData);
      setReportForm(initialReportForm);
      setReportPhoto(null);
      showMessage('Laporan sampah liar berhasil dikirim.', 'success');
      loadAllData();
    } catch (error) { showMessage(error.message, 'error'); }
  }

  function handlePickFromMap(lat, lng) {
    setReportForm((prev) => ({ ...prev, latitude: lat.toFixed(7), longitude: lng.toFixed(7) }));
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) { showMessage('Browser tidak mendukung geolocation.', 'error'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => handlePickFromMap(coords.latitude, coords.longitude),
      () => showMessage('Tidak bisa mengambil lokasi. Pastikan izin lokasi diaktifkan.', 'error'),
    );
  }

  async function handleUpdateReportStatus(reportId, status) {
    try {
      await api.updateReportStatus(reportId, status);
      showMessage('Status laporan berhasil diperbarui.', 'success');
      loadAllData();
    } catch (error) { showMessage(error.message, 'error'); }
  }

  async function handleCreateSchedule(e) {
    e.preventDefault();
    try {
      await api.createSchedule(scheduleForm);
      setScheduleForm(initialScheduleForm);
      showMessage('Jadwal pengangkutan berhasil ditambahkan.', 'success');
      loadAllData();
    } catch (error) { showMessage(error.message, 'error'); }
  }

  async function handleCreateOfficer(e) {
    e.preventDefault();
    try {
      await api.createOfficer(officerForm);
      setOfficerForm(initialOfficerForm);
      showMessage('Data petugas berhasil ditambahkan.', 'success');
      loadAllData();
    } catch (error) { showMessage(error.message, 'error'); }
  }

  async function handleCreateLog(e) {
    e.preventDefault();
    try {
      await api.createOfficerLog(logForm.officerId, {
        latitude: Number(logForm.latitude),
        longitude: Number(logForm.longitude),
        status: logForm.status,
        notes: logForm.notes,
      });
      setLogForm(initialLogForm);
      showMessage('Update monitoring petugas berhasil disimpan.', 'success');
      loadAllData();
    } catch (error) { showMessage(error.message, 'error'); }
  }

  return (
    <div style={{
      maxWidth: 920, margin: '0 auto',
      padding: '0 20px 72px',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      backgroundColor: T.gray50,
      minHeight: '100vh',
    }}>

      {/* ── Navbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 0 18px',
        borderBottom: `2px solid ${T.green600}`,
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9,
            backgroundColor: T.green600,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🗑️</div>
          <div>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.gray900, letterSpacing: '-0.02em' }}>
              GO GO TRASH GO
            </p>
            <p style={{ margin: '1px 0 0', fontSize: 11, color: T.gray500, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Sistem Manajemen Persampahan
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BtnSecondary onClick={loadAllData} style={{ minWidth: 110, fontSize: 12 }}>
            {loading ? '⟳ Memuat...' : '⟳ Muat ulang'}
          </BtnSecondary>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: 'auto', minWidth: 140, paddingRight: 32 }}
          >
            <option value="masyarakat">👤 Masyarakat</option>
            <option value="admin">🔧 Admin</option>
          </Select>
        </div>
      </div>

      {/* ── Alert ── */}
      <Alert message={message} type={messageType} />

      {/* ── Stats ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        gap: 10, marginBottom: 20,
      }}>
        <StatCard label="Total laporan"   value={dashboardStats.totalLaporan}   accent={T.gray300} />
        <StatCard label="Laporan baru"    value={dashboardStats.laporanBaru}    accent={T.blue600} />
        <StatCard label="Selesai"         value={dashboardStats.laporanSelesai} accent={T.green500} />
        <StatCard label="Jadwal hari ini" value={dashboardStats.jadwalHariIni}  accent={T.amber600} />
        <StatCard label="Petugas aktif"   value={dashboardStats.petugasAktif}   accent={T.teal600} />
      </div>

      {/* ═══════════════════════════════════════════════════
          Section 1: Pelaporan
      ═══════════════════════════════════════════════════ */}
      <Card>
        <CardHeader icon="1" title="Pelaporan sampah liar" badge="Publik" badgeColor="blue" />
        <CardBody>
          <form onSubmit={handleCreateReport}>
            <div style={formGrid}>
              <Field label="Nama pelapor">
                <Input
                  value={reportForm.reporter_name} required
                  placeholder="Nama lengkap"
                  onChange={(e) => setReportForm({ ...reportForm, reporter_name: e.target.value })}
                />
              </Field>
              <Field label="Alamat / keterangan lokasi">
                <Input
                  value={reportForm.address}
                  placeholder="Nama jalan, kelurahan, dst."
                  onChange={(e) => setReportForm({ ...reportForm, address: e.target.value })}
                />
              </Field>
              <Field label="Latitude">
                <Input
                  type="number" step="0.0000001"
                  value={reportForm.latitude} required
                  placeholder="-6.2000000"
                  onChange={(e) => setReportForm({ ...reportForm, latitude: e.target.value })}
                />
              </Field>
              <Field label="Longitude">
                <Input
                  type="number" step="0.0000001"
                  value={reportForm.longitude} required
                  placeholder="106.8166666"
                  onChange={(e) => setReportForm({ ...reportForm, longitude: e.target.value })}
                />
              </Field>
            </div>

            <Field label="Pilih lokasi di peta">
              <div style={{ marginTop: 6 }}>
                <LocationPickerMap
                  latitude={reportForm.latitude}
                  longitude={reportForm.longitude}
                  onPick={handlePickFromMap}
                />
              </div>
              <BtnSecondary type="button" onClick={handleUseCurrentLocation} style={{ marginTop: 8, fontSize: 12 }}>
                📍 Gunakan lokasi saya
              </BtnSecondary>
            </Field>

            <div style={{ marginTop: 14 }}>
              <Field label="Deskripsi laporan">
                <Textarea
                  value={reportForm.description} required
                  placeholder="Jelaskan kondisi sampah liar yang ditemukan..."
                  onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                />
              </Field>
            </div>

            <div style={{ marginTop: 14 }}>
              <Field label="Upload gambar (opsional)">
                <div style={{
                  marginTop: 4,
                  border: `1.5px dashed ${T.gray300}`,
                  borderRadius: 8, padding: '14px 16px',
                  backgroundColor: T.gray50,
                  transition: 'border-color 0.15s',
                }}>
                  <input
                    type="file" accept="image/*"
                    style={{ fontSize: 12, color: T.gray500 }}
                    onChange={(e) => setReportPhoto(e.target.files?.[0] || null)}
                  />
                  {reportPhoto && (
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: T.green600, fontWeight: 600 }}>
                      ✓ {reportPhoto.name}
                    </p>
                  )}
                </div>
              </Field>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
              <BtnPrimary type="submit">Kirim laporan →</BtnPrimary>
            </div>
          </form>

          {/* Report list */}
          {reports.length > 0 && (
            <>
              <Divider />
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.gray700 }}>
                  Daftar laporan masuk
                </p>
                <Badge color="gray">{reports.length} laporan</Badge>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {reports.map((report) => (
                  <ListItem key={report.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.gray900 }}>{report.reporter_name}</p>
                        {report.address && (
                          <p style={{ margin: '2px 0 0', fontSize: 12, color: T.gray500 }}>{report.address}</p>
                        )}
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: T.gray600 || T.gray500, lineHeight: 1.65 }}>
                      {report.description}
                    </p>
                    {report.photo_url && (
                      <img
                        src={resolveAssetUrl(report.photo_url)} alt="Foto laporan"
                        style={{
                          width: '100%', maxHeight: 180,
                          objectFit: 'cover', borderRadius: 7,
                          marginBottom: 10,
                          border: `1px solid ${T.gray200}`,
                        }}
                      />
                    )}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: T.gray400 }}>
                        📍 {report.latitude}, {report.longitude}
                      </span>
                      <span style={{ fontSize: 12, color: T.gray400 }}>
                        🕐 {formatDateTime(report.created_at)}
                      </span>
                    </div>
                    {isAdmin && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.gray100}` }}>
                        <Select
                          value={report.status}
                          onChange={(e) => handleUpdateReportStatus(report.id, e.target.value)}
                          style={{ width: 200, fontSize: 12 }}
                        >
                          <option value="baru">Baru</option>
                          <option value="diproses">Diproses</option>
                          <option value="selesai">Selesai</option>
                        </Select>
                      </div>
                    )}
                  </ListItem>
                ))}
              </div>
            </>
          )}
          {!reports.length && !loading && (
            <p style={{ fontSize: 13, color: T.gray400, textAlign: 'center', padding: '28px 0 8px' }}>
              Belum ada laporan masuk.
            </p>
          )}
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════
          Section 2: Jadwal
      ═══════════════════════════════════════════════════ */}
      <Card>
        <CardHeader icon="2" title="Jadwal pengangkutan sampah" badge="Publik & Admin" badgeColor="green" />
        <CardBody>
          {isAdmin && (
            <SubForm title="Tambah jadwal baru">
              <form onSubmit={handleCreateSchedule}>
                <div style={formGrid}>
                  <Field label="Area">
                    <Input value={scheduleForm.area} required placeholder="Nama area / kelurahan"
                      onChange={(e) => setScheduleForm({ ...scheduleForm, area: e.target.value })} />
                  </Field>
                  <Field label="Tanggal angkut">
                    <Input type="date" value={scheduleForm.pickup_date} required
                      onChange={(e) => setScheduleForm({ ...scheduleForm, pickup_date: e.target.value })} />
                  </Field>
                  <Field label="Jam mulai">
                    <Input type="time" value={scheduleForm.start_time} required
                      onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                  </Field>
                  <Field label="Jam selesai">
                    <Input type="time" value={scheduleForm.end_time} required
                      onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                  </Field>
                  <Field label="Catatan" full>
                    <Textarea value={scheduleForm.notes} placeholder="Catatan tambahan (opsional)"
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} />
                  </Field>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <BtnPrimary type="submit">Tambah jadwal →</BtnPrimary>
                </div>
              </form>
            </SubForm>
          )}

          {schedules.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {schedules.map((schedule) => {
                const isToday = schedule.pickup_date?.slice(0, 10) === todayDate;
                return (
                  <ListItem key={schedule.id} style={isToday ? { borderColor: T.green200, borderLeftWidth: 3, borderLeftColor: T.green500 } : {}}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.gray900 }}>{schedule.area}</p>
                      {isToday && <Badge color="green">Hari ini</Badge>}
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: 13, color: T.gray500 }}>
                      📅 {schedule.pickup_date?.slice(0, 10)}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: T.gray500 }}>
                      🕐 {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                    </p>
                    {schedule.notes && (
                      <p style={{ margin: '10px 0 0', fontSize: 12, color: T.gray400, lineHeight: 1.6 }}>{schedule.notes}</p>
                    )}
                  </ListItem>
                );
              })}
            </div>
          ) : !loading && (
            <p style={{ fontSize: 13, color: T.gray400, textAlign: 'center', padding: '28px 0 8px' }}>
              Belum ada jadwal pengangkutan.
            </p>
          )}
        </CardBody>
      </Card>

      {/* ═══════════════════════════════════════════════════
          Section 3: Monitoring
      ═══════════════════════════════════════════════════ */}
      <Card>
        <CardHeader icon="3" title="Monitoring petugas kebersihan" badge="Admin" badgeColor="amber" />
        <CardBody>
          {isAdmin && (
            <>
              {/* Add officer */}
              <SubForm title="Tambah petugas baru">
                <form onSubmit={handleCreateOfficer}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                    <Field label="Nama petugas">
                      <Input value={officerForm.name} required placeholder="Nama lengkap"
                        onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} />
                    </Field>
                    <Field label="Telepon">
                      <Input value={officerForm.phone} placeholder="08xx-xxxx-xxxx"
                        onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })} />
                    </Field>
                    <Field label="Zona kerja">
                      <Input value={officerForm.zone} required placeholder="Zona A, B, dst."
                        onChange={(e) => setOfficerForm({ ...officerForm, zone: e.target.value })} />
                    </Field>
                    <BtnPrimary type="submit" style={{ whiteSpace: 'nowrap' }}>+ Tambah</BtnPrimary>
                  </div>
                </form>
              </SubForm>

              {/* Log form */}
              <SubForm title="Input log monitoring">
                <form onSubmit={handleCreateLog}>
                  <div style={formGrid}>
                    <Field label="Pilih petugas">
                      <Select value={logForm.officerId} required
                        onChange={(e) => setLogForm({ ...logForm, officerId: e.target.value })}>
                        <option value="">— Pilih petugas —</option>
                        {officers.map((o) => (
                          <option key={o.id} value={o.id}>{o.name} ({o.zone})</option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Status tugas">
                      <Input value={logForm.status} placeholder="cth: sedang menyapu" required
                        onChange={(e) => setLogForm({ ...logForm, status: e.target.value })} />
                    </Field>
                    <Field label="Latitude">
                      <Input type="number" step="0.0000001" value={logForm.latitude} required placeholder="-6.2000000"
                        onChange={(e) => setLogForm({ ...logForm, latitude: e.target.value })} />
                    </Field>
                    <Field label="Longitude">
                      <Input type="number" step="0.0000001" value={logForm.longitude} required placeholder="106.8166666"
                        onChange={(e) => setLogForm({ ...logForm, longitude: e.target.value })} />
                    </Field>
                    <Field label="Catatan" full>
                      <Textarea value={logForm.notes} placeholder="Catatan kegiatan petugas..."
                        onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} />
                    </Field>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <BtnPrimary type="submit">Simpan monitoring →</BtnPrimary>
                  </div>
                </form>
              </SubForm>
            </>
          )}

          {monitoring.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {monitoring.map((item) => {
                const initials = item.name?.charAt(0).toUpperCase() || '?';
                const active = Boolean(item.is_active);
                return (
                  <ListItem key={item.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        backgroundColor: active ? T.green50 : T.gray100,
                        border: `2px solid ${active ? T.green200 : T.gray200}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700,
                        color: active ? T.green700 : T.gray500,
                      }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: T.gray900 }}>{item.name}</p>
                        <p style={{ margin: '1px 0 0', fontSize: 12, color: T.gray500 }}>Zona: {item.zone}</p>
                      </div>
                      <Badge color={active ? 'green' : 'gray'}>{active ? 'Aktif' : 'Nonaktif'}</Badge>
                    </div>
                    <div style={{
                      borderTop: `1px solid ${T.gray100}`,
                      paddingTop: 10,
                      display: 'flex', flexDirection: 'column', gap: 4,
                    }}>
                      <p style={{ margin: 0, fontSize: 13, color: T.gray700 }}>
                        <span style={{ color: T.gray400, fontWeight: 500 }}>Status: </span>
                        {item.latest_status || '—'}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: T.gray400 }}>
                        📞 {item.phone || '—'} &nbsp;·&nbsp; 📍 {item.latitude ?? '—'}, {item.longitude ?? '—'}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: T.gray400 }}>
                        Diperbarui: {formatDateTime(item.last_update)}
                      </p>
                    </div>
                  </ListItem>
                );
              })}
            </div>
          ) : !loading && (
            <p style={{ fontSize: 13, color: T.gray400, textAlign: 'center', padding: '28px 0 8px' }}>
              Belum ada data monitoring.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Footer */}
      <div style={{
        textAlign: 'center', padding: '24px 0 0',
        borderTop: `1px solid ${T.gray200}`,
        marginTop: 8,
      }}>
        <p style={{ margin: 0, fontSize: 11, color: T.gray400, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Go Go Trash Go — Sistem Manajemen Persampahan
        </p>
      </div>

    </div>
  );
}