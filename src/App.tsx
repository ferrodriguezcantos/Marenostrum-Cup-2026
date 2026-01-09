import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Shirt, Users, User, X, Camera, Trash2, Edit } from 'lucide-react';

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCRhQZYGJqf4mBXXeNr2Q7xH_1TJqkWIJ8",
  authDomain: "marenostrum-cup-2026.firebaseapp.com",
  projectId: "marenostrum-cup-2026",
  storageBucket: "marenostrum-cup-2026.firebasestorage.app",
  messagingSenderId: "234388591670",
  appId: "1:234388591670:web:978410dc19bd57b13eb497",
  measurementId: "G-VKYBQGL2XE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- CONFIG ADMIN ---
const ADMIN_PASSWORD = "Fe07012007*"; 

// --- DATOS POR DEFECTO (Para cargar la primera vez) ---
const DEFAULT_VENUES = [
  { id: 'central', name: 'Pavelló Central (Salou)', short: 'P. Central', image: 'https://lh3.googleusercontent.com/p/AF1QipN-zFv1vDkC6eQyS25v7qJ1qz4q7z9kE5v2x1z-=s680-w680-h510' },
  { id: 'ponent', name: 'Pavelló Ponent (Salou)', short: 'P. Ponent', image: 'https://lh3.googleusercontent.com/p/AF1QipO9x6_8_1_5_2_3_4_5_6_7_8_9_0_1_2_3_4_5=s680-w680-h510' },
  { id: 'cap', name: 'Pavelló Cap Salou (Salou)', short: 'P. Cap Salou', image: '' },
  { id: 'rebull', name: 'Pavelló Joan Rebull (Reus)', short: 'P. Joan Rebull', image: '' },
];

const CATEGORIES = ['Alevín', 'Infantil', 'Cadete Femenino', 'Cadete Masculino', 'Juvenil Masculino', 'Junior (Sub 19)'];

const DATES = [
  { day: '02', label: 'Jueves 2', full: '2026-04-02' },
  { day: '03', label: 'Viernes 3', full: '2026-04-03' },
  { day: '04', label: 'Sábado 4', full: '2026-04-04' },
  { day: '05', label: 'Domingo 5', full: '2026-04-05' },
];

// --- COMPONENTES ---

// Modal Editar Equipo (Admin)
const EditTeamModal = ({ team, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  const [data, setData] = useState(team || { name: '', logo: '', staff: [], players: [], kits: { home: '', away: '' } });

  // Manejadores sencillos para arrays
  const handlePlayerChange = (idx, field, val) => {
    const newPlayers = [...(data.players || [])];
    newPlayers[idx] = { ...newPlayers[idx], [field]: val };
    setData({ ...data, players: newPlayers });
  };
  const addPlayer = () => setData({ ...data, players: [...(data.players || []), { num: 0, name: '', pos: '' }] });
  const removePlayer = (idx) => setData({ ...data, players: data.players.filter((_, i) => i !== idx) });

  return (
    <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="bg-blue-900 p-4 text-white flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold">✏️ {team ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-xs font-bold">Nombre Equipo</label><input className="w-full border p-2 rounded" value={data.name} onChange={e => setData({...data, name: e.target.value})} /></div>
            <div><label className="text-xs font-bold">Logo URL</label><input className="w-full border p-2 rounded" value={data.logo} onChange={e => setData({...data, logo: e.target.value})} /></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded">
            <div><label className="text-xs font-bold">Camiseta 1ª (URL)</label><input className="w-full border p-2 rounded text-xs" value={data.kits?.home || ''} onChange={e => setData({...data, kits: {...data.kits, home: e.target.value}})} /></div>
            <div><label className="text-xs font-bold">Camiseta 2ª (URL)</label><input className="w-full border p-2 rounded text-xs" value={data.kits?.away || ''} onChange={e => setData({...data, kits: {...data.kits, away: e.target.value}})} /></div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2"><label className="text-xs font-bold">Jugadores</label><button onClick={addPlayer} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">+ Añadir</button></div>
            <div className="space-y-2 max-h-40 overflow-y-auto border p-2 rounded">
              {data.players?.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input placeholder="#" className="w-10 border p-1 rounded text-center" value={p.num} onChange={e => handlePlayerChange(i, 'num', e.target.value)} />
                  <input placeholder="Nombre" className="flex-1 border p-1 rounded" value={p.name} onChange={e => handlePlayerChange(i, 'name', e.target.value)} />
                  <input placeholder="Pos" className="w-16 border p-1 rounded" value={p.pos} onChange={e => handlePlayerChange(i, 'pos', e.target.value)} />
                  <button onClick={() => removePlayer(i)} className="text-red-500">🗑️</button>
                </div>
              ))}
            </div>
          </div>

          <div>
             <label className="text-xs font-bold block mb-1">Staff (Separar por comas)</label>
             <textarea className="w-full border p-2 rounded h-16" value={data.staff?.join(', ') || ''} onChange={e => setData({...data, staff: e.target.value.split(',').map(s => s.trim())})} placeholder="Entrenador 1, Fisio..." />
          </div>
        </div>
        <div className="p-4 border-t sticky bottom-0 bg-white flex justify-end gap-2">
           <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancelar</button>
           <button onClick={() => onSave(data)} className="px-6 py-2 bg-blue-600 text-white rounded font-bold">Guardar Equipo</button>
        </div>
      </div>
    </div>
  );
};

