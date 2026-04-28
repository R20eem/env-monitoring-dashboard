/**
 * File: dash.js
 *
 * Purpose:
 * Handles the main landing page dashboard which displays
 * researcher data to all visitors (farmers and guests).
 *
 * Responsibilities:
 * - Check user authentication and role
 * - Display appropriate dashboard view based on user role
 * - Load and display sensor data from API
 * - Handle logout functionality
 *
 * Layer:
 * Frontend
 *
 * Related:
 * - index.html
 * - researcher.html
 * - style.css
 */

// Change this to your computer's Wi-Fi IP (e.g., 'http://192.168.0.22:8000') if testing on your phone!
const API_BASE = 'http://127.0.0.1:8000';


document.addEventListener('DOMContentLoaded', () => {
    
    // 1. SECURITY CHECK: Are they logged in?
    const role = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    // If they have no token, kick them out to the login page immediately!
    // if (!role || !token) {
    //     window.location.href = 'login.html';
    //     return; // Stop the rest of the script from running
    // }

    // 2. PERSONALIZE THE HEADER
    const welcomeText = role === 'researcher' ? 'Welcome, Researcher' : 'Welcome, Farmer';
    document.getElementById('welcome-message').innerText = welcomeText;

    // 3. THE MAGIC SWITCH: Show the correct layout based on role
    if (role === 'researcher') {
        document.getElementById('researcher-view').style.display = 'block';
        loadResearcherData();
    } else {
        // guests AND farmers both see the researcher dashboard publicly
        document.getElementById('researcher-view').style.display = 'block';
        loadResearcherData();
    }

    // 4. LOGOUT BUTTON
    document.getElementById('logout-btn').addEventListener('click', (e) => {
        e.preventDefault(); // Prevents the link from jumping to the top of the page
        localStorage.clear(); // Wipes their token and role from the browser
        window.location.href = 'login.html'; // Sends them to login
    });
});

// ==========================================
// RESEARCHER FUNCTIONS
// ==========================================
async function loadResearcherData() {
    const tableBody = document.getElementById('live-sensor-table');
    const sensorCountText = document.getElementById('sensor-count');
    
    try {
        // Fetch live sensor readings from your Python API
        const response = await fetch(`${API_BASE}/sensors/recent`); 
        
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const readings = await response.json();
        
        // Clear the "Loading..." text
        tableBody.innerHTML = ''; 
        
        // Update the top stat card
        sensorCountText.innerText = readings.length;

        // Loop through the data and build the table rows
        readings.forEach(reading => {
            // Determine badge color
            let badgeClass = 'normal';
            if (reading.status === 'Warning') badgeClass = 'warning';
            if (reading.status === 'Critical') badgeClass = 'critical'; 

            const row = `
                <tr>
                    <td>${reading.time}</td>
                    <td>${reading.location}</td>
                    <td>${reading.sensor_id}</td>
                    <td>${reading.value}</td>
                    <td><span class="badge ${badgeClass}">${reading.status}</span></td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error('Sensor fetch error:', error);
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#dc2626; padding: 20px;">⚠️ Could not connect to Python backend. Is Uvicorn running?</td></tr>';
        sensorCountText.innerText = '0';
    }
}

// Add this to the very bottom of your dashboard.js file
function renderChart() {
    const ctx = document.getElementById('nitrogenMoistureChart');
    
    // If the chart canvas doesn't exist on this page, don't try to draw it
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Moisture Level (%)',
                    data: [45, 42, 48, 55, 50, 48, 52],
                    borderColor: '#117a3d', // Eco Leaf Green
                    backgroundColor: 'rgba(17, 122, 61, 0.1)',
                    borderWidth: 2,
                    tension: 0.4, // Makes the line curvy and smooth
                    fill: true
                },
                {
                    label: 'Nitrogen (ppm)',
                    data: [30, 29, 31, 35, 34, 32, 33],
                    borderColor: '#d68910', // Warning Orange
                    borderWidth: 2,
                    borderDash: [5, 5], // Makes it a dashed line
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: false }
            }
        }
    });
}