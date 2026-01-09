import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Shirt, Users, User, X, Camera, Trash2, Edit, Trophy, Plus, Save } from 'lucide-react';

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

// --- CONFIG ---
const ADMIN_PASSWORD = "Fe07012007*"; 

const CATEGORIES = ['Alevín', 'Infantil', 'Cadete Femenino', 'Cadete Masculino', 'Juvenil Masculino', 'Junior (Sub 19)'];

const DATES = [
  { day: '02', label: 'Jueves 2', full: '2026-04-02' },
  { day: '03', label: 'Viernes 3', full: '2026-04-03' },
  { day: '04', label: 'Sábado 4', full: '2026-04-04' },
  { day: '05', label: 'Domingo 5', full: '2026-04-05' },
];

const DEFAULT_VENUES = [
  { id: 'central', name: 'Pavelló Central (Salou)', short: 'P. Central', image: '' },
  { id: 'ponent', name: 'Pavelló Ponent (Salou)', short: 'P. Ponent', image: '' },
  { id: 'cap', name: 'Pavelló Cap Salou (Salou)', short: 'P. Cap Salou', image: '' },
  { id: 'rebull', name: 'Pavelló Joan Rebull (Reus)', short: 'P. Joan Rebull', image: '' },
];

// --- COMPONENTES ---

