import React, { useState, useEffect } from "react";
import {
  Users,
  MessageSquare,
  Activity,
  Server,
  AlertTriangle,
  TrendingUp,
  LayoutDashboard,
  Settings,
  Shield,
  LogOut,
  Search,
  Bell,
  Menu,
  X,
  Trash2,
  Ban,
  CheckCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";
import {
  getStats,
  getUserGrowth,

  getMessageVolume,
  getActiveRooms,
  pauseCommunications,
  resumeCommunications,
  getCommunicationsStatus,
  getAllUsers,
  updateUserStatus,
  getAllRooms,
  deleteRoom
} from "../api/admin";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// --- Components ---

const StatCard = ({ stat }: { stat: any }) => (
  <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl hover:bg-slate-800/60 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
        <stat.icon size={24} />
      </div>
    </div>
    <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
  </div>
);

const GrowthChart = ({ data }: { data: any[] }) => {
  if (!data || data.length === 0) return <div className="text-center text-slate-500 h-64 flex items-center justify-center">No user growth data available</div>;
  const userGrowthData = data.map(d => d.count);
  const max = Math.max(...userGrowthData, 1);
  const min = 0;
  const points = userGrowthData.map((val, i) => {
    const x = userGrowthData.length > 1 ? (i / (userGrowthData.length - 1)) * 100 : 50;
    const y = 100 - ((val - min) / (max - min)) * 80;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full h-64 relative group">
      <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`M0,100 L0,${100 - ((userGrowthData[0] - min) / (max - min)) * 80} ${points.replace(/,/g, ' ')} L100,100 Z`} fill="url(#gradient)" />
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
          className="drop-shadow-lg"
        />
      </svg>
    </div>
  );
};



// --- Views ---

const DashboardView = ({ stats, userGrowth, systemPaused, setShowKillSwitchModal, handleSystemPause }: any) => {
  const KEY_STATS = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "New Users (24h)", value: stats.new_users_24h, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Active Rooms", value: stats.active_rooms, icon: MessageSquare, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Avg Active Time (min)", value: stats.avg_active_minutes || 0, icon: Activity, color: "text-cyan-400", bg: "bg-cyan-500/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {KEY_STATS.map((stat, i) => <StatCard key={i} stat={stat} />)}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">User Growth</h2>
              <p className="text-xs text-slate-500">New sign-ups over the last 30 days</p>
            </div>
          </div>
          <GrowthChart data={userGrowth} />
        </div>
      </div>

      {/* Control Section */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-red-500/5 backdrop-blur-sm border border-red-500/20 p-6 rounded-2xl relative overflow-hidden flex flex-col justify-center">
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500 border border-red-500/20">
              <Server size={28} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Global Communication Control
                {systemPaused && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded uppercase">Paused</span>}
              </h2>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Emergency control to pause all real-time messaging across the platform.
                Use this only in case of severe server load or security breaches.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <button
                  onClick={() => setShowKillSwitchModal(true)}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-lg ${systemPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/20'
                    }`}
                >
                  {systemPaused ? "Resume Communications" : "Pause All Communications"}
                </button>
                <div className="text-xs text-slate-500 font-mono flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${systemPaused ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                  System Status: {systemPaused ? 'OFFLINE' : 'OPERATIONAL'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const RoomsView = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const data = await getAllRooms();
        setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms", error);
      }
    };
    fetchRooms();
  }, []);

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm("Are you sure you want to delete this room? This cannot be undone.")) return;
    try {
      await deleteRoom(roomId);
      setRooms(rooms.filter(r => r.id !== roomId));
      toast({
        title: "Room Deleted",
        description: "The room has been permanently removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">Room Moderation</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950/50 text-slate-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Room Name</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-slate-200 font-medium">{room.name}</td>
                <td className="px-6 py-4 text-slate-400 truncate max-w-xs">{room.description || '-'}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${room.is_private ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {room.is_private ? 'Private' : 'Public'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SettingsView = ({ systemPaused, setShowKillSwitchModal }: any) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white mb-4">System Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <div>
              <h3 className="text-white font-medium">Emergency Kill Switch</h3>
              <p className="text-slate-400 text-sm">Pause all real-time communications instantly.</p>
            </div>
            <button
              onClick={() => setShowKillSwitchModal(true)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${systemPaused ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}
            >
              {systemPaused ? "Resume System" : "Pause System"}
            </button>
          </div>
          {/* Add more settings here as needed */}
        </div>
      </div>
    </div>
  );
};

// --- Main Layout ---

export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showKillSwitchModal, setShowKillSwitchModal] = useState(false);
  const [systemPaused, setSystemPaused] = useState(false);

  const [stats, setStats] = useState({ total_users: 0, new_users_24h: 0, active_rooms: 0, avg_active_minutes: 0 });
  const [userGrowth, setUserGrowth] = useState([]);
  const [, setLocation] = useLocation();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, userGrowthData, commsStatusData] = await Promise.all([
          getStats(),
          getUserGrowth(),
          getCommunicationsStatus(),
        ]);
        setStats(statsData);
        setUserGrowth(userGrowthData);
        setSystemPaused(commsStatusData.is_paused);
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      }
    };
    fetchData();
  }, []);

  // Auto-collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSystemPause = async () => {
    try {
      if (systemPaused) {
        await resumeCommunications();
      } else {
        await pauseCommunications();
      }
      setSystemPaused(!systemPaused);
    } catch (error) {
      console.error("Failed to update communication status", error);
    }
    setShowKillSwitchModal(false);
  };

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView stats={stats} userGrowth={userGrowth} systemPaused={systemPaused} setShowKillSwitchModal={setShowKillSwitchModal} handleSystemPause={handleSystemPause} />;
      case 'rooms':
        return <RoomsView />;
      case 'settings':
        return <SettingsView systemPaused={systemPaused} setShowKillSwitchModal={setShowKillSwitchModal} />;
      default:
        return <DashboardView stats={stats} userGrowth={userGrowth} systemPaused={systemPaused} setShowKillSwitchModal={setShowKillSwitchModal} handleSystemPause={handleSystemPause} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex overflow-hidden">
      {/* --- Sidebar --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 transition-all duration-300 ease-in-out lg:relative 
          ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'}`}
      >
        <div className="h-full flex flex-col p-4">
          <div className={`flex items-center gap-3 mb-10 text-white ${!isSidebarOpen && 'justify-center'}`}>
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg shadow-lg shadow-blue-500/20 shrink-0">
              <Shield size={24} />
            </div>
            <span className={`text-xl font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
              Echo Admin
            </span>
          </div>

          <nav className="space-y-2 flex-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'rooms', label: 'Room Moderation', icon: MessageSquare },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  } ${!isSidebarOpen && 'justify-center px-2'}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <item.icon size={20} className="shrink-0" />
                <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-800">
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ${!isSidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold shrink-0">AD</div>
              <div className={`flex-1 overflow-hidden text-left transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
                <p className="text-sm font-medium text-white truncate whitespace-nowrap">Admin</p>
                <p className="text-xs text-slate-500 truncate whitespace-nowrap">Logout</p>
              </div>
              {isSidebarOpen && <LogOut size={18} className="text-slate-400 shrink-0" />}
            </button>
          </div>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm z-40">
          <div className="flex items-center gap-4">
            <button onClick={toggleSidebar} className="text-slate-400 hover:text-white">
              {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <div className="flex items-center gap-4">
            {systemPaused && (
              <span className="hidden sm:flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full animate-pulse">
                <AlertTriangle size={12} /> SYSTEM PAUSED
              </span>
            )}
            <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-950"></span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scrollbar-hide">
          {renderContent()}
          <div className="h-4"></div>
        </div>

        {/* --- Modals --- */}
        {showKillSwitchModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <button
                onClick={() => setShowKillSwitchModal(false)}
                className="absolute top-4 right-4 text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-500/10 rounded-full text-red-500 mb-4 border border-red-500/20">
                  <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {systemPaused ? "Resume Services?" : "Stop All Communications?"}
                </h3>
                <p className="text-slate-400 text-sm mb-6">
                  {systemPaused
                    ? "This will immediately reconnect all active users and allow messages to flow again. Are you sure?"
                    : "This will disconnect all WebSocket connections and prevent users from sending messages. This action affects all users."}
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowKillSwitchModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSystemPause}
                    className={`flex-1 py-2.5 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${systemPaused
                      ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                      : 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                      }`}
                  >
                    {systemPaused ? "Yes, Resume" : "Yes, Pause System"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
