import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthProvider"; 
import api from "../api/axios"; 
import "./Profile.css";

// Placeholder cover image
const COVER_IMAGE = "https://placehold.co/1200x200/2c3e50/ffffff?text=User+Cover";

// --- PATH AVATAR DEFAULT ---
const DEFAULT_AVATAR_PATH = "/uploads/avatars/default.png"; 


// Icon SVG untuk Avatar default
const UserIcon = ({ size = 48 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.6"         
    strokeLinecap="round"     
    strokeLinejoin="round"    
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="8" r="4" />
  </svg>
);

export default function Profile() {
  const { currentUser, updateCurrentUser } = useAuth(); 
  
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  
  // State baru untuk menangani kegagalan pemuatan gambar
  const [avatarFailed, setAvatarFailed] = useState(false); 
  
  // State untuk Statistik
  const [statistics, setStatistics] = useState({ targets: 0, tests: 0, vulns: 0 });
  const [statsLoading, setStatsLoading] = useState(true); 
  
  // State untuk Aktivitas
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  // State untuk Form Profil
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    location: "",
    joined: "",
    bio: "",
    avatar: null, 
    avatarFile: null, 
  });

// --- UTAMA: FUNGSI DATA FETCHING ---

    const fetchActivities = async () => {
        if (!currentUser) return;
        setActivitiesLoading(true);
        try {
            const response = await api.get("/activities/recent"); 
            setRecentActivities(response.data || []);
        } catch (err) {
            console.error("Error fetching recent activities:", err);
            setRecentActivities([{ 
                type: 'Failed to load activities', 
                date: new Date().toISOString(), 
                detail: 'Check API /activities/recent' 
            }]);
        } finally {
            setActivitiesLoading(false);
        }
    }

    const fetchStatistics = async () => {
        if (!currentUser) {
             setStatsLoading(false); return;
        }
        setStatsLoading(true);
        try {
            const response = await api.get("/stats/user"); 
            const { targets = 0, tests = 0, vulns = 0 } = response.data || {};
            setStatistics({ targets, tests, vulns });
        } catch (err) {
            console.error("Error fetching statistics:", err);
            setStatistics({ targets: 0, tests: 0, vulns: 0 }); 
        } finally {
            setStatsLoading(false);
        }
    }

  useEffect(() => {
    if (!currentUser) {
      setStatsLoading(false); 
      setActivitiesLoading(false); 
      return;
    }

    // Sinkronisasi data profil dari currentUser
    setForm({
      name: currentUser.name || currentUser.username || "Anonymous User",
      role: currentUser.role || "Security Analyst",
      email: currentUser.email || "",
      location: currentUser.location || "Unknown Location",
      joined: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : "Recently",
      bio: currentUser.bio || "No bio yet.",
      avatar: currentUser.avatarUrl || null, 
      avatarFile: null,
    });
    
    // Reset state kegagalan setiap kali data currentUser di-refresh
    setAvatarFailed(false); 
    
    fetchStatistics();
    fetchActivities(); 
    
  }, [currentUser]); 

  // --- Handle Form Input & Save ---
    function handleChange(e) {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    }

    function handleAvatarChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (form.avatarFile) {
            URL.revokeObjectURL(form.avatar); 
        }

        const previewUrl = URL.createObjectURL(file);
        
        // Reset avatarFailed karena ada file baru
        setAvatarFailed(false);
        
        setForm((s) => ({ ...s, avatar: previewUrl, avatarFile: file })); 
    }

    async function saveProfile(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData();
        
        formData.append('name', form.name);
        formData.append('role', form.role);
        formData.append('location', form.location);
        formData.append('bio', form.bio);
        
        if (form.avatarFile) {
            formData.append('avatar', form.avatarFile); 
        }

        try {
            const response = await api.put("/users/profile", formData); 
            
            if (form.avatarFile) {
                URL.revokeObjectURL(form.avatar); 
            }

            if (updateCurrentUser) {
                updateCurrentUser(response.data); 
            }
            
            setEditMode(false);
            setForm(s => ({...s, avatarFile: null}));
            setError("Profile updated successfully!");
            
            await fetchActivities(); 

        } catch (err) {
            console.error("Error saving profile:", err);
            
            if (form.avatarFile) {
                URL.revokeObjectURL(form.avatar);
            }
            setError(err.response?.data?.message || "Failed to save profile changes. Please check server logs.");
        } finally {
            setLoading(false);
        }
    }

    function handleCancel() {
        if (form.avatarFile) {
            URL.revokeObjectURL(form.avatar);
        }

        if (currentUser) {
            setForm({
                name: currentUser.name || currentUser.username || "Anonymous User",
                role: currentUser.role || "Security Analyst",
                email: currentUser.email || "",
                location: currentUser.location || "Unknown Location",
                joined: currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : "Recently",
                bio: currentUser.bio || "No bio yet.",
                avatar: currentUser.avatarUrl || null, 
                avatarFile: null, 
            });
        }
        setEditMode(false);
        setError(null);
        setAvatarFailed(false); // Reset kegagalan saat batal
    }
    // --- Akhir Handle Form Input & Save ---


  // --- LOGIKA TAMPILAN AVATAR (FINAL PERBAIKAN URL) ---
    const isLocalAvatar = form.avatarFile && form.avatar;
    let finalAvatarUrl = null;

    if (isLocalAvatar) {
        // Kasus 1: Sedang dalam mode pratinjau (URL objek lokal)
        finalAvatarUrl = form.avatar;
    } else if (form.avatar) {
        // Kasus 2: URL dari database (Asumsi backend mengembalikan path LENGKAP atau path yang bisa langsung diakses)
        // Jika backend mengembalikan "uploads/avatars/file.png" ATAU "/uploads/avatars/file.png"
        // Kita gunakan saja apa adanya, karena penambahan "/uploads/" di baris 211 sebelumnya yang menyebabkan masalah URL ganda.
        
        // JIKA backend hanya mengembalikan NAMA FILE (misal: "my-photo.jpg"):
        // finalAvatarUrl = `/uploads/avatars/${form.avatar}`; // UNCOMMENT JIKA INI KASUSNYA

        // JIKA backend mengembalikan PATH LENGKAP (misal: "uploads/avatars/my-photo.jpg"):
        finalAvatarUrl = `/${form.avatar.replace(/^\//, '')}`; // Tambahkan '/' jika belum ada, lalu gunakan path dari DB

    } else {
        // Kasus 3: Tidak ada avatar dari DB, gunakan default.png
        finalAvatarUrl = DEFAULT_AVATAR_PATH;
    }
  // --- AKHIR LOGIKA TAMPILAN AVATAR ---


  if (!currentUser || (form.name === "" && !statsLoading && !activitiesLoading)) {
    return (
        <div className="profile-page">
            <div className="container">
                <div className="card" style={{padding: '2rem', textAlign: 'center'}}>
                    <h2>Loading user data...</h2>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container main-content">
        
        <div className="profile-top card">
          <div className="cover" style={{ backgroundImage: `url(${COVER_IMAGE})` }}>
            <div className="cover-overlay" />
            <div className="cover-inner">
              <div className="avatar-block">
                <div className="avatar-frame">
                  {/* ✨ TAMPILKAN AVATAR (LOGIKA BARU DENGAN STATE FAILOVER) */}
                  {finalAvatarUrl && !avatarFailed ? 
                    <img 
                      src={finalAvatarUrl} 
                      alt="avatar" 
                      // ✨ PERBAIKAN: Gunakan state untuk menandai kegagalan
                      onError={() => {
                          setAvatarFailed(true);
                      }}
                    /> 
                    : <UserIcon size={72} />}
                    
                </div>
              </div>
              <div className="meta-block">
                <h1 className="name">{form.name}</h1>
                <div className="role">{form.role}</div>
              </div>
              <div className="top-actions">
                <button
                  className={`btn ${editMode ? "btn-danger" : "btn-primary"}`}
                  onClick={() => {
                    if (editMode) {
                        handleCancel();
                    } else {
                        setEditMode(true);
                    }
                  }}
                  type="button"
                  disabled={loading}
                >
                  {loading ? "Loading..." : (editMode ? "Cancel" : "Edit profile")}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-grid">
          <section className="card main-card">
            <div className="card-body">
              <div className="section-head">
                <h2>Profile</h2>
                <span className="muted">Member since {form.joined}</span>
              </div>
              
              {error && <div className={`error-message ${error.includes('successfully') ? 'success' : 'error'}`}>{error}</div>}

              {!editMode ? (
                <>
                    <p className="lead">{form.bio}</p>
                    <dl className="details-grid">
                        <div><dt>Email</dt><dd>{form.email}</dd></div>
                        <div><dt>Location</dt><dd>{form.location}</dd></div>
                        <div><dt>Joined</dt><dd>{form.joined}</dd></div>
                    </dl>
                </>
              ) : (
                <form className="edit-form" onSubmit={saveProfile}>
                    <div className="form-row">
                      <label>
                        <div className="label">Full name</div>
                        <input name="name" value={form.name} onChange={handleChange} required />
                      </label>
                      <label>
                        <div className="label">Role</div>
                        <input name="role" value={form.role} onChange={handleChange} />
                      </label>
                    </div>
                    <div className="form-row">
                      <label>
                        <div className="label">Email</div>
                        <input name="email" value={form.email} disabled /> 
                      </label>
                      <label>
                        <div className="label">Location</div>
                        <input name="location" value={form.location} onChange={handleChange} />
                      </label>
                    </div>
                    <label className="label-block">
                      <div className="label">Bio</div>
                      <textarea name="bio" value={form.bio} onChange={handleChange} rows="4" />
                    </label>
                    <label className="label-block">
                      <div className="label">Avatar</div>
                      <input type="file" accept="image/*" onChange={handleAvatarChange} />
                      {form.avatarFile && <p className="muted">File dipilih: {form.avatarFile.name}</p>}
                    </label>
                    <div className="form-actions">
                      <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? "Saving..." : "Save changes"}
                      </button>
                      <button className="btn" onClick={handleCancel} type="button" disabled={loading}>Discard</button>
                    </div>
                </form>
              )}

              <hr />

              <h3>Recent activity</h3>
              {activitiesLoading ? (
                  <p>Loading activities...</p>
              ) : recentActivities.length === 0 ? (
                  <p className="muted">No recent activity found for this user.</p>
              ) : (
                  <ul className="activity">
                      {recentActivities.map((activity, index) => (
                          <li key={index}>
                              {activity.type} 
                              <span className="muted"> — {new Date(activity.date).toLocaleDateString('en-GB')}</span> 
                              {activity.detail && <span className="muted-small"> · {activity.detail}</span>}
                          </li>
                      ))}
                  </ul>
              )}
            </div>
          </section>

          <aside className="card aside-card">
            <div className="card-body aside-body">
              <div className="stats">
                <div className="stats-head">Statistics</div>
                <div className="stats-grid">
                  {statsLoading ? (
                    <div style={{ textAlign: 'center', gridColumn: 'span 3' }}>Loading stats...</div>
                  ) : (
                    <>
                      <div className="stat-item">
                        <div className="value">{statistics.targets}</div>
                        <div className="label">Targets</div>
                      </div>
                      <div className="stat-item">
                        <div className="value">{statistics.tests}</div>
                        <div className="label">Tests</div>
                      </div>
                      <div className="stat-item">
                        <div className="value">{statistics.vulns}</div>
                        <div className="label">Vulns</div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="actions-block">
                <div className="actions-head">Quick actions</div>
                <div className="stack">
                  <button className="action-btn" onClick={() => window.location.href = '/targets'}>Tambah target baru</button>
                  <button className="action-btn" onClick={() => window.location.href = '/tests'}>Jalankan Security Scan</button>
                  <button className="action-btn" onClick={() => window.location.href = '/reports'}>Lihat laporan</button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}