// 1. Editor de Grupos
const GroupEditor = ({ group, onSave, onDelete, teamsList }) => {
  const [localGroup, setLocalGroup] = useState(group);
  
  const addRow = () => setLocalGroup({ ...localGroup, rows: [...localGroup.rows, { teamId: '', played: 0, won: 0, draw: 0, lost: 0, gf: 0, ga: 0, pts: 0 }] });
  
  const updateRow = (idx, field, val) => {
    const newRows = [...localGroup.rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    if(field === 'won' || field === 'draw') {
       const w = field === 'won' ? parseInt(val) : (parseInt(newRows[idx].won) || 0);
       const d = field === 'draw' ? parseInt(val) : (parseInt(newRows[idx].draw) || 0);
       newRows[idx].pts = (w * 3) + d;
    }
    setLocalGroup({ ...localGroup, rows: newRows });
  };

  // Filtramos equipos para el desplegable que sean de la misma categoría que el grupo
  const catTeams = teamsList.filter(t => t.category === group.category);

  return (
    <div className="bg-white p-4 rounded-lg shadow border mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between mb-3 items-center">
        <input className="font-bold text-lg border-b border-dashed border-gray-400 focus:outline-none text-blue-900 w-full mr-2" value={localGroup.name} onChange={e => setLocalGroup({...localGroup, name: e.target.value})} />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onSave(localGroup)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">Guardar</button>
          <button onClick={() => onDelete(group.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
        </div>
      </div>
      <div className="space-y-2 overflow-x-auto">
        {localGroup.rows.map((row, idx) => (
          <div key={idx} className="flex gap-1 items-center bg-gray-50 p-1 rounded min-w-[500px]">
            <select className="w-32 text-xs border rounded p-1" value={row.teamId} onChange={e => updateRow(idx, 'teamId', e.target.value)}>
               <option value="">Equipo...</option>
               {catTeams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            <input type="number" placeholder="PJ" className="w-10 text-xs border rounded p-1 text-center" value={row.played} onChange={e => updateRow(idx, 'played', parseInt(e.target.value))} />
            <input type="number" placeholder="G" className="w-10 text-xs border rounded p-1 text-center bg-green-100" value={row.won} onChange={e => updateRow(idx, 'won', parseInt(e.target.value))} />
            <input type="number" placeholder="E" className="w-10 text-xs border rounded p-1 text-center bg-yellow-100" value={row.draw} onChange={e => updateRow(idx, 'draw', parseInt(e.target.value))} />
            <input type="number" placeholder="P" className="w-10 text-xs border rounded p-1 text-center bg-red-100" value={row.lost} onChange={e => updateRow(idx, 'lost', parseInt(e.target.value))} />
            <div className="w-10 text-xs font-bold text-center text-blue-800 border bg-white flex items-center justify-center h-8">{row.pts}</div>
            <button onClick={() => {const r = [...localGroup.rows]; r.splice(idx,1); setLocalGroup({...localGroup, rows: r})}} className="text-gray-400 hover:text-red-500 font-bold px-2">×</button>
          </div>
        ))}
        <button onClick={addRow} className="w-full py-1 bg-white text-blue-500 text-xs border border-dashed border-blue-300 rounded mt-2 hover:bg-blue-50">+ Añadir Fila</button>
      </div>
    </div>
  );
};

// 2. Bracket (Fase Final)
const BracketBuilder = ({ bracketData, isAdmin, onSave, categoryName }) => {
  const [data, setData] = useState(bracketData || {});
  
  // Actualizar data si cambia la prop bracketData (al cambiar de categoría)
  useEffect(() => { setData(bracketData || {}) }, [bracketData]);

  const handleChange = (id, field, val) => setData({...data, [id]: {...data[id], [field]: val}});
  
  const Match = ({ id, label }) => (
    <div className="bg-white border rounded p-2 mb-2 shadow-sm w-40 flex-shrink-0">
      <div className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</div>
      {isAdmin ? (
         <div className="space-y-1">
           <input placeholder="Equipo 1" className="w-full text-xs border p-1" value={data[id]?.h || ''} onChange={e => handleChange(id, 'h', e.target.value)} />
           <input placeholder="Equipo 2" className="w-full text-xs border p-1" value={data[id]?.a || ''} onChange={e => handleChange(id, 'a', e.target.value)} />
           <input placeholder="Res" className="w-full text-xs border p-1 text-center bg-gray-50" value={data[id]?.s || ''} onChange={e => handleChange(id, 's', e.target.value)} />
         </div>
      ) : (
         <div>
           <div className={`text-xs font-bold truncate ${data[id]?.h ? 'text-gray-800' : 'text-gray-300'}`}>{data[id]?.h || 'TBD'}</div>
           <div className={`text-xs font-bold truncate ${data[id]?.a ? 'text-gray-800' : 'text-gray-300'}`}>{data[id]?.a || 'TBD'}</div>
           {data[id]?.s && <div className="mt-1 text-center text-xs bg-blue-50 text-blue-700 font-bold rounded">{data[id].s}</div>}
         </div>
      )}
    </div>
  );

  return (
    <div className="mt-8 pt-6 border-t animate-in fade-in">
       <div className="flex justify-between items-center mb-4">
         <h2 className="text-lg font-bold text-blue-900">🏆 Fase Final: {categoryName}</h2>
         {isAdmin && <button onClick={() => onSave(data)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"><Save size={14}/> Guardar Bracket</button>}
       </div>
       <div className="flex gap-4 overflow-x-auto pb-4 items-center">
          <div className="space-y-4"><Match id="q1" label="Cuartos 1" /><Match id="q2" label="Cuartos 2" /><Match id="q3" label="Cuartos 3" /><Match id="q4" label="Cuartos 4" /></div>
          <div className="w-4 h-px bg-gray-300"></div>
          <div className="space-y-12"><Match id="s1" label="Semifinal 1" /><Match id="s2" label="Semifinal 2" /></div>
          <div className="w-4 h-px bg-gray-300"></div>
          <div><div className="text-center font-bold text-yellow-600 mb-1 text-xs">GRAN FINAL</div><Match id="f1" label="FINAL" /></div>
       </div>
    </div>
  );
};

// 3. Modals y Tarjetas
const EditTeamModal = ({ team, isOpen, onClose, onSave }) => {
  if (!isOpen) return null;
  const [data, setData] = useState(team || { name: '', category: 'Alevín', logo: '', staff: [], players: [], kits: { home: '', away: '' } });
  
  const handlePlayerChange = (i, f, v) => { const n = [...(data.players||[])]; n[i] = {...n[i], [f]: v}; setData({...data, players: n}); };
  const addP = () => setData({...data, players: [...(data.players||[]), {num:0, name:'', pos:''}]});
  
  return (
    <div className="fixed inset-0 bg-black/80 z-[90] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-blue-900 p-4 text-white flex justify-between items-center sticky top-0">
           <h3 className="font-bold">✏️ Equipo</h3>
           <button onClick={onClose} className="text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
           <div className="bg-blue-50 p-3 rounded border border-blue-200">
             <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Categoría</label>
             <select className="w-full p-2 border border-blue-300 rounded font-bold" value={data.category || 'Alevín'} onChange={e => setData({...data, category: e.target.value})}>
               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
           </div>
           <div className="grid grid-cols-2 gap-2">
             <input className="border p-2 rounded" placeholder="Nombre Equipo" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
             <input className="border p-2 rounded" placeholder="URL Logo" value={data.logo} onChange={e => setData({...data, logo: e.target.value})} />
           </div>
           <div className="border p-2 rounded bg-gray-50 max-h-40 overflow-y-auto">
             <div className="flex justify-between mb-2"><span className="text-xs font-bold">Plantilla</span><button onClick={addP} className="text-xs bg-green-200 px-2 rounded">+ Jugador</button></div>
             {data.players?.map((p, i) => (
               <div key={i} className="flex gap-1 mb-1">
                 <input className="w-8 p-1 border text-center text-xs" placeholder="#" value={p.num} onChange={e => handlePlayerChange(i, 'num', e.target.value)}/>
                 <input className="flex-1 p-1 border text-xs" placeholder="Nombre" value={p.name} onChange={e => handlePlayerChange(i, 'name', e.target.value)}/>
                 <button onClick={() => {const n = [...data.players]; n.splice(i,1); setData({...data, players: n})}} className="text-red-500">×</button>
               </div>
             ))}
           </div>
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500">Cancelar</button>
          <button onClick={() => onSave(data)} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Guardar</button>
        </div>
      </div>
    </div>
  );
};

const TeamModal = ({ team, isOpen, onClose }) => {
  if (!isOpen || !team) return null;
  const [tab, setTab] = useState('squad');
  return (
    <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl w-full max-w-md h-[80vh] flex flex-col overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/20 rounded-full p-1"><X size={20}/></button>
        <div className="bg-blue-900 p-6 text-white text-center">
           {team.logo && <img src={team.logo} className="w-20 h-20 mx-auto object-contain bg-white rounded-full p-2 mb-2"/>}
           <h2 className="text-xl font-bold">{team.name}</h2>
           <span className="text-xs bg-white/20 px-2 py-1 rounded mt-2 inline-block">{team.category}</span>
        </div>
        <div className="flex border-b">
           {['squad', 'staff', 'kits'].map(t => <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-bold capitalize ${tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>{t}</button>)}
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
           {tab === 'squad' && team.players?.map((p,i) => <div key={i} className="flex gap-3 bg-white p-2 mb-2 rounded shadow-sm items-center"><span className="font-bold text-blue-600 bg-blue-50 w-8 h-8 flex items-center justify-center rounded-full">{p.num}</span><span>{p.name}</span></div>)}
           {tab === 'staff' && team.staff?.map((s,i) => <div key={i} className="bg-white p-3 mb-2 rounded shadow-sm border-l-4 border-orange-400">{s}</div>)}
           {tab === 'kits' && <div className="text-center">{team.kits?.home && <img src={team.kits.home} className="w-32 mx-auto mb-4 border rounded"/>}{team.kits?.away && <img src={team.kits.away} className="w-32 mx-auto border rounded"/>}</div>}
        </div>
      </div>
    </div>
  );
};

const MatchCard = ({ match, isAdmin, onUpdate, onDelete, venues }) => {
  const v = venues.find(vn => vn.id === match.venueId) || {};
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-3 relative">
      {isAdmin && <button onClick={() => onDelete(match.id)} className="absolute top-2 right-2 text-red-300 hover:text-red-600"><Trash2 size={16}/></button>}
      <div className="flex justify-between text-xs text-gray-500 mb-2">
         {isAdmin ? <input type="time" defaultValue={match.time} onBlur={e => onUpdate(match.id, 'time', e.target.value)} className="border rounded bg-gray-50"/> : <span className="font-bold">{match.time}</span>}
         <span className="text-blue-600 font-bold">📍 {v.short || v.name || 'Sede'}</span>
      </div>
      <div className="space-y-2">
         {['teamA', 'teamB'].map((t, i) => (
           <div key={t} className="flex justify-between items-center">
              {isAdmin ? <input defaultValue={match[t]} onBlur={e => onUpdate(match.id, t, e.target.value)} className="border p-1 rounded text-sm w-32"/> : <span className="font-medium">{match[t]}</span>}
              {isAdmin ? <input type="number" defaultValue={match[i===0?'scoreA':'scoreB']} onBlur={e => onUpdate(match.id, i===0?'scoreA':'scoreB', parseInt(e.target.value))} className="border w-12 text-center font-bold"/> : <span className="font-bold text-lg">{match[i===0?'scoreA':'scoreB']}</span>}
           </div>
         ))}
      </div>
      <div className="mt-2 pt-2 border-t flex justify-between items-center">
         <span className="text-[10px] uppercase font-bold text-gray-400">{match.category}</span>
         {isAdmin && <select defaultValue={match.category} onChange={e => onUpdate(match.id, 'category', e.target.value)} className="text-[10px] border rounded"><option value="Alevín">Alevín</option><option value="Infantil">Infantil</option></select>}
      </div>
    </div>
  );
};

// --- APP PRINCIPAL ---
export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedDate, setSelectedDate] = useState('2026-04-03');
  const [selectedCategory, setSelectedCategory] = useState('Alevín'); // Estado para el filtro de categorías
  
  // Data
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [venues, setVenues] = useState([]);
  const [groups, setGroups] = useState([]);
  const [brackets, setBrackets] = useState([]); // Colección de todos los brackets
  const [logo, setLogo] = useState("https://marenostrumcup.es/wp-content/uploads/2024/08/simbol-MARENOSTRUM-3.png");

  // Modals
  const [teamModal, setTeamModal] = useState({open: false, team: null});
  const [editTeamModal, setEditTeamModal] = useState({open: false, team: null});

  // FIREBASE SYNC
  useEffect(() => {
    const uM = onSnapshot(collection(db, "matches"), s => setMatches(s.docs.map(d => ({...d.data(), id: parseInt(d.id)}))));
    const uT = onSnapshot(collection(db, "teams"), s => setTeams(s.docs.map(d => ({...d.data(), id: d.id}))));
    const uG = onSnapshot(collection(db, "groups"), s => setGroups(s.docs.map(d => ({...d.data(), id: d.id}))));
    const uV = onSnapshot(collection(db, "venues"), s => setVenues(s.docs.map(d => ({...d.data(), id: d.id}))));
    const uB = onSnapshot(collection(db, "brackets"), s => setBrackets(s.docs.map(d => ({...d.data(), id: d.id})))); // Leemos todos los brackets
    const uL = onSnapshot(doc(db, "config", "main"), d => {if(d.exists()) setLogo(d.data().logo)});
    return () => {uM(); uT(); uG(); uV(); uB(); uL();}
  }, []);

  // LOGIC
  const handleSaveTeam = async (t) => { const id = t.id || `team_${Date.now()}`; await setDoc(doc(db, "teams", id), {...t, id}); setEditTeamModal({open: false}); };
  const handleDeleteTeam = async (id) => { if(confirm("¿Borrar?")) await deleteDoc(doc(db, "teams", id)); };
  
  // LOGIC: Grupos y Brackets por Categoría
  const handleAddGroup = async () => { 
    // Al crear grupo, le asignamos la categoría actual
    const id = `grp_${Date.now()}`; 
    await setDoc(doc(db, "groups", id), {id, name: 'Nuevo Grupo', category: selectedCategory, rows:[]}); 
  };
  const handleSaveGroup = async (g) => await setDoc(doc(db, "groups", g.id), g);
  const handleDeleteGroup = async (id) => { if(confirm("¿Borrar?")) await deleteDoc(doc(db, "groups", id)); };
  
  const handleSaveBracket = async (data) => {
    // Guardamos el bracket con el ID de la categoría (ej: "Alevín")
    await setDoc(doc(db, "brackets", selectedCategory), { ...data, id: selectedCategory });
  };

  const updateMatch = async (id, f, v) => await setDoc(doc(db,"matches",id.toString()), { ...matches.find(m=>m.id===id), [f]:v });
  const deleteMatch = async (id) => { if(confirm("¿Borrar?")) await deleteDoc(doc(db, "matches", id.toString())); }

  const restoreVenues = async () => {
    if(!confirm("¿Restaurar las 4 sedes?")) return;
    for(const v of DEFAULT_VENUES) await setDoc(doc(db, "venues", v.id), v);
    alert("¡Sedes restauradas!");
  };
  const updateVenuePhoto = async (v) => {
    const url = prompt("Nueva URL foto:", v.image);
    if(url !== null) await setDoc(doc(db, "venues", v.id), {...v, image: url});
  };

  const toggleAdmin = () => { if(isAdmin) setIsAdmin(false); else if(prompt("Pass:") === ADMIN_PASSWORD) setIsAdmin(true); };

  // Filters for Standings Tab
  const currentGroups = groups.filter(g => g.category === selectedCategory);
  const currentBracket = brackets.find(b => b.id === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-24 text-gray-900">
      {/* HEADER */}
      <header className="bg-white shadow sticky top-0 z-50 p-2">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
           <div className="flex items-center gap-2">
              <img src={logo} className="h-10 object-contain" onClick={() => isAdmin && prompt("URL Logo") && setDoc(doc(db,"config","main"), {logo: prompt("URL Logo")})}/>
              <div className="leading-none"><h1 className="font-bold text-blue-900">MARENOSTRUM</h1><span className="text-xs text-blue-500">CUP 2026</span></div>
           </div>
           <div className="flex gap-2">
              <button onClick={() => setActiveTab('matches')} className={`p-2 rounded w-10 flex justify-center ${activeTab === 'matches' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>📅</button>
              <button onClick={() => setActiveTab('standings')} className={`p-2 rounded w-10 flex justify-center ${activeTab === 'standings' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}><Trophy size={20}/></button>
              <button onClick={() => setActiveTab('teams')} className={`p-2 rounded w-10 flex justify-center ${activeTab === 'teams' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>🛡️</button>
              <button onClick={() => setActiveTab('venues')} className={`p-2 rounded w-10 flex justify-center ${activeTab === 'venues' ? 'bg-blue-100 text-blue-600' : 'text-gray-400'}`}>📍</button>
           </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        
        {/* 1. MATCHES */}
        {activeTab === 'matches' && (
           <div className="space-y-4">
              <div className="flex overflow-x-auto border-b bg-white rounded shadow-sm">
                 {DATES.map(d => <button key={d.full} onClick={() => setSelectedDate(d.full)} className={`flex-1 py-3 px-4 whitespace-nowrap ${selectedDate === d.full ? 'text-blue-600 border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}>{d.label}</button>)}
              </div>
              {isAdmin && <button onClick={() => {const id=Date.now(); setDoc(doc(db,"matches",id.toString()), {id, date:selectedDate, time:'10:00', venueId:'central', teamA:'Local', teamB:'Visitante', scoreA:0, scoreB:0, category:'Alevín'})}} className="w-full py-2 bg-blue-600 text-white font-bold rounded shadow">+ Añadir Partido</button>}
              {matches.filter(m => m.date === selectedDate).sort((a,b) => a.time.localeCompare(b.time)).map(m => (
                 <MatchCard key={m.id} match={m} isAdmin={isAdmin} onDelete={deleteMatch} onUpdate={updateMatch} venues={venues.length > 0 ? venues : DEFAULT_VENUES} />
              ))}
              {matches.filter(m => m.date === selectedDate).length === 0 && <p className="text-center text-gray-400 py-10">No hay partidos este día.</p>}
           </div>
        )}

        {/* 2. STANDINGS (CLASIFICACIÓN) - SEPARADA POR CATEGORÍAS */}
        {activeTab === 'standings' && (
           <div className="animate-in fade-in">
              {/* Selector de Categoría */}
              <div className="flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar">
                {CATEGORIES.map(cat => (
                  <button 
                    key={cat} 
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold shadow-sm border transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600 transform scale-105' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Contenido de la categoría seleccionada */}
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-bold text-blue-900 border-l-4 border-blue-600 pl-3">Grupos: {selectedCategory}</h2>
                 {isAdmin && <button onClick={handleAddGroup} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold flex gap-1 items-center"><Plus size={14}/> Nuevo Grupo en {selectedCategory}</button>}
              </div>

              {currentGroups.length > 0 ? (
                currentGroups.map(g => <GroupEditor key={g.id} group={g} onSave={handleSaveGroup} onDelete={handleDeleteGroup} teamsList={teams} />)
              ) : (
                <div className="text-center py-8 bg-white rounded border border-dashed text-gray-400 mb-6">No hay grupos creados en {selectedCategory}</div>
              )}
              
              <BracketBuilder 
                bracketData={currentBracket} 
                isAdmin={isAdmin} 
                onSave={handleSaveBracket} 
                categoryName={selectedCategory}
              />
           </div>
        )}

        {/* 3. TEAMS */}
        {activeTab === 'teams' && (
           <div>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-blue-900">Equipos</h2>
                 {isAdmin && <button onClick={() => setEditTeamModal({open: true})} className="bg-green-600 text-white px-3 py-1 rounded font-bold text-xs">+ Equipo</button>}
              </div>
              {CATEGORIES.map(cat => {
                 const list = teams.filter(t => t.category === cat);
                 if(list.length === 0) return null;
                 return (
                    <div key={cat} className="mb-8">
                       <h3 className="font-bold text-lg text-blue-800 border-b mb-3 pb-1">{cat}</h3>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {list.map(t => (
                             <div key={t.id} className="bg-white p-3 rounded shadow-sm border text-center relative group">
                                <div onClick={() => setTeamModal({open:true, team:t})} className="cursor-pointer">
                                   <div className="w-12 h-12 bg-gray-100 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-gray-400 overflow-hidden">
                                      {t.logo ? <img src={t.logo} className="w-full h-full object-contain"/> : t.name?.[0]}
                                   </div>
                                   <div className="font-bold text-sm leading-tight">{t.name}</div>
                                </div>
                                {isAdmin && <div className="absolute top-1 right-1 flex gap-1"><button onClick={() => setEditTeamModal({open:true, team:t})} className="text-blue-500 bg-white rounded-full shadow p-1"><Edit size={12}/></button><button onClick={() => handleDeleteTeam(t.id)} className="text-red-500 bg-white rounded-full shadow p-1"><Trash2 size={12}/></button></div>}
                             </div>
                          ))}
                       </div>
                    </div>
                 )
              })}
           </div>
        )}

        {/* 4. VENUES (FIX FOTOS) */}
        {activeTab === 'venues' && (
           <div className="space-y-4">
              {isAdmin && (
                 <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-center mb-6">
                    <p className="text-sm text-yellow-800 font-bold mb-2">¿Problemas con las sedes? (Si desaparecen)</p>
                    <button onClick={restoreVenues} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold shadow hover:bg-yellow-700">🔁 PULSA AQUÍ PARA ARREGLARLO</button>
                 </div>
              )}
              {(venues.length > 0 ? venues : DEFAULT_VENUES).map(v => (
                 <div key={v.id} className="bg-white rounded-xl shadow overflow-hidden relative">
                    <div className="h-40 bg-gray-200 relative">
                       {v.image ? <img src={v.image} className="w-full h-full object-cover"/> : <div className="flex h-full items-center justify-center text-gray-400">Sin foto</div>}
                       {isAdmin && <button onClick={() => updateVenuePhoto(v)} className="absolute bottom-2 right-2 bg-white text-blue-900 px-3 py-1 rounded-full text-xs font-bold shadow flex items-center gap-1"><Camera size={14}/> Cambiar Foto</button>}
                    </div>
                    <div className="p-4 border-l-4 border-blue-500 font-bold">{v.name}</div>
                 </div>
              ))}
           </div>
        )}
      </div>

      <button onClick={toggleAdmin} className={`fixed bottom-5 right-5 w-12 h-12 rounded-full shadow-xl flex items-center justify-center z-50 text-xl transition-all ${isAdmin ? 'bg-red-600 text-white rotate-45' : 'bg-gray-900 text-white'}`}>{isAdmin ? '+' : '🔒'}</button>
      
      <TeamModal isOpen={teamModal.open} team={teamModal.team} onClose={() => setTeamModal({open: false})} />
      <EditTeamModal isOpen={editTeamModal.open} team={editTeamModal.team} onClose={() => setEditTeamModal({open: false})} onSave={handleSaveTeam} />
    </div>
  );
}