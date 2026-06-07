import './style.css'
import membersSorted from './members-sorted.json'

const WebringGridId = "webring-grid";
const SearchBarId = "search-bar";

let allMembers = [];

function normalizeSiteUrl(url) {
  return url.toLowerCase().trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\s+/g, "")
    .replace(/\/$/, "");
}

function normalizeField(value) {
  return value.toLowerCase().trim()
    .replace(/\s+/g, "");
}

function abbreviateSchool(input) {
  const schoolNameMap = {
    "baruch college": "BARUCH",
    "borough of manhattan community college": "BMCC",
    "bronx community college": "BCC",
    "brooklyn college": "BC",
    "college of staten island": "CSI",
    "cuny school of labor and urban studies": "SLU",
    "cuny school of medicine": "SOM",
    "cuny school of professional studies": "SPS",
    "guttman community college": "GCC",
    "hostos community college": "HCC",
    "hunter college": "HC",
    "john jay college of criminal justice": "JJAY",
    "kingsborough community college": "KCC",
    "laguardia community college": "LCC",
    "lehman college": "LC",
    "macaulay honors college": "MHC",
    "medgar evers college": "MEC",
    "new york city college of technology": "CITYTECH",
    "queens college": "QC",
    "queensborough community college": "QCC",
    "the city college of new york": "CCNY",
    "york college": "YC"
  };

  return schoolNameMap[input.toLowerCase().trim()] ?? "";
}

function displayWebringGridError() {
  const webringContainer = document.getElementById(WebringGridId);
  webringContainer.innerHTML = "";

  const errorMsg = document.createElement("p");
  errorMsg.className = "text-bc-maroon font-bold py-4 text-center";
  errorMsg.textContent = "Error loading members' data. Please try refreshing the page.";
  
  webringContainer.appendChild(errorMsg);
}

function handleRouting(members) {
  if (!members || members.length === 0) return false;

  const urlParams = new URLSearchParams(window.location.search);
  const action = urlParams.get("action");

  if (!action) return false;

  const fromSite = urlParams.get("from");
  const currentSite = fromSite ? normalizeSiteUrl(fromSite) : "";
  const currentIndex = members.findIndex(m => normalizeSiteUrl(m.site) === currentSite);

  let targetIndex;

  if (action === "next") {
    targetIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % members.length;
  } else if (action === "prev") {
    targetIndex = currentIndex === -1 ? members.length - 1 : (currentIndex - 1 + members.length) % members.length;
  } else {
    return false;
  }

  const targetSite = members[targetIndex].site;
  const targetUrl = targetSite.startsWith("http") ? targetSite : `https://${targetSite}`;

  window.location.replace(targetUrl);

  return true;
}

function normalizeMembers(membersData) {
  return membersData.map(member => ({
    name: normalizeField(member.name),
    year: normalizeField(member.year),
    schoolAcronym: normalizeField(abbreviateSchool(member.school)),
    school: normalizeField(member.school),
    displaySite: normalizeSiteUrl(member.site),
    site: member.site
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
    anchor.textContent = member.displaySite;

    fragment.appendChild(anchor);
  }

  webringContainer.appendChild(fragment);
}

function setUpSearchListener() {
  const input = document.getElementById(SearchBarId);

  if (!input) return;

  input.addEventListener("input", (event) => {
    const query = normalizeField(event.target.value);
    const filteredMembers = allMembers.filter(member =>
      (member.name && member.name.includes(query)) ||
      (member.year && member.year.includes(query)) ||
      (member.school && member.school.includes(query)) ||
      (member.schoolAcronym && member.schoolAcronym.includes(query)) ||
      (member.site && member.site.includes(query))
    );
    
    initializeWebringGrid(filteredMembers);
  });
}

async function initialize() {
  try {
    const isRedirecting = handleRouting(membersSorted);

    if (isRedirecting) return;

    allMembers = normalizeMembers(membersSorted);

    initializeWebringGrid(allMembers);
    setUpSearchListener();
  } catch (error) {
    console.error("Failed to load webring member data:", error);
    displayWebringGridError();
  }
}

initialize();
