import { useEffect, useState } from 'react'

interface Booking {
  id?: number;
  roomName: string;
  requesterName: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: string;
  createdAt: string;
}

function App() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyBookings, setHistoryBookings] = useState<Booking[]>([])
  const [historyRoomName, setHistoryRoomName] = useState<string>('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userRole, setUserRole] = useState<'Admin' | 'Manager' | 'User'>('User')
  const [adminPassword, setAdminPassword] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [newBooking, setNewBooking] = useState<Booking>({
    roomName: '', requesterName: '', purpose: '', status: 'Pending', startTime: '', endTime: '', createdAt: ''
  });

  const handleLogin = (e: React.FormEvent, role: 'Admin' | 'Manager' | 'User') => {
    e.preventDefault()
    if (role === 'User') {
      setIsLoggedIn(true); setUserRole(role);
    } else if (adminPassword === 'password123') {
      setIsLoggedIn(true); setUserRole(role); setAdminPassword('');
    } else {
      alert('Password salah!'); setAdminPassword('');
    }
  }

  const fetchBookings = async (term: string) => {
    setIsLoading(true)
    try {
      const url = term ? `http://localhost:5023/api/Bookings?searchTerm=${encodeURIComponent(term)}` : 'http://localhost:5023/api/Bookings';
      const response = await fetch(url)
      const data = await response.json()
      setBookings(data)
    } catch (err) { console.error(err) }
    finally { setIsLoading(false) }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchBookings(debouncedSearchTerm)
  }, [debouncedSearchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `http://localhost:5023/api/Bookings/${editingId}` : 'http://localhost:5023/api/Bookings';
      // build payload and OMIT createdAt when it's empty (server expects a valid DateTime)
      const payload: any = {
        roomName: newBooking.roomName,
        requesterName: newBooking.requesterName,
        startTime: new Date(newBooking.startTime).toISOString(),
        endTime: new Date(newBooking.endTime).toISOString(),
        purpose: newBooking.purpose,
        status: newBooking.status,
      };
      if (newBooking.createdAt) payload.createdAt = newBooking.createdAt;
      // when updating an existing booking the API expects the booking 'id' in the body
      if (editingId) payload.id = editingId;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchBookings(debouncedSearchTerm);
        closeModal();
      } else {
        const text = await response.text();
        console.error('Save failed', response.status, text);
        alert('Gagal menyimpan: ' + (text || response.status));
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan. Cek console untuk detail.');
    }
  }

  const handleEdit = (booking: Booking) => {
    setNewBooking({
      ...booking,
      startTime: new Date(booking.startTime).toISOString().slice(0, 16),
      endTime: new Date(booking.endTime).toISOString().slice(0, 16),
    });
    setEditingId(booking.id || null);
    setIsModalOpen(true);
  }

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  }

  const confirmDelete = async () => {
    if (deletingId) {
      await fetch(`http://localhost:5023/api/Bookings/${deletingId}`, { method: 'DELETE' })
      fetchBookings(debouncedSearchTerm)
      setDeletingId(null)
      setIsDeleteModalOpen(false)
    }
  }

  const cancelDelete = () => {
    setDeletingId(null);
    setIsDeleteModalOpen(false);
  }

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setNewBooking({ roomName: '', requesterName: '', purpose: '', status: 'Pending', startTime: '', endTime: '', createdAt: '' });
  }

  const handleDetail = async (id: number) => {
    try {
      const response = await fetch(`http://localhost:5023/api/Bookings/${id}`)
      const data = await response.json()
      setSelectedBooking(data)
      setIsDetailModalOpen(true)
    } catch (err) {
      console.error(err)
    }
  }

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedBooking(null);
  }

  const handleHistory = async (roomName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5023/api/Bookings?searchTerm=${encodeURIComponent(roomName)}`);
      const data: Booking[] = await response.json();
      // `searchTerm` is a substring search on server — filter exact room name here and sort by startTime desc
      const filtered = data.filter(b => b.roomName === roomName)
                           .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
      setHistoryBookings(filtered);
      setHistoryRoomName(roomName);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setHistoryBookings([]);
    setHistoryRoomName('');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {!isLoggedIn ? (
        /* --- LOGIN UI LIGHT MODE --- */
        <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-white">
          <div className="w-full max-w-md bg-white border border-blue-100 rounded-[2.5rem] shadow-2xl shadow-blue-200/50 overflow-hidden animate-in fade-in zoom-in duration-500">
            <div className="bg-blue-600 p-10 text-center">
              <span className="text-5xl block mb-4">🏫</span>
              <h1 className="text-3xl font-black text-white tracking-tight">PENS Booking</h1>
              <p className="text-blue-100 text-xs mt-1 font-bold uppercase tracking-widest">Sistem Booking Ruangan Digital</p>
            </div>
            
            <form onSubmit={(e) => handleLogin(e, userRole)} className="p-10 space-y-6">
              <div className="grid grid-cols-3 gap-3">
                {(['User', 'Manager', 'Admin'] as const).map((role) => (
                  <button key={role} type="button" onClick={() => {setUserRole(role); setAdminPassword('')}}
                    className={`py-3 rounded-2xl text-xs font-bold transition-all border-2 ${userRole === role ? 'bg-blue-50 border-blue-600 text-blue-600 shadow-sm' : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'}`}>
                    {role}
                  </button>
                ))}
              </div>

              {userRole !== 'User' && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <label className="text-xs font-black text-slate-400 ml-1">ADMIN PASSWORD</label>
                  <input type="password" required placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all"
                    value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
                </div>
              )}

              <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all active:scale-95 shadow-xl shadow-blue-200">
                MASUK SEBAGAI {userRole.toUpperCase()}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* --- DASHBOARD UI LIGHT MODE --- */
        <div className="max-w-7xl mx-auto p-8">
          <header className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-black text-blue-900 flex items-center gap-3">
                <span className="bg-blue-600 p-2 rounded-2xl text-white shadow-lg shadow-blue-200">📋</span> Dashboard
              </h1>
              <p className="text-slate-400 mt-1 font-medium">Selamat datang {userRole}</p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all active:scale-95">
                + Booking Baru
              </button>
              <button onClick={() => setIsLoggedIn(false)} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-6 py-3.5 rounded-2xl font-bold transition-all">
                Logout
              </button>
            </div>
          </header>

          <div className="mb-8">
            <input
              type="text"
              placeholder="🔍 Cari berdasarkan ruangan, peminjam, tujuan, atau status..."
              className="w-full bg-white border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white border border-blue-100 rounded-[2rem] overflow-hidden shadow-xl shadow-blue-100/50">
            <table className="w-full text-left">
              <thead className="bg-blue-50/50 border-b border-blue-100">
                <tr>
                  <th className="px-8 py-6 text-xs font-black text-blue-900/40 uppercase tracking-widest">Ruangan</th>
                  <th className="px-8 py-6 text-xs font-black text-blue-900/40 uppercase tracking-widest">Peminjam</th>
                  <th className="px-8 py-6 text-xs font-black text-blue-900/40 uppercase tracking-widest">Tujuan</th>
                  <th className="px-8 py-6 text-xs font-black text-blue-900/40 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-6 text-xs font-black text-blue-900/40 uppercase tracking-widest text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bookings.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-8 py-6 font-bold text-blue-900 text-lg">{item.roomName}</td>
                    <td className="px-8 py-6 font-semibold text-slate-600">{item.requesterName}</td>
                    <td className="px-8 py-6 text-sm text-slate-400 italic max-w-xs truncate">"{item.purpose}"</td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        item.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                        item.status === 'Rejected' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => item.id && handleDetail(item.id)} className="p-2.5 bg-slate-50 hover:bg-green-100 text-green-600 rounded-xl transition-all">👁️</button>
                          <button onClick={() => handleHistory(item.roomName)} className="p-2.5 bg-slate-50 hover:bg-yellow-100 text-yellow-600 rounded-xl transition-all">📜</button>
                          {(userRole === 'Admin' || userRole === 'Manager') && (
                              <>
                                  <button onClick={() => handleEdit(item)} className="p-2.5 bg-slate-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all">✏️</button>
                                  {userRole === 'Admin' && <button onClick={() => item.id && handleDelete(item.id)} className="p-2.5 bg-slate-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all">🗑️</button>}
                              </>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL FORM CERAH --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white border border-blue-50 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
            <div className="bg-blue-600 p-8 flex justify-between items-center text-white rounded-t-[2.5rem]">
              <h2 className="text-xl font-black tracking-tight">{editingId ? 'EDIT DATA' : 'BOOKING BARU'}</h2>
              <button onClick={closeModal} className="text-2xl opacity-50 hover:opacity-100 transition-opacity">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 ml-1 uppercase">Ruangan</label>
                  <input type="text" required placeholder="Nama Ruangan" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all"
                    value={newBooking.roomName} onChange={(e) => setNewBooking({...newBooking, roomName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 ml-1 uppercase">Peminjam</label>
                  <input type="text" required placeholder="Nama Anda" className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all"
                    value={newBooking.requesterName} onChange={(e) => setNewBooking({...newBooking, requesterName: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 ml-1 uppercase">Waktu Mulai</label>
                  <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all"
                    value={newBooking.startTime} onChange={(e) => setNewBooking({...newBooking, startTime: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 ml-1 uppercase">Waktu Selesai</label>
                  <input type="datetime-local" required className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all"
                    value={newBooking.endTime} onChange={(e) => setNewBooking({...newBooking, endTime: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 ml-1 uppercase">Tujuan</label>
                <textarea required placeholder="Keperluan peminjaman..." className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-blue-50 focus:border-blue-600 outline-none transition-all h-24"
                  value={newBooking.purpose} onChange={(e) => setNewBooking({...newBooking, purpose: e.target.value})} />
              </div>
              
              {(userRole === 'Admin' || userRole === 'Manager') && editingId && (
                <div className="space-y-2 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                  <label className="text-xs font-black text-blue-600 uppercase">Update Status Peminjaman</label>
                  <select className="w-full bg-transparent border-none text-blue-900 font-black outline-none cursor-pointer"
                    value={newBooking.status} onChange={(e) => setNewBooking({...newBooking, status: e.target.value})}>
                    <option value="Pending">🕒 Pending</option>
                    <option value="Approved">✅ Approved</option>
                    <option value="Rejected">❌ Rejected</option>
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors">BATAL</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                  {editingId ? 'UPDATE' : 'SIMPAN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DETAIL MODAL --- */}
      {isDetailModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white border border-blue-50 rounded-[2.5rem] w-full max-w-lg shadow-2xl">
            <div className="bg-blue-600 p-8 flex justify-between items-center text-white rounded-t-[2.5rem]">
              <h2 className="text-xl font-black tracking-tight">DETAIL PEMINJAMAN</h2>
              <button onClick={closeDetailModal} className="text-2xl opacity-50 hover:opacity-100 transition-opacity">✕</button>
            </div>
            <div className="p-10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <p><strong className="font-bold text-slate-500 block">Ruangan:</strong> <span className="text-slate-800 text-base font-semibold">{selectedBooking.roomName}</span></p>
                <p><strong className="font-bold text-slate-500 block">Peminjam:</strong> <span className="text-slate-800 text-base font-semibold">{selectedBooking.requesterName}</span></p>
                <p><strong className="font-bold text-slate-500 block">Waktu Mulai:</strong> <span className="text-slate-800 text-base font-semibold">{new Date(selectedBooking.startTime).toLocaleString('id-ID')}</span></p>
                <p><strong className="font-bold text-slate-500 block">Waktu Selesai:</strong> <span className="text-slate-800 text-base font-semibold">{new Date(selectedBooking.endTime).toLocaleString('id-ID')}</span></p>
                <p className="md:col-span-2"><strong className="font-bold text-slate-500 block">Tujuan:</strong> <span className="text-slate-800 text-base font-semibold">{selectedBooking.purpose}</span></p>
                <p><strong className="font-bold text-slate-500 block">Status:</strong> <span className="text-slate-800 text-base font-semibold">{selectedBooking.status}</span></p>
                <p><strong className="font-bold text-slate-500 block">Dibuat pada:</strong> <span className="text-slate-800 text-base font-semibold">{new Date(selectedBooking.createdAt).toLocaleString('id-ID')}</span></p>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeDetailModal} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-black hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">TUTUP</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- HISTORY MODAL --- */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-yellow-900/10 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white border border-yellow-100 rounded-[2.5rem] w-full max-w-2xl shadow-2xl">
            <div className="bg-yellow-600 p-6 flex justify-between items-center text-white rounded-t-[2.5rem]">
              <h2 className="text-lg font-black tracking-tight">Riwayat Peminjaman — {historyRoomName}</h2>
              <button onClick={closeHistoryModal} className="text-2xl opacity-50 hover:opacity-100 transition-opacity">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {historyBookings.length === 0 ? (
                <div className="text-center p-6 text-slate-500">Belum ada riwayat peminjaman untuk ruangan ini.</div>
              ) : (
                <div className="overflow-auto max-h-96">
                  <table className="w-full text-left">
                    <thead className="bg-yellow-50/50 border-b border-yellow-100">
                      <tr>
                        <th className="px-4 py-3 text-xs font-black text-yellow-900/40 uppercase">Peminjam</th>
                        <th className="px-4 py-3 text-xs font-black text-yellow-900/40 uppercase">Waktu Mulai</th>
                        <th className="px-4 py-3 text-xs font-black text-yellow-900/40 uppercase">Waktu Selesai</th>
                        <th className="px-4 py-3 text-xs font-black text-yellow-900/40 uppercase">Tujuan</th>
                        <th className="px-4 py-3 text-xs font-black text-yellow-900/40 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {historyBookings.map(b => (
                        <tr key={b.id}>
                          <td className="px-4 py-3 font-semibold text-slate-700">{b.requesterName}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{new Date(b.startTime).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{new Date(b.endTime).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-sm text-slate-500 italic max-w-xs truncate">{b.purpose}</td>
                          <td className="px-4 py-3 text-sm font-black uppercase">{b.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeHistoryModal} className="w-full bg-yellow-600 text-white py-3.5 rounded-2xl font-black hover:bg-yellow-700 transition-all shadow-xl shadow-yellow-100">TUTUP</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-rose-900/20 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white border border-rose-100 rounded-[2.5rem] w-full max-w-md shadow-2xl shadow-rose-200/50">
            <div className="p-10 text-center">
              <span className="text-5xl block mb-4">🗑️</span>
              <h2 className="text-2xl font-black text-rose-900 tracking-tight">Konfirmasi Hapus</h2>
              <p className="text-slate-500 mt-2">Apakah Anda yakin ingin menghapus data peminjaman ini secara permanen?</p>
            </div>
            <div className="flex bg-rose-50/50 rounded-b-[2.5rem] p-5 gap-4">
              <button onClick={cancelDelete} className="flex-1 py-3.5 font-bold text-slate-500 hover:text-slate-700 transition-colors rounded-2xl">
                Batal
              </button>
              <button onClick={confirmDelete} className="flex-1 bg-rose-600 text-white py-3.5 rounded-2xl font-black hover:bg-rose-700 transition-all shadow-xl shadow-rose-200">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App