import { fetchRecentMonths, normaliseGame, drawEloChart, drawBarChart} from './fetchGames.js';

function showLoading(isLoading) {
  const load = document.getElementById('loading');
  const stat = document.getElementById('stats');
  const graphs = document.getElementById('graphs-container');
  if (load) {
    load.style.display = isLoading ? 'flex' : 'none';
    graphs.style.display = isLoading ? 'none' : 'flex';
    stat.style.display = isLoading ? 'none' : 'flex';
  }
}

function calculateStats(games) {
  const num_games = games.length;
  let wins = 0, draws = 0, losses = 0, timeouts = 0, abandoned=0;
  let opp_resigned = 0, opp_checkmated = 0, opp_timeout = 0, opp_abandoned=0;
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
      if (game.opp_result === "timeout") opp_timeout++;
      if (game.opp_result === "abandoned") opp_abandoned++;
    } else if (game.kris_result === "repetition") {
      draws++;
    } else if (game.kris_result === "agreed") {
      draws++;
    } else if (game.kris_result === "stalemate") {
      draws++;
    } else if (game.kris_result === "insufficient") {
      draws++;
    }
    else {
        losses++;
        if (game.kris_result === "resigned") resigned++;
        if (game.kris_result === "checkmated") checkmated++;
        if (game.kris_result === "timeout") timeouts++;
        if (game.kris_result === "abandoned") abandoned++;
    }
  });
  const win_rate = ((wins / num_games) * 100).toFixed(2);
  return {
    num_games,
    wins,
    draws,
    losses,
    timeouts,
    abandoned,
    opp_resigned,
    opp_checkmated,
    opp_timeout,
    opp_abandoned,
    resigned,
    checkmated,
    win_rate,
    elo_change
  };
}

function renderStats(stats, month_name, username) {
  if (!stats) return;

  const oppDetails = [
    stats.opp_resigned > 0 ? `${stats.opp_resigned} resignations` : null,
    stats.opp_checkmated > 0 ? `${stats.opp_checkmated} checkmates` : null,
    stats.opp_timeout > 0 ? `${stats.opp_timeout} timeouts` : null,
    stats.opp_abandoned > 0 ? `${stats.opp_abandoned} abandoned` : null
  ].filter(Boolean).join(', ');

  const lossDetails = [
    stats.resigned > 0 ? `${stats.resigned} resignations` : null,
    stats.checkmated > 0 ? `${stats.checkmated} checkmates` : null,
    stats.timeouts > 0 ? `${stats.timeouts} timeouts` : null,
    stats.abandoned > 0 ? `${stats.abandoned} abandoned` : null
  ].filter(Boolean).join(', ');

  const drawDetails = [
      stats.draws > 0 ? `, drew ${stats.draws} games`: null
  ].filter(Boolean).join(', ')


  document.getElementById('games-played').textContent =
    `${username} played ${stats.num_games} games in ${month_name}.`;
  document.getElementById('wins-losses').textContent =
    `They won ${stats.wins} games (${oppDetails}) ${drawDetails} and lost ${stats.losses} games (${lossDetails}).`;
  document.getElementById('win-rate').textContent =
    `That's a win rate of ${stats.win_rate}%.`;
  document.getElementById('elo-change').textContent =
    `Their ELO change over the month was: ${stats.elo_change}`;
}


export async function loadMonthData(year, month, username) {
  showLoading(true);
  try {
    const raw_plain = await fetchRecentMonths(username, month, year);
    console.log("Fetched raw data:", raw_plain.length);
    const raw = raw_plain.filter(game => game.rated === true)
    console.log("found rated games:", raw.length)
    const games = raw
      .map(g => normaliseGame(g, username))
      .sort((a,b) => a.end_time - b.end_time);
    console.log("Normalised games:", games.length);
    showLoading(false);
    const graphs = document.getElementById('graphs-container');
    if (!games || games.length === 0) {
      graphs.style.display = 'none';
      document.getElementById('games-played').textContent =":(";
      document.getElementById('wins-losses').textContent ="Sorry";
      document.getElementById('win-rate').textContent ="no games found for this month";
      document.getElementById('elo-change').textContent =":(";
      console.log("no games found for this month")
    } else {
      graphs.style.display = 'flex';
      const month_name = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
      const stats = calculateStats(games);
      renderStats(stats, month_name, username);

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

  let USERNAME = null;
  document.getElementById('search-button').addEventListener('click', async () => {
  const input = document.getElementById('usernameInput').value.trim();
  if (!input) {
     alert('Please enter a username!');
     return;
  }
  USERNAME = input;
  console.log("We want for:", USERNAME);
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  await loadMonthData(currentYear, currentMonth, USERNAME);
});

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

    await loadMonthData(year, month, USERNAME);
  });

  // load current month on start up
  await loadMonthData(currentYear, new Date().getMonth() + 1, USERNAME);
});


