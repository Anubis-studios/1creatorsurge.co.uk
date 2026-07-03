import React, { useState, useEffect } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Database, 
  Zap, 
  Terminal, 
  Copy, 
  Check, 
  Code, 
  Server, 
  ShieldAlert, 
  RefreshCw, 
  Play, 
  ArrowRight, 
  Shield, 
  HelpCircle, 
  UserPlus, 
  LogIn, 
  LogOut, 
  User, 
  DollarSign, 
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/useAuthStore';

export default function SupabaseIntegration() {
  const { profile } = useAuthStore();

  // Credentials state
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => localStorage.getItem('supabase_url') || ((import.meta as any).env?.VITE_SUPABASE_URL || ''));
  const [supabaseKey, setSupabaseKey] = useState<string>(() => localStorage.getItem('supabase_key') || ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY || ''));
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedProject, setConnectedProject] = useState<string>('');
  
  // Active Client reference
  const [supabaseClient, setSupabaseClient] = useState<SupabaseClient | null>(null);

  // Tab selections
  const [activeTab, setActiveTab] = useState<'sql' | 'frontend' | 'backend'>('sql');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  // Auth simulator inputs & state
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regUsername, setRegUsername] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [simUser, setSimUser] = useState<any>(null);
  const [simProfile, setSimProfile] = useState<any>(null);
  const [simLoading, setSimLoading] = useState(false);
  
  // Live console logger
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "System initialized. Awaiting Supabase connection credentials..."
  ]);

  // Profile update simulator
  const [updateUsername, setUpdateUsername] = useState('');
  const [updateBalance, setUpdateBalance] = useState('100.00');

  if (profile?.username !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-orange-500 font-sans text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 rounded-2xl">
        ✕ ACCESS DENIED: Administrative credentials required to view Supabase Integration configurations.
      </div>
    );
  }

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConsoleLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  // Persist / load connection status on mount
  useEffect(() => {
    if (supabaseUrl && supabaseKey) {
      handleConnect(true); // silent auto-connect
    }
  }, []);

  const handleConnect = async (isSilent = false) => {
    if (!supabaseUrl) {
      if (!isSilent) toast.error("Please enter a valid Supabase Project URL");
      return;
    }
    if (!supabaseKey) {
      if (!isSilent) toast.error("Please enter a valid Supabase Anon/Public Key");
      return;
    }

    // Basic URL validation
    if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
      if (!isSilent) toast.error("Supabase URL must start with http:// or https://");
      return;
    }

    setIsConnecting(true);
    if (!isSilent) addLog(`Attempting connection to ${supabaseUrl}...`);

    try {
      // Create supabase client
      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false // disable persistence to avoid colliding with main app auth
        }
      });

      // Test connection by fetching current sessions (usually safe, lightweight, non-destructive check)
      const { data, error } = await client.auth.getSession();
      
      if (error) {
        throw new Error(error.message);
      }

      // Extract project ID from url (e.g. https://abc.supabase.co -> abc)
      let projectId = "YourProject";
      try {
        const parsed = new URL(supabaseUrl);
        projectId = parsed.hostname.split('.')[0] || "YourProject";
      } catch (e) {}

      setSupabaseClient(client);
      setIsConnected(true);
      setConnectedProject(projectId);

      // Save to localStorage for convenience
      localStorage.setItem('supabase_url', supabaseUrl);
      localStorage.setItem('supabase_key', supabaseKey);

      if (!isSilent) {
        toast.success(`Successfully connected to Supabase Project: ${projectId}!`);
        addLog(`⚡ Connection established successfully to project [${projectId}]`);
        addLog(`Profiles database tables ready for synchronization.`);
      }
    } catch (err: any) {
      setIsConnected(false);
      setSupabaseClient(null);
      addLog(`❌ Connection failure: ${err.message || err}`);
      if (!isSilent) {
        toast.error(`Connection failed: ${err.message || 'Make sure URL and Anon Key are valid.'}`);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    setIsConnected(false);
    setSupabaseClient(null);
    setSimUser(null);
    setSimProfile(null);
    addLog("Disconnected from project. Client state cleared.");
    toast.success("Disconnected from Supabase.");
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [id]: true }));
    toast.success("Code block copied to clipboard!");
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  // Real-time integration actions on their database
  const runRegisterSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) return toast.error("Please connect your Supabase project first!");
    if (!regEmail || !regPassword || !regUsername) {
      return toast.error("Please fill in email, password, and custom username!");
    }

    setSimLoading(true);
    addLog(`Initiating SignUp: ${regEmail} (username: ${regUsername})`);

    try {
      // 1. Sign Up User via Auth
      const { data, error } = await supabaseClient.auth.signUp({
        email: regEmail,
        password: regPassword,
        options: {
          data: {
            username: regUsername,
            avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(regUsername)}`
          }
        }
      });

      if (error) throw error;

      addLog(`✅ Auth signup succeeded. User ID: ${data.user?.id || 'Pending check'}`);
      addLog(`Note: If you have configured the SQL trigger (Step 2), a row has been auto-inserted into your public.profiles table!`);
      
      setSimUser(data.user);
      toast.success("Sign Up simulation completed!");

      // Try fetching profile immediately to verify trigger
      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (err: any) {
      addLog(`❌ Sign Up Error: ${err.message}`);
      toast.error(`Sign Up failed: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const runLoginSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) return toast.error("Please connect your Supabase project first!");
    if (!loginEmail || !loginPassword) {
      return toast.error("Please fill in email and password!");
    }

    setSimLoading(true);
    addLog(`Initiating Login: ${loginEmail}`);

    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });

      if (error) throw error;

      addLog(`✅ Login success! Signed in as: ${data.user?.email}`);
      setSimUser(data.user);
      toast.success("Logged in successfully!");

      if (data.user) {
        await fetchProfile(data.user.id);
      }
    } catch (err: any) {
      addLog(`❌ Login Error: ${err.message}`);
      toast.error(`Login failed: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    if (!supabaseClient) return;
    addLog(`Reading public.profiles row for user ${userId}...`);
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        addLog(`⚠️ Profile fetch returned non-fatal error: ${error.message}. This is normal if you haven't run the SQL scripts in your Supabase dashboard yet.`);
        setSimProfile(null);
      } else {
        addLog(`✅ Loaded profile database data: ${JSON.stringify(data)}`);
        setSimProfile(data);
        setUpdateUsername(data.username || '');
        setUpdateBalance(data.balance?.toString() || '100.00');
      }
    } catch (err: any) {
      addLog(`⚠️ Profile fetch failed: ${err.message}`);
    }
  };

  const runUpdateProfileSimulator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient || !simUser) return;

    setSimLoading(true);
    addLog(`Updating profiles table for UID: ${simUser.id}`);

    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          username: updateUsername,
          balance: parseFloat(updateBalance) || 0
        })
        .eq('id', simUser.id)
        .select();

      if (error) throw error;

      addLog(`✅ Profile update succeeded! New state: ${JSON.stringify(data)}`);
      toast.success("Profile updated successfully on your database!");
      
      if (data && data[0]) {
        setSimProfile(data[0]);
      }
    } catch (err: any) {
      addLog(`❌ Profile Update Error: ${err.message}`);
      addLog(`Ensure Row Level Security (RLS) is configured to permit updates, and that public.profiles contains matching rows.`);
      toast.error(`Update failed: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const runLogoutSimulator = async () => {
    if (!supabaseClient) return;
    addLog("Signing out simulator user...");
    try {
      await supabaseClient.auth.signOut();
      setSimUser(null);
      setSimProfile(null);
      addLog("✅ Simulated user logged out successfully.");
      toast.success("Logged out simulated user.");
    } catch (err: any) {
      addLog(`❌ Sign Out Error: ${err.message}`);
    }
  };

  // Interpolated code examples
  const activeUrl = supabaseUrl || "https://your-project.supabase.co";
  const activeKey = supabaseKey || "your-anon-key-placeholder-here";

  const sqlCode = `-- ==========================================
-- STEP 1: CREATE USER PROFILES TABLE
-- ==========================================
-- This table stores extended user details like balances and usernames,
-- and is directly linked to the Supabase Authentication schema.

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT NOT NULL,
  balance NUMERIC(15, 2) DEFAULT 100.00 NOT NULL,
  loyalty_points INTEGER DEFAULT 0 NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- STEP 2: ENABLE ROW LEVEL SECURITY (RLS)
-- ==========================================
-- Secure the profiles table so users can read any profile but only edit their own.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-access" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow individual write-access" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ==========================================
-- STEP 3: AUTOMATE PROFILE CREATION VIA TRIGGER
-- ==========================================
-- Create a database trigger function that auto-creates a matching profile 
-- record whenever a new user registers using email + password.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, balance)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id::text),
    100.00
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();`;

  const reactCode = `import { createClient } from '@supabase/supabase-js';
