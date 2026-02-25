<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>修行筆記</title>
    <!-- 引入必要的工具套件 -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/lucide@latest"></script>
    <script src="https://unpkg.com/recharts/umd/Recharts.js"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap');
        body { font-family: 'Noto Sans TC', sans-serif; }
        .font-serif { font-family: 'Noto Serif TC', serif; }
    </style>
</head>
<body>
    <div id="root"></div>

    <script type="text/babel">
        const { useState, useEffect, useMemo } = React;
        const { 
            Plus, Settings, BarChart3, Calendar, ChevronRight, 
            Trash2, BookOpen, X, MessageSquare 
        } = lucide;
        const { 
            AreaChart, Area, XAxis, YAxis, CartesianGrid, 
            Tooltip, ResponsiveContainer 
        } = Recharts;

        // --- 初期設定 ---
        const INITIAL_PRACTICES = [
            { id: '1', title: '金光明經', total: 0, color: '#d97706' },
            { id: '2', title: '蓮師心咒', total: 0, color: '#dc2626' }
        ];
        const STORAGE_KEY = 'spiritual_practice_journal_v1';

        function App() {
            const [practices, setPractices] = useState(INITIAL_PRACTICES);
            const [logs, setLogs] = useState([]);
            const [activeTab, setActiveTab] = useState('home');
            const [selectedPracticeId, setSelectedPracticeId] = useState(null);
            const [isAddLogOpen, setIsAddLogOpen] = useState(false);
            const [isAddPracticeOpen, setIsAddPracticeOpen] = useState(false);
            const [inputCount, setInputCount] = useState('');
            const [inputNote, setInputNote] = useState('');
            const [newPracticeTitle, setNewPracticeTitle] = useState('');

            useEffect(() => {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    try {
                        const parsed = JSON.parse(saved);
                        setPractices(parsed.practices || INITIAL_PRACTICES);
                        setLogs(parsed.logs || []);
                    } catch (e) { console.error("讀取失敗", e); }
                }
            }, []);

            useEffect(() => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ practices, logs }));
            }, [practices, logs]);

            const addLog = () => {
                if (!selectedPracticeId || (!inputCount && !inputNote)) return;
                const count = parseInt(inputCount) || 0;
                const newLog = {
                    id: Date.now().toString(),
                    practiceId: selectedPracticeId,
                    count: count,
                    note: inputNote.trim(),
                    date: new Date().toISOString()
                };
                setLogs([newLog, ...logs]);
                if (count > 0) {
                    setPractices(practices.map(p => p.id === selectedPracticeId ? { ...p, total: p.total + count } : p));
                }
                setInputCount(''); setInputNote(''); setIsAddLogOpen(false);
            };

            const addPractice = () => {
                if (!newPracticeTitle.trim()) return;
                const colors = ['#d97706', '#dc2626', '#7c3aed', '#059669', '#2563eb'];
                const newPractice = {
                    id: Date.now().toString(),
                    title: newPracticeTitle,
                    total: 0,
                    color: colors[practices.length % colors.length]
                };
                setPractices([...practices, newPractice]);
                setNewPracticeTitle(''); setIsAddPracticeOpen(false);
            };

            const stats = useMemo(() => {
                const now = new Date();
                const getPeriodData = (days) => {
                    const grouped = {};
                    for (let i = 0; i < days; i++) {
                        const d = new Date(); d.setDate(now.getDate() - i);
                        grouped[d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })] = 0;
                    }
                    logs.filter(l => (now - new Date(l.date)) / (1000*60*60*24) <= days).forEach(log => {
                        const dateStr = new Date(log.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
                        if (grouped[dateStr] !== undefined) grouped[dateStr] += log.count;
                    });
                    return Object.entries(grouped).map(([name, value]) => ({ name, value })).reverse();
                };
                const computeSum = (months) => {
                    const limit = new Date(); limit.setMonth(now.getMonth() - months);
                    return logs.filter(l => new Date(l.date) >= limit).reduce((sum, l) => sum + l.count, 0);
                };
                return { monthly: getPeriodData(30), quarterly: computeSum(3), semi: computeSum(6), annual: computeSum(12) };
            }, [logs]);

            return (
                <div className="min-h-screen bg-[#FDFCFB] text-stone-800 pb-24">
                    <header className="bg-white border-b border-stone-100 px-6 py-5 sticky top-0 z-10">
                        <div className="max-w-md mx-auto flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-stone-800 p-1.5 rounded-lg"><BookOpen size={18} className="text-white" /></div>
                                <h1 className="text-xl font-bold">修行筆記</h1>
                            </div>
                            <button onClick={() => setIsAddPracticeOpen(true)} className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-full"><Plus size={20} /></button>
                        </div>
                    </header>

                    <main className="max-w-md mx-auto p-6">
                        {activeTab === 'home' && (
                            <div className="space-y-8">
                                <section>
                                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">今日修持</h2>
                                    <div className="grid gap-3">
                                        {practices.map(item => (
                                            <div key={item.id} onClick={() => { setSelectedPracticeId(item.id); setIsAddLogOpen(true); }} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                    <div>
                                                        <h3 className="font-bold">{item.title}</h3>
                                                        <p className="text-stone-400 text-xs">累計：{item.total.toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <Plus size={16} className="text-stone-300" />
                                            </div>
                                        ))}
                                    </div>
                                </section>
                                <section>
                                    <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">隨筆紀錄</h2>
                                    <div className="space-y-4">
                                        {logs.slice(0, 10).map(log => (
                                            <div key={log.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm">
                                                <div className="flex justify-between text-[10px] text-stone-400 mb-2 font-bold uppercase">
                                                    <span>{practices.find(p => p.id === log.practiceId)?.title}</span>
                                                    <span>{new Date(log.date).toLocaleDateString()}</span>
                                                </div>
                                                {log.count > 0 && <p className="text-lg font-serif mb-2 font-bold text-amber-600">{log.count} 遍</p>}
                                                {log.note && <div className="flex gap-2 text-stone-600 text-sm italic border-t border-stone-50 pt-2"><MessageSquare size={14} className="mt-1" />{log.note}</div>}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'stats' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-3 gap-3">
                                    {[ ['本季', stats.quarterly], ['半年', stats.semi], ['年度', stats.annual] ].map(([l, v], i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-stone-100 text-center">
                                            <p className="text-[10px] text-stone-400 mb-1">{l}</p>
                                            <p className="text-lg font-bold">{v.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-stone-100 h-80">
                                    <h3 className="text-sm font-bold mb-6">近 30 日精進曲線</h3>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.monthly}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} minTickGap={30} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                            <Area type="monotone" dataKey="value" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </main>

                    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-100 flex justify-around py-4 pb-8 z-20">
                        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-stone-800' : 'text-stone-300'}`}><Calendar size={22} /><span className="text-[10px] font-bold">修行</span></button>
                        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-stone-800' : 'text-stone-300'}`}><BarChart3 size={22} /><span className="text-[10px] font-bold">統計</span></button>
                    </nav>

                    {isAddLogOpen && (
                        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-end justify-center">
                            <div className="bg-[#FDFCFB] w-full max-w-md rounded-t-[40px] p-8 shadow-2xl">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-2xl font-bold">修持日誌</h3>
                                    <button onClick={() => setIsAddLogOpen(false)} className="bg-stone-100 p-2 rounded-full"><X size={20} /></button>
                                </div>
                                <div className="space-y-6">
                                    <input type="number" autoFocus value={inputCount} onChange={(e) => setInputCount(e.target.value)} placeholder="0 遍" className="w-full text-5xl font-serif font-bold text-amber-600 bg-transparent border-b-2 border-stone-100 py-4 focus:outline-none" />
                                    <textarea value={inputNote} onChange={(e) => setInputNote(e.target.value)} placeholder="隨感..." rows={3} className="w-full bg-stone-50 rounded-2xl p-4 text-stone-700 outline-none" />
                                    <button onClick={addLog} className="w-full bg-stone-800 text-white py-5 rounded-3xl font-bold text-lg">存入日誌</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {isAddPracticeOpen && (
                        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                            <div className="bg-white w-full max-w-sm rounded-[32px] p-8">
                                <h3 className="text-xl font-bold mb-6">新增項目</h3>
                                <input type="text" autoFocus value={newPracticeTitle} onChange={(e) => setNewPracticeTitle(e.target.value)} placeholder="項目名稱" className="w-full border-2 border-stone-100 rounded-2xl p-4 mb-8 outline-none" />
                                <button onClick={addPractice} className="w-full bg-stone-800 text-white py-4 rounded-2xl font-bold">新增</button>
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
