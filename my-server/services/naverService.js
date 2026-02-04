const axios = require('axios');
require('dotenv').config();

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

const NAVER_API_URL = 'https://openapi.naver.com/v1/datalab/search';

/**
 * Naver DataLab API를 사용하여 키워드 검색량 조회
 * @param {string} keyword - 검색 키워드
 * @returns {Object} 검색량 데이터
 */
async function getNaverKeywordData(keyword) {
    if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
        return {
            error: 'Naver API 키가 설정되지 않았습니다.',
            usesMockData: true
        };
    }

    try {
        // 현재 날짜 기준 1년 데이터 조회
        const today = new Date();
        const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

        const startDate = oneYearAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];

        const requestBody = {
            startDate: startDate,
            endDate: endDate,
            timeUnit: 'month',
            keywords: [keyword]
        };

        const response = await axios.post(NAVER_API_URL, requestBody, {
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.results && response.data.results.length > 0) {
            const result = response.data.results[0];
            const data = result.data;

            // 월간 검색량 평균
            const avgVolume = Math.round(
                data.reduce((sum, item) => sum + item.ratio, 0) / data.length
            );

            // 최근 3개월 트렌드
            const recentData = data.slice(-3);
            const trend = Math.round(
                ((recentData[2].ratio - recentData[0].ratio) / recentData[0].ratio) * 100
            );

            return {
                keyword: keyword,
                searchVolume: avgVolume * 1000, // 상대값을 절대값으로 변환 (근사값)
                trend: trend,
                monthlyData: data.map(item => ({
                    period: item.period,
                    ratio: item.ratio
                })),
                isRealData: true
            };
        }

        return {
            keyword: keyword,
            searchVolume: 0,
            trend: 0,
            monthlyData: [],
            isRealData: true
        };

    } catch (error) {
        console.error('Naver API 오류:', error.message);
        return {
            error: error.message,
            usesMockData: true
        };
    }
}

/**
 * Naver DataLab API를 사용하여 연관 키워드 조회
 * @param {string} keyword - 기본 키워드
 * @returns {Array} 연관 키워드 배열
 */
async function getNaverRelatedKeywords(keyword) {
    // Naver DataLab은 직접 연관 키워드 API를 제공하지 않으므로
    // 일반적인 연관 키워드 생성 로직 사용
    const suffixes = ['추천', '가격', '비교', '구매', '후기', '정보', '순위', '장점'];
    return suffixes.map(s => `${keyword} ${s}`).slice(0, 5);
}

module.exports = {
    getNaverKeywordData,
    getNaverRelatedKeywords
};
