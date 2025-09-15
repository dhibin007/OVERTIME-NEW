// ==========================
// Global data
// ==========================
let teams = JSON.parse(localStorage.getItem("teams")) || [
  { name: "Team 1", employees: [] },
  { name: "Team 2", employees: [] },
  { name: "Team 3", employees: [] },
  { name: "Team 4", employees: [] }
];

const today = new Date().toISOString().split("T")[0];

// ==========================
// Local Storage Helpers
// ==========================
function saveTeams() {
  localStorage.setItem("teams", JSON.stringify(teams));
}

// ==========================
// Build Hamburger Menu with per-team bulk apply and drag/drop
// ==========================
function buildHamburgerMenu() {
  const menu = document.getElementById("employeeMenu");
  menu.innerHTML = "";

  teams.forEach(team => {
    const teamDiv = document.createElement("div");
    teamDiv.className = "team-block";

    const title = document.createElement("h4");
    title.textContent = team.name;
    teamDiv.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "employee-list";
    ul.dataset.team = team.name;

    team.employees.forEach(emp => {
      if (!emp) return;
      const li = document.createElement("li");
      li.textContent = emp.name + " (" + emp.site + ")";
      li.draggable = true;
      li.dataset.empId = emp.id;

      li.addEventListener("dragstart", dragStart);
      li.addEventListener("dragover", dragOver);
      li.addEventListener("drop", dropEmployee);

      const delBtn = document.createElement("button");
      delBtn.textContent = "❌";
      delBtn.style.marginLeft = "8px";
      delBtn.onclick = () => deleteEmployee(team.name, emp.id);

      li.appendChild(delBtn);
      ul.appendChild(li);
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "➕ Add Employee";
    addBtn.onclick = () => addEmployee(team.name);

    teamDiv.appendChild(ul);
    teamDiv.appendChild(addBtn);

    // Per-team bulk apply
    const bulkDiv = document.createElement("div");
    bulkDiv.className = "bulk-section";
    bulkDiv.innerHTML = `
      <h5>Bulk Apply for ${team.name}</h5>
      <input type="time" class="bulkSiteIn" placeholder="Site In">
      <input type="time" class="bulkSiteOut" placeholder="Site Out">
      <input type="text" class="bulkSiteName" placeholder="Site Name">
      <button class="applyTeamBtn">Apply to Team</button>
    `;
    teamDiv.appendChild(bulkDiv);

    menu.appendChild(teamDiv);

    bulkDiv.querySelector(".applyTeamBtn").addEventListener("click", () => {
      const siteIn = bulkDiv.querySelector(".bulkSiteIn").value;
      const siteOut = bulkDiv.querySelector(".bulkSiteOut").value;
      const siteName = bulkDiv.querySelector(".bulkSiteName").value;

      applyTimeToTeam(team.name, siteIn, siteOut, siteName);
    });

    // Make ul droppable
    ul.addEventListener("dragover", dragOver);
    ul.addEventListener("drop", dropEmployee);
  });
}

// ==========================
// Drag & Drop Functions
// ==========================
let draggedEmpId = null;
function dragStart(e) {
  draggedEmpId = e.target.dataset.empId;
}

function dragOver(e) {
  e.preventDefault();
}

function dropEmployee(e) {
  e.preventDefault();
  const targetTeamName = e.currentTarget.dataset.team;
  if (!draggedEmpId || !targetTeamName) return;

  // Find employee and current team
  let fromTeam = null, emp = null;
  teams.forEach(team => {
    const found = team.employees.find(x => x.id == draggedEmpId);
    if (found) {
      fromTeam = team;
      emp = found;
    }
  });
  if (!emp || !fromTeam) return;

  // Remove from current team
  fromTeam.employees = fromTeam.employees.filter(x => x.id != draggedEmpId);

  // Add to target team
  const targetTeam = teams.find(t => t.name === targetTeamName);
  targetTeam.employees.push(emp);
  emp.team = targetTeamName;

  saveTeams();
  buildHamburgerMenu();
  buildEmployeeTable();
  draggedEmpId = null;
}

// ==========================
// Add/Delete Employees
// ==========================
function addEmployee(teamName) {
  const name = prompt("Enter employee name:");
  if (!name) return;
  const site = prompt("Enter site name:") || "";

  const employee = {
    id: Date.now(),
    name,
    site,
    team: teamName
  };

  const team = teams.find(t => t.name === teamName);
  team.employees.push(employee);

  saveTeams();
  buildHamburgerMenu();
  buildEmployeeTable();
}

// Delete Employee
function deleteEmployee(teamName, empId) {
  const team = teams.find(t => t.name === teamName);
  team.employees = team.employees.filter(e => e.id !== empId);

  saveTeams();
  buildHamburgerMenu();
  buildEmployeeTable();
}

// ==========================
// Employee Table
// ==========================
function buildEmployeeTable() {
  const table = document.getElementById("employeeTable");
  table.innerHTML = `
    <tr>
      <th>Employee Name</th>
      <th>Date</th>
      <th>Site Name</th>
      <th>Site In</th>
      <th>Site Out</th>
      <th>Total Hours</th>
      <th>Overtime Hours</th>
    </tr>
  `;

  teams.forEach(team => {
    team.employees.forEach(emp => {
      if (emp) addRow(emp);
    });
  });
}

function addRow(emp) {
  const table = document.getElementById("employeeTable");
  const row = table.insertRow();

  row.insertCell(0).textContent = emp.name;
  row.insertCell(1).textContent = today;

  const siteInput = document.createElement("input");
  siteInput.value = emp.site;
  siteInput.onchange = e => {
    emp.site = e.target.value;
    saveTeams();
    buildHamburgerMenu();
  };
  row.insertCell(2).appendChild(siteInput);

  const inInput = document.createElement("input");
  inInput.type = "time";
  inInput.value = getCurrentTime(); // default to current time
  row.insertCell(3).appendChild(inInput);

  const outInput = document.createElement("input");
  outInput.type = "time";
  outInput.value = getCurrentTime(); // default to current time
  row.insertCell(4).appendChild(outInput);

  const totalCell = row.insertCell(5);
  const overtimeCell = row.insertCell(6);

  inInput.addEventListener("change", () => calculateHours(inInput, outInput, totalCell, overtimeCell));
  outInput.addEventListener("change", () => calculateHours(inInput, outInput, totalCell, overtimeCell));

  // Sunday coloring
  const d = new Date(today);
  if (d.getDay() === 0) row.style.backgroundColor = "yellow";
}

// ==========================
// Get current time in HH:MM format
// ==========================
function getCurrentTime() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ==========================
// Calculate Hours
// ==========================
function calculateHours(inInput, outInput, totalCell, overtimeCell) {
  const inTime = inInput.value;
  const outTime = outInput.value;

  if (!inTime || !outTime) {
    totalCell.textContent = "❌";
    overtimeCell.textContent = "❌";
    totalCell.style.background = "red";
    overtimeCell.style.background = "red";
    return;
  }

  totalCell.style.background = "";
  overtimeCell.style.background = "";

  const [inH, inM] = inTime.split(":").map(Number);
  const [outH, outM] = outTime.split(":").map(Number);

  let diff = (outH*60 + outM - (inH*60 + inM)) / 60;
  if (diff < 0) diff += 24;

  totalCell.textContent = diff.toFixed(2);
  overtimeCell.textContent = (diff > 9 ? (diff-9).toFixed(2) : "0");
}

// ==========================
// Apply to specific team
// ==========================
function applyTimeToTeam(teamName, siteIn, siteOut, siteName) {
  const team = teams.find(t => t.name === teamName);
  if (!team) return;

  document.querySelectorAll("#employeeTable tr").forEach((row, i) => {
    if (i === 0) return;
    const empName = row.cells[0].textContent;
    if (!team.employees.find(e => e.name === empName)) return;

    const inInput = row.cells[3].querySelector("input");
    const outInput = row.cells[4].querySelector("input");
    const siteInput = row.cells[2].querySelector("input");

    if (siteIn) inInput.value = siteIn;
    if (siteOut) outInput.value = siteOut;
    if (siteName) siteInput.value = siteName;

    calculateHours(inInput, outInput, row.cells[5], row.cells[6]);
  });
}

// ==========================
// Hamburger Toggle
// ==========================
const sidebar = document.getElementById("sidebar");
const hamburgerBtn = document.getElementById("hamburgerBtn");

hamburgerBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

// ==========================
// Export CSV
// ==========================
function exportCSV() {
  let rows = [];
  const headers = ["Employee Name","Date","Site Name","Site In","Site Out","Total Hours","Overtime Hours"];
  rows.push(headers.join(","));

  document.querySelectorAll("#employeeTable tr").forEach((tr, i) => {
    if (i === 0) return;
    let cols = [];
    tr.querySelectorAll("td").forEach(td => {
      if (td.querySelector("input")) cols.push(td.querySelector("input").value);
      else cols.push(td.innerText);
    });
    rows.push(cols.join(","));
  });

  const blob = new Blob([rows.join("\n")], {type:"text/csv"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "employee_hours.csv";
  a.click();
}

// ==========================
// Init
// ==========================
buildHamburgerMenu();
buildEmployeeTable();
