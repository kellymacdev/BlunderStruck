
import {showLoading, renderStats, calculateStats} from "./load_functions.js";

import {drawBarChart, drawEloChart, fetchRecentMonths, normaliseGame} from "./fetchGames.js";





document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOMContentLoaded fired ✅");

    let USERNAME = null;
    const searchButton = document.getElementById("search-button");
    const searchInput = document.getElementById("usernameInput");
    const message = document.getElementById("message");
    const statsContainer = document.getElementById("stats");
    const controlsContainer = document.getElementById("controls");
    const otherDivs = document.querySelectorAll(".hidden-on-load");

    otherDivs.forEach(div => div.style.display = "none");
    statsContainer.style.display = "none";
    message.style.display = "block";

    searchButton.addEventListener('click', async () => {
        const input = searchInput.value.trim();
        if (!input) {
            alert('Please enter a username!');
            return;
        }

        USERNAME = input;
        console.log("Username set:", USERNAME)
        message.style.display = "none";
        searchButton.disabled = true;
        searchButton.style.display = "none";


        // Populate controls container
        controlsContainer.style.display = "block";
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        const yearSelect = document.getElementById("yearSelect");
        const monthSelect = document.getElementById("monthSelect");
        const loadButton = document.getElementById("loadButton");

        for (let y = currentYear; y >= 2020; y--) {
            const opt = document.createElement("option");
            opt.value = y;
            opt.textContent = y;
            yearSelect.appendChild(opt);
        }

        const months = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        months.forEach((m, i) => {
            const opt = document.createElement("option");
            opt.value = i + 1; // API uses 1–12
            opt.textContent = m;
            monthSelect.appendChild(opt);
        });

        yearSelect.value = currentYear;
        monthSelect.value = currentMonth;


        loadButton.addEventListener("click", async () => {
            const year = yearSelect.value;
            const month = monthSelect.value;

            showLoading(true);
            try {
                const raw_plain = await fetchRecentMonths(USERNAME, month, year);
                console.log("Fetched raw data:", raw_plain.length);
                const raw = raw_plain.filter(game => game.rated === true)
                console.log("found rated games:", raw.length)
                const games = raw
                    .map(g => normaliseGame(g, USERNAME))
                    .sort((a, b) => a.end_time - b.end_time);
                console.log("Normalised games:", games.length);
                showLoading(false);
                const graphs = document.getElementById('graphs-container');
                if (!games || games.length === 0) {
                    graphs.style.display = 'none';
                    document.getElementById('games-played').textContent = ":(";
                    document.getElementById('wins-losses').textContent = "Sorry";
                    document.getElementById('win-rate').textContent = "no games found for this month";
                    document.getElementById('elo-change').textContent = ":(";
                    console.log("no games found for this month")
                } else {
                    graphs.style.display = 'flex';
                    const month_name = new Date(year, month - 1).toLocaleString('default', {month: 'long'});
                    const stats = calculateStats(games);
                    renderStats(stats, month_name, USERNAME);

                    if (window.eloChartInstance) window.eloChartInstance.destroy();
                    if (window.openingsChartInstance) window.openingsChartInstance.destroy();

                    window.eloChartInstance = drawEloChart(games);
                    window.openingsChartInstance = drawBarChart(games);
                }
            } catch (err) {
                console.error("Error in deploying:", err);
                showLoading(false);
                return [];
            }

        })

    });

})