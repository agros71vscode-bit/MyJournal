//This scipt loads your saved journal entries from local storage, or 
//starts fresh with an empty list if none exist.
let journal=JSON.parse(localStorage.getItem('journal')||'[]');
  /* This script looks in the browser’s local storage for something saved under 
  the name "journal". If it finds it, it takes that stored text (which should be JSON) 
  and turns it back into a JavaScript object/array. If it doesn’t find anything, it just 
  uses an empty array ([]) instead.*/

//This script check wether it new entry is being created or an existing one is being edited. 
let editingId=null;
 /*If editingId has a value, it means we are updating an existing entry. It finds that entry in 
 the journal array using the ID, updates its date, category, and entry text with the new values
 from the input fields, and then resets editingId to null to indicate that we are no longer in
 edit mode. It also changes the button text back to "Save Entry". If editingId is null, it 
 means we are creating a new entry, so it pushes a new object with a unique ID (using 
 Date.now()), date, category, and entry text into the journal array.  After either operation, 
 it sorts the journal entries by date in descending order, clears  the input fields, resets 
 the date input to the current date and time, and calls render() to update the displayed list 
 of entries.*/

//This is the 1st function, it declare a function we call nowValue()
function nowValue()
//START:  the body of the "function nowValue()", which calculates the current date and 
// time in a format suitable for the date input field.
{const d=new Date();  //This creates a new Date object representing the current date and time.
 d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
 return d.toISOString().slice(0,16);}

 document.getElementById('dateInput').value=nowValue();

function persist(){
 localStorage.setItem('journal',JSON.stringify(journal));
 }

function badge(cat){
 return '<span class="badge">'+cat+'</span>';
}

function render(data=journal){
 const tb=document.getElementById('tbody');
 tb.innerHTML='';
 data.forEach(item=>{
  tb.innerHTML+=`<tr>
  <td>${new Date(item.date).toLocaleString()}</td>
  <td>${badge(item.category)}</td>
  <td>${item.entry.replace(/</g,'&lt;')}</td>
  <td>
  <button class="edit" onclick="editEntry(${item.id})">Edit</button>
  <button class="delete" onclick="deleteEntry(${item.id})">Delete</button>
  </td></tr>`;
 });
 document.getElementById('entryCount').innerText=journal.length+' entries';
 persist();
}

function saveEntry(){
 const date=dateInput.value;
 const category=categoryInput.value;
 const entry=entryInput.value.trim();
 if(!date||!entry){alert('Complete all fields');return;}

 if(editingId){
   const item=journal.find(x=>x.id===editingId);
   item.date=date; item.category=category; item.entry=entry;
   editingId=null;
   saveBtn.innerText='Save Entry';
 }else{
   journal.push({id:Date.now(),date,category,entry});
 }
 journal.sort((a,b)=>new Date(b.date)-new Date(a.date));
 entryInput.value='';
 dateInput.value=nowValue();
 render();
}

function editEntry(id){
 const item=journal.find(x=>x.id===id);
 if(!item) return;
 editingId=id;
 dateInput.value=item.date;
 categoryInput.value=item.category;
 entryInput.value=item.entry;
 saveBtn.innerText='Update Entry';
 window.scrollTo({top:0,behavior:'smooth'});
}

function deleteEntry(id){
 if(!confirm('Delete this entry?')) return;
 journal=journal.filter(x=>x.id!==id);
 render();
}

function filterEntries(){
 const q=searchBar.value.toLowerCase();
 render(journal.filter(x=>
 x.date.toLowerCase().includes(q)||
 x.category.toLowerCase().includes(q)||
 x.entry.toLowerCase().includes(q)
 ));
}

// ==========================================
// EXPORT CSV FUNCTION (Choose Save Location)
// ==========================================

// "async" allows us to use "await"
// because we must wait for the user
// to choose where to save the file.
async function exportCSV(){

    // ======================================
    // STEP 1 - Create CSV text
    // ======================================

    // Create the header row
    let csv = "Date,Category,Entry\n";

    // Convert each journal entry
    // into a CSV row
    journal.forEach(item => {

        csv +=
            `"${item.date}",` +
            `"${item.category}",` +
            `"${item.entry.replace(/"/g,'""')}"\n`;

    });


    // ======================================
    // STEP 2 - Ask user where to save file
    // ======================================

    // Open the browser's Save As dialog
   // Create unique filename
const now = new Date();

const fileName =
    `journal-${now.getFullYear()}-${
        String(now.getMonth()+1).padStart(2,'0')
    }-${
        String(now.getDate()).padStart(2,'0')
    }-${
        String(now.getHours()).padStart(2,'0')
    }-${
        String(now.getMinutes()).padStart(2,'0')
    }-${
        String(now.getSeconds()).padStart(2,'0')
    }.csv`;

// Open Save As dialog
const handle =
    await window.showSaveFilePicker({

        suggestedName: fileName,

        types: [{
            description: "CSV Files",

            accept: {
                "text/csv": [".csv"]
            }
        }]
    });

    // ======================================
    // STEP 3 - Create writable file stream
    // ======================================

    // Prepare the selected file
    // so we can write data into it
    const writable =
        await handle.createWritable();


    // ======================================
    // STEP 4 - Write CSV data into file
    // ======================================

    // Save the CSV text
    await writable.write(csv);


    // ======================================
    // STEP 5 - Close file
    // ======================================

    // Finalize and save the file
    await writable.close();


    // ======================================
    // STEP 6 - Notify user
    // ======================================

    alert("CSV exported successfully.");

}

// ==========================================
// IMPORT CSV FUNCTION
// ==========================================

function importCSV(){

    // Find the hidden file picker
    const fileInput =
        document.getElementById("importFile");

    // Open the file picker window
    fileInput.click();

    // Run this code after the user selects a file
    fileInput.onchange = function(e){

        // Get the selected file
        const file = e.target.files[0];

        // Stop if no file was selected
        if(!file) return;

        // Create a file reader
        const reader = new FileReader();

        // Run this after the file has been read
        reader.onload = function(event){

            // Get all text from the CSV file
            const csvText = event.target.result;

            // Split the file into rows
            const rows = csvText.trim().split("\n");

            // Remove the first row
            // because it contains:
            // Date,Category,Entry
            rows.shift();

            // Process each journal row
            rows.forEach(row => {

                // Example row:
                // "2026-06-09","Daily Log","Learned JavaScript"

                const parts = row.split('","');

                // If something is wrong with the row,
                // skip it
                if(parts.length < 3) return;

                // Create a new journal object
                const newEntry = {

                    // Generate a unique ID
                    id: Date.now() + Math.random(),

                    // Remove quotation marks
                    date: parts[0].replace(/"/g,''),

                    // Remove quotation marks
                    category: parts[1].replace(/"/g,''),

                    // Remove quotation marks
                    entry: parts[2].replace(/"/g,'')

                };

                // Add entry into journal array
                journal.push(newEntry);

            });

            // Save everything to local storage
            persist();

            // Refresh table display
            render();

            // Show success message
            alert("CSV imported successfully");

        };

        // Read the file as plain text
        reader.readAsText(file);

    };
}
render();
