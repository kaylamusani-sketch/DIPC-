import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { Month, Event, Person, AttendanceRecord } from './types';
import { Dashboard } from './components/Dashboard';
import { MonthlyOverview } from './components/MonthlyOverview';
import { Directory } from './components/Directory';
import { EVENTS as INITIAL_EVENTS } from './data/events';
import { 
  LayoutDashboard, 
  Settings, 
  Menu, 
  ChevronDown,
  School,
  LayoutGrid,
  LogIn,
  LogOut,
  Loader2,
  AlertTriangle,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  query
} from 'firebase/firestore';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      const error = this.state.error;
      try {
        const parsedError = JSON.parse(error?.message || "");
        if (parsedError.error) errorMessage = parsedError.error;
      } catch (e) {
        errorMessage = error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-4 border border-red-100">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-gray-900">Application Error</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

type Page = 'home' | 'overview' | 'directory';

export default function App() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const [events, setEvents] = useState<Event[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Firestore Events Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setEvents([]);
      return;
    }

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => doc.data() as Event);
      setEvents(eventsData);
      
      // Sync missing events from INITIAL_EVENTS
      const missingEvents = INITIAL_EVENTS.filter(ie => !eventsData.some(ce => ce.id === ie.id));
      if (missingEvents.length > 0) {
        syncEvents(missingEvents);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'events');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  // Firestore People Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setPeople([]);
      return;
    }

    const peopleRef = collection(db, 'people');
    const q = query(peopleRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const peopleData = snapshot.docs.map(doc => doc.data() as Person);
      setPeople(peopleData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'people');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setAttendance({});
      return;
    }

    const attendanceRef = collection(db, 'attendance');
    const q = query(attendanceRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const attendanceData: Record<string, AttendanceRecord> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data() as AttendanceRecord;
        attendanceData[data.date] = data;
      });
      setAttendance(attendanceData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'attendance');
    });

    return () => unsubscribe();
  }, [isAuthReady, user]);

  const syncEvents = async (eventsToSync: Event[]) => {
    try {
      const batch = eventsToSync.map(event => {
        const eventWithDefaults = {
          ...event,
          speaker: '',
          graphicUrl: '',
          announcementText: '',
          isCompleted: false
        };
        return setDoc(doc(db, 'events', event.id), eventWithDefaults);
      });
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'events');
    }
  };

  const updateEvent = async (updatedEvent: Event) => {
    try {
      await setDoc(doc(db, 'events', updatedEvent.id), updatedEvent);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `events/${updatedEvent.id}`);
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'events', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${id}`);
    }
  };

  const addPerson = async (person: Person) => {
    try {
      // Use name-based ID to prevent duplicates
      const id = person.name.toLowerCase().trim().replace(/\s+/g, '-');
      await setDoc(doc(db, 'people', id), { ...person, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `people/${person.id}`);
    }
  };

  const deletePerson = async (id: string) => {
    try {
      const { deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'people', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `people/${id}`);
    }
  };

  const updateAttendance = async (record: AttendanceRecord) => {
    try {
      await setDoc(doc(db, 'attendance', record.date), record);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `attendance/${record.date}`);
    }
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center space-y-6 border border-gray-100">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
            <LogIn className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 text-sm">Please sign in to access the School Event Planner</p>
          </div>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-indigo-200"
          >
            <LogIn className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#F8F9FC] flex font-sans text-gray-900">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {!isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-100 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center gap-3 px-2 mb-10">
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight leading-none">DIPC</h1>
              </div>
            </div>

            <nav className="flex-grow space-y-1 overflow-y-auto custom-scrollbar pr-2">
              <button 
                onClick={() => setCurrentPage('home')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${currentPage === 'home' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </button>

              <button 
                onClick={() => setCurrentPage('overview')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${currentPage === 'overview' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <LayoutGrid className="w-5 h-5" />
                Monthly Overview
              </button>

              <button 
                onClick={() => setCurrentPage('directory')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${currentPage === 'directory' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <Users className="w-5 h-5" />
                Directory
              </button>
            </nav>

            <div className="mt-auto pt-6 border-t border-gray-50 space-y-4">
              <div className="flex items-center gap-3 px-2 mb-4">
                {user?.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || ''} 
                    className="w-10 h-10 rounded-xl border-2 border-white shadow-sm"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <span className="text-indigo-600 font-bold">{user?.displayName?.[0]}</span>
                  </div>
                )}
                <div className="flex-grow overflow-hidden">
                  <p className="text-xs font-black text-gray-900 truncate">{user?.displayName}</p>
                  <button 
                    onClick={handleLogout}
                    className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:text-red-600 flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-grow h-screen overflow-y-auto custom-scrollbar">
          <header className="sticky top-0 z-30 bg-[#F8F9FC]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between lg:hidden">
            <button onClick={toggleSidebar} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <Menu className="w-5 h-5" />
            </button>
            <div className="font-black text-lg tracking-tight">DIPC</div>
            <div className="w-9" /> {/* Spacer */}
          </header>

          <div className="max-w-7xl mx-auto p-6 lg:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {currentPage === 'home' ? (
                  <Dashboard events={events} onUpdateEvent={updateEvent} onDeleteEvent={deleteEvent} people={people} />
                ) : currentPage === 'overview' ? (
                  <MonthlyOverview events={events} onUpdateEvent={updateEvent} onDeleteEvent={deleteEvent} />
                ) : (
                  <Directory 
                    people={people} 
                    onAddPerson={addPerson} 
                    onDeletePerson={deletePerson}
                    attendance={attendance}
                    onUpdateAttendance={updateAttendance}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        <style dangerouslySetInnerHTML={{ __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #E2E8F0;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #CBD5E1;
          }
        `}} />
      </div>
    </ErrorBoundary>
  );
}
