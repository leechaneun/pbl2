import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyPortfolio = ({ refreshSignal }) => {
    const [myTrades, setMyTrades] = useState([]);
    const loginId = "real_db_tester"; // DB에 존재하는 실제 아이디

    const fetchMyTrades = async () => {
        try {
            // TradeController의 getMyTrades(@PathVariable String loginId) 호출
            const response = await axios.get(`http://localhost:8080/trade/my/${loginId}`);
            setMyTrades(response.data);
        } catch (error) {
            console.error("보유 자산 로드 실패:", error);
        }
    };

    // 처음 로드될 때와 거래(매수/매도)가 발생했을 때 다시 불러옵니다.
    useEffect(() => {
        fetchMyTrades();
    }, [refreshSignal]);

    return (
        <div style={portfolioContainer}>
            <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>💰 내 보유 주식</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa', fontSize: '14px' }}>
                        <th style={thStyle}>종목명</th>
                        <th style={thStyle}>수량</th>
                        <th style={thStyle}>평균단가</th>
                    </tr>
                </thead>
                <tbody>
                    {myTrades.length > 0 ? (
                        myTrades.map((trade) => (
                            <tr key={trade.stockCode} style={{ borderBottom: '1px solid #eee', textAlign: 'center' }}>
                                <td style={tdStyle}>{trade.stockName}</td>
                                <td style={tdStyle}>{trade.quantity}주</td>
                                <td style={tdStyle}>{trade.averagePrice?.toLocaleString()}원</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="3" style={{ padding: '20px', color: '#888' }}>보유 중인 주식이 없습니다.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// 스타일 정의
const portfolioContainer = { padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '20px' };
const thStyle = { padding: '10px', borderBottom: '2px solid #eee' };
const tdStyle = { padding: '12px', fontSize: '15px' };

export default MyPortfolio;