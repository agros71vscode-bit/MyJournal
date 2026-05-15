// --- VERSION NOTE: DAILY PULSE V1.1.1 JAVASCRIPT ---
// This file contains all the JavaScript code for the My Journal web application, including Firebase integration, event handling, and dynamic rendering of journal entries. It connects to Firebase Firestore to store and retrieve journal memories in real-time, allowing users to create, edit, and delete entries with various moods, types, and optional images. The code also manages the user interface interactions such as form handling, checkbox visibility based on entry type, and formatting of dates for display.

// Connection to Firebase and Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"; // Importing necessary functions from Firebase SDK for app initialization and Firestore operations
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js"; // Importing Firestore functions for database operations such as adding, querying, updating, and deleting documents in the Firestore database

// Firebase Configuration (Connecting to your project)
const firebaseConfig = { // from your Firebase project settings, this object contains all the necessary keys and identifiers to connect your web app to the correct Firebase project and Firestore database
    apiKey: "AIzaSyCIYjZvw1rWr6Ptda2mk9dGX9xyVMoM_W4",
    authDomain: "gemini-journal---firebase.firebaseapp.com",
    projectId: "gemini-journal---firebase",
    storageBucket: "gemini-journal---firebase.firebasestorage.app",
    messagingSenderId: "876671563015",
    appId: "1:876671563015:web:83855c77a72b08ebd141a2"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig); //initializes the Firebase app using the provided configuration, establishing a connection to the Firebase services associated with your project
const db = getFirestore(app); //initializes Firestore and connects it to the Firebase app
const colRef = collection(db, "journal_memories");//creates a reference to the "journal_memories" collection in Firestore, which is where all journal entries will be stored and retrieved from

let editId = null; // Keeps track of which ID we are editing (if any)

// Utility: Converts images to a text string for easy cloud storage
const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// Utility: Formats date to "Tuesday, May 12, 2026, 9:00 AM"
const getFormattedDate = (dateObj) => {
    return dateObj.toLocaleString('en-US', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true 
    });
};

// Function: Updates the type UI and optionally sets a starter emoji when the input is empty
const updateTypeUI = () => {
    const type = document.getElementById('typeSelect').value;
    const input = document.getElementById('entryInput');
    const checkboxWrap = document.getElementById('actionCheckboxWrap');

    // Show checkbox icon ONLY if "Action" is selected
    checkboxWrap.style.display = (type === "Action") ? "block" : "none";

    // Only add a starter emoji when the text box is empty
    if (!input.value.trim()) {
        if (type === "Note") input.value = "📝 ";
        else if (type === "Action") input.value = "⚡ ";
        else if (type === "Event") input.value = "📅 ";
        else if (type === "Other") input.value = "🌀 ";
    }
};

const handleTypeChange = () => {
    updateTypeUI();
};

// Setup listeners when the browser finished loading the HTML
window.addEventListener('DOMContentLoaded', () => {// Waits for the DOM to be fully loaded before running the code inside this function, ensuring that all HTML elements are available for manipulation
    document.getElementById('currentDate').innerText = getFormattedDate(new Date());
    document.getElementById('saveBtn').addEventListener('click', saveEntry);
    document.getElementById('typeSelect').addEventListener('change', handleTypeChange);
    
    // Start with empty box (shows "What's on your mind?")
    document.getElementById('entryInput').value = ""; 
});

// Real-time listener: Updates the list automatically when Firebase data changes
const q = query(colRef, orderBy("date", "desc"));
onSnapshot(q, (snapshot) => {
    const memories = [];
    snapshot.docs.forEach((doc) => {
        memories.push({ ...doc.data(), id: doc.id });
    });
    render(memories);
});

