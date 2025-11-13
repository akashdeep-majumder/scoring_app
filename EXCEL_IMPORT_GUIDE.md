# Excel Import Guide

Import multiple teams and players quickly using Excel spreadsheets.

## Quick Start

1. **Download Template**: Click "Template" button in tournament view
2. **Fill Data**: Add your teams and players in Excel
3. **Upload**: Click "Import Excel" and select your file
4. **Done**: All teams and players imported automatically!

## Excel File Format

### Required Columns

Your Excel file must have these column headers (case-insensitive):

| Column Name | Required | Valid Values | Description |
|------------|----------|--------------|-------------|
| Team Name | ✅ Yes | Any text | Name of the team |
| Player Name | ✅ Yes | Any text | Name of the player |
| Role | ✅ Yes | batsman, bowler, all-rounder, wicket-keeper | Player's role |
| Jersey Number | ❌ No | 1-99 | Player's jersey number |

### Column Name Variations

The system accepts multiple variations of column names:
- **Team Name**: `Team Name`, `TeamName`, `team_name`
- **Player Name**: `Player Name`, `PlayerName`, `player_name`
- **Role**: `Role`, `role`
- **Jersey Number**: `Jersey Number`, `JerseyNumber`, `jersey_number`

## Valid Roles

Only these roles are accepted (case-insensitive):
- `batsman`
- `bowler`
- `all-rounder`
- `wicket-keeper`

Any other role will default to `batsman`.

## Example Format

```
| Team Name          | Player Name      | Role           | Jersey Number |
|--------------------|------------------|----------------|---------------|
| Mumbai Indians     | Rohit Sharma     | batsman        | 45            |
| Mumbai Indians     | Jasprit Bumrah   | bowler         | 93            |
| Chennai Super Kings| MS Dhoni         | wicket-keeper  | 7             |
| Chennai Super Kings| Ravindra Jadeja  | all-rounder    | 8             |
```

## Demo Files Included

### 1. demo_ipl_teams.xlsx
**Location**: `public/demo-sheets/demo_ipl_teams.xlsx`

**Contains**:
- **Mumbai Indians** (11 players)
  - Rohit Sharma, Ishan Kishan, Suryakumar Yadav, Tilak Varma
  - Hardik Pandya, Jasprit Bumrah, Arjun Tendulkar
  - Jason Behrendorff, Piyush Chawla, Tim David, Cameron Green

- **Chennai Super Kings** (11 players)
  - MS Dhoni, Ruturaj Gaikwad, Devon Conway, Ajinkya Rahane
  - Ravindra Jadeja, Moeen Ali, Deepak Chahar
  - Tushar Deshpande, Matheesha Pathirana, Shivam Dube, Maheesh Theekshana

**Use Case**: IPL-style fantasy matches, professional team format

### 2. demo_local_teams.xlsx
**Location**: `public/demo-sheets/demo_local_teams.xlsx`

**Contains**:
- **Rising Stars** (11 players)
  - Rajesh Kumar, Amit Singh, Vijay Sharma, Suresh Patel
  - Ramesh Yadav, Prakash Verma, Dinesh Gupta
  - Anil Reddy, Sanjay Mehta, Kiran Joshi, Mohan Das

- **Thunder Strikers** (11 players)
  - Arjun Malhotra, Rahul Kapoor, Vikram Chauhan, Naveen Kumar
  - Manoj Tiwari, Ashok Pandey, Deepak Singh
  - Praveen Nair, Rohit Jain, Sandeep Bhat, Govind Raj

**Use Case**: Local leagues, community matches, practice games

## How to Use Demo Files

### Option 1: Use As-Is
1. Navigate to a tournament
2. Click "Import Excel"
3. Select `public/demo-sheets/demo_ipl_teams.xlsx` or `demo_local_teams.xlsx`
4. Teams imported instantly!

### Option 2: Customize
1. Copy one of the demo files
2. Open in Excel/Google Sheets/LibreOffice
3. Edit team names and player details
4. Save the file
5. Import into the app

## Creating Your Own Excel File

### Step 1: Set Up Columns
Create a new Excel file with these headers in row 1:
```
Team Name | Player Name | Role | Jersey Number
```

### Step 2: Add Teams and Players
For each player, add a new row:
```
Team A | John Doe | batsman | 10
Team A | Jane Smith | bowler | 11
Team B | Bob Wilson | all-rounder | 5
```

