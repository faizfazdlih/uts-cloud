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
  return new Date(value).toLocaleString('id-ID');
}

const defaultLatitude = -6.2;
const defaultLongitude = 106.816666;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// ── primitives ────────────────────────────────────────────────────────────────

const cn = (...classes) => classes.filter(Boolean).join(' ');

const styles = {
  // layout
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 12,
    padding: '24px',
    marginBottom: 16,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottom: '1px solid hsl(240 5.9% 90%)',
  },
  sectionTitleGroup: { display: 'flex', alignItems: 'center', gap: 10 },
  sectionNum: {
    width: 24, height: 24,
    borderRadius: 6,
    backgroundColor: 'hsl(240 10% 3.9%)',
    color: '#fff',
    fontSize: 12, fontWeight: 500,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: { fontSize: 15, fontWeight: 600, color: 'hsl(240 10% 3.9%)' },

  // form
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 },
  fieldWrapper: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: 'hsl(240 3.8% 46.1%)' },
  input: {
    height: 36, padding: '0 12px', fontSize: 13,
    color: 'hsl(240 10% 3.9%)',
    backgroundColor: '#ffffff',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 8,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  textarea: {
    padding: '8px 12px', fontSize: 13,
    color: 'hsl(240 10% 3.9%)',
    backgroundColor: '#ffffff',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 8,
    outline: 'none', width: '100%', minHeight: 80,
    resize: 'vertical', boxSizing: 'border-box',
    fontFamily: 'inherit', lineHeight: 1.6,
  },
  select: {
    height: 36, padding: '0 12px', fontSize: 13,
    color: 'hsl(240 10% 3.9%)',
    backgroundColor: '#ffffff',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 8,
    outline: 'none', width: '100%', boxSizing: 'border-box',
    fontFamily: 'inherit', cursor: 'pointer',
  },

  // buttons
  btnPrimary: {
    height: 36, padding: '0 16px', fontSize: 13, fontWeight: 500,
    backgroundColor: 'hsl(240 10% 3.9%)',
    color: '#ffffff',
    border: '1px solid hsl(240 10% 3.9%)',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    height: 36, padding: '0 14px', fontSize: 13, fontWeight: 500,
    backgroundColor: '#ffffff',
    color: 'hsl(240 10% 3.9%)',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
  },

  // inline sub-form box
  inlineForm: {
    backgroundColor: 'hsl(240 4.8% 95.9%)',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
  },
  inlineFormLabel: {
    fontSize: 12, fontWeight: 600,
    color: 'hsl(240 3.8% 46.1%)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: 12,
  },

  // report / schedule item
  listItem: {
    backgroundColor: 'hsl(240 4.8% 95.9%)',
    border: '1px solid hsl(240 5.9% 90%)',
    borderRadius: 10,
    padding: '14px 16px',
  },

  emptyText: {
    fontSize: 13, color: 'hsl(240 3.8% 46.1%)',
    textAlign: 'center', padding: '24px 0',
  },
};

// ── small reusable components ─────────────────────────────────────────────────

