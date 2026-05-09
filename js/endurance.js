/**
 * Endurance Manager Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let state = {
        config: {
            durationHours: 24,
            tankSizeLiters: 110,
            fuelConsumptionPerLap: 3.2,
            baseLapTimeSeconds: 120
        },
        roster: [
            { id: 1, name: 'Driver A', irating: 3000, gmtOffset: 0, color: '#ff3366' },
            { id: 2, name: 'Driver B', irating: 2800, gmtOffset: 1, color: '#33ccff' },
            { id: 3, name: 'Driver C', irating: 3100, gmtOffset: -5, color: '#33ff99' }
        ],
        availability: {}, // { driverId: { timeSlot: 'open|tentative|blocked' } }
        stints: [] // { id, startTime, laps, driverId, endTime }
    };

    // Load from local storage if available
    const savedState = localStorage.getItem('endurance_manager_state');
    if (savedState) {
        try {
            state = JSON.parse(savedState);
        } catch (e) {
            console.error("Failed to parse saved state", e);
        }
    }

    const saveState = () => {
        localStorage.setItem('endurance_manager_state', JSON.stringify(state));
    };

    // --- Navigation Logic ---
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active from all
            navLinks.forEach(l => l.classList.remove('active'));
            views.forEach(v => v.classList.remove('active'));

            // Add active to clicked
            link.classList.add('active');
            const targetId = link.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');

            // Trigger re-renders if necessary based on view
            if(targetId === 'strategy-view') renderSchedule();
            if(targetId === 'availability-view') renderAvailabilityGrid();
            if(targetId === 'roster-view') renderRoster();
            if(targetId === 'dashboard-view') renderDashboard();
        });
    });

    // --- Config Logic ---
    const configInputs = {
        duration: document.getElementById('race-duration'),
        tank: document.getElementById('tank-size'),
        fuel: document.getElementById('fuel-consumption'),
        lap: document.getElementById('base-lap-time')
    };

    const loadConfigUI = () => {
        configInputs.duration.value = state.config.durationHours;
        configInputs.tank.value = state.config.tankSizeLiters;
        configInputs.fuel.value = state.config.fuelConsumptionPerLap;
        configInputs.lap.value = state.config.baseLapTimeSeconds;
    };

    document.getElementById('save-config').addEventListener('click', () => {
        state.config.durationHours = parseFloat(configInputs.duration.value);
        state.config.tankSizeLiters = parseFloat(configInputs.tank.value);
        state.config.fuelConsumptionPerLap = parseFloat(configInputs.fuel.value);
        state.config.baseLapTimeSeconds = parseFloat(configInputs.lap.value);
        saveState();
        calculateStints();
        alert('Configuration saved. Stints recalculated.');
    });

    // --- Roster Logic ---
    const renderRoster = () => {
        const tbody = document.querySelector('#roster-table tbody');
        tbody.innerHTML = '';

        state.roster.forEach(driver => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${driver.name}</td>
                <td>${driver.irating}</td>
                <td>GMT ${driver.gmtOffset > 0 ? '+' : ''}${driver.gmtOffset}</td>
                <td>
                    <span class="driver-color-dot" style="background-color: ${driver.color}"></span>
                    ${driver.color}
                </td>
                <td>
                    <button class="btn secondary-btn" onclick="removeDriver(${driver.id})" style="padding: 6px 12px; font-size: 12px; color: #ff3366;"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    };

    window.removeDriver = (id) => {
        state.roster = state.roster.filter(d => d.id !== id);
        saveState();
        renderRoster();
    };

    document.getElementById('add-driver-btn').addEventListener('click', () => {
        const name = prompt("Driver Name:");
        if (!name) return;
        const irating = prompt("iRating:", "2000");
        const offset = prompt("GMT Offset (e.g. -5, 0, 1):", "0");
        const color = prompt("Hex Color (e.g. #ffffff):", "#ffffff");

        state.roster.push({
            id: Date.now(),
            name,
            irating: parseInt(irating) || 2000,
            gmtOffset: parseInt(offset) || 0,
            color: color || '#ffffff'
        });
        saveState();
        renderRoster();
    });

    // --- Availability Logic ---
    const renderAvailabilityGrid = () => {
        const grid = document.getElementById('availability-grid');
        grid.innerHTML = '';
        
        // Setup Grid Columns: 1 Time Col + N Driver Cols
        grid.style.gridTemplateColumns = `120px repeat(${state.roster.length}, 1fr)`;

        // Header Row
        grid.appendChild(createGridCell('Time (GMT)', 'grid-header'));
        state.roster.forEach(d => {
            const cell = createGridCell(d.name, 'grid-header');
            cell.style.color = d.color;
            grid.appendChild(cell);
        });

        // Generate Time Slots (1 hour intervals for simplicity, or 24 slots)
        const totalSlots = state.config.durationHours;
        for (let i = 0; i < totalSlots; i++) {
            const timeStr = `Race Hour ${i+1}`;
            grid.appendChild(createGridCell(timeStr, 'grid-header'));

            state.roster.forEach(d => {
                if (!state.availability[d.id]) state.availability[d.id] = {};
                const currentStatus = state.availability[d.id][i] || 'open';
                
                const cell = createGridCell('', `grid-cell ${currentStatus}`);
                cell.addEventListener('click', () => {
                    // Cycle: open -> tentative -> blocked -> open
                    let nextStatus = 'open';
                    if (currentStatus === 'open') nextStatus = 'tentative';
                    else if (currentStatus === 'tentative') nextStatus = 'blocked';

                    state.availability[d.id][i] = nextStatus;
                    saveState();
                    renderAvailabilityGrid(); // re-render
                });
                grid.appendChild(cell);
            });
        }
    };

    const createGridCell = (text, className) => {
        const div = document.createElement('div');
        div.className = className;
        div.textContent = text;
        return div;
    };

    // --- Strategy & Schedule Logic ---
    const calculateStints = () => {
        const lapsPerStint = Math.floor(state.config.tankSizeLiters / state.config.fuelConsumptionPerLap);
        const stintDurationSec = lapsPerStint * state.config.baseLapTimeSeconds;
        const totalRaceSec = state.config.durationHours * 3600;
        
        const numStints = Math.ceil(totalRaceSec / stintDurationSec);
        
        state.stints = [];
        let currentTime = 0;

        for (let i = 0; i < numStints; i++) {
            const endTime = currentTime + stintDurationSec;
            state.stints.push({
                id: i,
                stintNumber: i + 1,
                laps: lapsPerStint,
                startTimeStr: formatTime(currentTime),
                endTimeStr: formatTime(endTime),
                driverId: null
            });
            currentTime = endTime;
        }
        saveState();
    };

    const renderSchedule = () => {
        if (state.stints.length === 0) calculateStints();

        const tbody = document.querySelector('#schedule-table tbody');
        tbody.innerHTML = '';
        
        let totalLaps = 0;

        state.stints.forEach((stint, index) => {
            totalLaps += stint.laps;
            
            // Driver Select Dropdown
            let driverSelect = `<select onchange="assignDriver(${index}, this.value)" style="background: rgba(0,0,0,0.5); color: white; border: 1px solid var(--border-color); padding: 5px; border-radius: 4px;">`;
            driverSelect += `<option value="">-- Unassigned --</option>`;
            state.roster.forEach(d => {
                const selected = stint.driverId == d.id ? 'selected' : '';
                driverSelect += `<option value="${d.id}" ${selected}>${d.name}</option>`;
            });
            driverSelect += `</select>`;

            // Check availability warning
            let warning = '';
            if (stint.driverId) {
                const hourIndex = Math.floor(index * (stint.laps * state.config.baseLapTimeSeconds) / 3600);
                const avail = state.availability[stint.driverId]?.[hourIndex];
                if (avail === 'blocked') {
                    warning = `<span style="color: var(--avail-blocked-border); margin-left: 10px;" title="Driver is Blocked!"><i class="fas fa-exclamation-triangle"></i></span>`;
                }
            }

            const tr = document.createElement('tr');
            
            // Style row slightly if driver assigned
            const assignedDriver = state.roster.find(d => d.id == stint.driverId);
            if (assignedDriver) {
                tr.style.borderLeft = `4px solid ${assignedDriver.color}`;
            }

            tr.innerHTML = `
                <td>Stint ${stint.stintNumber}</td>
                <td style="font-family: 'Roboto Mono', monospace;">${stint.startTimeStr}</td>
                <td>${stint.laps} Laps</td>
                <td>${driverSelect} ${warning}</td>
                <td style="font-family: 'Roboto Mono', monospace;">${stint.endTimeStr}</td>
                <td>${assignedDriver ? '<span style="color:#2ecc71">Assigned</span>' : '<span style="color:#e74c3c">Pending</span>'}</td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('total-stints-val').textContent = state.stints.length;
        document.getElementById('total-laps-val').textContent = totalLaps;
    };

    window.assignDriver = (stintIndex, driverId) => {
        state.stints[stintIndex].driverId = driverId ? parseInt(driverId) : null;
        saveState();
        renderSchedule();
    };

    const formatTime = (totalSeconds) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        return `T+${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // --- Dashboard Logic ---
    const renderDashboard = () => {
        // Render Checklist
        const clContainer = document.getElementById('next-stint-checklist');
        clContainer.innerHTML = `
            <label class="checklist-item"><input type="checkbox"> Verify Fuel Allocation</label>
            <label class="checklist-item"><input type="checkbox"> Spotter Connected</label>
            <label class="checklist-item"><input type="checkbox"> Setup Loaded & Checked</label>
            <label class="checklist-item"><input type="checkbox"> Driver Rested & Hydrated</label>
        `;

        // Render Fairness Chart (Simple Bar Chart Visualization using DOM)
        const chartContainer = document.getElementById('fairness-chart');
        chartContainer.innerHTML = '';
        
        const driverStintCounts = {};
        state.roster.forEach(d => driverStintCounts[d.id] = 0);
        
        let totalAssigned = 0;
        state.stints.forEach(s => {
            if (s.driverId) {
                driverStintCounts[s.driverId]++;
                totalAssigned++;
            }
        });

        if (totalAssigned === 0) {
            chartContainer.innerHTML = '<p style="color: var(--text-muted)">No stints assigned yet.</p>';
            return;
        }

        const chartWrapper = document.createElement('div');
        chartWrapper.style.display = 'flex';
        chartWrapper.style.width = '100%';
        chartWrapper.style.height = '40px';
        chartWrapper.style.borderRadius = '8px';
        chartWrapper.style.overflow = 'hidden';

        state.roster.forEach(d => {
            const count = driverStintCounts[d.id];
            if (count > 0) {
                const percentage = (count / totalAssigned) * 100;
                const bar = document.createElement('div');
                bar.style.width = `${percentage}%`;
                bar.style.backgroundColor = d.color;
                bar.style.display = 'flex';
                bar.style.alignItems = 'center';
                bar.style.justifyContent = 'center';
                bar.style.color = '#000';
                bar.style.fontWeight = 'bold';
                bar.style.fontSize = '12px';
                bar.title = `${d.name}: ${count} stints (${percentage.toFixed(1)}%)`;
                
                if (percentage > 10) {
                    bar.textContent = `${percentage.toFixed(0)}%`;
                }
                
                chartWrapper.appendChild(bar);
            }
        });

        chartContainer.appendChild(chartWrapper);
        
        // Add legend below
        const leg = document.createElement('div');
        leg.style.display = 'flex';
        leg.style.gap = '15px';
        leg.style.marginTop = '20px';
        leg.style.flexWrap = 'wrap';
        
        state.roster.forEach(d => {
            const count = driverStintCounts[d.id];
            if (count > 0) {
                const p = document.createElement('div');
                p.innerHTML = `<span class="driver-color-dot" style="background-color:${d.color}"></span> ${d.name} (${count})`;
                p.style.fontSize = '14px';
                leg.appendChild(p);
            }
        });
        chartContainer.appendChild(leg);
    };

    // --- Init ---
    loadConfigUI();
    renderDashboard();
});
