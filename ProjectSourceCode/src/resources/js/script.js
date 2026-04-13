let sessions = [];

document.addEventListener('DOMContentLoaded', () => {
	// Reserved for future page-specific behavior.
});

document.getElementById("session_form").addEventListener("submit", function (event) {
    const form = this;

    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation(); 
    } else {
        event.preventDefault();  
        saveEvent();
    }
});

function saveEvent() {
                const sessionDetails = {
                date: document.getElementById("session_date").value, 
                hours: parseFloat(document.getElementById("session_hours").value) || 0,
                buyin: parseFloat(document.getElementById("session_buyin").value) || 0,
                cashout: parseFloat(document.getElementById("session_cashout").value) || 0,
                rebuyNum: parseInt(document.getElementById("session_rebuyNum").value) || 0,
                rebuyAmt: parseFloat(document.getElementById("session_rebuyAmt").value) || 0,
                location: document.getElementById("session_location").value, 
                smallBlind: parseFloat(document.getElementById("session_smallBlind").value) || 0,
                bigBlind: parseFloat(document.getElementById("session_bigBlind").value) || 0
                };
            sessions.push(sessionDetails);
            // (TO DO) call to add session to list function
            document.getElementById("session_form").reset();
            const myModalElement = document.getElementById('session_modal');
            const myModal = bootstrap.Modal.getOrCreateInstance(myModalElement);
            myModal.hide();
}