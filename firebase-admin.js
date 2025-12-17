// Firebase Admin Panel Integration

// Listen for real-time users updates
function initFirebaseRealtimeSync() {
    if (typeof firebase === 'undefined' || !firebase.database) {
        console.error('Firebase not initialized');
        return;
    }

    console.log('🔥 Initializing Firebase real-time sync...');

    // Listen to users changes
    database.ref('users').on('value', (snapshot) => {
        const users = [];
        snapshot.forEach((childSnapshot) => {
            users.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        
        console.log('📊 Firebase users updated:', users.length);
        
        // Update admin panel if UIManager exists
        if (typeof UIManager !== 'undefined') {
            UIManager.renderUsers(users);
            UIManager.updateStats();
        }
    });

    // Listen to logs changes
    database.ref('logs').on('value', (snapshot) => {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
            logs.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        
        console.log('📝 Firebase logs updated:', logs.length);
        
        // Update admin panel if UIManager exists
        if (typeof UIManager !== 'undefined') {
            UIManager.renderLogs(logs);
        }
    });

    // Listen to projects changes
    database.ref('projects').on('value', (snapshot) => {
        const projects = [];
        snapshot.forEach((childSnapshot) => {
            projects.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        
        console.log('🚀 Firebase projects updated:', projects.length);
        console.log('📋 Projects:', projects);
        
        // Count active projects
        const activeProjects = projects.filter(p => p.status === 'Active');
        console.log('✨ Active projects:', activeProjects.length);
        
        // Update admin panel if UIManager exists
        if (typeof UIManager !== 'undefined') {
            console.log('📊 Updating admin panel projects...');
            UIManager.renderProjects(projects);
            UIManager.updateStats();
        } else {
            console.warn('⚠️ UIManager not available');
        }
        
        // Update main site if displayProjects exists
        if (typeof displayProjects !== 'undefined') {
            console.log('🌐 Updating main site projects...');
            displayProjects(projects);
        } else {
            console.warn('⚠️ displayProjects not available on main site');
        }
    });

    // Listen to messages changes
    database.ref('messages').on('value', (snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        
        console.log('💬 Firebase messages updated:', messages.length);
        
        // Update admin panel if UIManager exists
        if (typeof UIManager !== 'undefined') {
            UIManager.renderMessages(messages);
            UIManager.updateStats();
        }
    });

    // Listen to settings changes (for real-time maintenance mode, theme, etc.)
    database.ref('settings').on('value', (snapshot) => {
        const settings = snapshot.val() || {};
        console.log('⚙️ Firebase settings updated:', settings);
        
        // Update main site if applySiteSettings exists
        if (typeof applySettingsToUI !== 'undefined') {
            applySettingsToUI(settings);
        }
    });

    console.log('✅ Firebase real-time sync active');
}

// Save user to Firebase
function saveUserToFirebase(userData) {
    const userRef = database.ref('users/' + userData.id);
    return userRef.set(userData);
}

// Delete user from Firebase
function deleteUserFromFirebase(userId) {
    return database.ref('users/' + userId).remove();
}

// Save project to Firebase
function saveProjectToFirebase(projectData) {
    if (!projectData.id) {
        const projectRef = database.ref('projects').push();
        projectData.id = projectRef.key;
    }
    return database.ref('projects/' + projectData.id).set(projectData);
}

// Delete project from Firebase
function deleteProjectFromFirebase(projectId) {
    return database.ref('projects/' + projectId).remove();
}

// Save message to Firebase
function saveMessageToFirebase(messageData) {
    if (!messageData.id) {
        const messageRef = database.ref('messages').push();
        messageData.id = messageRef.key;
    }
    return database.ref('messages/' + messageData.id).set(messageData);
}

// Delete message from Firebase
function deleteMessageFromFirebase(messageId) {
    return database.ref('messages/' + messageId).remove();
}

// Get all users from Firebase
function getAllUsersFromFirebase() {
    return database.ref('users').once('value').then((snapshot) => {
        const users = [];
        snapshot.forEach((childSnapshot) => {
            users.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        return users;
    });
}

// Get all projects from Firebase
function getAllProjectsFromFirebase() {
    return database.ref('projects').once('value').then((snapshot) => {
        const projects = [];
        snapshot.forEach((childSnapshot) => {
            projects.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        return projects;
    });
}

// Get all messages from Firebase
function getAllMessagesFromFirebase() {
    return database.ref('messages').once('value').then((snapshot) => {
        const messages = [];
        snapshot.forEach((childSnapshot) => {
            messages.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        return messages;
    });
}

// Get all logs from Firebase
function getAllLogsFromFirebase() {
    return database.ref('logs').once('value').then((snapshot) => {
        const logs = [];
        snapshot.forEach((childSnapshot) => {
            logs.push({
                ...childSnapshot.val(),
                id: childSnapshot.key
            });
        });
        return logs;
    });
}

// Get settings from Firebase
function getSettingsFromFirebase() {
    return database.ref('settings').once('value').then((snapshot) => {
        return snapshot.val() || {};
    });
}

// Reset all Firebase data (for production cleanup)
function resetAllFirebaseData() {
    console.log('🔄 Resetting all Firebase data...');
    
    return Promise.all([
        database.ref('users').remove(),
        database.ref('projects').remove(),
        database.ref('messages').remove(),
        database.ref('logs').remove()
    ]).then(() => {
        console.log('✅ All Firebase data reset successfully');
        
        // Initialize with default admin user
        const adminUser = {
            id: 'admin_' + Date.now(),
            username: 'admin',
            email: 'admin@laurixy.com',
            password: 'admin640',
            role: 'Admin',
            status: 'Active',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        return database.ref('users/' + adminUser.id).set(adminUser);
    }).then(() => {
        console.log('✅ Admin user initialized');
    }).catch(error => {
        console.error('❌ Reset error:', error);
    });
}

// Initialize Firebase admin sync when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebaseRealtimeSync);
} else {
    initFirebaseRealtimeSync();
}