// Modal Ver Equipo (Público)
const TeamModal = ({ team, isOpen, onClose }) => {
  if (!isOpen || !team) return null;
  const [tab, setTab] = useState('squad'); 
  return (
    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white z-20 bg-black/20 rounded-full p-1"><X /></button>
        <div className="bg-blue-900 p-6 text-white text-center shrink-0">
          <div className="w-20 h-20 mx-auto bg-white rounded-full p-2 mb-3 shadow-lg flex items-center justify-center">
             {team.logo ? <img src={team.logo} className="w-full h-full object-contain" /> : <span className="text-3xl font-bold text-blue-900">{team.name?.[0]}</span>}
          </div>
          <h2 className="text-xl font-bold">{team.name}</h2>
        </div>
        <div className="flex border-b">
          <button onClick={() => setTab('squad')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${tab === 'squad' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><User size={16}/> Plantilla</button>
          <button onClick={() => setTab('staff')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${tab === 'staff' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><Users size={16}/> Staff</button>
          <button onClick={() => setTab('kits')} className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${tab === 'kits' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}><Shirt size={16}/> Kits</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          {tab === 'squad' && (
            <div className="space-y-2">
              {team.players?.length > 0 ? team.players.map((p, i) => (
                <div key={i} className="bg-white p-2 rounded shadow-sm flex items-center gap-3 border border-gray-100">
                  <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">{p.num}</div>
                  <div><p className="font-bold text-sm text-gray-800">{p.name}</p><p className="text-[10px] uppercase text-gray-500">{p.pos}</p></div>
                </div>
              )) : <p className="text-center text-gray-400 mt-10">Sin jugadores.</p>}
            </div>
          )}
          {tab === 'staff' && (
            <div className="space-y-2">
               {team.staff?.length > 0 ? team.staff.map((s, i) => <div key={i} className="bg-white p-3 rounded shadow-sm border-l-4 border-orange-400 font-medium text-gray-800">{s}</div>) : <p className="text-center text-gray-400 mt-10">Sin staff.</p>}
            </div>
          )}
          {tab === 'kits' && (
            <div className="space-y-6 text-center mt-4">
              {team.kits?.home && <div><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Local</h4><img src={team.kits.home} className="w-32 mx-auto rounded shadow border" /></div>}
              {team.kits?.away && <div><h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Visitante</h4><img src={team.kits.away} className="w-32 mx-auto rounded shadow border" /></div>}
              {!team.kits?.home && !team.kits?.away && <p className="text-gray-400">Sin equipaciones.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- TARJETA PARTIDO ---
const MatchCard = ({ match, isAdmin, onUpdate, onDelete, onOpenDetails, venues }) => {
  const venueObj = venues.find(v => v.id === match.venueId);
  const isLive = match.status === 'live';
  const statusColor = isLive ? 'bg-red-500' : (match.status === 'finished' ? 'bg-gray-300' : 'bg-blue-500');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 relative overflow-hidden group">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusColor}`}></div>
      {isAdmin && <button onClick={() => onDelete(match.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 p-1">🗑️</button>}
      <div className="pl-2 pr-4">
        <div className="flex justify-between items-start mb-3 text-xs text-gray-500 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            {isAdmin ? <input type="time" className="font-bold text-gray-800 text-sm bg-blue-50 border px-1 rounded" defaultValue={match.time} onBlur={(e) => onUpdate(match.id, 'time', e.target.value)} /> : <span className="font-bold text-gray-800 text-sm bg-gray-100 px-2 py-0.5 rounded">{match.time}</span>}
            {isAdmin ? <select className="uppercase text-xs border rounded bg-white" defaultValue={match.category} onChange={(e) => onUpdate(match.id, 'category', e.target.value)}>{CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select> : <span className="uppercase tracking-wide">{match.category}</span>}
          </div>
          <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full"><span className="mr-1">📍</span>{isAdmin ? <select className="bg-transparent border-none text-xs font-medium cursor-pointer" defaultValue={match.venueId} onChange={(e) => onUpdate(match.id, 'venueId', e.target.value)}>{venues.map(v => <option key={v.id} value={v.id}>{v.short || v.name}</option>)}</select> : <span className="font-medium">{venueObj?.short || venueObj?.name || 'Pista'}</span>}</div>
        </div>
        <div className="space-y-3">
          {[{ t: 'teamA', s: 'scoreA', l: 'logoA', c: 'blue' }, { t: 'teamB', s: 'scoreB', l: 'logoB', c: 'yellow' }].map((side, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <div className="flex items-center space-x-3 w-full">
                {match[side.l] ? <img src={match[side.l]} className="w-8 h-8 object-contain" /> : <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border bg-${side.c}-100 text-${side.c}-700 border-${side.c}-200`}>{idx === 0 ? 'A' : 'B'}</div>}
                {isAdmin ? <input type="text" className="border border-blue-300 rounded px-2 py-1 text-sm w-full mr-4" defaultValue={match[side.t]} onBlur={(e) => onUpdate(match.id, side.t, e.target.value)} /> : <span className="font-medium text-gray-900">{match[side.t]}</span>}
              </div>
              {isAdmin ? <input type="number" className="border border-gray-300 rounded px-1 py-1 w-16 text-center font-bold text-lg" defaultValue={match[side.s]} onBlur={(e) => onUpdate(match.id, side.s, parseInt(e.target.value) || 0)} /> : <span className="text-xl font-bold">{match.status === 'upcoming' ? '-' : match[side.s]}</span>}
            </div>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center flex-wrap gap-2">
          {isAdmin ? <select className="text-xs border p-1 rounded bg-gray-50" defaultValue={match.status} onChange={(e) => onUpdate(match.id, 'status', e.target.value)}><option value="upcoming">🕒 Pendiente</option><option value="live">🔴 En Juego</option><option value="finished">🏁 Finalizado</option></select> : <span className={`text-xs uppercase font-medium ${isLive ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>{isLive ? 'EN JUEGO' : (match.status === 'finished' ? 'FINALIZADO' : 'PRÓXIMAMENTE')}</span>}
          <div className="flex gap-2">
            <button onClick={() => onOpenDetails(match)} className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${isAdmin ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>📝 {isAdmin ? 'Editar Acta' : 'Ver Detalles'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedDate, setSelectedDate] = useState('2026-04-03');
  const [isAdmin, setIsAdmin] = useState(false);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [tournamentLogo, setTournamentLogo] = useState("https://marenostrumcup.es/wp-content/uploads/2024/08/simbol-MARENOSTRUM-3.png");
  
  // Modals
  const [editModal, setEditModal] = useState({ open: false, match: null });
  const [teamModal, setTeamModal] = useState({ open: false, team: null });
  const [editTeamModal, setEditTeamModal] = useState({ open: false, team: null });

  // --- SYNC CON FIREBASE ---
  useEffect(() => {
    const unsubMatches = onSnapshot(collection(db, "matches"), (snap) => setMatches(snap.docs.map(d => ({ ...d.data(), id: parseInt(d.id) }))));
    const unsubTeams = onSnapshot(collection(db, "teams"), (snap) => setTeams(snap.docs.map(d => ({ ...d.data(), id: d.id }))));
    const unsubVenues = onSnapshot(collection(db, "venues"), (snap) => {
       const vData = snap.docs.map(d => ({...d.data(), id: d.id}));
       if(vData.length === 0) vData.push(...DEFAULT_VENUES); // Fallback visual
       setVenues(vData);
    });
    const unsubLogo = onSnapshot(doc(db, "config", "main"), (d) => { if(d.exists()) setTournamentLogo(d.data().logo); });
    return () => { unsubMatches(); unsubTeams(); unsubVenues(); unsubLogo(); };
  }, []);

  // --- LOGICA DB ---
  const updateMatch = async (id, field, val) => await updateDoc(doc(db, "matches", id.toString()), { [field]: val });
  const deleteMatch = async (id) => { if(confirm("¿Borrar partido?")) await deleteDoc(doc(db, "matches", id.toString())); }
  
  const handleSaveTeam = async (teamData) => {
    const teamId = teamData.id || `team_${Date.now()}`;
    await setDoc(doc(db, "teams", teamId), { ...teamData, id: teamId });
    setEditTeamModal({ open: false, team: null });
  };
  const handleDeleteTeam = async (id) => { if(confirm("¿Borrar equipo?")) await deleteDoc(doc(db, "teams", id)); };

  const handleVenuePhoto = async (venue) => {
    const newUrl = prompt("URL de la foto del pabellón:", venue.image || "");
    if (newUrl !== null) {
      await setDoc(doc(db, "venues", venue.id), { ...venue, image: newUrl });
    }
  };

  const initDB = async () => {
    if(!confirm("¿Inicializar datos por defecto en la nube?")) return;
    for(const v of DEFAULT_VENUES) await setDoc(doc(db, "venues", v.id), v);
    alert("Pabellones inicializados.");
  };

  const toggleAdmin = () => {
    if(isAdmin) setIsAdmin(false);
    else if(prompt("Contraseña:") === ADMIN_PASSWORD) setIsAdmin(true);
  };

  const filteredMatches = matches.filter(m => m.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 relative">
      <header className="bg-white shadow sticky top-0 z-50 p-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
             <img src={tournamentLogo} className="h-10 object-contain" onClick={() => isAdmin && handleLogoEdit()} />
             <div className="leading-none"><h1 className="font-bold text-blue-900">MARENOSTRUM</h1><span className="text-xs text-blue-500">CUP 2026</span></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('matches')} className={`p-2 rounded w-10 flex flex-col items-center ${activeTab === 'matches' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>📅</button>
            <button onClick={() => setActiveTab('teams')} className={`p-2 rounded w-10 flex flex-col items-center ${activeTab === 'teams' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>🛡️</button>
            <button onClick={() => setActiveTab('venues')} className={`p-2 rounded w-10 flex flex-col items-center ${activeTab === 'venues' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>📍</button>
          </div>
        </div>
      </header>

      {activeTab === 'matches' && (
        <>
          <div className="bg-white border-b overflow-x-auto flex sticky top-[56px] z-40">
            {DATES.map(d => (<button key={d.full} onClick={() => setSelectedDate(d.full)} className={`flex-1 py-3 px-4 whitespace-nowrap border-b-2 ${selectedDate === d.full ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>{d.label}</button>))}
          </div>
          <div className="max-w-4xl mx-auto px-4 py-4">
             {isAdmin && <div className="mb-4 flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-200"><span className="text-xs font-bold text-yellow-800">MODO ADMIN</span><button onClick={() => {const id = Date.now(); setDoc(doc(db,"matches",id.toString()), {id, date: selectedDate, time:'12:00', venueId:'central', category:'Alevín', teamA:'Local', teamB:'Visitante', scoreA:0, scoreB:0, status:'upcoming'})}} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">+ Partido</button></div>}
             {filteredMatches.map(m => <MatchCard key={m.id} match={m} isAdmin={isAdmin} onUpdate={updateMatch} onDelete={deleteMatch} venues={venues} onOpenDetails={() => alert("Función editar detalle simplificada para este ejemplo")} />)}
             {filteredMatches.length === 0 && <div className="text-center py-10 text-gray-400">No hay partidos.</div>}
          </div>
        </>
      )}

      {activeTab === 'teams' && (
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-blue-900 border-l-4 border-blue-500 pl-3">Equipos</h2>
            {isAdmin && <button onClick={() => setEditTeamModal({open:true, team: null})} className="bg-green-600 text-white px-4 py-2 rounded shadow font-bold text-sm">+ Crear Equipo</button>}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {teams.map(team => (
              <div key={team.id} className="relative group">
                <button onClick={() => setTeamModal({open:true, team})} className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center gap-3 transition-transform hover:scale-105">
                  <div className="w-16 h-16 flex items-center justify-center">
                    {team.logo ? <img src={team.logo} className="max-w-full max-h-full object-contain" /> : <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">{team.name?.[0]}</div>}
                  </div>
                  <span className="font-bold text-center text-sm text-gray-800 leading-tight">{team.name}</span>
                </button>
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={(e) => {e.stopPropagation(); setEditTeamModal({open:true, team})}} className="bg-white shadow p-1.5 rounded-full text-blue-600 hover:bg-blue-50"><Edit size={14}/></button>
                    <button onClick={(e) => {e.stopPropagation(); handleDeleteTeam(team.id)}} className="bg-white shadow p-1.5 rounded-full text-red-600 hover:bg-red-50"><Trash2 size={14}/></button>
                  </div>
                )}
              </div>
            ))}
          </div>
          {teams.length === 0 && <div className="text-center p-10 text-gray-400">No hay equipos. {isAdmin && "Crea el primero."}</div>}
        </div>
      )}

      {activeTab === 'venues' && (
        <div className="max-w-4xl mx-auto p-4 space-y-4">
          {isAdmin && venues.length === 0 && <button onClick={initDB} className="w-full py-4 bg-gray-200 text-gray-600 font-bold rounded border-2 border-dashed">Inicializar Pabellones (Admin)</button>}
          {venues.map(v => (
            <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden relative group">
              <div className="h-40 bg-gray-200 w-full relative">
                {v.image ? <img src={v.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">Sin foto</div>}
                {isAdmin && <button onClick={() => handleVenuePhoto(v)} className="absolute bottom-2 right-2 bg-white/90 text-blue-900 px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1 hover:bg-white"><Camera size={14}/> Cambiar Foto</button>}
              </div>
              <div className="p-4 border-l-4 border-blue-500">
                <h3 className="font-bold text-lg text-gray-800">{v.name}</h3>
                <p className="text-sm text-gray-500">Sede oficial del torneo</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <button onClick={toggleAdmin} className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl z-50 font-bold transition-all hover:scale-105 ${isAdmin ? 'bg-red-600 text-white ring-4 ring-red-200' : 'bg-gray-900 text-white'}`}>{isAdmin ? '❌ Salir' : '👮‍♂️ Admin'}</button>

      <TeamModal isOpen={teamModal.open} team={teamModal.team} onClose={() => setTeamModal({open: false, team: null})} />
      <EditTeamModal isOpen={editTeamModal.open} team={editTeamModal.team} onClose={() => setEditTeamModal({open: false, team: null})} onSave={handleSaveTeam} />
    </div>
  );
}