import React, { useState, useEffect } from 'react';

// 1. Initialize the Supabase Client
const supabaseUrl = "${activeUrl}";
const supabaseKey = "${activeKey}";
export const supabase = createClient(supabaseUrl, supabaseKey);

// 2. React User Registration Hook/Function
export async function registerUser(email, password, username) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        avatar_url: \`https://api.dicebear.com/7.x/bottts/svg?seed=\${encodeURIComponent(username)}\`
      }
    }
  });
  if (error) throw error;
  return data.user;
}

// 3. React Login Function
export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data.user;
}

// 4. Session Persistence Component Wrapper
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth state changes (Login, Logout, Token Refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}`;

  const expressCode = `// Node/Express API backend verification of Supabase User JWT Sessions
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const supabaseUrl = "${activeUrl}";
// Use Service Role key for backend operations to bypass RLS safely
const supabaseServiceRoleKey = "YOUR_SUPABASE_SERVICE_ROLE_KEY"; 
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// MIDDLEWARE: Validate and authorize Supabase User JWT
const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Retrieve the user information directly from Supabase Auth using their current JWT token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired auth token session' });
    }

    // Attach verified user profile context to Express Request
    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal validation server error' });
  }
};

// PROTECTED ROUTE: Requires valid Supabase Auth JWT
app.get('/api/protected-ledger', requireAuth, async (req, res) => {
  try {
    // Fetch user profile from profiles table using verified UID
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({
      status: 'authenticated',
      uid: req.user.id,
      email: req.user.email,
      profile_info: profile,
      message: 'Secure ledger successfully decrypted using verified Supabase credentials.'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`Express back-end listening on port \${PORT}\`);
});`;

  return (
    <div className="space-y-8 animate-fade-in" id="supabase-integrator-dashboard">
      
      {/* Upper header block */}
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden" id="supabase-header">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Database className="h-5 w-5 animate-pulse" />
            <span className="font-mono text-xs uppercase font-black tracking-widest text-emerald-500">PROVIDER INTEGRATION</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white flex items-center space-x-2">
            <span>Supabase Integrator Hub</span>
          </h2>
          <p className="text-xs text-white/60">
            Connect your Supabase project in real-time, generate secure table triggers, and execute automated auth handshakes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-white/5 text-white/40 border border-white/10'}`}>
            <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'}`}></span>
            {isConnected ? `Connected: ${connectedProject}` : 'Not Connected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Setup Credentials & Live Simulator Console */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* STEP 1: Connect Project Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl" id="credentials-card">
            <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
              <Zap className="h-4.5 w-4.5 text-emerald-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                1. Connect Supabase Project
              </h3>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed">
              Input your Supabase project credentials to initialize the helper SDK client. Credentials are used entirely client-side to synchronize your setup.
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono block">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://your-project.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full rounded-lg bg-black/40 border border-white/5 p-2 text-xs font-mono text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none disabled:opacity-40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono block">
                  Anon / Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  disabled={isConnected || isConnecting}
                  className="w-full rounded-lg bg-black/40 border border-white/5 p-2 text-xs font-mono text-white placeholder-white/20 focus:border-emerald-500/50 focus:outline-none disabled:opacity-40"
                />
              </div>

              {isConnected ? (
                <div className="pt-2">
                  <button
                    onClick={handleDisconnect}
                    className="w-full rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 py-2.5 font-sans text-xs font-black uppercase tracking-wider hover:bg-red-500/20 cursor-pointer transition-all"
                  >
                    Disconnect Project
                  </button>
                </div>
              ) : (
                <button
                  disabled={isConnecting}
                  onClick={() => handleConnect(false)}
                  className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black py-2.5 font-sans text-xs font-black uppercase tracking-wider disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>INITIALIZING...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Connect Supabase Project</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Live Auth Simulator Terminal */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 shadow-xl" id="simulator-card">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center space-x-2">
                <Play className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  2. Auth & Database Simulator
                </h3>
              </div>
              <div className="h-2 w-2 rounded-full bg-purple-400 animate-ping"></div>
            </div>

            <p className="text-[11px] text-white/50 leading-relaxed">
              Test user registration, secure session handshakes, and profile writes in real-time directly on your connected Supabase tables.
            </p>

            {!isConnected ? (
              <div className="bg-black/40 border border-dashed border-white/5 p-6 rounded-xl text-center space-y-2">
                <ShieldAlert className="h-5 w-5 text-white/25 mx-auto" />
                <p className="text-[10px] uppercase font-bold text-white/40">SIMULATOR DEACTIVATED</p>
                <p className="text-[9px] text-white/30 font-mono">Connect your credentials above to unlock the sandbox.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                
                {/* Simulated Register Block */}
                {!simUser ? (
                  <div className="space-y-4">
                    <form onSubmit={runRegisterSimulator} className="space-y-2.5 bg-black/40 p-3.5 rounded-xl border border-white/5">
                      <span className="block text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider">📝 Register Account Test</span>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Username"
                          value={regUsername}
                          onChange={(e) => setRegUsername(e.target.value)}
                          className="w-full rounded bg-white/5 border border-white/5 p-1.5 text-xs text-white placeholder-white/20 font-mono"
                        />
                        <input
                          type="email"
                          placeholder="test@example.com"
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full rounded bg-white/5 border border-white/5 p-1.5 text-xs text-white placeholder-white/20 font-mono"
                        />
                      </div>
                      <input
                        type="password"
                        placeholder="Secure Password (min 6)"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full rounded bg-white/5 border border-white/5 p-1.5 text-xs text-white placeholder-white/20 font-mono block"
                      />
                      
                      <button
                        type="submit"
                        disabled={simLoading}
                        className="w-full rounded bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold py-1.5 uppercase cursor-pointer"
                      >
                        {simLoading ? 'Registering...' : 'Register Simulated User'}
                      </button>
                    </form>

                    <form onSubmit={runLoginSimulator} className="space-y-2.5 bg-black/40 p-3.5 rounded-xl border border-white/5">
                      <span className="block text-[10px] font-mono font-black text-orange-400 uppercase tracking-wider">🔑 Login Test User</span>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          placeholder="Email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="w-full rounded bg-white/5 border border-white/5 p-1.5 text-xs text-white placeholder-white/20 font-mono"
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="w-full rounded bg-white/5 border border-white/5 p-1.5 text-xs text-white placeholder-white/20 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={simLoading}
                        className="w-full rounded bg-orange-500 hover:bg-orange-400 text-black text-xs font-bold py-1.5 uppercase cursor-pointer"
                      >
                        {simLoading ? 'Logging in...' : 'Sign In'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4 animate-scale-up">
                    
                    {/* Active Simulated Session Status */}
                    <div className="bg-black/60 p-4 rounded-xl border border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-xs font-mono font-black text-white">Active Session</span>
                        </div>
                        <button
                          onClick={runLogoutSimulator}
                          className="text-[10px] font-mono font-bold uppercase text-red-400 hover:underline cursor-pointer"
                        >
                          Sign Out
                        </button>
                      </div>

                      <div className="text-[11px] font-mono space-y-1 text-white/70">
                        <p><strong className="text-white">UID:</strong> {simUser.id}</p>
                        <p><strong className="text-white">Email:</strong> {simUser.email}</p>
                        <p><strong className="text-white">Verified:</strong> {simUser.email_confirmed_at ? 'Yes' : 'No (check dashboard)'}</p>
                      </div>

                      {simProfile ? (
                        <div className="pt-2 border-t border-white/5 text-[11px] font-mono space-y-1 text-emerald-400">
                          <p className="uppercase text-[9px] text-white/40 font-black tracking-wider">Matched public.profiles row:</p>
                          <p><strong className="text-white">Username:</strong> {simProfile.username}</p>
                          <p><strong className="text-white">Credits balance:</strong> ${simProfile.balance?.toFixed(2)}</p>
                          <p><strong className="text-white">Loyalty:</strong> {simProfile.loyalty_points} XP</p>
                        </div>
                      ) : (
                        <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-white/40 space-y-1">
                          <p>⚠️ No profile record retrieved.</p>
                          <p>Ensure Step 1 SQL script was successfully pasted and run on your database.</p>
                          <button 
                            onClick={() => fetchProfile(simUser.id)}
                            className="text-purple-400 underline font-bold uppercase mt-1 cursor-pointer block"
                          >
                            Retry Loading Profile Row
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Profile Write Update form */}
                    <form onSubmit={runUpdateProfileSimulator} className="space-y-2.5 bg-black/40 p-3.5 rounded-xl border border-white/5">
                      <span className="block text-[10px] font-mono font-black text-purple-400 uppercase tracking-wider">✏️ Update Profile Data on Table</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-white/40 block">Simulated Username</label>
                          <input
                            type="text"
                            value={updateUsername}
                            onChange={(e) => setUpdateUsername(e.target.value)}
                            className="w-full rounded bg-white/5 border border-white/5 p-1 text-xs text-white font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-white/40 block">Simulated Balance</label>
                          <input
                            type="number"
                            step="0.01"
                            value={updateBalance}
                            onChange={(e) => setUpdateBalance(e.target.value)}
                            className="w-full rounded bg-white/5 border border-white/5 p-1 text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={simLoading}
                        className="w-full rounded bg-purple-500 hover:bg-purple-400 text-black text-xs font-bold py-1.5 uppercase cursor-pointer"
                      >
                        {simLoading ? 'Updating table row...' : 'Write Updates to Supabase'}
                      </button>
                    </form>

                  </div>
                )}

              </div>
            )}
          </div>

          {/* Interactive Console Outputs log */}
          <div className="rounded-2xl border border-white/10 bg-black/60 p-5 space-y-3" id="console-logs-card">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center space-x-2 text-white/60">
                <Terminal className="h-4 w-4" />
                <span className="font-mono text-xs font-bold uppercase">Real-Time Event Logs</span>
              </div>
              <button 
                onClick={() => setConsoleLogs(["Console cleared."])}
                className="text-[9px] font-mono font-bold text-white/30 hover:text-white uppercase hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>

            <div className="h-36 overflow-y-auto font-mono text-[10px] space-y-1 pr-1 scrollbar-thin text-white/60">
              {consoleLogs.map((log, idx) => (
                <div key={idx} className="leading-normal break-all">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Code generators & integration guides */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3 flex-wrap gap-2">
              <div className="flex space-x-1.5">
                {[
                  { id: 'sql', label: '1. Supabase SQL Script', icon: Database },
                  { id: 'frontend', label: '2. React Setup', icon: Code },
                  { id: 'backend', label: '3. Node Back-end', icon: Server },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`rounded-lg px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer flex items-center space-x-1 ${
                      activeTab === tab.id 
                        ? 'bg-orange-500 text-black border-orange-500 font-black' 
                        : 'border-white/5 text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: SQL SCHEMA SCRIPT */}
            {activeTab === 'sql' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Database Schema & Triggers Initialization</h4>
                  <p className="text-xs text-white/60">
                    Paste the following SQL statements into the <strong>SQL Editor</strong> in your Supabase Dashboard. This establishes your <code>public.profiles</code> table linked with Supabase's identity schemas, configures safe Row Level Security (RLS) policies, and creates a PostgreSQL Trigger to automate user record creation.
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(sqlCode, 'sql')}
                    className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-white/10 text-white/40 hover:text-white rounded border border-white/10 cursor-pointer flex items-center space-x-1 text-[10px] font-bold uppercase"
                  >
                    {copiedStates['sql'] ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedStates['sql'] ? 'Copied' : 'Copy'}</span>
                  </button>
                  <pre className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[11px] overflow-x-auto max-h-[500px] text-white/80 leading-normal">
                    {sqlCode}
                  </pre>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/20 p-3.5 rounded-xl flex items-start space-x-3 text-xs text-orange-400">
                  <Shield className="h-5 w-5 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <strong className="block font-sans font-bold">Why Triggers matter:</strong>
                    <p className="font-sans leading-relaxed text-white/70 text-[11px]">
                      By listening to table changes on <code>auth.users</code>, Supabase PostgreSQL automates matching user rows instantly without needing complex manual insertions during signup routines. This ensures 100% database synchronization.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REACT CODE HANDLER */}
            {activeTab === 'frontend' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Front-end Client Setup</h4>
                  <p className="text-xs text-white/60">
                    Integrate standard authentication flows in your React client. The following implementation instantiates Supabase, listens to authentication state mutations (sign-in/sign-out), and persists profile states.
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(reactCode, 'react')}
                    className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-white/10 text-white/40 hover:text-white rounded border border-white/10 cursor-pointer flex items-center space-x-1 text-[10px] font-bold uppercase"
                  >
                    {copiedStates['react'] ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedStates['react'] ? 'Copied' : 'Copy'}</span>
                  </button>
                  <pre className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[11px] overflow-x-auto max-h-[500px] text-white/80 leading-normal">
                    {reactCode}
                  </pre>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <h5 className="text-[11px] uppercase font-bold text-white tracking-wider">How to implement in your code workspace:</h5>
                  <ol className="list-decimal pl-5 text-xs text-white/60 font-mono space-y-1 text-[11px]">
                    <li>Install dependency: <code className="text-white">npm i @supabase/supabase-js</code></li>
                    <li>Initialize client using your own variables as demonstrated above.</li>
                    <li>Wrap your application with the <code>AuthProvider</code> context to expose current state throughout your app.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* TAB 3: BACK-END EXPRESS JWT VALIDATOR */}
            {activeTab === 'backend' && (
              <div className="space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-orange-400">Node/Express Back-end Token Verification</h4>
                  <p className="text-xs text-white/60">
                    Secure server-side API routes using standard Supabase Token JWT authorization signatures. Clients transmit their auth token inside requests, and the back-end automatically verifies credentials using the safe, secure admin handler.
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => copyToClipboard(expressCode, 'express')}
                    className="absolute top-3 right-3 p-1.5 bg-black/80 hover:bg-white/10 text-white/40 hover:text-white rounded border border-white/10 cursor-pointer flex items-center space-x-1 text-[10px] font-bold uppercase"
                  >
                    {copiedStates['express'] ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedStates['express'] ? 'Copied' : 'Copy'}</span>
                  </button>
                  <pre className="p-4 bg-black/60 rounded-xl border border-white/5 font-mono text-[11px] overflow-x-auto max-h-[500px] text-white/80 leading-normal">
                    {expressCode}
                  </pre>
                </div>

                <div className="bg-zinc-900 border border-white/5 p-4 rounded-xl space-y-2">
                  <h5 className="text-[11px] font-mono font-bold uppercase text-red-400 flex items-center space-x-1">
                    <ShieldAlert className="h-4 w-4" />
                    <span>CRITICAL SECURITY MANDATE</span>
                  </h5>
                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    Never expose the <strong>Service Role Secret Key</strong> (<code>service_role</code>) inside your client-side React code. That key completely bypasses PostgreSQL Row Level Security (RLS) rules and must be stored strictly inside secure back-end environmental variables (<code>.env</code> file).
                  </p>
                </div>
              </div>
            )}

          </div>

          {/* Quick Help documentation panel */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center space-x-2 text-white/80 font-bold uppercase text-xs">
              <HelpCircle className="h-4.5 w-4.5 text-orange-500" />
              <span>Integration Quick Help & Steps</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs leading-relaxed text-white/60">
              <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1">
                <span className="block font-black text-white text-[11px]">1. PROVISION PROJECT</span>
                <p className="text-[10px] font-sans">Sign up on <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline inline-flex items-center">supabase.com <ExternalLink className="h-2.5 w-2.5 ml-0.5" /></a> and create a fresh new database instance.</p>
              </div>
              <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1">
                <span className="block font-black text-white text-[11px]">2. INITIALIZE TABLES</span>
                <p className="text-[10px] font-sans">Copy the SQL scripts under Tab 1 and paste them inside your Supabase project's SQL Editor to set up triggers.</p>
              </div>
              <div className="bg-black/30 p-3 rounded-lg border border-white/5 space-y-1">
                <span className="block font-black text-white text-[11px]">3. LAUNCH & ENJOY</span>
                <p className="text-[10px] font-sans">Connect your URL and Anon Key above to test the real registration flow live in our simulator sandbox!</p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