function Badge({ children, variant = 'default' }) {
  const variantStyles = {
    default: { backgroundColor: 'hsl(240 4.8% 95.9%)', color: 'hsl(240 3.8% 46.1%)', border: '1px solid hsl(240 5.9% 90%)' },
    blue:    { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' },
    green:   { backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0' },
    amber:   { backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' },
    red:     { backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' },
  };
  return (
    <span style={{
      fontSize: 11, fontWeight: 500,
      padding: '2px 8px', borderRadius: 6,
      ...variantStyles[variant],
    }}>
      {children}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    baru:     { label: 'Baru',     variant: 'blue' },
    diproses: { label: 'Diproses', variant: 'amber' },
    selesai:  { label: 'Selesai',  variant: 'green' },
  };
  const cfg = map[status] || { label: status, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function StatCard({ label, value, color }) {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      border: '1px solid hsl(240 5.9% 90%)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <p style={{ fontSize: 11, color: 'hsl(240 3.8% 46.1%)', margin: '0 0 8px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 600, margin: 0, lineHeight: 1, color: color || 'hsl(240 10% 3.9%)' }}>{value}</p>
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

function SectionHeader({ number, title, badgeLabel, badgeVariant }) {
  return (
    <div style={styles.sectionHeader}>
      <div style={styles.sectionTitleGroup}>
        <div style={styles.sectionNum}>{number}</div>
        <h2 style={{ ...styles.sectionTitle, margin: 0 }}>{title}</h2>
      </div>
      <Badge variant={badgeVariant}>{badgeLabel}</Badge>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={styles.fieldWrapper}>
      <label style={styles.label}>{label}</label>
      {children}
    </div>
  );
}

function Separator({ style }) {
  return <div style={{ height: 1, backgroundColor: 'hsl(240 5.9% 90%)', margin: '20px 0', ...style }} />;
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
      style={{ width: '100%', height: 280, borderRadius: 8, overflow: 'hidden', border: '1px solid hsl(240 5.9% 90%)' }}
    />
  );
}

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

  const alertVariants = {
    success: { bg: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' },
    error:   { bg: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c' },
    info:    { bg: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8' },
  };

  return (
    <div style={{
      maxWidth: 900, margin: '0 auto', padding: '0 20px 60px',
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
      backgroundColor: 'hsl(240 4.8% 95.9%)',
      minHeight: '100vh',
    }}>

      {/* Navbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 0 18px',
        borderBottom: '1px solid hsl(240 5.9% 90%)',
        marginBottom: 24,
      }}>
        <div>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'hsl(240 10% 3.9%)' }}>GO GO TRASH GO</p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'hsl(240 3.8% 46.1%)', letterSpacing: '0.03em' }}>
            Sistem Manajemen Persampahan
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={loadAllData} style={styles.btnSecondary}>
            {loading ? '...' : 'Muat ulang'}
          </button>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ ...styles.select, width: 'auto', paddingRight: 28 }}
          >
            <option value="masyarakat">Masyarakat</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Alert */}
      {message && (
        <div style={{
          margin: '0 0 16px',
          padding: '10px 14px',
          borderRadius: 8,
          fontSize: 13, fontWeight: 500,
          ...alertVariants[messageType],
        }}>
          {message}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatCard label="Total laporan"   value={dashboardStats.totalLaporan}   />
        <StatCard label="Laporan baru"    value={dashboardStats.laporanBaru}    color="#1d4ed8" />
        <StatCard label="Selesai"         value={dashboardStats.laporanSelesai} color="#15803d" />
        <StatCard label="Jadwal hari ini" value={dashboardStats.jadwalHariIni}  color="#b45309" />
        <StatCard label="Petugas aktif"   value={dashboardStats.petugasAktif}   color="#b91c1c" />
      </div>

      {/* ── Section 1: Pelaporan ── */}
      <Card>
        <SectionHeader number="1" title="Pelaporan sampah liar" badgeLabel="Publik" badgeVariant="blue" />

        <form onSubmit={handleCreateReport}>
          <div style={styles.formGrid}>
            <Field label="Nama pelapor">
              <input
                style={styles.input} value={reportForm.reporter_name} required
                onChange={(e) => setReportForm({ ...reportForm, reporter_name: e.target.value })}
              />
            </Field>
            <Field label="Alamat / keterangan lokasi">
              <input
                style={styles.input} value={reportForm.address}
                onChange={(e) => setReportForm({ ...reportForm, address: e.target.value })}
              />
            </Field>
            <Field label="Latitude">
              <input
                type="number" step="0.0000001" style={styles.input}
                value={reportForm.latitude} required
                onChange={(e) => setReportForm({ ...reportForm, latitude: e.target.value })}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="number" step="0.0000001" style={styles.input}
                value={reportForm.longitude} required
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
            <button type="button" onClick={handleUseCurrentLocation} style={{ ...styles.btnSecondary, marginTop: 8, fontSize: 12 }}>
              Gunakan lokasi saya
            </button>
          </Field>

          <div style={{ marginTop: 14 }}>
            <Field label="Deskripsi laporan">
              <textarea
                style={styles.textarea} value={reportForm.description} required
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
              />
            </Field>
          </div>

          <div style={{ marginTop: 14 }}>
            <Field label={<>Upload gambar <span style={{ color: 'hsl(240 3.8% 46.1%)', fontWeight: 400 }}>(opsional)</span></>}>
              <div style={{
                marginTop: 4,
                border: '1px dashed hsl(240 5.9% 85%)',
                borderRadius: 8, padding: '12px 14px',
                backgroundColor: 'hsl(240 4.8% 95.9%)',
              }}>
                <input
                  type="file" accept="image/*"
                  style={{ fontSize: 12, color: 'hsl(240 3.8% 46.1%)' }}
                  onChange={(e) => setReportPhoto(e.target.files?.[0] || null)}
                />
                {reportPhoto && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#15803d', fontWeight: 500 }}>
                    ✓ {reportPhoto.name}
                  </p>
                )}
              </div>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="submit" style={styles.btnPrimary}>Kirim laporan</button>
          </div>
        </form>

        {/* Report list */}
        {reports.length > 0 && (
          <>
            <Separator />
            <p style={{ ...styles.label, marginBottom: 12 }}>Daftar laporan ({reports.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map((report) => (
                <div key={report.id} style={styles.listItem}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'hsl(240 10% 3.9%)' }}>{report.reporter_name}</p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p style={{ margin: '0 0 8px', fontSize: 13, color: 'hsl(240 3.8% 46.1%)', lineHeight: 1.6 }}>{report.description}</p>
                  {report.photo_url && (
                    <img
                      src={resolveAssetUrl(report.photo_url)} alt="Foto laporan"
                      style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8, border: '1px solid hsl(240 5.9% 90%)' }}
                    />
                  )}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: 'hsl(240 3.8% 60%)' }}>
                      📍 {report.latitude}, {report.longitude}{report.address ? ` · ${report.address}` : ''}
                    </span>
                    <span style={{ fontSize: 12, color: 'hsl(240 3.8% 60%)' }}>
                      🕐 {formatDateTime(report.created_at)}
                    </span>
                  </div>
                  {isAdmin && (
                    <div style={{ marginTop: 10 }}>
                      <select
                        value={report.status}
                        onChange={(e) => handleUpdateReportStatus(report.id, e.target.value)}
                        style={{ ...styles.select, width: 180, fontSize: 12 }}
                      >
                        <option value="baru">Baru</option>
                        <option value="diproses">Diproses</option>
                        <option value="selesai">Selesai</option>
                      </select>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        {!reports.length && !loading && (
          <p style={styles.emptyText}>Belum ada laporan masuk.</p>
        )}
      </Card>

      {/* ── Section 2: Jadwal ── */}
      <Card>
        <SectionHeader number="2" title="Jadwal pengangkutan sampah" badgeLabel="Publik & Admin" badgeVariant="green" />

        {isAdmin && (
          <div style={styles.inlineForm}>
            <p style={styles.inlineFormLabel}>Tambah jadwal baru</p>
            <form onSubmit={handleCreateSchedule}>
              <div style={styles.formGrid}>
                <Field label="Area">
                  <input style={styles.input} value={scheduleForm.area} required
                    onChange={(e) => setScheduleForm({ ...scheduleForm, area: e.target.value })} />
                </Field>
                <Field label="Tanggal angkut">
                  <input type="date" style={styles.input} value={scheduleForm.pickup_date} required
                    onChange={(e) => setScheduleForm({ ...scheduleForm, pickup_date: e.target.value })} />
                </Field>
                <Field label="Jam mulai">
                  <input type="time" style={styles.input} value={scheduleForm.start_time} required
                    onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
                </Field>
                <Field label="Jam selesai">
                  <input type="time" style={styles.input} value={scheduleForm.end_time} required
                    onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
                </Field>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Field label="Catatan">
                    <textarea style={styles.textarea} value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} />
                  </Field>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" style={styles.btnPrimary}>Tambah jadwal</button>
              </div>
            </form>
          </div>
        )}

        {schedules.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {schedules.map((schedule) => (
              <div key={schedule.id} style={styles.listItem}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14, color: 'hsl(240 10% 3.9%)' }}>{schedule.area}</p>
                <p style={{ margin: '0 0 2px', fontSize: 13, color: 'hsl(240 3.8% 46.1%)' }}>{schedule.pickup_date?.slice(0, 10)}</p>
                <p style={{ margin: 0, fontSize: 12, color: 'hsl(240 3.8% 60%)' }}>
                  {schedule.start_time?.slice(0, 5)} – {schedule.end_time?.slice(0, 5)}
                </p>
                {schedule.notes && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'hsl(240 3.8% 50%)' }}>{schedule.notes}</p>
                )}
              </div>
            ))}
          </div>
        ) : !loading && (
          <p style={styles.emptyText}>Belum ada jadwal pengangkutan.</p>
        )}
      </Card>

      {/* ── Section 3: Monitoring ── */}
      <Card>
        <SectionHeader number="3" title="Monitoring petugas kebersihan" badgeLabel="Admin" badgeVariant="amber" />

        {isAdmin && (
          <>
            {/* Add officer */}
            <div style={styles.inlineForm}>
              <p style={styles.inlineFormLabel}>Tambah petugas baru</p>
              <form onSubmit={handleCreateOfficer}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <Field label="Nama petugas">
                    <input style={styles.input} value={officerForm.name} required
                      onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} />
                  </Field>
                  <Field label="Telepon">
                    <input style={styles.input} value={officerForm.phone}
                      onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })} />
                  </Field>
                  <Field label="Zona kerja">
                    <input style={styles.input} value={officerForm.zone} required
                      onChange={(e) => setOfficerForm({ ...officerForm, zone: e.target.value })} />
                  </Field>
                  <button type="submit" style={{ ...styles.btnPrimary, whiteSpace: 'nowrap' }}>+ Tambah</button>
                </div>
              </form>
            </div>

            {/* Log form */}
            <div style={styles.inlineForm}>
              <p style={styles.inlineFormLabel}>Input log monitoring</p>
              <form onSubmit={handleCreateLog}>
                <div style={styles.formGrid}>
                  <Field label="Pilih petugas">
                    <select style={styles.select} value={logForm.officerId} required
                      onChange={(e) => setLogForm({ ...logForm, officerId: e.target.value })}>
                      <option value="">— Pilih petugas —</option>
                      {officers.map((o) => (
                        <option key={o.id} value={o.id}>{o.name} ({o.zone})</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status tugas">
                    <input style={styles.input} value={logForm.status} placeholder="contoh: sedang menyapu" required
                      onChange={(e) => setLogForm({ ...logForm, status: e.target.value })} />
                  </Field>
                  <Field label="Latitude">
                    <input type="number" step="0.0000001" style={styles.input} value={logForm.latitude} required
                      onChange={(e) => setLogForm({ ...logForm, latitude: e.target.value })} />
                  </Field>
                  <Field label="Longitude">
                    <input type="number" step="0.0000001" style={styles.input} value={logForm.longitude} required
                      onChange={(e) => setLogForm({ ...logForm, longitude: e.target.value })} />
                  </Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Catatan">
                      <textarea style={styles.textarea} value={logForm.notes}
                        onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} />
                    </Field>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" style={styles.btnPrimary}>Simpan monitoring</button>
                </div>
              </form>
            </div>
          </>
        )}

        {monitoring.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {monitoring.map((item) => (
              <div key={item.id} style={styles.listItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: item.is_active ? '#f0fdf4' : 'hsl(240 4.8% 92%)',
                    border: `1px solid ${item.is_active ? '#bbf7d0' : 'hsl(240 5.9% 85%)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 500,
                    color: item.is_active ? '#15803d' : 'hsl(240 3.8% 46.1%)',
                    flexShrink: 0,
                  }}>
                    {item.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: 'hsl(240 10% 3.9%)' }}>{item.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'hsl(240 3.8% 46.1%)' }}>Zona: {item.zone}</p>
                  </div>
                </div>
                <div style={{ borderTop: '1px solid hsl(240 5.9% 90%)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'hsl(240 10% 3.9%)' }}>
                    Status: <strong style={{ fontWeight: 500 }}>{item.latest_status || '—'}</strong>
                  </p>
                  <p style={{ margin: 0, fontSize: 12, color: 'hsl(240 3.8% 46.1%)' }}>
                    {item.phone || '—'} · {item.latitude ?? '—'}, {item.longitude ?? '—'}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'hsl(240 3.8% 60%)' }}>
                    Update: {formatDateTime(item.last_update)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <p style={styles.emptyText}>Belum ada data monitoring.</p>
        )}
      </Card>
    </div>
  );
}