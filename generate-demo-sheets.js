import XLSX from 'xlsx';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo Sheet 1: IPL Style Teams
const iplTeams = [
  // Mumbai Indians
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Rohit Sharma', 'Role': 'batsman', 'Jersey Number': 45 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Ishan Kishan', 'Role': 'wicket-keeper', 'Jersey Number': 32 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Suryakumar Yadav', 'Role': 'batsman', 'Jersey Number': 63 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Tilak Varma', 'Role': 'batsman', 'Jersey Number': 9 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Hardik Pandya', 'Role': 'all-rounder', 'Jersey Number': 33 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Jasprit Bumrah', 'Role': 'bowler', 'Jersey Number': 93 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Arjun Tendulkar', 'Role': 'all-rounder', 'Jersey Number': 19 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Jason Behrendorff', 'Role': 'bowler', 'Jersey Number': 88 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Piyush Chawla', 'Role': 'bowler', 'Jersey Number': 3 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Tim David', 'Role': 'batsman', 'Jersey Number': 8 },
  { 'Team Name': 'Mumbai Indians', 'Player Name': 'Cameron Green', 'Role': 'all-rounder', 'Jersey Number': 67 },

  // Chennai Super Kings
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'MS Dhoni', 'Role': 'wicket-keeper', 'Jersey Number': 7 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Ruturaj Gaikwad', 'Role': 'batsman', 'Jersey Number': 31 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Devon Conway', 'Role': 'batsman', 'Jersey Number': 88 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Ajinkya Rahane', 'Role': 'batsman', 'Jersey Number': 27 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Ravindra Jadeja', 'Role': 'all-rounder', 'Jersey Number': 8 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Moeen Ali', 'Role': 'all-rounder', 'Jersey Number': 18 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Deepak Chahar', 'Role': 'bowler', 'Jersey Number': 90 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Tushar Deshpande', 'Role': 'bowler', 'Jersey Number': 43 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Matheesha Pathirana', 'Role': 'bowler', 'Jersey Number': 63 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Shivam Dube', 'Role': 'all-rounder', 'Jersey Number': 55 },
  { 'Team Name': 'Chennai Super Kings', 'Player Name': 'Maheesh Theekshana', 'Role': 'bowler', 'Jersey Number': 99 },
];

// Demo Sheet 2: Local League Teams
const localTeams = [
  // Rising Stars
  { 'Team Name': 'Rising Stars', 'Player Name': 'Rajesh Kumar', 'Role': 'batsman', 'Jersey Number': 1 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Amit Singh', 'Role': 'wicket-keeper', 'Jersey Number': 2 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Vijay Sharma', 'Role': 'batsman', 'Jersey Number': 3 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Suresh Patel', 'Role': 'all-rounder', 'Jersey Number': 4 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Ramesh Yadav', 'Role': 'bowler', 'Jersey Number': 5 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Prakash Verma', 'Role': 'bowler', 'Jersey Number': 6 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Dinesh Gupta', 'Role': 'all-rounder', 'Jersey Number': 7 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Anil Reddy', 'Role': 'batsman', 'Jersey Number': 8 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Sanjay Mehta', 'Role': 'bowler', 'Jersey Number': 9 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Kiran Joshi', 'Role': 'batsman', 'Jersey Number': 10 },
  { 'Team Name': 'Rising Stars', 'Player Name': 'Mohan Das', 'Role': 'bowler', 'Jersey Number': 11 },

  // Thunder Strikers
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Arjun Malhotra', 'Role': 'batsman', 'Jersey Number': 12 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Rahul Kapoor', 'Role': 'wicket-keeper', 'Jersey Number': 13 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Vikram Chauhan', 'Role': 'batsman', 'Jersey Number': 14 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Naveen Kumar', 'Role': 'all-rounder', 'Jersey Number': 15 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Manoj Tiwari', 'Role': 'bowler', 'Jersey Number': 16 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Ashok Pandey', 'Role': 'bowler', 'Jersey Number': 17 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Deepak Singh', 'Role': 'all-rounder', 'Jersey Number': 18 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Praveen Nair', 'Role': 'batsman', 'Jersey Number': 19 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Rohit Jain', 'Role': 'bowler', 'Jersey Number': 20 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Sandeep Bhat', 'Role': 'batsman', 'Jersey Number': 21 },
  { 'Team Name': 'Thunder Strikers', 'Player Name': 'Govind Raj', 'Role': 'bowler', 'Jersey Number': 22 },
];

// Create Excel files
const ws1 = XLSX.utils.json_to_sheet(iplTeams);
const wb1 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb1, ws1, 'Teams');
XLSX.writeFile(wb1, join(__dirname, 'public/demo-sheets/demo_ipl_teams.xlsx'));

const ws2 = XLSX.utils.json_to_sheet(localTeams);
const wb2 = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb2, ws2, 'Teams');
XLSX.writeFile(wb2, join(__dirname, 'public/demo-sheets/demo_local_teams.xlsx'));

console.log('✅ Demo Excel sheets created successfully!');
console.log('📁 Files created:');
console.log('   - public/demo-sheets/demo_ipl_teams.xlsx (Mumbai Indians vs Chennai Super Kings)');
console.log('   - public/demo-sheets/demo_local_teams.xlsx (Rising Stars vs Thunder Strikers)');
