import React, { useState } from 'react';
import { Person, AttendanceRecord } from '../types';
import { Plus, Trash2, User, Mail, Search, Calendar, CheckCircle2, XCircle, Lock } from 'lucide-react';

interface DirectoryProps {
  people: Person[];
  onAddPerson: (person: Person) => void;
  onDeletePerson: (id: string) => void;
  attendance: Record<string, AttendanceRecord>;
  onUpdateAttendance: (record: AttendanceRecord) => void;
}

export const Directory: React.FC<DirectoryProps> = ({ 
  people, 
  onAddPerson, 
  onDeletePerson,
  attendance,
  onUpdateAttendance
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'attendance'>('directory');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState('');
  const [pendingAttendance, setPendingAttendance] = useState<string[]>([]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newPerson: Person = {
      id: Date.now().toString(),
      name: newName,
      email: newEmail,
    };

    onAddPerson(newPerson);
    setNewName('');
    setNewEmail('');
  };

  const filteredPeople = people.sort((a, b) => a.name.localeCompare(b.name)).filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentAttendance = attendance[attendanceDate] || { date: attendanceDate, presentIds: [] };

  const handleToggleAttendance = (personId: string) => {
    const isCurrentlyPresent = pendingAttendance.includes(personId);
    if (isCurrentlyPresent) {
      setPendingAttendance(pendingAttendance.filter(id => id !== personId));
    } else {
      setPendingAttendance([...pendingAttendance, personId]);
    }
  };

  const handleSaveAttendance = () => {
    if (password === 'dipcexecs2026') {
      onUpdateAttendance({
        date: attendanceDate,
        presentIds: pendingAttendance
      });
      setShowPasswordPrompt(false);
      setPassword('');
      alert('Attendance saved successfully!');
    } else {
      alert('Incorrect password. Access denied.');
    }
  };

  // Initialize pending attendance when date changes
  React.useEffect(() => {
    setPendingAttendance(currentAttendance.presentIds);
  }, [attendanceDate, attendance]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Directory & Attendance</h1>
          <p className="text-gray-500 font-medium">Manage people and track attendance</p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('directory')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'directory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Directory
          </button>
          <button 
            onClick={() => setActiveTab('attendance')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'attendance' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Attendance
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Person</h2>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="e.g. John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="email"
                      placeholder="e.g. jdoe@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add to Directory
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPeople.map(person => (
                      <tr key={person.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900">{person.name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 font-medium">{person.email}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => onDeletePerson(person.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredPeople.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <User className="w-8 h-8 text-gray-200" />
                            <p className="text-sm text-gray-400 font-medium italic">No people found in directory</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded-2xl">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Attendance Date</label>
                <input 
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="bg-transparent font-bold text-gray-900 outline-none focus:text-indigo-600"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-900">{pendingAttendance.length} Present</p>
                <p className="text-xs text-gray-500 font-medium">{people.length - pendingAttendance.length} Absent</p>
              </div>
              <button 
                onClick={() => setShowPasswordPrompt(true)}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Save Attendance
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x divide-y divide-gray-50">
              {people.sort((a, b) => a.name.localeCompare(b.name)).map(person => {
                const isPresent = pendingAttendance.includes(person.id);
                return (
                  <button
                    key={person.id}
                    onClick={() => handleToggleAttendance(person.id)}
                    className={`p-6 flex items-center justify-between hover:bg-gray-50 transition-all text-left ${isPresent ? 'bg-green-50/30' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${isPresent ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{person.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{person.email}</p>
                      </div>
                    </div>
                    {isPresent ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-200" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full space-y-6 border border-gray-100">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Admin Access</h3>
              <p className="text-gray-500 text-sm font-medium">Enter password to save attendance changes</p>
            </div>
            
            <input 
              type="password"
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="w-full px-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-center text-lg font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveAttendance()}
            />
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPassword('');
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveAttendance}
                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
