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
        data.searchVolume ? `${data.searchVolume.toLocaleString()}` : '-';
    document.getElementById('competition').textContent =
        `${data.competition || 0}%`;
    document.getElementById('recommendation').textContent =
        `${data.recommendation || 0}/10`;
    document.getElementById('trend').textContent =
        data.trend ? `↑ ${data.trend}%` : '-';

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

// 대량 분석
document.getElementById('bulk-btn').addEventListener('click', async () => {
    const file = document.getElementById('bulk-excel').files[0];
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
            <td>${r.searchVolume.toLocaleString()}</td>
            <td>${r.competition}%</td>
            <td>${r.recommendation}/10</td>
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
