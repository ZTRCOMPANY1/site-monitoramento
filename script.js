/* ===========================
   CONFIGURAÇÃO DE LOGIN
=========================== */

if (!localStorage.getItem("user")) {
    localStorage.setItem("user", "admin");
    localStorage.setItem("pass", "1234");
}

function login() {
    const u = document.getElementById("userInput").value;
    const p = document.getElementById("passInput").value;

    if (u === localStorage.getItem("user") && p === localStorage.getItem("pass")) {
        localStorage.setItem("logged", "true");
        location.reload();
    } else {
        alert("Usuário ou senha incorretos");
    }
}

function logout() {
    localStorage.removeItem("logged");
    location.reload();
}

if (localStorage.getItem("logged") === "true") {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("panel").style.display = "block";
}

/* ===========================
   DADOS
=========================== */

let sites = JSON.parse(localStorage.getItem("sites")) || [];
let history = JSON.parse(localStorage.getItem("history")) || [];

const siteList = document.getElementById("siteList");

/* ===========================
   SALVAR TUDO
=========================== */

function saveAll() {
    localStorage.setItem("sites", JSON.stringify(sites));
    localStorage.setItem("history", JSON.stringify(history));
}

/* ===========================
   SITES
=========================== */

function addSite() {
    const name = document.getElementById("siteName").value.trim();
    const url = document.getElementById("siteUrl").value.trim();

    if (!name || !url) {
        alert("Preencha todos os campos");
        return;
    }

    sites.push({
        name,
        url,
        checks: 0,
        online: 0,
        lastStatus: "OFFLINE"
    });

    document.getElementById("siteName").value = "";
    document.getElementById("siteUrl").value = "";

    saveAll();
    renderSites();
}

function removeSite(index) {
    if (!confirm("Remover este site?")) return;
    sites.splice(index, 1);
    saveAll();
    renderSites();
}

/* ===========================
   MONITORAMENTO
=========================== */

function checkSite(site) {
    site.checks++;

    fetch(site.url, { mode: "no-cors" })
        .then(() => {
            site.online++;
            site.lastStatus = "ONLINE";
        })
        .catch(() => {
            site.lastStatus = "OFFLINE";
        });

    saveAll();
}

function getUptime(site) {
    if (site.checks === 0) return "0%";
    return ((site.online / site.checks) * 100).toFixed(1) + "%";
}

/* ===========================
   RENDER
=========================== */

function renderSites() {
    siteList.innerHTML = "";

    sites.forEach((site, index) => {
        const uptime = getUptime(site);
        const statusClass = site.lastStatus === "ONLINE" ? "online" : "offline";

        siteList.innerHTML += `
            <div class="site">
                <strong>${site.name}</strong>
                <span class="${statusClass}">
                    ${uptime} • ${site.lastStatus}
                </span>
                <button class="blue" onclick="window.open('${site.url}', '_blank')">Abrir</button>
                <button class="red" onclick="removeSite(${index})">Remover</button>
            </div>
        `;
    });
}

/* ===========================
   INTERVALO AUTOMÁTICO
=========================== */

setInterval(() => {
    sites.forEach(site => {
        checkSite(site);

        history.push({
            time: new Date().toLocaleTimeString(),
            value: getUptime(site).replace("%", "")
        });
    });

    history = history.slice(-50);
    saveAll();
    renderSites();
    drawChart();
}, 10000); // ⏱ 10 segundos

/* ===========================
   GRÁFICO
=========================== */

let chart;

function drawChart() {
    const ctx = document.getElementById("chart").getContext("2d");

    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: history.map(h => h.time),
            datasets: [{
                label: "Uptime %",
                data: history.map(h => h.value),
                borderWidth: 2
            }]
        }
    });
}

/* ===========================
   RESET DO GRÁFICO
=========================== */

function resetChart() {
    if (!confirm("Reiniciar apenas o gráfico de uptime?")) return;

    history = [];
    localStorage.removeItem("history");

    if (chart) chart.destroy();
    drawChart();
}

/* ===========================
   INIT
=========================== */

renderSites();
drawChart();
