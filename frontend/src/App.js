import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { 
  TrendingUp, Wallet, LayoutDashboard, RefreshCw, Search, 
  ArrowUpRight, ArrowDownRight, Minus, DollarSign, 
  PieChart, Activity, ShoppingCart, X, LogOut, 
  LogIn, Key, User, Hash, AlertCircle, Loader2,
  PenLine, MessageSquare, ShieldCheck, BarChart4,
  ThumbsUp, Eye, Send, Clock
} from 'lucide-react';

// --- [전역 설정] ---
const API_BASE = "http://localhost:8080";
axios.defaults.withCredentials = true;

export default function App() {
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('login'); 
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [posts, setPosts] = useState([]); // 게시글 목록
  const [activeTab, setActiveTab] = useState('market'); // market | portfolio | community
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // 게시글 관련 상태
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); // 상세보기용
  const [commentInput, setCommentInput] = useState('');
  const [postForm, setPostForm] = useState({ title: '', content: '', stockName: '', stockCode: '', position: '매수' });
  
  // 거래 모달 상태
  const [tradeModal, setTradeModal] = useState({ show: false, stock: null, type: 'buy' });
  const [tradeQty, setTradeQty] = useState(1);
  const [loginForm, setLoginForm] = useState({ loginId: '', password: '' });

  // --- [계산 로직: 실시간 전체 수익률 및 평가액 인증] ---
  const { myTotalYield, totalEvalAmt } = useMemo(() => {
    if (!portfolio.length || !stocks.length) return { myTotalYield: "0.00", totalEvalAmt: 0 };
    
    let evalSum = 0;
    let purchaseSum = 0;
    
    portfolio.forEach(p => {
      const s = stocks.find(st => st.stockCode === p.stockCode);
      const currentPrice = s?.currentPrice || p.averagePrice;
      evalSum += currentPrice * p.quantity;
      purchaseSum += p.averagePrice * p.quantity;
    });
    
    const yieldRate = purchaseSum > 0 
      ? ((evalSum - purchaseSum) / purchaseSum * 100).toFixed(2) 
      : "0.00";

    return { 
      myTotalYield: yieldRate, 
      totalEvalAmt: evalSum 
    };
  }, [portfolio, stocks]);

  // --- [데이터 패칭] ---

  const fetchStocks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/stocks`);
      setStocks(res.data || []);
      setLastUpdated(new Date());
    } catch (err) { console.error("주가 로드 실패"); }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    try {
      const portRes = await axios.get(`${API_BASE}/trade/my/${user.loginId}`);
      setPortfolio(portRes.data || []);
      const userRes = await axios.get(`${API_BASE}/user/me`);
      if (userRes.data) setUser(userRes.data);
    } catch (err) { console.error("데이터 동기화 실패"); }
  }, [user]);

  const fetchPosts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/posts`);
      setPosts(res.data || []);
    } catch (err) { console.error("게시글 로드 실패"); }
  }, []);

  const fetchPostDetail = async (postId) => {
    try {
      const res = await axios.get(`${API_BASE}/posts/${postId}`);
      setSelectedPost(res.data);
    } catch (err) { console.error("상세보기 로드 실패"); }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API_BASE}/user/me`);
        if (res.data && res.data.loginId) {
          setUser(res.data);
          setView('main');
        }
      } catch (e) { setView('login'); }
      finally { setIsAuthChecked(true); }
    };
    init();
  }, []);

  useEffect(() => {
    if (user && view === 'main') {
      fetchStocks();
      fetchUserData();
      fetchPosts();
      const timer = setInterval(() => {
        fetchStocks();
        fetchUserData();
      }, 30000);
      return () => clearInterval(timer);
    }
  }, [user, view, fetchStocks, fetchUserData, fetchPosts]);

  // --- [핸들러] ---

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/user/login`, loginForm);
      setUser(res.data);
      setView('main');
    } catch (err) { alert("로그인 정보를 확인하세요."); }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/user/logout`);
      setUser(null);
      setView('login');
    } catch (e) { window.location.reload(); }
  };

  const handleTrade = async () => {
    setLoading(true);
    try {
      const endpoint = tradeModal.type === 'buy' ? '/trade/buy' : '/trade/sell';
      const response = await axios.post(`${API_BASE}${endpoint}`, {
        loginId: user.loginId,
        stockCode: tradeModal.stock.stockCode,
        quantity: parseInt(tradeQty)
      });
      alert(response.data);
      setTradeModal({ show: false, stock: null, type: 'buy' });
      fetchUserData();
    } catch (err) { alert(err.response?.data || "거래 실패"); }
    finally { setLoading(false); }
  };

  const handleSavePost = async (e) => {
    e.preventDefault();
    if (!postForm.stockName) { alert("종목을 선택해주세요."); return; }
    try {
      await axios.post(`${API_BASE}/posts`, {
        ...postForm,
        author: user.name,
        yield: parseFloat(myTotalYield) 
      });
      alert("분석글이 성공적으로 게시되었습니다.");
      setIsPostModalOpen(false);
      fetchPosts();
    } catch (err) { alert("게시글 저장 실패"); }
  };

  const handleLike = async (postId, e) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    try {
      await axios.post(`${API_BASE}/posts/${postId}/like`, { loginId: user.loginId });
      fetchPosts();
      if (selectedPost && selectedPost.postId === postId) fetchPostDetail(postId);
    } catch (err) { console.error("좋아요 처리 실패"); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      await axios.post(`${API_BASE}/posts/${selectedPost.postId}/comments`, {
        content: commentInput,
        author: user.name
      });
      setCommentInput('');
      fetchPostDetail(selectedPost.postId); // 댓글 목록 갱신
    } catch (err) { alert("댓글 작성 실패"); }
  };

  // --- [렌더링] ---

  if (!isAuthChecked) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><Loader2 className="animate-spin" size={48} /></div>;

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-left">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl w-full max-w-md">
          <div className="text-center mb-10 text-left">
            <TrendingUp className="mx-auto text-blue-600 mb-4" size={56} />
            <h1 className="text-3xl font-black tracking-tighter uppercase">Mock<span className="text-blue-600">Trade</span></h1>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="ID" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none" value={loginForm.loginId} onChange={e => setLoginForm({...loginForm, loginId: e.target.value})} />
            <input type="password" placeholder="PW" className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
            <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-700 transition">LOGIN</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900 text-left">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-100 p-8 sticky top-0 h-screen hidden lg:flex flex-col">
        <div className="flex items-center gap-3 mb-16 text-blue-600 font-black text-2xl tracking-tighter uppercase">
          <TrendingUp size={32} /> M-PRO
        </div>
        <nav className="flex-1 space-y-2">
          <NavItem active={activeTab === 'market'} icon={<LayoutDashboard size={20}/>} label="마켓보드" onClick={() => setActiveTab('market')} />
          <NavItem active={activeTab === 'portfolio'} icon={<PieChart size={20}/>} label="포트폴리오" onClick={() => setActiveTab('portfolio')} />
          <NavItem active={activeTab === 'community'} icon={<MessageSquare size={20}/>} label="커뮤니티" onClick={() => setActiveTab('community')} />
        </nav>
        <div className="mt-auto p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left">
          <p className="text-sm font-black text-slate-800 mb-1">{user?.name} 님</p>
          <div className="flex items-center gap-1.5 mb-4">
             <ShieldCheck size={12} className="text-blue-500" />
             <span className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Certified Yield: {myTotalYield}%</span>
          </div>
          <button onClick={handleLogout} className="w-full py-3 bg-white border border-slate-200 text-[10px] font-black text-slate-400 rounded-xl hover:text-red-500 transition-colors uppercase">로그아웃</button>
        </div>
      </aside>

      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="flex justify-between items-center mb-10 text-left">
          <div className="text-left">
            <h1 className="text-5xl font-black tracking-tighter leading-none">
                {activeTab === 'market' ? 'Market Watch' : activeTab === 'portfolio' ? 'My Assets' : 'Insights'}
            </h1>
            <p className="text-slate-400 text-sm font-bold mt-3 flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> {lastUpdated.toLocaleTimeString()} Sync
            </p>
          </div>
          <div className="flex gap-4">
             {activeTab === 'community' && (
                 <button 
                    onClick={() => setIsPostModalOpen(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black hover:bg-slate-800 transition"
                 >
                    <PenLine size={20} /> 분석글 작성
                 </button>
             )}
             <div className="bg-white p-4 px-8 rounded-2xl border border-slate-100 shadow-sm text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 leading-none text-left">Balance</p>
                <p className="text-2xl font-black text-slate-900 leading-none">{user?.balance?.toLocaleString()} <span className="text-xs text-slate-300">KRW</span></p>
             </div>
          </div>
        </header>

        {activeTab === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-in fade-in duration-700">
            {stocks.map(s => <StockCard key={s.stockCode} stock={s} onTrade={type => setTradeModal({ show: true, stock: s, type })} />)}
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-8 animate-in fade-in duration-700">
             <div className="grid grid-cols-3 gap-6 text-left">
                <Stat label="총 평가액" value={`${totalEvalAmt.toLocaleString()}원`} icon={<Wallet size={20}/>} />
                <Stat label="인증 수익률" value={`${myTotalYield}%`} isRate rate={parseFloat(myTotalYield)} icon={<ShieldCheck size={20}/>} />
                <Stat label="보유 종목" value={`${portfolio.length}종목`} icon={<PieChart size={20}/>} />
             </div>
             <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <tr>
                         <th className="px-10 py-6">Asset</th>
                         <th className="px-10 py-6 text-right">Avg.Price</th>
                         <th className="px-10 py-6 text-right">Quantity</th>
                         <th className="px-10 py-6 text-right">Yield</th>
                         <th className="px-10 py-6 text-center">Trade</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 text-left">
                      {portfolio.map(p => {
                         const s = stocks.find(st => st.stockCode === p.stockCode);
                         const curP = s?.currentPrice || p.averagePrice;
                         const yields = ((curP - p.averagePrice) / p.averagePrice * 100).toFixed(2);
                         const isPlus = parseFloat(yields) >= 0;
                         return (
                            <tr key={p.stockCode} className="hover:bg-slate-50/50 transition-colors">
                               <td className="px-10 py-7 font-black text-slate-800 text-left">{p.stockName} <span className="ml-2 text-[10px] text-slate-300 font-bold">{p.stockCode}</span></td>
                               <td className="px-10 py-7 text-right font-bold text-slate-500">{p.averagePrice.toLocaleString()}</td>
                               <td className="px-10 py-7 text-right font-black text-lg">{p.quantity.toLocaleString()}</td>
                               <td className={`px-10 py-7 text-right font-black text-lg ${isPlus ? 'text-rose-500' : 'text-blue-600'}`}>{isPlus ? '▲' : '▼'} {Math.abs(yields)}%</td>
                               <td className="px-10 py-7 text-center">
                                  <button onClick={() => setTradeModal({ show: true, stock: s || p, type: 'sell' })} className="px-5 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black hover:bg-blue-600 hover:text-white transition-all uppercase">Sell</button>
                               </td>
                            </tr>
                         );
                      })}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-700">
             {posts.map(post => {
                 const isLiked = post.likedUsers?.includes(user.loginId);
                 return (
                 <div 
                    key={post.postId} 
                    onClick={() => fetchPostDetail(post.postId)}
                    className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all text-left cursor-pointer group"
                 >
                    <div className="flex justify-between items-start mb-6 text-left">
                        <div className="flex items-center gap-3 text-left">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-xs">{post.author[0]}</div>
                            <div className="text-left">
                                <p className="font-black text-slate-800">{post.author}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase">{post.stockName} 분석</p>
                            </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 ${post.yield >= 0 ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                           <ShieldCheck size={12} /> 인증 수익률 {post.yield}%
                        </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">{post.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-2 font-medium">{post.content}</p>
                    
                    <div className="flex items-center gap-6 border-t border-slate-50 pt-6">
                       <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                           <Eye size={14} /> {post.viewCount || 0}
                       </div>
                       <button 
                          onClick={(e) => handleLike(post.postId, e)}
                          className={`flex items-center gap-1.5 font-bold text-xs transition-colors ${isLiked ? 'text-blue-600' : 'text-slate-400 hover:text-blue-500'}`}
                       >
                           <ThumbsUp size={14} fill={isLiked ? "currentColor" : "none"} /> {post.likedUsers?.length || 0}
                       </button>
                       <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs">
                           <MessageSquare size={14} /> {post.comments?.length || 0}
                       </div>
                       <div className="ml-auto flex items-center gap-1 text-slate-300 font-bold text-[10px] uppercase tracking-wider">
                           <BarChart4 size={14}/> {post.stockCode}
                       </div>
                    </div>
                 </div>
                 );
             })}
          </div>
        )}
      </main>

      {/* 분석글 작성 모달 */}
      {isPostModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-left">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsPostModalOpen(false)} />
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 text-left">
                <div className="p-10 bg-slate-900 text-white text-left">
                    <h2 className="text-3xl font-black tracking-tighter mb-2">분석글 작성</h2>
                    <p className="text-slate-400 font-bold">현재 사용자님의 수익률이 게시글에 자동으로 인증되어 포함됩니다.</p>
                </div>
                <form onSubmit={handleSavePost} className="p-10 space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">종목 선택</label>
                            <select 
                                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none"
                                value={postForm.stockName}
                                onChange={(e) => {
                                    const s = stocks.find(st => st.stockName === e.target.value);
                                    setPostForm({...postForm, stockName: e.target.value, stockCode: s?.stockCode || ''});
                                }}
                            >
                                <option value="">종목을 선택하세요</option>
                                {stocks.map(s => <option key={s.stockCode} value={s.stockName}>{s.stockName}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">인증 수익률</label>
                            <div className={`w-full p-4 rounded-2xl border font-black flex items-center gap-2 ${parseFloat(myTotalYield) >= 0 ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                               <ShieldCheck size={16} /> {myTotalYield}% (실시간 인증됨)
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">제목</label>
                        <input type="text" placeholder="분석글 제목을 입력하세요" className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-left" value={postForm.title} onChange={e => setPostForm({...postForm, title: e.target.value})} required />
                    </div>
                    <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-left">내용</label>
                        <textarea rows="5" placeholder="종목에 대한 본인의 견해를 자유롭게 작성하세요..." className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all resize-none text-left" value={postForm.content} onChange={e => setPostForm({...postForm, content: e.target.value})} required></textarea>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIsPostModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black text-lg hover:bg-slate-200 transition">취소</button>
                        <button type="submit" className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition">인증 글 올리기</button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* 게시글 상세보기 모달 */}
      {selectedPost && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 text-left">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedPost(null)} />
              <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in slide-in-from-bottom-10 duration-500 flex flex-col max-h-[90vh]">
                  {/* 상단 헤더 */}
                  <div className="p-8 border-b border-slate-100 flex justify-between items-start">
                      <div className="flex items-center gap-4 text-left">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">{selectedPost.author[0]}</div>
                          <div className="text-left">
                              <h3 className="text-xl font-black text-slate-900">{selectedPost.title}</h3>
                              <p className="text-sm font-bold text-slate-400 tracking-tight">{selectedPost.author} • {selectedPost.stockName} ({selectedPost.stockCode})</p>
                          </div>
                      </div>
                      <button onClick={() => setSelectedPost(null)} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={24}/></button>
                  </div>

                  {/* 본문 내용 (스크롤 가능) */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      <div className="flex items-center gap-3">
                          <div className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 ${selectedPost.yield >= 0 ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-600'}`}>
                             <ShieldCheck size={18} /> 인증된 수익률: {selectedPost.yield}%
                          </div>
                          <div className="px-4 py-2 bg-slate-50 rounded-2xl font-black text-sm text-slate-500 flex items-center gap-2">
                             <Eye size={18} /> 조회수 {selectedPost.viewCount}
                          </div>
                          <button 
                             onClick={(e) => handleLike(selectedPost.postId, e)}
                             className={`px-4 py-2 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${selectedPost.likedUsers?.includes(user.loginId) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                          >
                             <ThumbsUp size={18} fill={selectedPost.likedUsers?.includes(user.loginId) ? "currentColor" : "none"} /> {selectedPost.likedUsers?.length || 0}
                          </button>
                      </div>

                      <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap font-medium border-l-4 border-slate-100 pl-6">
                          {selectedPost.content}
                      </p>

                      {/* 댓글 섹션 */}
                      <div className="space-y-6 pt-8 border-t border-slate-100">
                          <h4 className="font-black text-slate-900 flex items-center gap-2">
                             <MessageSquare size={20} /> 댓글 ({selectedPost.comments?.length || 0})
                          </h4>
                          
                          <div className="space-y-4">
                              {selectedPost.comments?.map((comment, idx) => (
                                  <div key={idx} className="bg-slate-50 p-5 rounded-2xl text-left border border-slate-100/50">
                                      <div className="flex justify-between mb-2">
                                          <span className="font-black text-slate-800 text-sm">{comment.author}</span>
                                          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1"><Clock size={10}/> {comment.createdAt}</span>
                                      </div>
                                      <p className="text-slate-600 text-sm leading-relaxed">{comment.content}</p>
                                  </div>
                              ))}
                              {(!selectedPost.comments || selectedPost.comments.length === 0) && (
                                  <p className="text-center py-10 text-slate-300 font-bold italic uppercase tracking-widest text-xs">No comments yet.</p>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* 댓글 작성란 */}
                  <form onSubmit={handleAddComment} className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4">
                      <input 
                        type="text" 
                        placeholder="분석에 대한 의견을 남겨주세요..." 
                        className="flex-1 p-4 bg-white border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-600/5 transition-all text-sm"
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                      />
                      <button className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-700 transition flex items-center gap-2 active:scale-95 shadow-lg shadow-blue-600/20">
                          <Send size={18} /> 전송
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Trade Modal */}
      {tradeModal.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 text-left">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setTradeModal({...tradeModal, show: false})} />
          <div className="bg-white w-full max-w-md rounded-[3.5rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300 text-left">
            <div className={`p-10 ${tradeModal.type === 'buy' ? 'bg-rose-500 text-white' : 'bg-blue-600 text-white'} text-left`}>
              <div className="flex justify-between items-start mb-6">
                <div className="text-left">
                  <h3 className="text-3xl font-black uppercase tracking-tighter">{tradeModal.type} Order</h3>
                  <p className="font-bold text-white/70">{tradeModal.stock.stockName} ({tradeModal.stock.stockCode})</p>
                </div>
                <X className="cursor-pointer" onClick={() => setTradeModal({...tradeModal, show: false})} />
              </div>
              <div className="bg-white/10 p-6 rounded-3xl flex justify-between items-center text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 leading-none">Price</p>
                <p className="text-4xl font-black leading-none">{tradeModal.stock.currentPrice?.toLocaleString()} <span className="text-sm">원</span></p>
              </div>
            </div>
            <div className="p-10 space-y-8 text-left">
              <div className="text-left">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 ml-1">Quantity</label>
                <div className="flex gap-4 items-center">
                  <button onClick={() => setTradeQty(Math.max(1, tradeQty-1))} className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl hover:bg-slate-100 shadow-sm transition-all">-</button>
                  <input type="number" value={tradeQty} onChange={e => setTradeQty(parseInt(e.target.value)||1)} className="flex-1 text-center text-4xl font-black outline-none bg-transparent" />
                  <button onClick={() => setTradeQty(tradeQty+1)} className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl font-black text-2xl hover:bg-slate-100 shadow-sm transition-all">+</button>
                </div>
              </div>
              <div className="bg-slate-50/80 p-8 rounded-[2rem] flex justify-between items-center border border-slate-100">
                <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest leading-none">Total</span>
                <span className="text-2xl font-black text-slate-900 leading-none">{(tradeModal.stock.currentPrice * tradeQty).toLocaleString()}원</span>
              </div>
              <button onClick={handleTrade} className={`w-full py-6 rounded-[2.5rem] font-black text-xl text-white shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${tradeModal.type === 'buy' ? 'bg-rose-500 shadow-rose-200' : 'bg-blue-600 shadow-blue-200'}`}>
                 {tradeModal.type === 'buy' ? '매수 주문 확정' : '매도 주문 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- [컴포넌트] ---

const NavItem = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-5 rounded-[1.5rem] font-black transition-all duration-300 group ${active ? 'bg-blue-600 text-white shadow-2xl shadow-blue-100 scale-[1.03]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-800'}`}>
    {icon} <span className="text-[15px] tracking-tight">{label}</span>
  </button>
);

const Stat = ({ label, value, isRate, rate, icon }) => (
  <div className="bg-white p-8 rounded-[2.8rem] border border-slate-100 text-left flex justify-between items-center group hover:shadow-lg transition-all">
    <div className="text-left">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">{label}</p>
      <p className={`text-3xl font-black leading-none ${isRate ? (rate >= 0 ? 'text-rose-500' : 'text-blue-600') : 'text-slate-900'}`}>{value}</p>
    </div>
    <div className="w-14 h-14 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shadow-inner">{icon}</div>
  </div>
);

const StockCard = ({ stock, onTrade }) => {
  const rate = parseFloat(stock.changeRate) || 0;
  const isUp = rate > 0;
  const isDown = rate < 0;
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center hover:shadow-2xl hover:-translate-y-1 transition-all text-left group">
      <div className="flex items-center gap-5 text-left leading-none">
        <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl transition-all shadow-sm ${isUp ? 'bg-rose-500 text-rose-500' : isDown ? 'bg-blue-600 text-white' : 'bg-slate-200 text-white'}`}>{stock.stockName?.[0] || '?'}</div>
        <div className="text-left">
          <p className="font-black text-slate-900 text-xl leading-none mb-2">{stock.stockName}</p>
          <div className={`text-xs font-black ${isUp ? 'text-rose-500' : isDown ? 'text-blue-600' : 'text-slate-400'}`}>
            {isUp ? '▲' : isDown ? '▼' : '-'} {Math.abs(rate).toFixed(2)}%
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-3 text-left">
        <p className="font-black text-slate-900 text-2xl tracking-tighter leading-none">{stock.currentPrice?.toLocaleString()}<span className="text-[10px] ml-0.5 font-bold text-slate-300 uppercase">원</span></p>
        <div className="flex gap-2">
          <button onClick={() => onTrade('buy')} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"><ShoppingCart size={18} /></button>
          <button onClick={() => onTrade('sell')} className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm"><DollarSign size={18} /></button>
        </div>
      </div>
    </div>
  );
};