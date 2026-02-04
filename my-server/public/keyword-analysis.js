// 현재 플랫폼 상태
let currentPlatform = 'naver';
let analysisResults = {};

// 플랫폼 탭 변경
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentPlatform = btn.dataset.platform;
    });
});

// 검색 버튼
document.getElementById('search-btn').addEventListener('click', async () => {
    const keyword = document.getElementById('keyword-input').value.trim();
    if (!keyword) {
        alert('키워드를 입력하세요.');
        return;
    }

    await analyzeKeyword(keyword);
});

// 엔터키로 검색
document.getElementById('keyword-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('search-btn').click();
    }
});

// 키워드 분석 함수
async function analyzeKeyword(keyword) {
    const btn = document.getElementById('search-btn');
    const originalText = btn.textContent;
    btn.textContent = '분석 중...';
    btn.disabled = true;

    try {
        // API 호출 (백엔드 엔드포인트)
        const response = await fetch('/api/analyze-keyword', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                keyword: keyword,
                platform: currentPlatform
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        analysisResults[keyword] = data;

        // 결과 표시
        displayResults(keyword, data);

    } catch (error) {
        console.error('분석 실패:', error);
        alert('분석에 실패했습니다. 나중에 다시 시도해주세요.');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// 결과 표시
function displayResults(keyword, data) {
    // 기본 정보 업데이트
    document.getElementById('result-keyword').textContent = keyword;
    document.getElementById('search-volume').textContent =
        data.searchVolume ? `${Math.round(data.searchVolume).toLocaleString()}` : '-';
    document.getElementById('competition').textContent = 
        `${Math.round(data.competition || 0)}%`;
    document.getElementById('recommendation').textContent = 
        `${Math.round(data.recommendation || 0)}/10`;
    document.getElementById('trend').textContent = 
        data.trend ? `${data.trend > 0 ? '↑' : '↓'} ${Math.abs(data.trend)}%` : '-';

    // 실제 데이터 표시 여부
    if (data.isMockData || data.usesMockData) {
        const warningMsg = document.createElement('div');
        warningMsg.style.cssText = 'background: #fff3cd; color: #856404; padding: 10px; border-radius: 4px; margin-bottom: 10px;';
        warningMsg.textContent = '⚠️ 모의 데이터를 표시하고 있습니다. Naver API 키를 설정하면 실제 데이터를 볼 수 있습니다.';
        document.getElementById('results-container').insertBefore(warningMsg, document.getElementById('results-container').firstChild);
    }

    // 월간 데이터 차트 (있으면)
    if (data.monthlyData && data.monthlyData.length > 0) {
        displayMonthlyChart(data.monthlyData);
    }

    // 연관 키워드 표시
    if (data.relatedKeywords && data.relatedKeywords.length) {
        const container = document.getElementById('related-keywords-container');
        container.innerHTML = data.relatedKeywords.map(kw => 
            `<div class="keyword-tag" onclick="document.getElementById('keyword-input').value='${kw}'; document.getElementById('search-btn').click();">${kw}</div>`
        ).join('');
    }

    // 상위 검색 결과 표시
    if (data.topResults && data.topResults.length) {
        const container = document.getElementById('top-results-container');
        container.innerHTML = data.topResults.map((result, idx) => `
            <div class="result-item">
                <div class="result-rank">${idx + 1}</div>
                <div class="result-content">
                    <a href="${result.url}" target="_blank" class="result-title">${result.title}</a>
                    <div class="result-desc">${result.description}</div>
                    <div class="result-url">${new URL(result.url).hostname}</div>
                </div>
            </div>
        `).join('');
    }

    // 결과 컨테이너 표시
    document.getElementById('results-container').style.display = 'block';
    document.getElementById('save-section').style.display = 'block';
}

// 월간 데이터 차트 표시
function displayMonthlyChart(monthlyData) {
    const chartContainer = document.getElementById('chart-container');
    if (!monthlyData || monthlyData.length === 0) return;

    const maxRatio = Math.max(...monthlyData.map(d => d.ratio));
    const chartHTML = monthlyData.map(item => {
        const height = (item.ratio / maxRatio) * 200;
        const date = new Date(item.period);
        const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return `
            <div style="display: inline-block; width: 30px; margin: 5px; text-align: center;">
                <div style="background: #007bff; height: ${height}px; border-radius: 4px; margin-bottom: 5px;"></div>
                <small style="font-size: 10px;">${label}</small>
            </div>
        `;
    }).join('');

    chartContainer.innerHTML = `
        <div style="display: flex; align-items: flex-end; justify-content: center; height: 250px;">
            ${chartHTML}
        </div>
    `;
    if (!file) {
        alert('Excel 파일을 선택하세요.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const keywords = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const results = [];
            for (let row of keywords.slice(1)) {
                if (row[0]) {
                    const keyword = row[0];
                    try {
                        const response = await fetch('/api/analyze-keyword', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ keyword, platform: currentPlatform })
                        });

                        if (response.ok) {
                            const data = await response.json();
                            results.push({
                                keyword,
                                searchVolume: data.searchVolume || 0,
                                competition: data.competition || 0,
                                recommendation: data.recommendation || 0
                            });
                        }
                    } catch (err) {
                        console.error(`분석 실패: ${keyword}`, err);
                    }
                }
            }

            displayBulkResults(results);
        } catch (err) {
            alert('파일 처리 중 오류가 발생했습니다.');
            console.error(err);
        }
    };
    reader.readAsArrayBuffer(file);
});

// 대량 분석 결과 표시
function displayBulkResults(results) {
    const tbody = document.getElementById('bulk-tbody');
    tbody.innerHTML = results.map(r => `
        <tr>
            <td>${r.keyword}</td>
            <td>${Math.round(r.searchVolume || 0).toLocaleString()}</td>
            <td>${Math.round(r.competition || 0)}%</td>
            <td>${Math.round(r.recommendation || 0)}/10</td>
        </tr>
    `).join('');

    document.getElementById('bulk-results').style.display = 'block';
}

// Excel로 내보내기
document.getElementById('export-btn').addEventListener('click', () => {
    const keyword = document.getElementById('result-keyword').textContent;
    const data = analysisResults[keyword];

    if (!data) {
        alert('분석 결과가 없습니다.');
        return;
    }

    const exportData = [
        ['키워드 분석 결과'],
        [''],
        ['키워드', keyword],
        ['플랫폼', currentPlatform.toUpperCase()],
        ['월간 검색량', data.searchVolume || '-'],
        ['경쟁도', `${data.competition || 0}%`],
        ['추천도', `${data.recommendation || 0}/10`],
        ['트렌드', data.trend || '-'],
        [''],
        ['연관 키워드'],
        ...data.relatedKeywords?.map(kw => [kw]) || []
    ];

    const ws = XLSX.utils.aoa_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '분석결과');
    XLSX.writeFile(wb, `${keyword}_분석결과.xlsx`);
});

// 인쇄
document.getElementById('print-btn').addEventListener('click', () => {
    window.print();
});
