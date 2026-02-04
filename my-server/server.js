const express = require('express');
const path = require('path');
const app = express();
require('dotenv').config();

const { getNaverKeywordData, getNaverRelatedKeywords } = require('./services/naverService');

app.use(express.static('public'));
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// 키워드 분석 API
app.post('/api/analyze-keyword', async (req, res) => {
    try {
        const { keyword, platform } = req.body;

        if (!keyword) {
            return res.status(400).json({ error: '키워드를 입력하세요.' });
        }

        let analysisData;

        if (platform === 'naver') {
            // Naver DataLab API 사용
            const naverData = await getNaverKeywordData(keyword);
            
            if (naverData.error) {
                console.warn('Naver API 오류, Mock 데이터 사용:', naverData.error);
                analysisData = generateMockData(keyword);
            } else {
                const relatedKeywords = await getNaverRelatedKeywords(keyword);
                analysisData = {
                    keyword: keyword,
                    platform: 'naver',
                    searchVolume: naverData.searchVolume,
                    competition: calculateCompetition(naverData.searchVolume),
                    recommendation: calculateRecommendation(naverData.searchVolume),
                    trend: naverData.trend,
                    relatedKeywords: relatedKeywords,
                    topResults: generateTopResults(keyword),
                    monthlyData: naverData.monthlyData,
                    isRealData: naverData.isRealData || false
                };
            }
        } else if (platform === 'google') {
            // Google API (아직 구현 안 함)
            analysisData = {
                ...generateMockData(keyword),
                platform: 'google',
                note: 'Google API 통합 대기 중'
            };
        } else {
            analysisData = generateMockData(keyword);
        }

        res.json(analysisData);
    } catch (error) {
        console.error('분석 중 오류:', error);
        res.status(500).json({ error: '분석 실패' });
    }
});

// 대량 분석 API
app.post('/api/bulk-analyze', async (req, res) => {
    try {
        const { keywords, platform } = req.body;

        if (!keywords || !Array.isArray(keywords)) {
            return res.status(400).json({ error: '유효한 키워드 배열이 필요합니다.' });
        }

        const results = [];

        for (const keyword of keywords) {
            if (keyword.trim()) {
                try {
                    const data = await getNaverKeywordData(keyword);
                    results.push({
                        keyword: keyword,
                        searchVolume: data.searchVolume || 0,
                        competition: calculateCompetition(data.searchVolume || 0),
                        recommendation: calculateRecommendation(data.searchVolume || 0),
                        trend: data.trend || 0
                    });
                } catch (err) {
                    console.error(`키워드 분석 실패: ${keyword}`, err);
                    results.push({
                        keyword: keyword,
                        error: '분석 실패'
                    });
                }
            }
        }

        res.json({ results });
    } catch (error) {
        console.error('대량 분석 중 오류:', error);
        res.status(500).json({ error: '대량 분석 실패' });
    }
});

// Mock 데이터 생성
function generateMockData(keyword) {
    return {
        keyword: keyword,
        searchVolume: Math.floor(Math.random() * 100000) + 1000,
        competition: Math.floor(Math.random() * 100),
        recommendation: Math.floor(Math.random() * 10),
        trend: Math.floor(Math.random() * 50) - 25,
        relatedKeywords: generateRelatedKeywords(keyword),
        topResults: generateTopResults(keyword),
        isMockData: true
    };
}

// 경쟁도 계산
function calculateCompetition(searchVolume) {
    // 검색량을 기반으로 경쟁도 계산
    if (searchVolume < 1000) return 10;
    if (searchVolume < 5000) return 20;
    if (searchVolume < 10000) return 40;
    if (searchVolume < 50000) return 60;
    if (searchVolume < 100000) return 75;
    return 90;
}

// 추천도 계산
function calculateRecommendation(searchVolume) {
    // 검색량을 기반으로 추천도 계산
    const score = Math.min(10, Math.max(1, Math.floor(searchVolume / 10000)));
    return score;
}

// 관련 키워드 생성
function generateRelatedKeywords(keyword) {
    const suffixes = ['추천', '가격', '비교', '구매', '후기', '정보', '순위', '장점'];
    return suffixes.map(s => `${keyword} ${s}`).slice(0, 5);
}

// 상위 검색 결과 생성
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
    console.log(`✅ Naver API 상태: ${process.env.NAVER_CLIENT_ID ? '설정됨' : '미설정 (Mock 데이터 사용)'}`);
});


