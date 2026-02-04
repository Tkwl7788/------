// 메뉴 토글
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const closeBtn = document.getElementById('close-btn');
const overlay = document.getElementById('overlay');

menuBtn?.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

closeBtn?.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

overlay?.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// 메뉴 링크 클릭 시 메뉴 닫기
document.querySelectorAll('.menu-list a').forEach(link => {
    link.addEventListener('click', () => {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    });
});

// 모바일 반응형
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
});

function processColumns(data) {
    columnsData = {};
    const maxCols = Math.max(...data.map(row => row.length));
    for (let col = 0; col < maxCols; col++) {
        columnsData[col + 1] = [];
        for (let row = 1; row < data.length; row++) {
            const val = data[row][col];
            if (val !== undefined && val !== null && String(val).trim() !== '') columnsData[col + 1].push(val);
        }
    }
}

document.getElementById('random-btn').addEventListener('click', function () {
    const targetCount = parseInt(document.getElementById('gen-count').value) || 1;
    const formulas = document.getElementById('col-order').value.split(',').map(s => s.trim()).filter(s => s);
    if (!formulas.length) return alert("조합식을 입력하세요.");

    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = '';
    generatedResults = [];
    const uniqueSet = new Set();

    // 각 조합식별로 루프를 돌려 정확한 개수 보장
    formulas.forEach(formula => {
        let formulaCreatedCount = 0;
        let attempts = 0;
        const maxAttempts = targetCount * 50;

        while (formulaCreatedCount < targetCount && attempts < maxAttempts) {
            attempts++;
            const cols = formula.replace(/[^0-9]/g, '').split('').map(Number);
            let sentence = cols.map(c => {
                const items = columnsData[c] || [];
                return items[Math.floor(Math.random() * items.length)] || '';
            }).join('').trim();

            // 문장이 존재하고, 전체 세트에서 고유한 경우만 추가
            if (sentence && !uniqueSet.has(sentence)) {
                uniqueSet.add(sentence);
                generatedResults.push({ formula: formula, text: sentence });
                formulaCreatedCount++;

                // 화면 미리보기 (최대 100개까지만 표시)
                if (generatedResults.length <= 100) {
                    const row = document.createElement('div');
                    row.className = 'result-row';
                    row.innerHTML = `<span class="res-formula">${formula}</span><span>${sentence}</span>`;
                    resultContainer.appendChild(row);
                }
            }
        }
    });
    document.getElementById('save-section').style.display = 'block';
});

// 방식 1: A열 일렬 저장
document.getElementById('save-all-btn').addEventListener('click', function () {
    const sName = document.getElementById('sheet-name').value.trim() || "일렬결과";
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, XLSX.utils.aoa_to_sheet(firstSheetData), "원본데이터");

    const aoaData = [[`전체 조합식: ${document.getElementById('col-order').value}`]];
    generatedResults.forEach(item => aoaData.push([item.text]));

    XLSX.utils.book_append_sheet(newWb, XLSX.utils.aoa_to_sheet(aoaData), sName);
    XLSX.writeFile(newWb, "all_results.xlsx");
});

// 방식 2: 조합별 열 구분 저장 (정확한 열 배치 로직)
document.getElementById('save-split-btn').addEventListener('click', function () {
    const sName = document.getElementById('sheet-name').value.trim() || "열구분결과";
    const formulas = document.getElementById('col-order').value.split(',').map(s => s.trim()).filter(s => s);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, XLSX.utils.aoa_to_sheet(firstSheetData), "원본데이터");

    // 행-열 데이터 구성 (1행은 제목, 2행부터 데이터)
    const targetCount = parseInt(document.getElementById('gen-count').value) || 1;
    const finalTable = Array.from({ length: targetCount + 1 }, () => Array(formulas.length).fill(""));

    formulas.forEach((f, colIdx) => {
        finalTable[0][colIdx] = f; // 헤더 입력
        const filtered = generatedResults.filter(r => r.formula === f);
        filtered.forEach((r, rowIdx) => {
            if (rowIdx < targetCount) finalTable[rowIdx + 1][colIdx] = r.text;
        });
    });

    XLSX.utils.book_append_sheet(newWb, XLSX.utils.aoa_to_sheet(finalTable), sName);
    XLSX.writeFile(newWb, "column_split_results.xlsx");
});

function displayTable(data) {
    const head = document.getElementById('table-header');
    const body = document.getElementById('table-body');
    head.innerHTML = ''; body.innerHTML = '';
    const maxCols = Math.max(...data.map(row => row.length));
    const firstRow = data[0] || [];
    let trHead = document.createElement('tr');
    for (let i = 1; i <= maxCols; i++) {
        const th = document.createElement('th');
        th.innerHTML = `<span class="col-idx">${i}열</span>${firstRow[i - 1] || ""}`;
        trHead.appendChild(th);
    }
    head.appendChild(trHead);
    data.slice(1, 6).forEach(row => {
        const tr = document.createElement('tr');
        for (let i = 0; i < maxCols; i++) {
            const td = document.createElement('td');
            td.textContent = row[i] || '';
            tr.appendChild(td);
        }
        body.appendChild(tr);
    });
}
