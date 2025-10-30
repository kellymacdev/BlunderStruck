import { fetchRecentMonths, normaliseGame, drawEloChart, drawBarChart} from './fetchGames.js';

function showLoading(isLoading) {
  const load = document.getElementById('loading');
  const stat = document.getElementById('stats');
  const graphs = document.getElementById('graphs-container');
  if (load) {
    load.style.display = isLoading ? 'flex' : 'none';
    stat.style.display = isLoading ? 'none' : 'flex';
    graphs.style.display = isLoading ? 'none' : 'flex';
  }
}

function calculateStats(games) {
  const num_games = games.length;
  let wins = 0, draws = 0, losses = 0;
  let opp_resigned = 0, opp_checkmated = 0;
  let resigned = 0, checkmated = 0;
  if (num_games === 0) return null;
  const firstRating = games[0].kris_rating;
  const lastRating = games[games.length - 1].kris_rating;
  const elo_change = lastRating - firstRating;
  games.forEach(game => {
    if (game.kris_result === "win") {
      wins++;
      if (game.opp_result === "resigned") opp_resigned++;
      if (game.opp_result === "checkmated") opp_checkmated++;
    } else if (game.kris_result === "draw") {
      draws++;
    } else {
        losses++;
        if (game.kris_result === "resigned") resigned++;
        if (game.kris_result === "checkmated") checkmated++;
    }
  });
  const win_rate = ((wins / num_games) * 100).toFixed(2);
  return {
    num_games,
    wins,
    draws,
    losses,
    opp_resigned,
    opp_checkmated,
    resigned,
    checkmated,
    win_rate,
    elo_change
  };
}

function renderStats(stats, month_name) {
  if (!stats) return;
  document.getElementById('games-played').textContent =
    `Kris played ${stats.num_games} games in ${month_name}.`;
  document.getElementById('wins-losses').textContent =
    `He won ${stats.wins} games (of which ${stats.opp_resigned} were resignations and ${stats.opp_checkmated} were checkmates), drew ${stats.draws} games and lost ${stats.losses} games (of which ${stats.resigned} were resignations and ${stats.checkmated} were checkmates).`;
  document.getElementById('win-rate').textContent =
    `That's a win rate of ${stats.win_rate}%.`;
  document.getElementById('elo-change').textContent =
    `His ELO change over the month was: ${stats.elo_change}`;
}


async function loadMonthData(year, month) {
  showLoading(true);
  try {
    const raw = await fetchRecentMonths('kris_lemon', month, year);
    console.log("Fetched raw data:", raw.length);
    const games = raw
      .map(g => normaliseGame(g, 'Kris_Lemon'))
      .sort((a,b) => a.end_time - b.end_time);
    console.log("Normalised games:", games.length);
    showLoading(false);
    const graphs = document.getElementById('graphs-container');
    if (!games || games.length === 0) {
      graphs.style.display = 'none';
      document.getElementById('games-played').textContent ="Sorry, no games found for this month";
      document.getElementById('wins-losses').textContent ="";
      document.getElementById('win-rate').textContent ="";
      document.getElementById('elo-change').textContent ="";
      console.log("no games found for this month")
    } else {
      graphs.style.display = 'flex';
      const month_name = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const stats = calculateStats(games);
      renderStats(stats, month_name);

      if (window.eloChartInstance) window.eloChartInstance.destroy();
      if (window.openingsChartInstance) window.openingsChartInstance.destroy();

      window.eloChartInstance = drawEloChart(games);
      window.openingsChartInstance = drawBarChart(games);
    }
    } catch (err) {
    console.error("Error in loadMonthData:", err);
    showLoading(false);
    return [];
    }
}


document.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded fired ✅");
  const yearSelect = document.getElementById("yearSelect");
  const monthSelect = document.getElementById("monthSelect");
  const loadButton = document.getElementById("loadButton");

  // --- populate year and month dropdowns ---
  const currentYear = new Date().getFullYear();
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
  monthSelect.value = new Date().getMonth() + 1;

  loadButton.addEventListener("click", async () => {
    const year = yearSelect.value;
    const month = monthSelect.value;

    await loadMonthData(year, month);
  });

  // load current month on start up
  await loadMonthData(currentYear, new Date().getMonth() + 1);
});