// Main function to save data to the cloud
async function saveEntry() {
    const input = document.getElementById('entryInput');
    const mood = document.getElementById('moodSelect');
    const type = document.getElementById('typeSelect');
    const completed = document.getElementById('isCompleted');
    const fileInput = document.getElementById('fileInput');
    const saveBtn = document.getElementById('saveBtn');
    const file = fileInput.files[0];
    let imageData = null;

    if (!input.value.trim() && !file) return;

    saveBtn.innerText = "Saving...";
    saveBtn.disabled = true;

    try {
        if (file) imageData = await toBase64(file);

        const entryData = {
            text: input.value,
            mood: mood.value,
            type: type.value,
            completed: type.value === "Action" ? completed.checked : false,
            image: imageData || null,
            date: new Date().toISOString()
        };

        if (editId) {
            // Update existing entry
            await updateDoc(doc(db, "journal_memories", editId), entryData);
            editId = null;
        } else {
            // Add new entry
            await addDoc(colRef, entryData);
        }
        
        // Reset the input form to original state
        input.value = '';
        fileInput.value = '';
        completed.checked = false;
        document.getElementById('actionCheckboxWrap').style.display = "none";
    } catch (error) {
        console.error(error);
        alert("Error saving!");
    } finally {
        saveBtn.innerText = "Save Entry";
        saveBtn.disabled = false;
    }
}

// Global Delete Function
window.deleteEntry = async (id) => {
    if (confirm("Delete memory?")) await deleteDoc(doc(db, "journal_memories", id));
};

// Global Edit Function: populates the text box with old data
window.editEntry = (id, encodedText, mood, type, completed) => {
    // 1. Recover the original text (including emojis)
    const decodedText = decodeURIComponent(encodedText);
    
    // 2. Fill the form fields with the existing data
    document.getElementById('entryInput').value = decodedText;
    document.getElementById('moodSelect').value = mood;
    document.getElementById('typeSelect').value = type;
    
    // 3. Set the checkbox status
    const checkbox = document.getElementById('isCompleted');
    if (checkbox) {
        checkbox.checked = completed;
    }
    
    // 4. Prepare for update
    editId = id; 
    document.getElementById('saveBtn').innerText = "Update Entry";
    
    // 5. Update UI visibility (shows checkbox if type is Action) without overwriting the existing text
    updateTypeUI(); 
    
    // 6. Scroll to top so you can see the editor
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function render(memories) {
    const list = document.getElementById('memoriesList');
    list.innerHTML = memories.map((m) => {
        // We removed 'disabled' so you can interact with it in the feed
        // We added 'onchange' to update the database immediately
        const checkboxHTML = m.type === "Action" 
            ? `<input type="checkbox" ${m.completed ? 'checked' : ''} 
                onchange="toggleCompleteFromFeed('${m.id}', this.checked)" 
                style="flex-shrink: 0; margin-top: 2px;">` 
            : '';

        return `
          <div class="memory-item">
            <div class="memory-meta">
                <span>${getFormattedDate(new Date(m.date))}</span>
                <span>${m.mood || '😐'} | <span class="tag">${m.type || 'Note'}</span></span>
            </div>
            <div class="memory-text">
                ${checkboxHTML}<span>${m.text}</span>
            </div>
            ${m.type === "Action" && m.completed ? `<span class="status-done">✅ Completed</span>` : ''}
            ${m.image ? `<img src="${m.image}" class="preview-img">` : ''}
            <div class="item-actions">
              <span class="action-link" style="color: #6366f1;" onclick="editEntry('${m.id}', '${encodeURIComponent(m.text)}', '${m.mood}', '${m.type}', ${m.completed})">Edit</span>
              <span class="action-link" style="color: #ef4444;" onclick="deleteEntry('${m.id}')">Delete</span>
            </div>
          </div>
        `;
    }).join('');
}

window.toggleCompleteFromFeed = async (id, isChecked) => {
    try {
        await updateDoc(doc(db, "journal_memories", id), {
            completed: isChecked
        });
    } catch (error) {
        console.error("Error updating status:", error);
    }
};