**Tips:**
- Group all players of the same team together (easier to read)
- Use consistent role names
- Jersey numbers are optional but recommended
- You can have different number of players per team

### Step 3: Save and Import
1. Save as `.xlsx` or `.xls` format
2. Go to tournament in the app
3. Click "Import Excel"
4. Select your file
5. Verify import was successful

## Tips & Best Practices

### ✅ Do's

- **Use the template**: Click "Template" to download pre-formatted Excel
- **Test with demo files**: Try importing demo files first to understand format
- **One team per tournament**: Import all teams for a tournament at once
- **Consistent naming**: Use consistent role names (all lowercase recommended)
- **Verify after import**: Check all teams and players imported correctly

### ❌ Don'ts

- **Don't use special characters** in team/player names (stick to letters, numbers, spaces)
- **Don't skip required columns**: Team Name, Player Name, and Role are mandatory
- **Don't use invalid roles**: Stick to the 4 valid roles listed above
- **Don't mix formats**: Use either `.xlsx` or `.xls`, not CSV or other formats
- **Don't import duplicate teams**: Teams with same name will create duplicates

## Troubleshooting

### Import Failed
**Possible Causes:**
- File format is not `.xlsx` or `.xls`
- Missing required columns
- File is corrupted

**Solution:**
- Download template and copy your data
- Ensure all required columns exist
- Try saving file again

### Players Not Imported
**Possible Causes:**
- Empty rows in Excel
- Team Name or Player Name is blank
- Special characters in names

**Solution:**
- Remove empty rows
- Ensure all required fields are filled
- Use simple alphanumeric names

### Wrong Roles Assigned
**Possible Causes:**
- Typo in role name
- Using invalid role value

**Solution:**
- Use exact role names: `batsman`, `bowler`, `all-rounder`, `wicket-keeper`
- Check for extra spaces or capital letters
- When in doubt, use lowercase

### No Jersey Numbers
**Possible Causes:**
- Jersey Number column missing or wrong name
- Non-numeric values

**Solution:**
- Jersey numbers are optional, it's okay if missing
- Ensure column name matches one of the variations
- Use numbers only (1-99)

## Advanced Usage

### Multiple Teams
Import as many teams as you want in a single file:
```
Team A | Player 1 | batsman | 1
Team A | Player 2 | bowler | 2
Team B | Player 3 | batsman | 3
Team B | Player 4 | bowler | 4
Team C | Player 5 | all-rounder | 5
Team C | Player 6 | wicket-keeper | 6
```

### Unequal Team Sizes
Teams don't need to have the same number of players:
```
Big Team | Player 1 | batsman | 1
Big Team | Player 2 | bowler | 2
...
Big Team | Player 15 | batsman | 15

Small Team | Player 1 | batsman | 20
Small Team | Player 2 | bowler | 21
```

### No Jersey Numbers
Jersey numbers are completely optional:
```
Team Name | Player Name | Role | Jersey Number
Team A    | John        | batsman |
Team A    | Jane        | bowler  |
```

## Excel Formulas

You can use Excel formulas to generate data:

### Auto-increment Jersey Numbers
```excel
=ROW()-1  // In Jersey Number column, starting from row 2
```

### Generate Player Names
```excel
="Player " & ROW()-1
```

### Copy Role from Template
Use fill-down feature to copy roles quickly

## Exporting Teams

Currently, the app supports **import only**. Export feature can be added in future versions.

**Workaround for Export:**
1. Open browser console (F12)
2. Copy tournament data from localStorage
3. Parse and convert to Excel format manually
4. Or manually recreate Excel file from team data

## FAQ

**Q: Can I import CSV files?**
A: No, only `.xlsx` and `.xls` formats are supported.

**Q: What happens if I import twice?**
A: Teams will be duplicated. Each import creates new teams.

**Q: Can I update existing teams via import?**
A: No, import only adds new teams. Delete old teams first if needed.

**Q: Maximum file size?**
A: No hard limit, but keep it reasonable. 100+ teams should work fine.

**Q: Can I add team photos via Excel?**
A: No, team photos must be uploaded manually after import.

**Q: What if column names don't match exactly?**
A: System accepts variations like "TeamName", "team_name", "Team Name".

**Q: Can I import players to existing team?**
A: No, Excel import creates new teams. Add players manually to existing teams.

## Related Documentation

- [README.md](README.md) - Full application documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - Technical architecture

---

**Need Help?** Check the on-screen instructions in the app or refer to demo files for examples.
