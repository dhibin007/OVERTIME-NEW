// ==========================
// Global data
// ==========================
let teams = JSON.parse(localStorage.getItem("teams")) || [
  { name: "Team 1", employees: [] },
  { name: "Team 2", employees: [] },
  { name: "Team 3", employees: [] },
  { name: "Team 4", employees: [] }
];

let allData = JSON.parse(localStorage.getItem("allData")) || {}; 
let selectedDate = new Date().toISOString().split("T")[0];

// ==========================
// UAE Public Holidays 2025
// ==========================
const publicHolidays = [
  "2025-01-01","2025-03-30","2025-03-31","2025-04-01","2025-04-02",
  "2025-06-05","2025-06-06","2025-06-07","2025-06-08",
  "2025-06-27","2025-09-05","2025-12-02","2025-12-03",
  "2025-12-30","2025-12-31"
];

// ==========================
// Local Storage Helpers
// ==========================
function saveTeams(){ localStorage.setItem("teams", JSON.stringify(teams)); }
function saveAllData(){ localStorage.setItem("allData", JSON.stringify(allData)); }

// ==========================
// Date Picker
// ==========================
const dateInput = document.getElementById("workDate");
dateInput.value = selectedDate;
dateInput.addEventListener("change", () => {
  selectedDate = dateInput.value;
  buildEmployeeTable();
});

// ==========================
// Hamburger Toggle
// ==========================
const sidebar = document.getElementById("sidebar");
const hamburgerBtn = document.getElementById("hamburgerBtn");

hamburgerBtn.addEventListener("click", e => {
  e.stopPropagation();
  sidebar.classList.toggle("open");
});
document.addEventListener("click", e => {
  if(!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)){
    sidebar.classList.remove("open");
  }
});

// ==========================
// Google Login
// ==========================
let currentUser = null;

function onGoogleLogin(response){
  const credential = response.credential;
  currentUser = parseJwt(credential);
  alert("Welcome "+currentUser.email);

  // Rebuild menu & table after login so nothing is lost
  buildHamburgerMenu();
  buildEmployeeTable();
  updateSavedDatesList();
}

function parseJwt(token){
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g,'+').replace(/_/g,'/');
  return JSON.parse(window.atob(base64));
}

// ==========================
// Shareable Link
// ==========================
document.getElementById("shareBtn").addEventListener("click", () => {
  const url = `${window.location.origin}/view.html?date=${selectedDate}`;
  navigator.clipboard.writeText(url);
  alert("Shareable link copied: "+url);
});

