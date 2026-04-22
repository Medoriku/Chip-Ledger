let startTime;
let timerInterval;
let totalBuyIn = 0;
let rebuyCount = 0;
let isPaused = false;
let pauseOffset = 0;
let lastPauseTime = 0;

const setupContainer = document.getElementById('setup-container');
const trackerContainer = document.getElementById('tracker-container');
const startForm = document.getElementById('start-session-form');

startForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const initialBuyIn = parseFloat(document.getElementById('live-buyin').value);
    const sb = document.getElementById('live-small-blind').value;
    const bb = document.getElementById('live-big-blind').value;

    totalBuyIn = initialBuyIn;
    startTime = Date.now();

    document.getElementById('display-buyin').textContent = `$${totalBuyIn.toFixed(2)}`;
    document.getElementById('display-stakes').textContent = `$${sb} / $${bb}`;
    
    setupContainer.style.display = 'none';
    trackerContainer.style.display = 'block';

    startTimer();
});

function startTimer() {
    timerInterval = setInterval(() => {
        if (!isPaused) {
            const now = Date.now();
            const diff = now - startTime - pauseOffset;
            
            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);

            document.getElementById('live-timer').textContent = 
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }, 1000);
}

document.getElementById('pause-btn').addEventListener('click', function() {
    isPaused = !isPaused;
    
    if (isPaused) {
        lastPauseTime = Date.now();
        this.textContent = "Resume Timer";
        this.classList.add('btn-warning');
    } else {
        pauseOffset += (Date.now() - lastPauseTime);
        this.textContent = "Pause Timer";
        this.classList.remove('btn-warning');
    }
});

document.getElementById('rebuy-btn').addEventListener('click', () => {
    const amount = parseFloat(prompt("Enter Rebuy Amount:", "0.00"));
    if (!isNaN(amount) && amount > 0) {
        totalBuyIn += amount;
        rebuyCount++;
        document.getElementById('display-buyin').textContent = `$${totalBuyIn.toFixed(2)}`;
        document.getElementById('display-rebuys').textContent = rebuyCount;
    }
});

document.getElementById('end-session-btn').addEventListener('click', () => {
    isPaused = true; 
    document.getElementById('cashout-overlay').style.display = 'block';
    document.getElementById('cashout-overlay').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('confirm-finish-btn').addEventListener('click', async () => {
    const cashOut = parseFloat(document.getElementById('final-cashout').value);
    const initialBuyIn = parseFloat(document.getElementById('live-buyin').value);
    
    if (isNaN(cashOut)) {
        alert("Please enter a valid cash out amount.");
        return;
    }

    const durationMs = Date.now() - startTime - pauseOffset;
    const rawHours = durationMs / 3600000;

    let roundedHours = Math.round(rawHours * 4) / 4;
    if (roundedHours < 0.25) {
        roundedHours = 0.25;
    }

    const sessionData = {
        date: new Date().toISOString().split('T')[0],
        hours: roundedHours,
        buyin: initialBuyIn,
        cashout: cashOut,
        rebuyNum: rebuyCount,
        rebuyAmt: totalBuyIn - initialBuyIn,
        location: document.getElementById('live-location').value || "Live Session",
        smallBlind: parseFloat(document.getElementById('live-small-blind').value),
        bigBlind: parseFloat(document.getElementById('live-big-blind').value)
    };

    try {
        const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData)
        });

        const body = await response.json();
        if (response.ok) {
            alert("Live session saved successfully!");
            window.location.href = '/sessions'; 
        } else {
            alert("Error saving session: " + (body.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Submission failed", error);
        alert("Could not connect to the server. Please check your connection.");
    }
});