import './style.css'

const MembersDataPath = "/members.json";
const WebringGridId = "webring-grid";
const SearchBarId = "search-bar";

let allMembers = [];

function formatInput(value) {
    return value.toLowerCase().trim()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\s+/g, "")
        .replace(/\/$/, "");
}

function displayWebringGridError() {
  const webringContainer = document.getElementById(WebringGridId);
  webringContainer.innerHTML = "";

  const errorMsg = document.createElement("p");
  errorMsg.className = "text-bc-maroon font-bold py-4 text-center";
  errorMsg.textContent = "Error loading members' data. Please try refreshing the page.";
  
  webringContainer.appendChild(errorMsg);
}

async function fetchMembers() {
  const response = await fetch(MembersDataPath);

  if (!response.ok) {
    throw new Error(`HTTP error; Status: ${response.status}`);
  }

  return response.json();
}

function formatMembers(membersData) {
  return membersData.map(member => ({
    name: formatInput(member.name),
    year: formatInput(member.year),
    school: formatInput(member.school),
    site: formatInput(member.site)    
  }));
}

function initializeWebringGrid(members) {
  const webringContainer = document.getElementById(WebringGridId);
  webringContainer.innerHTML = "";

  if (members.length === 0) {
    const emptyMsg = document.createElement("p");
    emptyMsg.className = "text-bc-light/60 py-4 text-center";
    emptyMsg.textContent = "No member data found";

    webringContainer.appendChild(emptyMsg);

    return;
  }

  const fragment = document.createDocumentFragment();

  for (const member of members) {
    const anchor = document.createElement("a");
    anchor.href = member.site.startsWith("http") ? member.site : `https://${member.site}`;
    anchor.rel = "noopener noreferrer";
    anchor.className = "hover:text-bc-gold transition-colors whitespace-nowrap";
    anchor.textContent = member.site;

    fragment.appendChild(anchor);
  }

  webringContainer.appendChild(fragment);
}

async function initialize() {
  try {
    const membersData = await fetchMembers();
    allMembers = formatMembers(membersData);

    initializeWebringGrid(allMembers);
  } catch (error) {
    console.error("Failed to load webring member data:", error);
    displayWebringGridError();
  }
}

initialize();