// ==========================
// Save + Push to Google Sheets
// ==========================
async function pushToGoogleSheet(date, data) {
  const payload = [];
  Object.values(data).forEach(emp=>{
    payload.push({
      date: date,
      team: emp.team,
      name: emp.name,
      site: emp.site,
      in: emp.in || "",
      out: emp.out || "",
      totalHours: emp.totalHours || "",
      overtimeHours: emp.overtimeHours || ""
    });
  });

  await fetch("https://script.google.com/macros/s/AKfycbxLydY0VB6leR5mo6YNMAu0-avn3h6jrGmhXf2s_oGyGvnqUBQjvwOhw582CXTYLh9y/exec",
     {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
}

// Save Button
document.getElementById("saveBtn").addEventListener("click", async ()=>{
  saveAllData();
  updateSavedDatesList();

  const dataToSend = {};
  teams.forEach(team=>{
    team.employees.forEach(emp=>{
      if(!dataToSend[emp.id]) dataToSend[emp.id] = {...emp};
    });
  });

  await pushToGoogleSheet(selectedDate, dataToSend);
  alert("Data saved and synced!");
});

// ==========================
// Build Hamburger Menu
// ==========================
function buildHamburgerMenu(){
  const menu = document.getElementById("employeeMenu");
  menu.innerHTML = "";

  teams.forEach(team=>{
    const teamDiv = document.createElement("div");
    teamDiv.className = "team-block";

    const title = document.createElement("h4");
    title.textContent = team.name;
    teamDiv.appendChild(title);

    const ul = document.createElement("ul");
    ul.className = "employee-list";
    ul.dataset.team = team.name;

    team.employees.forEach(emp=>{
      if(!emp) return;
      const li = document.createElement("li");
      li.textContent = emp.name+" ("+emp.site+")";
      li.draggable = true;
      li.dataset.empId = emp.id;
      li.addEventListener("dragstart",dragStart);
      li.addEventListener("dragover",dragOver);
      li.addEventListener("drop",dropEmployee);

      const delBtn = document.createElement("button");
      delBtn.textContent = "❌";
      delBtn.onclick = ()=>deleteEmployee(team.name,emp.id);
      li.appendChild(delBtn);

      ul.appendChild(li);
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "➕ Add Employee";
    addBtn.onclick = ()=>addEmployee(team.name);

    teamDiv.appendChild(ul);
    teamDiv.appendChild(addBtn);

    // Bulk Apply
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

    bulkDiv.querySelector(".applyTeamBtn").addEventListener("click",()=>{
      const siteIn = bulkDiv.querySelector(".bulkSiteIn").value;
      const siteOut = bulkDiv.querySelector(".bulkSiteOut").value;
      const siteName = bulkDiv.querySelector(".bulkSiteName").value;
      applyTimeToTeam(team.name,siteIn,siteOut,siteName);
    });

    menu.appendChild(teamDiv);

    ul.addEventListener("dragover",dragOver);
    ul.addEventListener("drop",dropEmployee);
  });
}

// ==========================
// Drag & Drop
// ==========================
let draggedEmpId = null;
function dragStart(e){ draggedEmpId = e.target.dataset.empId; }
function dragOver(e){ e.preventDefault(); }
function dropEmployee(e){
  e.preventDefault();
  const targetTeamName = e.currentTarget.dataset.team;
  if(!draggedEmpId||!targetTeamName) return;

  let fromTeam=null, emp=null;
  teams.forEach(team=>{
    const found = team.employees.find(x=>x.id==draggedEmpId);
    if(found){ fromTeam=team; emp=found; }
  });
  if(!emp||!fromTeam) return;

  fromTeam.employees = fromTeam.employees.filter(x=>x.id!=draggedEmpId);
  const targetTeam = teams.find(t=>t.name===targetTeamName);
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
function addEmployee(teamName){
  const name = prompt("Enter employee name:");
  if(!name) return;
  const site = prompt("Enter site name:") || "";
  const employee = { id: Date.now(), name, site, team: teamName };
  const team = teams.find(t=>t.name===teamName);
  team.employees.push(employee);

  saveTeams();
  buildHamburgerMenu();
  buildEmployeeTable();
}

function deleteEmployee(teamName, empId){
  const team = teams.find(t=>t.name===teamName);
  team.employees = team.employees.filter(e=>e.id!==empId);
  if(allData[selectedDate]) delete allData[selectedDate][empId];

  saveTeams();
  saveAllData();
  buildHamburgerMenu();
  buildEmployeeTable();
}

// ==========================
// Employee Table
// ==========================
function buildEmployeeTable(){
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

  if(!allData[selectedDate]) allData[selectedDate]={};

  teams.forEach(team=>{
    team.employees.forEach(emp=>{
      addRow(emp);
    });
  });
}

// ==========================
// Add Row to Table
// ==========================
function addRow(emp){
  const table = document.getElementById("employeeTable");
  const row = table.insertRow();

  row.insertCell(0).textContent = emp.name;
  row.insertCell(1).textContent = selectedDate;

  const siteInput = document.createElement("input");
  siteInput.value = allData[selectedDate][emp.id]?.site || emp.site;
  siteInput.onchange = e=>{
    emp.site = e.target.value;
    if(!allData[selectedDate][emp.id]) allData[selectedDate][emp.id]={};
    allData[selectedDate][emp.id].site = e.target.value;
    saveTeams();
    saveAllData();
    buildHamburgerMenu();
  };
  row.insertCell(2).appendChild(siteInput);

  const inInput = document.createElement("input");
  inInput.type="time";
  inInput.value = allData[selectedDate][emp.id]?.in || "";
  row.insertCell(3).appendChild(inInput);

  const outInput = document.createElement("input");
  outInput.type="time";
  outInput.value = allData[selectedDate][emp.id]?.out || "";
  row.insertCell(4).appendChild(outInput);

  const totalCell = row.insertCell(5);
  const overtimeCell = row.insertCell(6);

  function updateAndSave(){
    calculateHours(inInput,outInput,totalCell,overtimeCell);
    if(!allData[selectedDate][emp.id]) allData[selectedDate][emp.id]={};
    allData[selectedDate][emp.id].in = inInput.value;
    allData[selectedDate][emp.id].out = outInput.value;
    allData[selectedDate][emp.id].site = siteInput.value;
    saveAllData();
    updateSavedDatesList();
  }

  inInput.addEventListener("change", updateAndSave);
  outInput.addEventListener("change", updateAndSave);

  calculateHours(inInput,outInput,totalCell,overtimeCell);

  const d = new Date(selectedDate);
  if(d.getDay()===0 || publicHolidays.includes(selectedDate)){
    row.style.backgroundColor = "yellow";
  }
}

// ==========================
// Calculate Hours
// ==========================
function calculateHours(inInput,outInput,totalCell,overtimeCell){
  const inTime = inInput.value;
  const outTime = outInput.value;

  if(!inTime||!outTime){
    totalCell.textContent="❌";
    overtimeCell.textContent="❌";
    totalCell.style.background="red";
    overtimeCell.style.background="red";
    return;
  }

  totalCell.style.background="";
  overtimeCell.style.background="";

  const [inH,inM] = inTime.split(":").map(Number);
  const [outH,outM] = outTime.split(":").map(Number);

  let diff = (outH*60+outM-(inH*60+inM))/60;
  if(diff<0) diff+=24;

  totalCell.textContent = diff.toFixed(2);

  const d = new Date(selectedDate);
  if(d.getDay()===0||publicHolidays.includes(selectedDate)){
    overtimeCell.textContent = diff.toFixed(2);
  } else {
    overtimeCell.textContent = diff>9?(diff-9).toFixed(2):"0";
  }
}

// ==========================
// Apply to Team
// ==========================
function applyTimeToTeam(teamName,siteIn,siteOut,siteName){
  const team = teams.find(t=>t.name===teamName);
  if(!team) return;

  document.querySelectorAll("#employeeTable tr").forEach((row,i)=>{
    if(i===0) return;
    const empName = row.cells[0].textContent;
    const emp = team.employees.find(e=>e.name===empName);
    if(!emp) return;

    const inInput = row.cells[3].querySelector("input");
    const outInput = row.cells[4].querySelector("input");
    const siteInput = row.cells[2].querySelector("input");

    if(siteIn) inInput.value=siteIn;
    if(siteOut) outInput.value=siteOut;
    if(siteName) siteInput.value=siteName;

    calculateHours(inInput,outInput,row.cells[5],row.cells[6]);

    if(!allData[selectedDate][emp.id]) allData[selectedDate][emp.id]={};
    allData[selectedDate][emp.id].in=inInput.value;
    allData[selectedDate][emp.id].out=outInput.value;
    allData[selectedDate][emp.id].site=siteInput.value;
  });

  saveAllData();
  updateSavedDatesList();
}

// ==========================
// Export CSV
// ==========================
function exportCSV(){
  const fromDate = document.getElementById("exportFrom").value||selectedDate;
  const toDate = document.getElementById("exportTo").value||selectedDate;

  let rows=[];
  const headers = ["Employee Name","Date","Site Name","Site In","Site Out","Total Hours","Overtime Hours"];
  rows.push(headers.join(","));

  const allDates = Object.keys(allData).sort();
  const datesToExport = allDates.filter(d=>d>=fromDate && d<=toDate);

  datesToExport.forEach(date=>{
    teams.forEach(team=>{
      team.employees.forEach(emp=>{
        const empData = allData[date]?.[emp.id];
        if(!empData) return;

        const siteIn = empData.in||"";
        const siteOut = empData.out||"";
        const siteName = empData.site||emp.site;

        let totalHours="", overtimeHours="";
        if(siteIn && siteOut){
          const [inH,inM]=siteIn.split(":").map(Number);
          const [outH,outM]=siteOut.split(":").map(Number);
          let diff=(outH*60+outM-(inH*60+inM))/60;
          if(diff<0) diff+=24;
          totalHours=diff.toFixed(2);

          const d=new Date(date);
          if(d.getDay()===0||publicHolidays.includes(date)){
            overtimeHours=diff.toFixed(2);
          } else {
            overtimeHours=diff>9?(diff-9).toFixed(2):"0";
          }
        }

        const row = [emp.name,date,siteName,siteIn,siteOut,totalHours,overtimeHours];
        rows.push(row.join(","));
      });
    });
  });

  const blob = new Blob([rows.join("\n")],{type:"text/csv"});
  const a=document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download="employee_hours.csv";
  a.click();
}

// ==========================
// Saved Dates List
// ==========================
function updateSavedDatesList(){
  const savedDatesList = document.getElementById("savedDatesList");
  savedDatesList.innerHTML = "";

  const dates = Object.keys(allData).sort((a,b)=>new Date(b)-new Date(a));
  dates.forEach(date=>{
    const li = document.createElement("li");
    li.textContent = date;
    li.style.cursor="pointer";
    li.style.margin="3px 0";
    li.onclick = ()=>{
      selectedDate=date;
      dateInput.value=date;
      buildEmployeeTable();
    };
    savedDatesList.appendChild(li);
  });
}

// ==========================
// Initialize
// ==========================
buildHamburgerMenu();
buildEmployeeTable();
updateSavedDatesList();
