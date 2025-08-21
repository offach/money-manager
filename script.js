document.addEventListener('DOMContentLoaded', () => {
    const appElement = document.getElementById('app');
    if (!appElement) return;

    // --- Централизованный доступ к UI элементам ---
    const ui = {
        salaryInput: document.getElementById('salary-input'),
        monthlyPaymentsInput: document.getElementById('monthly-payments-input'),
        dailyIncome: document.getElementById('daily-income'),
        avgSavings: document.getElementById('avg-savings'),
        projection: document.getElementById('projection'),
        accumulatedBalance: document.getElementById('accumulated-balance'),
        projectionDays: document.getElementById('projection-days-input'),
        customProjection: document.getElementById('custom-projection'),
        newEntryDate: document.getElementById('new-entry-date'),
        newEntryExpense: document.getElementById('new-entry-expense'),
        addEntryBtn: document.getElementById('add-entry-btn'),
        daysContainer: document.getElementById('days-container'),
        logoutBtn: document.getElementById('logout-btn'),
        chartCanvas: document.getElementById('dynamics-chart'),
    };

    let appData = { salary: 0, monthlyPayments: 0, entries: {} };
    let dynamicsChart = null;
    const AVG_DAYS_IN_MONTH = 30.42;

    // --- API Функции для работы с сервером ---
    async function loadData() { try { const response = await fetch('index.php?api=load'); appData = await response.json(); render(); } catch (error) { console.error('Ошибка загрузки данных:', error); ui.daysContainer.innerHTML = '<p style="text-align: center; color: var(--negative-color);">Не удалось загрузить данные.</p>'; } }
    async function saveData() { try { await fetch('index.php?api=save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(appData) }); await loadData(); } catch (error) { console.error('Ошибка сохранения данных:', error); } }

    // --- Основные функции рендеринга и расчетов ---
    function render() {
        updateSummary();
        renderDays();
        renderChart();
    }

    function updateSummary() {
        const salary = parseFloat(appData.salary) || 0;
        const monthlyPayments = parseFloat(appData.monthlyPayments) || 0;
        
        ui.salaryInput.value = salary;
        ui.monthlyPaymentsInput.value = monthlyPayments;

        const netMonthlyIncome = salary - monthlyPayments;
        const netDailyIncome = netMonthlyIncome / AVG_DAYS_IN_MONTH;
        ui.dailyIncome.textContent = `~ ${Math.round(netDailyIncome)} ₽`;

        const validEntries = Object.values(appData.entries).filter(v => v !== null);
        const daysCount = validEntries.length;
        const totalSaved = validEntries.reduce((sum, expense) => sum + (netDailyIncome - parseFloat(expense)), 0);
        
        ui.accumulatedBalance.textContent = `${Math.round(totalSaved)} ₽`;
        ui.accumulatedBalance.style.color = totalSaved >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';

        const avgDailySavings = daysCount > 0 ? totalSaved / daysCount : 0;
        ui.avgSavings.textContent = `${Math.round(avgDailySavings)} ₽`;
        ui.avgSavings.style.color = avgDailySavings >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';

        const monthlyProjection = avgDailySavings * AVG_DAYS_IN_MONTH;
        ui.projection.textContent = `${Math.round(monthlyProjection)} ₽`;
        ui.projection.style.color = monthlyProjection >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
        
        updateCustomProjection(avgDailySavings);
    }

    function renderDays() {
        ui.daysContainer.innerHTML = '';
        const salary = parseFloat(appData.salary) || 0;
        const monthlyPayments = parseFloat(appData.monthlyPayments) || 0;
        const netDailyIncome = (salary - monthlyPayments) / AVG_DAYS_IN_MONTH;
        const todayStr = new Date().toISOString().split('T')[0];

        if (!appData.entries.hasOwnProperty(todayStr)) { appData.entries[todayStr] = null; }

        const sortedDates = Object.keys(appData.entries).sort((a, b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateStr => {
            const expense = appData.entries[dateStr];
            const isToday = dateStr === todayStr;
            const saved = expense !== null ? netDailyIncome - parseFloat(expense) : null;

            const card = document.createElement('div');
            card.className = `card day-card ${isToday ? 'today' : ''}`;
            card.dataset.date = dateStr;
            
            card.innerHTML = `
                <div class="date">${formatDate(dateStr)}</div>
                
                <div class="value expense-value-desktop">${expense !== null ? `${expense} ₽` : 'Нет данных'}</div>
                <div class="value saved-value-desktop ${saved === null ? '' : (saved >= 0 ? 'saved-positive' : 'saved-negative')}">${saved !== null ? Math.round(saved) + ' ₽' : '—'}</div>
                
                <div class="data-container">
                    <span>Расход: <span class="expense-value-mobile">${expense !== null ? `${expense} ₽` : '...'}</span></span>
                    <span class="${saved === null ? '' : (saved >= 0 ? 'saved-positive' : 'saved-negative')}">Итог: <span class="saved-value-mobile">${saved !== null ? Math.round(saved) + ' ₽' : '...'}</span></span>
                </div>

                <div class="actions-cell">
                    <button class="edit-btn" title="Изменить">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="delete-btn" title="Удалить">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>`;
            ui.daysContainer.appendChild(card);
        });
    }

    function renderChart() {
        if (!ui.chartCanvas) return;
        const ctx = ui.chartCanvas.getContext('2d');
        if (dynamicsChart) { dynamicsChart.destroy(); }
        
        const salary = parseFloat(appData.salary) || 0;
        const monthlyPayments = parseFloat(appData.monthlyPayments) || 0;
        const netDailyIncome = (salary - monthlyPayments) / AVG_DAYS_IN_MONTH;
        
        const sortedEntries = Object.entries(appData.entries).filter(([, expense]) => expense !== null).sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));

        const labels = sortedEntries.map(([date]) => formatDate(date, { month: 'short', day: 'numeric' }));
        let cumulativeSavings = 0;
        const dataPoints = sortedEntries.map(([, expense]) => {
            cumulativeSavings += (netDailyIncome - parseFloat(expense));
            return cumulativeSavings;
        });

        dynamicsChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Накопленный баланс', data: dataPoints, borderColor: 'var(--primary-color)', backgroundColor: 'rgba(52, 152, 219, 0.1)', fill: true, tension: 0.1, pointBackgroundColor: 'var(--primary-color)', pointRadius: 4, pointHoverRadius: 6 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (context) => `Баланс: ${Math.round(context.raw)} ₽` } } }, scales: { y: { ticks: { callback: v => `${Math.round(v)} ₽` } }, x: { grid: { display: false } } } }
        });
    }

    function updateCustomProjection(avgDailySavings) { const days = parseInt(ui.projectionDays.value) || 0; const projection = avgDailySavings * days; ui.customProjection.textContent = `${Math.round(projection)} ₽`; ui.customProjection.style.color = projection >= 0 ? 'var(--positive-color)' : 'var(--negative-color)'; }
    function formatDate(dateStr, options = { year: 'numeric', month: 'long', day: 'numeric' }) { return new Date(dateStr).toLocaleDateString('ru-RU', options); }

    // --- Обработчики событий ---
    ui.salaryInput.addEventListener('change', () => { appData.salary = parseFloat(ui.salaryInput.value) || 0; saveData(); });
    ui.monthlyPaymentsInput.addEventListener('change', () => { appData.monthlyPayments = parseFloat(ui.monthlyPaymentsInput.value) || 0; saveData(); });
    ui.projectionDays.addEventListener('input', updateSummary);
    ui.addEntryBtn.addEventListener('click', () => { const date = ui.newEntryDate.value; const expense = parseFloat(ui.newEntryExpense.value); if (!date || isNaN(expense) || expense < 0) { alert('Пожалуйста, введите корректную дату и сумму расхода.'); return; } if (appData.entries[date] !== null && typeof appData.entries[date] !== 'undefined') { if (!confirm(`Запись для ${formatDate(date)} уже существует. Перезаписать?`)) return; } appData.entries[date] = expense; ui.newEntryDate.value = ''; ui.newEntryExpense.value = ''; saveData(); });
    ui.daysContainer.addEventListener('click', (e) => { const button = e.target.closest('button'); if (!button) return; const card = button.closest('.day-card'); const date = card.dataset.date; if (button.classList.contains('delete-btn')) { if (confirm(`Удалить запись за ${formatDate(date)}?`)) { delete appData.entries[date]; saveData(); } } else if (button.classList.contains('edit-btn')) { const currentExpense = appData.entries[date] || 0; const newExpenseStr = prompt(`Введите новый расход для ${formatDate(date)}:`, currentExpense); const newExpense = parseFloat(newExpenseStr); if (newExpenseStr !== null && !isNaN(newExpense) && newExpense >= 0) { appData.entries[date] = newExpense; saveData(); } } });
    ui.logoutBtn.addEventListener('click', () => { window.location.href = 'index.php?logout=true'; });

    // --- Первоначальный запуск ---
    loadData();
});