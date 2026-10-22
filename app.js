const STORAGE_KEY = 'sprintPlanSettings';
const DEFAULTS = { weeks: 2, hoursPerDay: 8 };
const WORK_DAYS_PER_WEEK = 5;

const weeksInput = document.getElementById('weeks');
const hoursInput = document.getElementById('hoursPerDay');
const summary = document.getElementById('summary');
const results = document.getElementById('results');

function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) return { ...DEFAULTS, ...saved };
    } catch (e) { /* storage unavailable or corrupt */ }
    return { ...DEFAULTS };
}

function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) { /* storage unavailable */ }
}

function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, '');
}

function plural(n, word) {
    return `${fmt(n)} ${word}${n === 1 ? '' : 's'}`;
}

// Fibonacci sequence up to 21, extended until one value's whole range exceeds the sprint
function fibonacciPoints(hoursPerPoint, sprintHours) {
    const points = [1, 2];
    const minHours = () => hoursRange(points, points.length - 1, hoursPerPoint).min;
    while (points[points.length - 1] < 21 || minHours() <= sprintHours) {
        points.push(points[points.length - 1] + points[points.length - 2]);
    }
    return points;
}

// Range runs halfway to the neighbouring Fibonacci values on each side
function hoursRange(points, i, hoursPerPoint) {
    const prev = i > 0 ? points[i - 1] : 0;
    const next = i < points.length - 1 ? points[i + 1] : points[i] + prev;
    return {
        min: (prev + points[i]) / 2 * hoursPerPoint,
        max: (points[i] + next) / 2 * hoursPerPoint,
    };
}

function describe(points, hours, days, sprintHours, range) {
    const fraction = hours / sprintHours;
    if (range.min > sprintHours) return { text: 'Bigger than your whole sprint, must split', cls: 'danger', icon: 'fa-scissors' };
    if (range.max > sprintHours) return { text: 'May not fit in your sprint, consider splitting', cls: 'warning', icon: 'fa-triangle-exclamation' };
    if (fraction > 0.5) return { text: 'Very large, consider splitting', cls: 'warning', icon: 'fa-triangle-exclamation' };
    if (fraction >= 0.35) return { text: `Large (~${plural(days, 'day')})`, cls: 'info', icon: 'fa-weight-hanging' };
    if (fraction >= 0.2) return { text: `Medium (~${plural(days, 'day')})`, cls: 'primary', icon: 'fa-cube' };
    if (points === 1) return { text: 'Tiny', cls: 'success', icon: 'fa-feather' };
    return { text: `~${plural(days, 'day')}`, cls: 'success', icon: 'fa-check' };
}

function calculate() {
    const weeks = parseFloat(weeksInput.value);
    const hoursPerDay = parseFloat(hoursInput.value);
    const valid = weeks > 0 && hoursPerDay > 0 && hoursPerDay <= 24;

    weeksInput.classList.toggle('is-invalid', !(weeks > 0));
    hoursInput.classList.toggle('is-invalid', !(hoursPerDay > 0 && hoursPerDay <= 24));

    if (!valid) {
        summary.innerHTML = '<i class="fa-solid fa-circle-exclamation me-1"></i>Enter a positive number of weeks and 0–24 hours per day.';
        results.innerHTML = '';
        return;
    }

    saveSettings({ weeks, hoursPerDay });

    const sprintDays = weeks * WORK_DAYS_PER_WEEK;
    const sprintHours = sprintDays * hoursPerDay;
    const hoursPerPoint = hoursPerDay / 2;

    summary.innerHTML =
        `<i class="fa-solid fa-calculator me-1"></i>` +
        `<strong>${plural(sprintDays, 'day')}</strong> × ${fmt(hoursPerDay)} h = ` +
        `<strong>${fmt(sprintHours)} hour</strong> sprint &middot; 1 point ≈ ${fmt(hoursPerPoint)} h`;

    const allPoints = fibonacciPoints(hoursPerPoint, sprintHours);
    results.innerHTML = allPoints.map((points, i) => {
        const hours = points * hoursPerPoint;
        const range = hoursRange(allPoints, i, hoursPerPoint);
        const d = describe(points, hours, hours / hoursPerDay, sprintHours, range);
        return `<tr>
            <td><span class="badge text-bg-${d.cls} points-badge">${points}</span></td>
            <td>${fmt(range.min)}–${fmt(range.max)}</td>
            <td><i class="fa-solid ${d.icon} text-${d.cls} me-2"></i>${d.text}</td>
        </tr>`;
    }).join('');
}

const settings = loadSettings();
weeksInput.value = settings.weeks;
hoursInput.value = settings.hoursPerDay;

weeksInput.addEventListener('input', calculate);
hoursInput.addEventListener('input', calculate);
calculate();
