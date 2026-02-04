const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 키워드 분석 API
app.post('/api/analyze-keyword', async (req, res) => {
    try {
        const { keyword, platform } = req.body;

        // 임시 데이터 (실제 API 통합 필요)
        const mockData = {
            keyword: keyword,
            searchVolume: Math.floor(Math.random() * 100000),
            competition: Math.floor(Math.random() * 100),
            recommendation: Math.floor(Math.random() * 10),
            trend: Math.floor(Math.random() * 50) - 25,
            relatedKeywords: generateRelatedKeywords(keyword),
            topResults: generateTopResults(keyword)
        };

        res.json(mockData);
    } catch (error) {
        console.error('분석 중 오류:', error);
        res.status(500).json({ error: '분석 실패' });
    }
});

// 관련 키워드 생성 함수
function generateRelatedKeywords(keyword) {
    const suffixes = ['추천', '가격', '비교', '구매', '후기', '정보', '순위', '장점'];
    return suffixes.map(s => `${keyword} ${s}`).slice(0, 5);
}

// 상위 검색 결과 생성 함수
function generateTopResults(keyword) {
    return [
        {
            rank: 1,
            title: `${keyword} 관련 정보 | 공식 사이트`,
            description: `${keyword}에 대한 정보를 제공합니다.`,
            url: 'https://example.com/1'
        },
        {
            rank: 2,
            title: `${keyword} 최신 소식`,
            description: `${keyword} 최신 뉴스와 업데이트를 확인하세요.`,
            url: 'https://example.com/2'
        },
        {
            rank: 3,
            title: `${keyword} 가이드 및 팁`,
            description: `${keyword}을 효과적으로 사용하는 방법`,
            url: 'https://example.com/3'
        }
    ];
}

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    console.log(`📡 외부 접속: http://<당신의IP주소>:${PORT}`);
});

