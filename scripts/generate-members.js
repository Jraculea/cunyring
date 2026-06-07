import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const MEMBERS_DIRECTORY = path.join(process.cwd(), 'members');
const OUTPUT_FILE = path.join(process.cwd(), 'src', 'members-sorted.json');

function getGitCreationDate(filePath) {
  try {
    // Queries Git for the ISO timestamp of the very first commit containing this file
    const stdout = execSync(
      `git log --diff-filter=A --format=%aI -n 1 -- "${filePath}"`,
      { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    
    const dateStr = stdout.trim();
    
    // Fallback to current file system time if the file hasn't been committed to Git yet (local testing)
    return dateStr ? new Date(dateStr) : fs.statSync(filePath).birthtime;
  } catch (error) {
    // Fallback if Git isn't initialized or available locally
    console.log("Error occurred while fetching Git creation date; Git not initialized or available locally? | ", error.message);

    return fs.statSync(filePath).birthtime;
  }
}

function generateMembers() {
  console.log('🔄 Syncing webring member timeline from Git logs...');

  if (!fs.existsSync(MEMBERS_DIRECTORY)) {
    console.error(`❌ Error: ${MEMBERS_DIRECTORY} directory does not exist.`);

    process.exit(1);
  }

  const files = fs.readdirSync(MEMBERS_DIRECTORY).filter(file => file.endsWith('.json'));
  const membersList = [];

  for (const file of files) {
    const filePath = path.join(MEMBERS_DIRECTORY, file);
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);
      const memberData = Array.isArray(data) ? data[0] : data;

      if (!memberData || !memberData.site) {
        console.warn(`⚠️ Skipping ${file}: Missing valid site data.`);
        continue;
      }

      const joinedDate = getGitCreationDate(filePath);

      membersList.push({
        ...memberData,
        _joinTime: joinedDate.getTime()
      });
    } catch (err) {
      console.error(`❌ Failed parsing file ${file}:`, err.message);
    }
  }

  // Sort from oldest (smallest timestamp) to newest (largest timestamp)
  membersList.sort((a, b) => a._joinTime - b._joinTime);

  // Write out the clean, chronological array for your frontend to consume
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(membersList, null, 2), 'utf-8');
  console.log(`✅ Webring generated successfully! Total members: ${membersList.length}`);
}

generateMembers();
