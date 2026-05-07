import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  MessageSquare, 
  CheckCircle2, 
  User, 
  LogOut, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Send, 
  ThumbsUp,
  RefreshCw,
  AlertCircle,
  Activity,
  Award,
  BarChart3
} from 'lucide-react';

// Axios 설정: 세션 쿠키 공유를 위해 withCredentials 필수
const api = axios.create({
  baseURL: 'http://localhost:8080',
  withCredentials: true,
  timeout: 5000,
});

const App = () => {
  // 전역 상태
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('stocks');
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState(false);

  // 데이터 상태
  const [stocks, setStocks] = useState([]);
  const [posts, setPosts] = useState([]);
  const [missions, setMissions] = useState(null);
  const [myTrades, setMyTrades] = useState([]);
  const [isLive, setIsLive] = useState(false); // 실시간 업데이트 표시용

  // 초기 로드: 로그인 확인
  useEffect(() => {
    checkAuth();
  }, []);

  // 5초마다 주식 시세 자동 새로고침 (Polling)
  useEffect(() => {
    let interval;
    if (user) {
      interval = setInterval(() => {
        setIsLive(true);
        fetchStocks();
        if (currentPage === 'portfolio') fetchMyTrades(user.loginId);
        setTimeout(() => setIsLive(false), 1000);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [user, currentPage]);

  const checkAuth = async () => {
    setServerError(false);
    try {
      const res = await api.get('/user/me');
      setUser(res.data);
      fetchInitialData(res.data.loginId);
    } catch (e) {
      if (!e.response) setServerError(true);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = (loginId) => {
    fetchStocks();
    fetchPosts();
    fetchMissions(loginId);
    fetchMyTrades(loginId);
  };

  const fetchStocks = async () => {
    try {
      const res = await api.get('/stocks');
      setStocks(res.data);
    } catch (e) { console.error("주식 로딩 실패", e); }
  };

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts');
      setPosts(res.data);
    } catch (e) { console.error("게시판 로딩 실패", e); }
  };

  const fetchMissions = async (loginId) => {
    try {
      const res = await api.get(`/missions/${loginId}`);
      setMissions(res.data);
    } catch (e) { console.error("미션 로딩 실패", e); }
  };

  const fetchMyTrades = async (loginId) => {
    try {
      const res = await api.get(`/trade/my/${loginId}`);
      setMyTrades(res.data);
    } catch (e) { console.error("포트폴리오 로딩 실패", e); }
  };

  const handleLogout = async () => {
    try {
      await api.post('/user/logout');
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
      setCurrentPage('stocks');
    }
  };

  // 실시간 총 수익률 계산
  const totalYield = calculateTotalYield(myTrades, stocks);

  if (loading) return (
    <div className="flex flex-col h-screen items-center justify-center gap-4 bg-gray-50">
      <RefreshCw className="animate-spin text-blue-600" size={48} />
      <div className="font-bold text-gray-600">서버와 연결 확인 중...</div>
    </div>
  );

  if (serverError) return (
    <div className="flex flex-col h-screen items-center justify-center gap-6 bg-red-50 p-6 text-center">
      <AlertCircle className="text-red-500" size={64} />
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-red-700">백엔드 서버 연결 오류</h2>
        <p className="text-red-600 max-w-md mx-auto">서버(http://localhost:8080)가 실행 중인지 확인해 주세요.</p>
      </div>
      <button onClick={checkAuth} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition flex items-center gap-2">
        <RefreshCw size={20} /> 다시 연결 시도
      </button>
    </div>
  );

  if (!user) return <AuthPage onLoginSuccess={checkAuth} />;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <nav className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('stocks')}>
            <TrendingUp size={24} /> MockInvest
          </h1>
          <div className="flex gap-4">
            {['stocks', 'portfolio', 'board', 'missions'].map(page => (
              <button 
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  if(page === 'missions') fetchMissions(user.loginId);
                  if(page === 'portfolio') fetchMyTrades(user.loginId);
                }}
                className={`px-3 py-1 rounded-md transition ${currentPage === page ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-100'}`}
              >
                {page.toUpperCase()}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold transition-all duration-500 ${isLive ? 'bg-green-100 text-green-600 scale-105' : 'bg-gray-100 text-gray-400 opacity-50'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            LIVE MARKET
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* 전체 수익률 표시 영역 */}
          <div className={`hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-500 ${Number(totalYield) >= 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'} ${isLive ? 'scale-105' : 'scale-100'}`}>
            <BarChart3 size={16} />
            <span className="text-xs font-black uppercase tracking-wider">Yield</span>
            <span className="font-black text-sm">{totalYield > 0 ? '+' : ''}{totalYield}%</span>
          </div>

          {/* 지갑 잔액 영역 */}
          <div onClick={checkAuth} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full cursor-pointer hover:bg-gray-200 transition border border-gray-200 group">
            <Wallet size={16} className="text-gray-600" />
            <span className="font-bold text-gray-700 text-sm">{user.balance?.toLocaleString() || 0} 원</span>
            <RefreshCw size={12} className="text-gray-400 group-hover:rotate-180 transition-transform duration-500" />
          </div>
          
          <div className="flex items-center gap-3 border-l pl-4">
            <span className="text-sm font-medium">{user.name || user.loginId}님</span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-500 transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-8">
        {currentPage === 'stocks' && <StockDashboard stocks={stocks} user={user} onTradeSuccess={() => {checkAuth(); fetchMyTrades(user.loginId);}} />}
        {currentPage === 'portfolio' && <Portfolio trades={myTrades} stocks={stocks} />}
        {currentPage === 'board' && <CommunityBoard posts={posts} user={user} stocks={stocks} myTrades={myTrades} onPostSuccess={fetchPosts} />}
        {currentPage === 'missions' && <MissionCenter missions={missions} user={user} onClaimSuccess={() => {checkAuth(); fetchMissions(user.loginId);}} />}
      </main>
    </div>
  );
};

// --- 유틸리티 함수 ---
const maskId = (id) => {
  if (!id) return "";
  if (id.length <= 3) return id[0] + "*".repeat(id.length - 1);
  return id.substring(0, 3) + "*".repeat(Math.max(3, id.length - 3));
};

const calculateTotalYield = (trades, stocks) => {
  if (!trades || trades.length === 0) return "0.00";
  let totalCost = 0;
  let totalValue = 0;
  
  trades.forEach(trade => {
    const stock = stocks.find(s => s.stockCode === trade.stockCode);
    const currentPrice = stock?.currentPrice || trade.averagePrice;
    totalCost += trade.averagePrice * trade.quantity;
    totalValue += currentPrice * trade.quantity;
  });

  if (totalCost === 0) return "0.00";
  return (((totalValue - totalCost) / totalCost) * 100).toFixed(2);
};

// 에러 메시지 추출 헬퍼
const getErrorMessage = (err) => {
  if (!err.response) return "서버와 연결할 수 없습니다.";
  const data = err.response.data;
  // 백엔드에서 BindingResult.getAllErrors()를 보낼 경우 처리
  if (Array.isArray(data)) {
    return data.map(item => item.defaultMessage || item).join('\n');
  }
  // 일반 String 메시지 또는 JSON 객체 처리
  return typeof data === 'string' ? data : (data.message || "오류가 발생했습니다.");
};

// --- 서브 컴포넌트들 ---

const AuthPage = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ loginId: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await api.post('/user/register', { loginId: form.loginId, password: form.password });
        alert("회원가입 성공! 로그인을 진행해주세요.");
        setIsRegister(false);
      } else {
        await api.post('/user/login', { loginId: form.loginId, password: form.password });
        onLoginSuccess();
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-blue-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-8 text-blue-600">{isRegister ? "계정 생성" : "MockInvest 로그인"}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">아이디</label>
            <input className="w-full border rounded-lg p-2.5 outline-blue-500" value={form.loginId} onChange={e => setForm({...form, loginId: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">비밀번호</label>
            <input type="password" className="w-full border rounded-lg p-2.5 outline-blue-500" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button type="submit" disabled={loading} className={`w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition mt-6 flex items-center justify-center ${loading ? 'opacity-50' : ''}`}>
            {loading ? <RefreshCw className="animate-spin mr-2" size={18} /> : null}
            {isRegister ? "가입하기" : "로그인"}
          </button>
        </form>
        <button className="w-full mt-4 text-sm text-gray-500 hover:underline" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "이미 계정이 있으신가요?" : "아직 회원이 아니신가요? 가입하기"}
        </button>
      </div>
    </div>
  );
};

const StockDashboard = ({ stocks, user, onTradeSuccess }) => {
  const [selectedStock, setSelectedStock] = useState(null);
  const [qty, setQty] = useState(1);
  const [trading, setTrading] = useState(false);

  const handleTrade = async (type) => {
    if(!selectedStock || trading) return;
    setTrading(true);
    try {
      await api.post(`/trade/${type}`, {
        loginId: user.loginId,
        stockCode: selectedStock.stockCode,
        quantity: qty
      });
      alert(`${selectedStock.stockName} ${qty}주 ${type === 'buy' ? '매수' : '매도'} 완료!`);
      onTradeSuccess();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setTrading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4"><TrendingUp className="text-blue-500" /> 실시간 시세 (TOP 40)</h3>
        {stocks.length === 0 ? (
          <div className="bg-white p-20 text-center border rounded-2xl text-gray-400">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stocks.map(stock => (
              <div key={stock.stockCode} onClick={() => setSelectedStock(stock)} className={`p-4 rounded-xl border transition cursor-pointer hover:shadow-md ${selectedStock?.stockCode === stock.stockCode ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-lg">{stock.stockName}</span>
                  <span className="text-xs text-gray-400 font-mono">{stock.stockCode}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xl font-semibold">{stock.currentPrice?.toLocaleString()} 원</span>
                  <span className={`flex items-center text-sm font-bold ${stock.changeRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                    {stock.changeRate >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                    {Math.abs(stock.changeRate || 0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border h-fit sticky top-24 shadow-sm">
        <h3 className="text-lg font-bold mb-6 border-b pb-4">주식 주문</h3>
        {selectedStock ? (
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">선택된 종목</p>
              <p className="text-xl font-bold">{selectedStock.stockName}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{selectedStock.currentPrice?.toLocaleString()} 원</p>
            </div>
            <div>
              <label className="text-sm text-gray-500 block mb-2">수량 설정</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(Math.max(1, qty-1))} className="w-10 h-10 border rounded-lg hover:bg-gray-50">-</button>
                <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} className="flex-1 border rounded-lg h-10 text-center font-bold" />
                <button onClick={() => setQty(qty+1)} className="w-10 h-10 border rounded-lg hover:bg-gray-50">+</button>
              </div>
            </div>
            <div className="pt-4 border-t space-y-3">
              <div className="flex justify-between text-sm">
                <span>총 주문금액</span>
                <span className="font-bold">{(selectedStock.currentPrice * qty).toLocaleString()} 원</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleTrade('buy')} disabled={trading} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition disabled:opacity-50">매수</button>
                <button onClick={() => handleTrade('sell')} disabled={trading} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50">매도</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center text-gray-400">
            <TrendingUp size={48} className="mx-auto mb-4 opacity-20" />
            <p>거래할 종목을 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CommunityBoard = ({ posts, user, stocks, myTrades, onPostSuccess }) => {
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [selectedPost, setSelectedPost] = useState(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 현재 사용자의 실시간 총 수익률 계산
  const currentTotalYield = calculateTotalYield(myTrades, stocks);

  const handlePostSubmit = async () => {
    if(!newPost.title || !newPost.content || submitting) return;
    setSubmitting(true);
    try {
      // 게시글 작성 시 현재 수익률(yield) 정보를 포함하여 전송
      await api.post('/posts', { 
        ...newPost, 
        author: user.loginId,
        yield: parseFloat(currentTotalYield) 
      });
      setNewPost({ title: '', content: '' });
      onPostSuccess();
      alert("투자 인사이트 게시글이 등록되었습니다!");
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await api.post(`/posts/${postId}/like`, { loginId: user.loginId });
      onPostSuccess();
      const updated = await api.get(`/posts/${postId}`);
      setSelectedPost(updated.data);
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const handleComment = async (postId) => {
    if(!comment) return;
    try {
      await api.post(`/posts/${postId}/comments`, { author: user.loginId, content: comment });
      setComment("");
      onPostSuccess();
      const updated = await api.get(`/posts/${postId}`);
      setSelectedPost(updated.data);
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border mb-6 shadow-sm border-blue-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold flex items-center gap-2 text-blue-600"><Send size={18} /> 투자 인사이트 공유</h3>
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              <Award size={14} className="text-blue-500" />
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">나의 실적: {currentTotalYield}%</span>
            </div>
          </div>
          <input placeholder="제목을 입력하세요" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full border-b py-2 mb-2 outline-none text-lg font-semibold" />
          <textarea placeholder="현재 시장에 대한 생각이나 투자 전략을 공유해보세요..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} className="w-full h-24 p-2 text-sm outline-none resize-none bg-gray-50 rounded-lg" />
          <button onClick={handlePostSubmit} disabled={submitting} className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-bold mt-3 hover:bg-blue-700 transition disabled:opacity-50">
            {submitting ? "등록 중..." : "인사이트 등록"}
          </button>
        </div>
        
        <h3 className="font-bold text-lg mb-4">커뮤니티 피드</h3>
        {posts.map(post => (
          <div key={post.postId} onClick={() => setSelectedPost(post)} className={`bg-white p-5 rounded-2xl border cursor-pointer hover:border-blue-300 transition shadow-sm ${selectedPost?.postId === post.postId ? 'border-blue-500 ring-2 ring-blue-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg">{post.title}</h4>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">{maskId(post.author)}</span>
                {post.yield !== undefined && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${post.yield >= 0 ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    <Activity size={10} /> {post.yield > 0 ? '+' : ''}{post.yield}%
                  </span>
                )}
              </div>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2 mb-4">{post.content}</p>
            <div className="flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><ThumbsUp size={14} /> {post.likedUsers?.length || 0}</span>
              <span className="flex items-center gap-1"><MessageSquare size={14} /> {post.comments?.length || 0}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-6 h-fit sticky top-24 shadow-sm min-h-[400px]">
        {selectedPost ? (
          <div className="space-y-6">
            <div className="border-b pb-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {selectedPost.author.substring(0, 1).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-800">{maskId(selectedPost.author)}</div>
                    {selectedPost.yield !== undefined && (
                      <div className={`text-[10px] font-bold flex items-center gap-1 ${selectedPost.yield >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                         누적 수익률 {selectedPost.yield > 0 ? '+' : ''}{selectedPost.yield}%
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleLike(selectedPost.postId); }} className={`flex items-center gap-1 text-sm transition ${selectedPost.likedUsers?.includes(user.loginId) ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-600'}`}>
                  <ThumbsUp size={16} /> {selectedPost.likedUsers?.includes(user.loginId) ? '추천됨' : '추천하기'}
                </button>
              </div>
              <h2 className="text-2xl font-bold mb-3">{selectedPost.title}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{selectedPost.content}</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold flex items-center gap-2"><MessageSquare size={16} /> 댓글 {selectedPost.comments?.length || 0}</h4>
              <div className="flex gap-2">
                <input value={comment} onChange={e => setComment(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleComment(selectedPost.postId)} placeholder="댓글을 입력하세요..." className="flex-1 border rounded-xl px-4 py-2.5 text-sm outline-blue-500 bg-gray-50 focus:bg-white transition" />
                <button onClick={() => handleComment(selectedPost.postId)} className="bg-gray-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition">등록</button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedPost.comments?.map((c, i) => (
                  <div key={i} className="bg-gray-50 p-3 rounded-xl text-sm border border-gray-100">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-blue-600">{maskId(c.author)}</span>
                      <span className="text-[10px] text-gray-400">{c.createdAt}</span>
                    </div>
                    <p className="text-gray-700">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
            <MessageSquare size={64} className="opacity-10 mb-4" />
            <p className="font-medium">게시글을 선택하여 전문가의 인사이트를 확인하세요</p>
          </div>
        )}
      </div>
    </div>
  );
};

const Portfolio = ({ trades, stocks }) => {
  const totalYield = calculateTotalYield(trades, stocks);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-2">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2"><Wallet className="text-green-500" /> 나의 보유 주식</h3>
          <p className="text-sm text-gray-500 mt-1">현재 총 누적 수익률: <span className={`font-bold ${Number(totalYield) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>{totalYield}%</span></p>
        </div>
        <span className="text-sm text-gray-500 italic">5초마다 현재가가 자동 갱신됩니다.</span>
      </div>
      {trades.length > 0 ? (
        <div className="overflow-hidden bg-white border rounded-2xl shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-4">종목명</th>
                <th className="px-6 py-4 text-right">보유수량</th>
                <th className="px-6 py-4 text-right">평단가</th>
                <th className="px-6 py-4 text-right bg-blue-50">현재가 (Live)</th>
                <th className="px-6 py-4 text-right">수익률</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trades.map(trade => {
                const stock = stocks.find(s => s.stockCode === trade.stockCode);
                const currentPrice = stock?.currentPrice || 0;
                const profitRate = trade.averagePrice > 0 
                  ? (((currentPrice - trade.averagePrice) / trade.averagePrice) * 100).toFixed(2) 
                  : "0.00";
                
                return (
                  <tr key={trade.stockCode} className="hover:bg-blue-50 transition duration-300">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{trade.stockName}</div>
                      <div className="text-xs text-gray-400 font-mono">{trade.stockCode}</div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-700">{trade.quantity}주</td>
                    <td className="px-6 py-4 text-right text-gray-500 font-mono">{trade.averagePrice?.toLocaleString()} 원</td>
                    <td className="px-6 py-4 text-right font-black text-blue-600 font-mono bg-blue-50/30 transition-colors duration-500">{currentPrice.toLocaleString()} 원</td>
                    <td className={`px-6 py-4 text-right font-black font-mono transition-colors duration-500 ${Number(profitRate) >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                      {Number(profitRate) > 0 ? '+' : ''}{profitRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed rounded-3xl py-20 text-center text-gray-400 flex flex-col items-center gap-4">
          <Wallet size={48} className="opacity-20" />
          <p className="text-lg font-medium">보유한 주식이 없습니다.</p>
        </div>
      )}
    </div>
  );
};

const MissionCenter = ({ missions, user, onClaimSuccess }) => {
  if (!missions) return <div className="text-center py-20"><RefreshCw className="animate-spin mx-auto mb-4" /></div>;

  const claim = async (type) => {
    try {
      const res = await api.post('/missions/claim', { loginId: user.loginId, type });
      alert(res.data);
      onClaimSuccess();
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const missionList = [
    { id: 'BUY', title: '첫 매수 성공', desc: '주식을 처음 매수하면 보상을 드립니다.', completed: missions.buyCompleted, claimed: missions.buyClaimed, reward: '50,000' },
    { id: 'SELL', title: '첫 매도 성공', desc: '수익 실현의 첫 걸음!', completed: missions.sellCompleted, claimed: missions.sellClaimed, reward: '30,000' },
    { id: 'POST', title: '인사이트 공유', desc: '커뮤니티에 글을 작성해보세요.', completed: missions.postCreated, claimed: missions.postClaimed, reward: '10,000' },
    { id: 'LIKE', title: '좋아요 클릭', desc: '다른 투자자의 글을 응원하세요.', completed: missions.likeCompleted, claimed: missions.likeClaimed, reward: '5,000' },
    { id: 'COMMENT', title: '댓글 소통', desc: '댓글로 의견을 나누어보세요.', completed: missions.commentCreated, claimed: missions.commentClaimed, reward: '5,000' },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10"><h2 className="text-3xl font-black mb-3 italic">MISSION CENTER</h2><p className="opacity-80 font-medium">미션을 달성하고 투자 지원금을 받으세요!</p></div>
        <CheckCircle2 size={120} className="absolute top-0 right-0 p-8 opacity-10" />
      </div>
      <div className="space-y-4">
        {missionList.map(m => (
          <div key={m.id} className={`bg-white p-6 rounded-2xl border-2 transition-all flex justify-between items-center ${m.completed && !m.claimed ? 'border-yellow-400 bg-yellow-50 shadow-md scale-[1.02]' : 'border-gray-100 shadow-sm'}`}>
            <div className="flex gap-5 items-center">
              <div className={`p-4 rounded-2xl ${m.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-300'}`}><CheckCircle2 size={28} /></div>
              <div><h4 className="font-bold text-xl text-gray-800">{m.title}</h4><p className="text-sm text-gray-500 mb-2">{m.desc}</p><span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 text-blue-600">보상: {m.reward}원</span></div>
            </div>
            <div>{!m.completed ? <div className="text-sm font-bold text-gray-400 bg-gray-50 px-5 py-2.5 rounded-xl border border-gray-100">진행 중</div> : m.claimed ? <div className="text-sm font-bold text-green-600 bg-green-50 px-5 py-2.5 rounded-xl border border-green-100">수령 완료</div> : <button onClick={() => claim(m.id)} className="bg-yellow-400 text-yellow-900 px-7 py-3 rounded-xl font-black hover:bg-yellow-500 transition shadow-lg">보상 받기</button>}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;