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
  "2025-01-01", "2025-03-30", "2025-03-31", "2025-04-01", "2025-04-02",
  "2025-06-05", "2025-06-06", "2025-06-07", "2025-06-08",
  "2025-06-27", "2025-09-05", "2025-12-02", "2025-12-03",
  "2025-12-30", "2025-12-31"
];

// ==========================
// Local Storage Helpers
// ==========================
function saveTeams() { localStorage.setItem("teams", JSON.stringify(teams)); }
function saveAllData() { localStorage.setItem("allData", JSON.stringify(allData)); }

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
  if (!sidebar.contains(e.target) && !hamburgerBtn.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

// ==========================
// Google Login
// ==========================
let currentUser = null;

function onGoogleLogin(response) {
  const credential = response.credential;
  currentUser = parseJwt(credential);
  alert("Welcome " + currentUser.email);
}

function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(window.atob(base64));
}

// ==========================
// Shareable Link
// ==========================
document.getElementById("shareBtn").addEventListener("click", () => {
  const url = `${window.location.origin}/view.html?date=${selectedDate}`;
  navigator.clipboard.writeText(url);
  alert("Shareable link copied: " + url);
});

// ==========================
// Save + Push to Google Sheets
// ==========================
async function pushToGoogleSheet(date, data) {
  await fetch("https://script.google.com/macros/s/AKfycbxG_etzGXWEg9uK9TFciAKLp7_eJaWY_P-dO3LtNWNrvzRch7xuJ0xn3Xm7PFTUXlQt/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, data })
  });
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  saveAllData();
  updateSavedDatesList();

  if (currentUser) {
    const dataToSend = allData[selectedDate];
    await pushToGoogleSheet(selectedDate, dataToSend);
    alert("Data saved and synced for " + selectedDate);
  } else {
    alert("Please login with Google first!");
  }
});

// ==========================
// --- ALL YOUR EXISTING FUNCTIONS BELOW ---
// buildHamburgerMenu, drag/drop, addEmployee, deleteEmployee, 
// buildEmployeeTable, addRow, calculateHours, applyTimeToTeam, 
// exportCSV, updateSavedDatesList
// (unchanged from your previous script.js)
// ==========================

// ... keep your entire original code here ...

// ==========================
// Initialize
// ==========================
buildHamburgerMenu();
buildEmployeeTable();
updateSavedDatesList();
