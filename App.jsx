import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Settings, 
  BarChart3, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  BookOpen,
  X,
  MessageSquare,
  ClipboardList,
  ChevronDown
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';

// --- 初期設定與常數 ---
const INITIAL_PRACTICES = [
  { id: '1', title: '金光明經', total: 0, color: '#d97706' },
  { id: '2', title: '蓮師心咒', total: 0, color: '#dc2626' }
];

const STORAGE_KEY = 'spiritual_practice_journal_v1';

export default function App() {
  const [practices, setPractices] = useState(INITIAL_PRACTICES);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('home'); // home, stats, settings
  const [selectedPracticeId, setSelectedPracticeId] = useState(null);
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [isAddPracticeOpen, setIsAddPracticeOpen] = useState(false);
  
  // 表單狀態
  const [inputCount, setInputCount] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [newPracticeTitle, setNewPracticeTitle] = useState('');

  // --- 資料持久化 ---
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setPractices(parsed.practices || INITIAL_PRACTICES);
        setLogs(parsed.logs || []);
      } catch (e) {
        console.error("資料讀取失敗", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ practices, logs }));
  }, [practices, logs]);

  // --- 邏輯操作 ---
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
      setPractices(practices.map(p => 
        p.id === selectedPracticeId ? { ...p, total: p.total + count } : p
      ));
    }
    
    setInputCount('');
    setInputNote('');
    setIsAddLogOpen(false);
  };

  const addPractice = () => {
    if (!newPracticeTitle.trim()) return;
    const colors = ['#d97706', '#dc2626', '#7c3aed', '#059669', '#2563eb', '#db2777'];
    const newPractice = {
      id: Date.now().toString(),
      title: newPracticeTitle,
      total: 0,
      color: colors[practices.length % colors.length]
    };
    setPractices([...practices, newPractice]);
    setNewPracticeTitle('');
    setIsAddPracticeOpen(false);
  };

  const deletePractice = (id) => {
    setPractices(practices.filter(p => p.id !== id));
    setLogs(logs.filter(l => l.practiceId !== id));
  };

  // --- 數據統計分析 ---
  const stats = useMemo(() => {
    const now = new Date();
    
    const getPeriodData = (days) => {
      const startDate = new Date();
      startDate.setDate(now.getDate() - days);
      
      const filtered = logs.filter(l => new Date(l.date) >= startDate);
      const grouped = {};
      
      // 確保圖表有連續日期
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const label = d.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
        grouped[label] = 0;
      }
      
      filtered.forEach(log => {
        const dateStr = new Date(log.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
        if (grouped[dateStr] !== undefined) {
          grouped[dateStr] += log.count;
        }
      });

      return Object.entries(grouped)
        .map(([name, value]) => ({ name, value }))
        .reverse();
    };

    const computeAggregates = (months) => {
      const startDate = new Date();
      startDate.setMonth(now.getMonth() - months);
      return logs
        .filter(l => new Date(l.date) >= startDate)
        .reduce((sum, l) => sum + l.count, 0);
    };

    return {
      monthly: getPeriodData(30),
      quarterlyTotal: computeAggregates(3),
      semiAnnualTotal: computeAggregates(6),
      annualTotal: computeAggregates(12)
    };
  }, [logs]);

  // --- UI 組件 ---
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-stone-800 font-sans pb-24">
      {/* 頂部導航列 */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-stone-800 p-1.5 rounded-lg">
              <BookOpen size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">修行筆記</h1>
          </div>
          <button 
            onClick={() => setIsAddPracticeOpen(true)}
            className="w-10 h-10 flex items-center justify-center bg-stone-100 rounded-full hover:bg-stone-200 transition-all"
          >
            <Plus size={20} className="text-stone-600" />
          </button>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="max-w-md mx-auto p-6">
        {activeTab === 'home' && (
          <div className="space-y-8">
            {/* 修持項目清單 */}
            <section>
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">今日修持項目</h2>
              <div className="grid gap-3">
                {practices.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => { setSelectedPracticeId(item.id); setIsAddLogOpen(true); }}
                    className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm flex justify-between items-center cursor-pointer active:scale-95 transition-transform"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-1.5 h-10 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <div>
                        <h3 className="font-bold text-stone-700">{item.title}</h3>
                        <p className="text-stone-400 text-xs mt-0.5">累計：{item.total.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="bg-stone-50 p-2 rounded-full">
                      <Plus size={16} className="text-stone-400" />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 最近日誌筆記 */}
            <section>
              <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">修行隨筆</h2>
              <div className="space-y-4">
                {logs.slice(0, 10).map(log => {
                  const practice = practices.find(p => p.id === log.practiceId);
                  return (
                    <div key={log.id} className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 text-stone-500 uppercase">
                          {practice?.title || '已移除'}
                        </span>
                        <span className="text-[10px] text-stone-400">
                          {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {log.count > 0 && (
                        <p className="text-lg font-serif mb-2">
                          完成了 <span className="text-amber-600 font-bold">{log.count}</span> 遍
                        </p>
                      )}
                      {log.note && (
                        <div className="flex gap-2 mt-2 pt-2 border-t border-stone-50">
                          <MessageSquare size={14} className="text-stone-300 mt-1 shrink-0" />
                          <p className="text-stone-600 text-sm leading-relaxed italic">
                            {log.note}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {logs.length === 0 && (
                  <div className="p-12 text-center border-2 border-dashed border-stone-100 rounded-2xl">
                    <p className="text-stone-300 text-sm italic">點擊上方項目，開啟今日的修行記錄</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">修持數據概覽</h2>
            
            {/* 核心指標 */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: '本季累計', val: stats.quarterlyTotal },
                { label: '半年累計', val: stats.semiAnnualTotal },
                { label: '年度總計', val: stats.annualTotal }
              ].map((s, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm text-center">
                  <p className="text-[10px] text-stone-400 font-medium mb-1 uppercase tracking-tighter">{s.label}</p>
                  <p className="text-lg font-bold text-stone-800 tracking-tight">{s.val.toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* 趋势圖表 */}
            <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-sm font-bold text-stone-700">近 30 日精進曲線</h3>
                <div className="flex items-center gap-1 text-[10px] text-stone-400">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  修持遍數
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.monthly}>
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#A8A29E' }}
                      minTickGap={30}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#A8A29E' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '16px', 
                        border: 'none', 
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#d97706" 
                      strokeWidth={2.5}
                      fillOpacity={1} 
                      fill="url(#chartGradient)" 
                      name="遍數"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 修行箴言 */}
            <div className="bg-stone-800 p-8 rounded-3xl text-stone-100 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-stone-400 text-xs font-bold uppercase tracking-[0.2em] mb-4">法語隨身</p>
                <p className="text-xl font-serif leading-relaxed italic">
                  「凡有所相，皆是虛妄。若見諸相非相，則見如來。」
                </p>
                <div className="mt-8 flex justify-between items-end">
                  <div className="text-[10px] text-stone-500">
                    <p>年度進度</p>
                    <p className="text-stone-300 font-bold mt-1">{(stats.annualTotal / 10000).toFixed(1)}%</p>
                  </div>
                  <BookOpen size={24} className="text-stone-700" />
                </div>
              </div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-stone-700/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">項目管理</h2>
            <div className="space-y-3">
              {practices.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-stone-100 flex justify-between items-center shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full shadow-inner" style={{ backgroundColor: item.color }}></div>
                    <span className="font-bold text-stone-700">{item.title}</span>
                  </div>
                  <button 
                    onClick={() => deletePractice(item.id)}
                    className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-6 bg-stone-100 rounded-2xl">
              <h4 className="text-xs font-bold text-stone-500 mb-2">關於儲存</h4>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                您的修持日誌目前安全地儲存在本機瀏覽器緩存中。若清除瀏覽器資料，紀錄將會消失。建議定期手動備份您的重要感悟。
              </p>
            </div>
          </div>
        )}
      </main>

      {/* 底部功能切換 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-stone-100 flex justify-around pt-4 pb-8 px-6 z-20">
        {[
          { id: 'home', icon: Calendar, label: '修行' },
          { id: 'stats', icon: BarChart3, label: '統計' },
          { id: 'settings', icon: Settings, label: '設定' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 transition-all ${
              activeTab === tab.id ? 'text-stone-800 scale-110' : 'text-stone-300'
            }`}
          >
            <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* 彈窗：新增修持日誌 */}
      {isAddLogOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
          <div className="bg-[#FDFCFB] w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold">修持日誌</h3>
                <p className="text-stone-400 text-sm mt-1">項目：{practices.find(p => p.id === selectedPracticeId)?.title}</p>
              </div>
              <button 
                onClick={() => { setIsAddLogOpen(false); setInputCount(''); setInputNote(''); }}
                className="bg-stone-100 p-2 rounded-full text-stone-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">本次修持遍數</label>
                <input 
                  type="number" 
                  autoFocus
                  value={inputCount}
                  onChange={(e) => setInputCount(e.target.value)}
                  placeholder="0"
                  className="w-full text-5xl font-serif font-bold text-amber-600 bg-transparent border-b-2 border-stone-100 py-4 focus:outline-none focus:border-stone-800 transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 block">隨筆感悟 (選填)</label>
                <textarea 
                  value={inputNote}
                  onChange={(e) => setInputNote(e.target.value)}
                  placeholder="寫下當下的身心感受..."
                  rows={4}
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200 transition-all resize-none"
                />
              </div>

              <button 
                onClick={addLog}
                className="w-full bg-stone-800 text-white py-5 rounded-3xl font-bold text-lg hover:bg-stone-900 active:scale-95 transition-all shadow-lg shadow-stone-200"
              >
                存入日誌
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 彈窗：新增項目 */}
      {isAddPracticeOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">新增修持項目</h3>
              <button onClick={() => setIsAddPracticeOpen(false)}><X className="text-stone-400" /></button>
            </div>
            <input 
              type="text" 
              autoFocus
              value={newPracticeTitle}
              onChange={(e) => setNewPracticeTitle(e.target.value)}
              placeholder="輸入法門或咒語名稱"
              className="w-full border-2 border-stone-100 rounded-2xl p-4 mb-8 focus:outline-none focus:border-stone-800 transition-all"
            />
            <button 
              onClick={addPractice}
              className="w-full bg-stone-800 text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-900 transition-all shadow-xl"
            >
              確定新增
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
