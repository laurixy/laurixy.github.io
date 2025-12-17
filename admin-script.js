// ============ FIREBASE ONLY - NO LOCALSTORAGE ============
// All data operations use Firebase ONLY
class StorageManager {
    // Deprecated - kept for compatibility only
    static KEYS = {
        SESSION: 'laurixy_session'
    };

    // Initialize - Firebase only
    static initializeData() {
        console.log('✅ Firebase initialized - no localStorage initialization needed');
    }

    // Add log to Firebase
    static addLog(action, details) {
        if (typeof database !== 'undefined' && database) {
            const logRef = database.ref('logs').push();
            logRef.set({
                id: logRef.key,
                action,
                details,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Session management - minimal localStorage for session only
    static getSession() {
        return JSON.parse(localStorage.getItem(this.KEYS.SESSION)) || null;
    }

    static saveSession(session) {
        localStorage.setItem(this.KEYS.SESSION, JSON.stringify(session));
    }

    static clearSession() {
        localStorage.removeItem(this.KEYS.SESSION);
    }

    // Deprecated methods - kept for compatibility
    static getUsers() { return []; }
    static saveUsers() {}
    static getProjects() { return []; }
    static saveProjects() {}
    static getMessages() { return []; }
    static saveMessages() {}
    static getLogs() { return []; }
    static getContent() { return {}; }
    static saveContent() {}
    static getSettings() { return {}; }
    static saveSettings() {}

    static exportData() {
        return {
            exportedAt: new Date().toISOString(),
            note: 'All data is stored in Firebase'
        };
    }
}

// ============ UI MANAGEMENT ============
class UIManager {
    static showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    static switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.getElementById(sectionId).classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
    }

    static updateStats() {
        // Firebase ONLY
        if (typeof database !== 'undefined' && database) {
            Promise.all([
                getAllUsersFromFirebase(),
                getAllProjectsFromFirebase(),
                getAllMessagesFromFirebase()
            ]).then(([users, projects, messages]) => {
                document.getElementById('totalUsers').textContent = users.length;
                document.getElementById('totalProjects').textContent = projects.length;
                document.getElementById('totalMessages').textContent = messages.length;
                document.getElementById('activeProjects').textContent = projects.filter(p => p.status === 'Active').length;
            }).catch(error => {
                console.error('❌ Firebase stats error:', error);
                document.getElementById('totalUsers').textContent = '0';
                document.getElementById('totalProjects').textContent = '0';
                document.getElementById('totalMessages').textContent = '0';
                document.getElementById('activeProjects').textContent = '0';
            });
        } else {
            console.error('❌ Firebase not initialized');
        }
    }

    static updateActivityFeed() {
        // Firebase ONLY
        if (typeof getAllLogsFromFirebase === 'function') {
            getAllLogsFromFirebase().then(logs => {
                const feed = document.getElementById('activityFeed');

                if (logs.length === 0) {
                    feed.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><div>No activity yet</div></div>';
                    return;
                }

                feed.innerHTML = logs.slice(-10).reverse().map(log => `
                    <div class="activity-item">
                        <strong>${log.action}</strong> - ${log.description || log.details}
                        <div class="activity-time">${new Date(log.timestamp).toLocaleString()}</div>
                    </div>
                `).join('');
            });
        }
    }

    static renderUsers(usersData = null) {
        // Use provided data or fetch from Firebase ONLY
        let users = usersData;
        if (!users) {
            // Fetch from Firebase
            if (typeof getAllUsersFromFirebase === 'function') {
                getAllUsersFromFirebase().then(firebaseUsers => {
                    UIManager.renderUsers(firebaseUsers);
                });
                return;
            } else {
                console.warn('⚠️ Firebase not available');
                users = [];
            }
        }
        
        const tbody = document.getElementById('usersTableBody');

        if (!users || users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${user.username || 'N/A'}</strong></td>
                <td>${user.email}</td>
                <td><code style="background: rgba(0,217,255,0.1); padding: 2px 6px; border-radius: 3px;">${user.password || 'N/A'}</code></td>
                <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                <td><span class="status-badge status-${user.status.toLowerCase()}">${user.status || 'Active'}</span></td>
                <td>${new Date(user.lastLogin || user.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="editUser('${user.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    static renderProjects(projectsData = null) {
        let projects = projectsData;
        if (!projects) {
            if (typeof getAllProjectsFromFirebase === 'function') {
                getAllProjectsFromFirebase().then(firebaseProjects => {
                    UIManager.renderProjects(firebaseProjects);
                });
                return;
            } else {
                console.warn('⚠️ Firebase not available');
                projects = [];
            }
        }
        const tbody = document.getElementById('projectsTableBody');

        if (projects.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No projects found</td></tr>';
            return;
        }

        tbody.innerHTML = projects.sort((a, b) => a.order - b.order).map(project => `
            <tr>
                <td>${project.title}</td>
                <td>${project.category}</td>
                <td><span class="status-badge status-${project.status.toLowerCase()}">${project.status}</span></td>
                <td>${project.order}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="editProject('${project.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProject('${project.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    static renderMessages(messagesData = null) {
        let messages = messagesData;
        if (!messages) {
            if (typeof getAllMessagesFromFirebase === 'function') {
                getAllMessagesFromFirebase().then(firebaseMessages => {
                    UIManager.renderMessages(firebaseMessages);
                });
                return;
            } else {
                console.warn('⚠️ Firebase not available');
                messages = [];
            }
        }
        const tbody = document.getElementById('messagesTableBody');

        if (messages.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No messages found</td></tr>';
            return;
        }

        tbody.innerHTML = messages.map(msg => `
            <tr>
                <td>${msg.name}</td>
                <td>${msg.email}</td>
                <td>${msg.subject}</td>
                <td><span class="status-badge status-${msg.status.toLowerCase()}">${msg.status}</span></td>
                <td>${new Date(msg.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="viewMessage('${msg.id}')">View</button>
                    <button class="btn btn-small btn-danger" onclick="deleteMessage('${msg.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    }

    static renderLogs(logsData = null) {
        let logs = logsData;
        if (!logs) {
            if (typeof getAllLogsFromFirebase === 'function') {
                getAllLogsFromFirebase().then(firebaseLogs => {
                    UIManager.renderLogs(firebaseLogs);
                });
                return;
            } else {
                console.warn('⚠️ Firebase not available');
                logs = [];
            }
        }
        
        const terminal = document.getElementById('logsTerminal');

        if (!logs || logs.length === 0) {
            terminal.innerHTML = '<div style="color: var(--text-muted);">No logs yet</div>';
            return;
        }

        terminal.innerHTML = logs.map(log => `
            <div class="log-entry">
                <span class="log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
                <strong>${log.action}</strong> - ${log.description || log.details}
            </div>
        `).join('');

        terminal.scrollTop = terminal.scrollHeight;
    }
}

// ============ USER MANAGEMENT ============
let currentEditingUserId = null;

function openAddUserModal() {
    currentEditingUserId = null;
    document.getElementById('modalUserUsername').value = '';
    document.getElementById('modalUserEmail').value = '';
    document.getElementById('modalUserPassword').value = '';
    document.getElementById('modalUserRole').value = 'user';
    openModal('userModal');
}

function editUser(userId) {
    currentEditingUserId = userId;
    
    // Use Firebase if available
    if (typeof database !== 'undefined' && database) {
        database.ref('users/' + userId).once('value').then(snapshot => {
            const user = snapshot.val();
            if (!user) return;

            document.getElementById('modalUserUsername').value = user.username || '';
            document.getElementById('modalUserEmail').value = user.email;
            document.getElementById('modalUserPassword').value = user.password || '';
            document.getElementById('modalUserRole').value = user.role;
            openModal('userModal');
        });
    } else {
        // Fallback to localStorage
        const users = StorageManager.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('modalUserUsername').value = user.username || '';
        document.getElementById('modalUserEmail').value = user.email;
        document.getElementById('modalUserPassword').value = user.password || '';
        document.getElementById('modalUserRole').value = user.role;
        openModal('userModal');
    }
}

function saveUser() {
    const username = document.getElementById('modalUserUsername').value.trim();
    const email = document.getElementById('modalUserEmail').value.trim();
    const password = document.getElementById('modalUserPassword').value.trim();
    const role = document.getElementById('modalUserRole').value;

    if (!username || !email || !password) {
        UIManager.showNotification('Username, email, and password are required', 'error');
        return;
    }

    // Use Firebase if available
    if (typeof database !== 'undefined' && database && typeof saveUserToFirebase === 'function') {
        const userData = {
            id: currentEditingUserId || 'user_' + Date.now(),
            username,
            email,
            password,
            role,
            status: 'Active',
            lastLogin: new Date().toISOString()
        };
        
        // Add createdAt only for new users
        if (!currentEditingUserId) {
            userData.createdAt = new Date().toISOString();
        }
        
        saveUserToFirebase(userData).then(() => {
            const action = currentEditingUserId ? 'User Updated' : 'User Created';
            const logRef = database.ref('logs').push();
            logRef.set({
                id: logRef.key,
                action: action,
                description: `${action}: ${username} (${email})`,
                timestamp: new Date().toISOString()
            });
            console.log('✅ User saved to Firebase:', userData);
            UIManager.showNotification(currentEditingUserId ? 'User updated successfully' : 'User added successfully', 'success');
            closeModal('userModal');
        }).catch(error => {
            console.error('❌ Firebase save error:', error);
            UIManager.showNotification('Error saving user: ' + error.message, 'error');
        });
    } else {
        // Fallback to localStorage
        const users = StorageManager.getUsers();
        if (currentEditingUserId) {
            const user = users.find(u => u.id === currentEditingUserId);
            if (user) {
                user.username = username;
                user.email = email;
                user.password = password;
                user.role = role;
                StorageManager.addLog('User Updated', `Updated user: ${username} (${email})`);
                UIManager.showNotification('User updated successfully', 'success');
            }
        } else {
            users.push({
                id: 'user_' + Date.now(),
                username,
                email,
                password,
                role,
                status: 'Active',
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString()
            });
            StorageManager.addLog('User Created', `Added new user: ${username} (${email})`);
            UIManager.showNotification('User added successfully', 'success');
        }
        StorageManager.saveUsers(users);
        UIManager.renderUsers();
        closeModal('userModal');
    }
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    // Use Firebase if available
    if (typeof database !== 'undefined' && database && typeof deleteUserFromFirebase === 'function') {
        database.ref('users/' + userId).once('value').then(snapshot => {
            const user = snapshot.val();
            return deleteUserFromFirebase(userId).then(() => {
                const logRef = database.ref('logs').push();
                logRef.set({
                    id: logRef.key,
                    action: 'User Deleted',
                    description: `Deleted user: ${user ? user.email : userId}`,
                    timestamp: new Date().toISOString()
                });
                UIManager.showNotification('User deleted successfully', 'success');
            });
        }).catch(error => {
            console.error('Firebase delete error:', error);
            UIManager.showNotification('Error deleting user: ' + error.message, 'error');
        });
    } else {
        // Fallback to localStorage
        const users = StorageManager.getUsers();
        const user = users.find(u => u.id === userId);
        if (!user) return;
        const filtered = users.filter(u => u.id !== userId);
        StorageManager.saveUsers(filtered);
        StorageManager.addLog('User Deleted', `Deleted user: ${user.email}`);
        UIManager.showNotification('User deleted successfully', 'success');
        UIManager.renderUsers();
    }
}

// ============ PROJECT MANAGEMENT ============
let currentEditingProjectId = null;

function openAddProjectModal() {
    currentEditingProjectId = null;
    document.getElementById('modalProjectTitle').value = '';
    document.getElementById('modalProjectDesc').value = '';
    document.getElementById('modalProjectCategory').value = 'Website';
    document.getElementById('modalProjectImage').value = '';
    document.getElementById('modalProjectLink').value = '';
    document.getElementById('modalProjectStatus').value = 'Active';
    document.getElementById('modalProjectOrder').value = '0';
    openModal('projectModal');
}

function editProject(projectId) {
    currentEditingProjectId = projectId;
    
    // Use Firebase if available
    if (typeof database !== 'undefined' && database) {
        database.ref('projects/' + projectId).once('value').then(snapshot => {
            const project = snapshot.val();
            if (!project) return;

            document.getElementById('modalProjectTitle').value = project.title;
            document.getElementById('modalProjectDesc').value = project.description;
            document.getElementById('modalProjectCategory').value = project.category;
            document.getElementById('modalProjectImage').value = project.image || '';
            document.getElementById('modalProjectLink').value = project.link;
            document.getElementById('modalProjectStatus').value = project.status;
            document.getElementById('modalProjectOrder').value = project.order;
            openModal('projectModal');
        });
    } else {
        // Fallback to localStorage
        const projects = StorageManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        document.getElementById('modalProjectTitle').value = project.title;
        document.getElementById('modalProjectDesc').value = project.description;
        document.getElementById('modalProjectCategory').value = project.category;
        document.getElementById('modalProjectImage').value = project.image || '';
        document.getElementById('modalProjectLink').value = project.link;
        document.getElementById('modalProjectStatus').value = project.status;
        document.getElementById('modalProjectOrder').value = project.order;
        openModal('projectModal');
    }
}

function saveProject() {
    const title = document.getElementById('modalProjectTitle').value.trim();
    const description = document.getElementById('modalProjectDesc').value.trim();
    const category = document.getElementById('modalProjectCategory').value;
    const projectType = document.getElementById('modalProjectType').value;
    const image = document.getElementById('modalProjectImage').value.trim();
    const status = document.getElementById('modalProjectStatus').value;
    const order = parseInt(document.getElementById('modalProjectOrder').value) || 0;

    if (!title || !description || !projectType) {
        UIManager.showNotification('Title, description, and project type are required', 'error');
        return;
    }

    // Handle website upload
    if (projectType === 'website') {
        const zipFile = document.getElementById('modalProjectZip').files[0];
        
        if (!zipFile) {
            UIManager.showNotification('Please select a ZIP file for website upload', 'error');
            return;
        }
        
        if (!zipFile.name.endsWith('.zip')) {
            UIManager.showNotification('Please upload a ZIP file', 'error');
            return;
        }
        
        if (zipFile.size > 100 * 1024 * 1024) { // 100MB limit
            UIManager.showNotification('File size exceeds 100MB limit', 'error');
            return;
        }
        
        console.log('📤 Processing website files...');
        console.log('📦 File:', zipFile.name, 'Size:', zipFile.size);
        UIManager.showNotification('⏳ Processing website files...', 'info');
        
        // Show progress
        document.getElementById('uploadProgressContainer').style.display = 'block';
        
        const projectId = generateProjectId(title);
        console.log('🆔 Project ID:', projectId);
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            document.getElementById('uploadProgressBar').value = progress;
            document.getElementById('uploadPercentage').textContent = Math.round(progress) + '%';
        }, 500);
        
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = async function(e) {
            console.log('✅ File read successfully');
            
            try {
                // Extract and save website
                console.log('🔄 Extracting website files...');
                const extractResult = await extractAndSaveWebsite(e.target.result, projectId, zipFile.name);
                
                // Complete progress
                clearInterval(progressInterval);
                document.getElementById('uploadProgressBar').value = 100;
                document.getElementById('uploadPercentage').textContent = '100%';
                
                const websiteUrl = `https://laurixy.online/websites/${projectId}/`;
                
                // Save to Firebase Database
                const projectData = {
                    id: currentEditingProjectId || 'proj_' + Date.now(),
                    title,
                    description,
                    category,
                    type: 'website',
                    websiteUrl: websiteUrl,
                    image,
                    status,
                    order,
                    uploadedAt: new Date().toISOString(),
                    fileName: zipFile.name,
                    fileSize: zipFile.size,
                    filesExtracted: extractResult.filesCount,
                    storedLocally: true  // Mark as stored locally
                };
                
                if (!currentEditingProjectId) {
                    projectData.createdAt = new Date().toISOString();
                }
                
                console.log('📝 Saving website project to Firebase:', projectData.title);
                
                if (typeof database !== 'undefined' && database && typeof saveProjectToFirebase === 'function') {
                    saveProjectToFirebase(projectData).then(() => {
                        const action = currentEditingProjectId ? 'Website Updated' : 'Website Created';
                        const logRef = database.ref('logs').push();
                        logRef.set({
                            id: logRef.key,
                            action: action,
                            description: `${action}: ${title} - Files: ${extractResult.filesCount}, URL: ${websiteUrl}`,
                            timestamp: new Date().toISOString()
                        });
                        
                        UIManager.showNotification('✅ Website uploaded and extracted successfully! Running at ' + websiteUrl, 'success');
                        document.getElementById('uploadProgressContainer').style.display = 'none';
                        
                        setTimeout(() => {
                            UIManager.renderProjects();
                        }, 500);
                        
                        closeModal('projectModal');
                    }).catch(error => {
                        console.error('❌ Firebase save error:', error);
                        UIManager.showNotification('Error saving project: ' + error.message, 'error');
                        document.getElementById('uploadProgressContainer').style.display = 'none';
                        clearInterval(progressInterval);
                    });
                }
            } catch (error) {
                console.error('❌ Extraction error:', error);
                UIManager.showNotification('Error extracting website: ' + error.message, 'error');
                document.getElementById('uploadProgressContainer').style.display = 'none';
                clearInterval(progressInterval);
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ File read error:', error);
            UIManager.showNotification('Error reading file: ' + error.message, 'error');
            document.getElementById('uploadProgressContainer').style.display = 'none';
            clearInterval(progressInterval);
        };
        
        reader.readAsDataURL(zipFile);
        
    } else if (projectType === 'app-link') {
        // Handle app download link
        const downloadLink = document.getElementById('modalProjectLink').value.trim();
        const fileSize = document.getElementById('modalProjectFileSize').value.trim();
        
        if (!downloadLink) {
            UIManager.showNotification('Please enter download link', 'error');
            return;
        }
        
        const projectData = {
            id: currentEditingProjectId || 'proj_' + Date.now(),
            title,
            description,
            category,
            type: 'app',
            downloadLink: downloadLink,
            fileSize: fileSize || 'Unknown',
            image,
            status,
            order
        };
        
        if (!currentEditingProjectId) {
            projectData.createdAt = new Date().toISOString();
        }
        
        console.log('📝 Saving app project to Firebase:', projectData);
        
        if (typeof database !== 'undefined' && database && typeof saveProjectToFirebase === 'function') {
            saveProjectToFirebase(projectData).then(() => {
                const action = currentEditingProjectId ? 'App Updated' : 'App Created';
                const logRef = database.ref('logs').push();
                logRef.set({
                    id: logRef.key,
                    action: action,
                    description: `${action}: ${title} (${fileSize})`,
                    timestamp: new Date().toISOString()
                });
                
                UIManager.showNotification('✅ App project saved successfully!', 'success');
                
                setTimeout(() => {
                    UIManager.renderProjects();
                }, 500);
                
                closeModal('projectModal');
            }).catch(error => {
                console.error('❌ Firebase save error:', error);
                UIManager.showNotification('Error saving project: ' + error.message, 'error');
            });
        }
    } else if (projectType === 'app-upload') {
        // Handle app/game file upload
        const appFile = document.getElementById('modalProjectAppFile').files[0];
        
        if (!appFile) {
            UIManager.showNotification('Please select an app/game file to upload', 'error');
            return;
        }
        
        const maxSize = 500 * 1024 * 1024; // 500MB limit
        if (appFile.size > maxSize) {
            UIManager.showNotification('File size exceeds 500MB limit', 'error');
            return;
        }
        
        console.log('📤 Processing app/game file...');
        console.log('📦 File:', appFile.name, 'Size:', appFile.size);
        UIManager.showNotification('⏳ Processing app/game file...', 'info');
        
        // Show progress
        document.getElementById('appUploadProgressContainer').style.display = 'block';
        
        const projectId = generateProjectId(title);
        console.log('🆔 Project ID:', projectId);
        
        // Format file size
        const formatFileSize = (bytes) => {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        };
        
        const fileSizeFormatted = formatFileSize(appFile.size);
        document.getElementById('modalProjectAppFileSize').value = fileSizeFormatted;
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress > 90) progress = 90;
            document.getElementById('appUploadProgressBar').value = progress;
            document.getElementById('appUploadPercentage').textContent = Math.round(progress) + '%';
        }, 500);
        
        // Read file as data URL
        const reader = new FileReader();
        reader.onload = async function(e) {
            console.log('✅ File read successfully');
            
            try {
                // Save app file to localStorage/IndexedDB
                const fileData = {
                    name: appFile.name,
                    type: appFile.type,
                    size: appFile.size,
                    dataUrl: e.target.result,
                    uploadedAt: new Date().toISOString()
                };
                
                // Store in localStorage (with fallback to IndexedDB for large files)
                const storageKey = `app_${projectId}_${appFile.name}`;
                try {
                    localStorage.setItem(storageKey, JSON.stringify(fileData));
                    console.log('✅ App file stored in localStorage');
                } catch (e) {
                    console.warn('⚠️ localStorage full, using IndexedDB');
                    // Fallback to IndexedDB for large files
                    if (window.indexedDB) {
                        const db = await new Promise((resolve, reject) => {
                            const request = indexedDB.open('LaurixyAppFiles', 1);
                            request.onerror = () => reject(request.error);
                            request.onsuccess = () => resolve(request.result);
                            request.onupgradeneeded = (e) => {
                                e.target.result.createObjectStore('files', { keyPath: 'id' });
                            };
                        });
                        
                        const tx = db.transaction('files', 'readwrite');
                        tx.objectStore('files').put({ id: storageKey, ...fileData });
                        await new Promise((resolve, reject) => {
                            tx.oncomplete = resolve;
                            tx.onerror = () => reject(tx.error);
                        });
                        console.log('✅ App file stored in IndexedDB');
                    }
                }
                
                // Complete progress
                clearInterval(progressInterval);
                document.getElementById('appUploadProgressBar').value = 100;
                document.getElementById('appUploadPercentage').textContent = '100%';
                
                const downloadUrl = `https://laurixy.online/apps/download/${projectId}/${appFile.name}`;
                
                // Save to Firebase Database
                const projectData = {
                    id: currentEditingProjectId || 'proj_' + Date.now(),
                    title,
                    description,
                    category,
                    type: 'app-upload',
                    appFileName: appFile.name,
                    appFileSize: appFile.size,
                    appFileSizeFormatted: fileSizeFormatted,
                    downloadUrl: downloadUrl,
                    image,
                    status,
                    order,
                    uploadedAt: new Date().toISOString(),
                    storedLocally: true
                };
                
                if (!currentEditingProjectId) {
                    projectData.createdAt = new Date().toISOString();
                }
                
                console.log('📝 Saving app upload project to Firebase:', projectData.title);
                
                if (typeof database !== 'undefined' && database && typeof saveProjectToFirebase === 'function') {
                    saveProjectToFirebase(projectData).then(() => {
                        const action = currentEditingProjectId ? 'App Updated' : 'App Created';
                        const logRef = database.ref('logs').push();
                        logRef.set({
                            id: logRef.key,
                            action: action,
                            description: `${action}: ${title} (${fileSizeFormatted}) - File: ${appFile.name}`,
                            timestamp: new Date().toISOString()
                        });
                        
                        UIManager.showNotification('✅ App/Game uploaded successfully! Download URL: ' + downloadUrl, 'success');
                        document.getElementById('appUploadProgressContainer').style.display = 'none';
                        
                        setTimeout(() => {
                            UIManager.renderProjects();
                        }, 500);
                        
                        closeModal('projectModal');
                    }).catch(error => {
                        console.error('❌ Firebase save error:', error);
                        UIManager.showNotification('Error saving project: ' + error.message, 'error');
                        document.getElementById('appUploadProgressContainer').style.display = 'none';
                        clearInterval(progressInterval);
                    });
                }
            } catch (error) {
                console.error('❌ Upload error:', error);
                UIManager.showNotification('Error uploading app: ' + error.message, 'error');
                document.getElementById('appUploadProgressContainer').style.display = 'none';
                clearInterval(progressInterval);
            }
        };
        
        reader.onerror = function(error) {
            console.error('❌ File read error:', error);
            UIManager.showNotification('Error reading file: ' + error.message, 'error');
            document.getElementById('appUploadProgressContainer').style.display = 'none';
            clearInterval(progressInterval);
        };
        
        reader.readAsDataURL(appFile);
    } else if (projectType === 'website-link') {
        // Handle website link
        const websiteLink = document.getElementById('modalProjectWebsiteLink').value.trim();
        const openNewTab = document.getElementById('modalProjectWebsiteLinkNewTab').value === 'true';
        
        if (!websiteLink) {
            UIManager.showNotification('Please enter website URL', 'error');
            return;
        }
        
        const projectData = {
            id: currentEditingProjectId || 'proj_' + Date.now(),
            title,
            description,
            category,
            type: 'website-link',
            websiteLink: websiteLink,
            openNewTab: openNewTab,
            image,
            status,
            order
        };
        
        if (!currentEditingProjectId) {
            projectData.createdAt = new Date().toISOString();
        }
        
        console.log('📝 Saving website link project to Firebase:', projectData);
        
        if (typeof database !== 'undefined' && database && typeof saveProjectToFirebase === 'function') {
            saveProjectToFirebase(projectData).then(() => {
                const action = currentEditingProjectId ? 'Website Link Updated' : 'Website Link Created';
                const logRef = database.ref('logs').push();
                logRef.set({
                    id: logRef.key,
                    action: action,
                    description: `${action}: ${title} - URL: ${websiteLink}`,
                    timestamp: new Date().toISOString()
                });
                
                UIManager.showNotification('✅ Website link project saved successfully!', 'success');
                
                setTimeout(() => {
                    UIManager.renderProjects();
                }, 500);
                
                closeModal('projectModal');
            }).catch(error => {
                console.error('❌ Firebase save error:', error);
                UIManager.showNotification('Error saving project: ' + error.message, 'error');
            });
        }
    }
}

// Generate project ID from title
function generateProjectId(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        + '-' + Date.now();
}

// Toggle between app link, app upload, website link, and website uploadable form fields
function toggleProjectTypeFields() {
    const projectType = document.getElementById('modalProjectType').value;
    const appLinkFields = document.getElementById('appLinkTypeFields');
    const appUploadFields = document.getElementById('appUploadTypeFields');
    const websiteLinkFields = document.getElementById('websiteLinkTypeFields');
    const websiteFields = document.getElementById('websiteTypeFields');
    
    // Hide all first
    appLinkFields.style.display = 'none';
    appUploadFields.style.display = 'none';
    websiteLinkFields.style.display = 'none';
    websiteFields.style.display = 'none';
    
    if (projectType === 'app-link') {
        appLinkFields.style.display = 'block';
        // Clear other fields
        document.getElementById('modalProjectAppFile').value = '';
        document.getElementById('modalProjectZip').value = '';
        document.getElementById('modalProjectWebsiteLink').value = '';
    } else if (projectType === 'app-upload') {
        appUploadFields.style.display = 'block';
        // Clear other fields
        document.getElementById('modalProjectLink').value = '';
        document.getElementById('modalProjectZip').value = '';
        document.getElementById('modalProjectWebsiteLink').value = '';
    } else if (projectType === 'website-link') {
        websiteLinkFields.style.display = 'block';
        // Clear other fields
        document.getElementById('modalProjectLink').value = '';
        document.getElementById('modalProjectAppFile').value = '';
        document.getElementById('modalProjectZip').value = '';
    } else if (projectType === 'website') {
        websiteFields.style.display = 'block';
        // Clear app fields
        document.getElementById('modalProjectLink').value = '';
        document.getElementById('modalProjectAppFile').value = '';
        document.getElementById('modalProjectWebsiteLink').value = '';
    }
}

function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project?')) return;

    // Use Firebase if available
    if (typeof database !== 'undefined' && database && typeof deleteProjectFromFirebase === 'function') {
        database.ref('projects/' + projectId).once('value').then(snapshot => {
            const project = snapshot.val();
            return deleteProjectFromFirebase(projectId).then(() => {
                const logRef = database.ref('logs').push();
                logRef.set({
                    id: logRef.key,
                    action: 'Project Deleted',
                    description: `Deleted project: ${project ? project.title : projectId}`,
                    timestamp: new Date().toISOString()
                });
                UIManager.showNotification('Project deleted successfully', 'success');
            });
        }).catch(error => {
            console.error('Firebase delete error:', error);
            UIManager.showNotification('Error deleting project: ' + error.message, 'error');
        });
    } else {
        // Fallback to localStorage
        const projects = StorageManager.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project) return;
        const filtered = projects.filter(p => p.id !== projectId);
        StorageManager.saveProjects(filtered);
        StorageManager.addLog('Project Deleted', `Deleted project: ${project.title}`);
        UIManager.showNotification('Project deleted successfully', 'success');
        UIManager.renderProjects();
    }
}

// ============ MESSAGE MANAGEMENT ============
let currentViewingMessageId = null;

function viewMessage(messageId) {
    currentViewingMessageId = messageId;
    
    // Use Firebase if available
    if (typeof database !== 'undefined' && database) {
        database.ref('messages/' + messageId).once('value').then(snapshot => {
            const message = snapshot.val();
            if (!message) return;
            
            document.getElementById('modalMessageName').textContent = message.name;
            document.getElementById('modalMessageEmail').textContent = message.email;
            document.getElementById('modalMessageSubject').textContent = message.subject;
            document.getElementById('modalMessageContent').textContent = message.message;

            if (message.status === 'Unread') {
                database.ref('messages/' + messageId).update({ status: 'Read' });
            }

            openModal('messageModal');
        });
    } else {
        // Fallback to localStorage
        const messages = StorageManager.getMessages();
        const message = messages.find(m => m.id === messageId);
        if (!message) return;

        document.getElementById('modalMessageName').textContent = message.name;
        document.getElementById('modalMessageEmail').textContent = message.email;
        document.getElementById('modalMessageSubject').textContent = message.subject;
        document.getElementById('modalMessageContent').textContent = message.message;

        if (message.status === 'Unread') {
            message.status = 'Read';
            StorageManager.saveMessages(messages);
            UIManager.renderMessages();
        }

        openModal('messageModal');
    }
}

function deleteMessage(messageId) {
    if (!confirm('Are you sure you want to delete this message?')) return;

    // Use Firebase if available
    if (typeof database !== 'undefined' && database && typeof deleteMessageFromFirebase === 'function') {
        database.ref('messages/' + messageId).once('value').then(snapshot => {
            const message = snapshot.val();
            return deleteMessageFromFirebase(messageId).then(() => {
                const logRef = database.ref('logs').push();
                logRef.set({
                    id: logRef.key,
                    action: 'Message Deleted',
                    description: `Deleted message from: ${message ? message.name : messageId}`,
                    timestamp: new Date().toISOString()
                });
                UIManager.showNotification('Message deleted successfully', 'success');
                closeModal('messageModal');
            });
        }).catch(error => {
            console.error('Firebase delete error:', error);
            UIManager.showNotification('Error deleting message: ' + error.message, 'error');
        });
    } else {
        // Fallback to localStorage
        const messages = StorageManager.getMessages();
        const message = messages.find(m => m.id === messageId);
        if (!message) return;
        const filtered = messages.filter(m => m.id !== messageId);
        StorageManager.saveMessages(filtered);
        StorageManager.addLog('Message Deleted', `Deleted message from: ${message.name}`);
        UIManager.showNotification('Message deleted successfully', 'success');
        UIManager.renderMessages();
        closeModal('messageModal');
    }
}

function replyMessage() {
    const messages = StorageManager.getMessages();
    const message = messages.find(m => m.id === currentViewingMessageId);
    if (!message) return;

    const mailtoLink = `mailto:${message.email}?subject=Re: ${message.subject}`;
    window.location.href = mailtoLink;
}

// ============ CONTENT MANAGEMENT ============
function loadContentForm() {
    const content = StorageManager.getContent();
    document.getElementById('homepageTitle').value = content.homepageTitle || '';
    document.getElementById('homepageSubtitle').value = content.homepageSubtitle || '';
    document.getElementById('aboutSection').value = content.aboutSection || '';
    document.getElementById('servicesSection').value = content.servicesSection || '';
    document.getElementById('footerText').value = content.footerText || '';
}

function saveContent() {
    const content = {
        homepageTitle: document.getElementById('homepageTitle').value.trim(),
        homepageSubtitle: document.getElementById('homepageSubtitle').value.trim(),
        aboutSection: document.getElementById('aboutSection').value.trim(),
        servicesSection: document.getElementById('servicesSection').value.trim(),
        footerText: document.getElementById('footerText').value.trim()
    };

    StorageManager.saveContent(content);
    StorageManager.addLog('Content Updated', 'Homepage content updated');
    UIManager.showNotification('Content saved successfully', 'success');
}

// ============ SETTINGS MANAGEMENT ============
function loadSettings() {
    console.log('⚙️ Loading settings from Firebase...');
    
    // Load from Firebase if available
    if (typeof database !== 'undefined' && database) {
        database.ref('settings').once('value').then(snapshot => {
            const settings = snapshot.val() || {};
            console.log('✅ Settings loaded from Firebase:', settings);
            applySettingsToUI(settings);
        }).catch(error => {
            console.error('❌ Firebase load error:', error);
            // Fallback to localStorage
            const settings = StorageManager.getSettings();
            applySettingsToUI(settings);
        });
    } else {
        // Fallback to localStorage
        const settings = StorageManager.getSettings();
        applySettingsToUI(settings);
    }
}

// Apply settings to UI
function applySettingsToUI(settings) {
    const theme = settings.theme || 'dark';
    const maintenanceMode = settings.maintenanceMode || false;
    const adminName = settings.adminName || 'Administrator';
    
    document.querySelector(`input[name="theme"][value="${theme}"]`).checked = true;
    document.getElementById('maintenanceToggle').checked = maintenanceMode;
    document.getElementById('adminName').value = adminName;
}

function updateSettings() {
    const theme = document.querySelector('input[name="theme"]:checked').value;
    const maintenanceMode = document.getElementById('maintenanceToggle').checked;
    const adminName = document.getElementById('adminName').value.trim();

    const settings = { theme, maintenanceMode, adminName };
    
    console.log('⚙️ Updating settings:', settings);
    console.log('🔍 Database object:', typeof database, database ? 'exists' : 'missing');
    
    // Save to Firebase ONLY
    if (typeof database !== 'undefined' && database) {
        console.log('📝 Attempting to save to Firebase...');
        
        database.ref('settings').set(settings).then(() => {
            console.log('✅ Settings saved to Firebase:', settings);
            
            // Log the action
            const logRef = database.ref('logs').push();
            logRef.set({
                id: logRef.key,
                action: 'Settings Updated',
                description: `Admin settings changed - Maintenance: ${maintenanceMode}, Theme: ${theme}`,
                timestamp: new Date().toISOString()
            }).catch(logError => {
                console.warn('⚠️ Log save error:', logError);
            });
            
            UIManager.showNotification('✅ Settings updated successfully!', 'success');
        }).catch(error => {
            console.error('❌ Firebase settings error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            // Check if it's a permission error
            if (error.code === 'PERMISSION_DENIED') {
                UIManager.showNotification('❌ Firebase Permission Denied - Check security rules in Firebase Console', 'error');
            } else {
                UIManager.showNotification('❌ Error saving settings: ' + error.message, 'error');
            }
        });
    } else {
        console.error('❌ Firebase not initialized');
        console.error('Database type:', typeof database);
        UIManager.showNotification('❌ Firebase not available', 'error');
    }
}

function exportData() {
    const data = StorageManager.exportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laurixy-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    StorageManager.addLog('Data Exported', 'Admin exported all data');
    UIManager.showNotification('Data exported successfully', 'success');
}

// ============ SEARCH FUNCTIONALITY ============
function searchUsers() {
    const query = document.getElementById('userSearch').value.toLowerCase();
    
    // Use Firebase if available
    if (typeof getAllUsersFromFirebase === 'function') {
        getAllUsersFromFirebase().then(users => {
            const filtered = users.filter(u => 
                u.email.toLowerCase().includes(query) || 
                (u.username && u.username.toLowerCase().includes(query))
            );
            displayFilteredUsers(filtered);
        });
    } else {
        const users = StorageManager.getUsers();
        const filtered = users.filter(u => 
            u.email.toLowerCase().includes(query) || 
            (u.username && u.username.toLowerCase().includes(query))
        );
        displayFilteredUsers(filtered);
    }
}

function displayFilteredUsers(filtered) {
    const tbody = document.getElementById('usersTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(user => `
        <tr>
            <td><strong>${user.username || 'N/A'}</strong></td>
            <td>${user.email}</td>
            <td><code style="background: rgba(0,217,255,0.1); padding: 2px 6px; border-radius: 3px;">${user.password || 'N/A'}</code></td>
            <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
            <td><span class="status-badge status-${user.status.toLowerCase()}">${user.status || 'Active'}</span></td>
            <td>${new Date(user.lastLogin || user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-small btn-secondary" onclick="editUser('${user.id}')">Edit</button>
                <button class="btn btn-small btn-danger" onclick="deleteUser('${user.id}')">Delete</button>
            </td>
        </tr>
    `).join('');
}

function setupSearch() {
    document.getElementById('userSearch').addEventListener('input', searchUsers);

    document.getElementById('projectSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const projects = StorageManager.getProjects();
        const filtered = projects.filter(p => p.title.toLowerCase().includes(query));
        
        const tbody = document.getElementById('projectsTableBody');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No projects found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.sort((a, b) => a.order - b.order).map(project => `
            <tr>
                <td>${project.title}</td>
                <td>${project.category}</td>
                <td><span class="status-badge status-${project.status.toLowerCase()}">${project.status}</span></td>
                <td>${project.order}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="editProject('${project.id}')">Edit</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProject('${project.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    });

    document.getElementById('messageSearch').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const messages = StorageManager.getMessages();
        const filtered = messages.filter(m => 
            m.name.toLowerCase().includes(query) || 
            m.email.toLowerCase().includes(query) ||
            m.subject.toLowerCase().includes(query)
        );
        
        const tbody = document.getElementById('messagesTableBody');
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No messages found</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map(msg => `
            <tr>
                <td>${msg.name}</td>
                <td>${msg.email}</td>
                <td>${msg.subject}</td>
                <td><span class="status-badge status-${msg.status.toLowerCase()}">${msg.status}</span></td>
                <td>${new Date(msg.createdAt).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-small btn-secondary" onclick="viewMessage('${msg.id}')">View</button>
                    <button class="btn btn-small btn-danger" onclick="deleteMessage('${msg.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    });
}

// ============ MODAL MANAGEMENT ============
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============ AUTHENTICATION ============
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    if (email === 'admin@laurixy.com' && password === 'admin640') {
        const session = { email, loginTime: new Date().toISOString() };
        localStorage.setItem(StorageManager.KEYS.SESSION, JSON.stringify(session));
        StorageManager.addLog('Admin Login', `Admin logged in: ${email}`);
        showAdminPanel();
    } else {
        document.getElementById('loginError').textContent = 'Invalid email or password';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        const session = JSON.parse(localStorage.getItem(StorageManager.KEYS.SESSION)) || {};
        StorageManager.addLog('Admin Logout', `Admin logged out: ${session.email}`);
        localStorage.removeItem(StorageManager.KEYS.SESSION);
        // Redirect to main site home page
        window.location.href = 'index.html';
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    const session = JSON.parse(localStorage.getItem(StorageManager.KEYS.SESSION));
    if (!session) {
        showLoginScreen();
        return;
    }

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'flex';
    document.getElementById('adminEmail').textContent = session.email;
    document.getElementById('userAvatar').textContent = session.email.charAt(0).toUpperCase();

    refreshAllData();
}

function refreshAllData() {
    console.log('🔄 Refreshing all admin data...');
    
    UIManager.updateStats();
    UIManager.updateActivityFeed();
    UIManager.renderUsers();
    UIManager.renderProjects();
    UIManager.renderMessages();
    UIManager.renderLogs();
    loadContentForm();
    
    // Load settings with a small delay to ensure Firebase is ready
    setTimeout(() => {
        loadSettings();
    }, 100);
}

// ============ NAVIGATION ============
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.getAttribute('data-section');
            UIManager.switchSection(sectionId);
        });
    });
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', logout);

    document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);
    document.getElementById('saveUserBtn').addEventListener('click', saveUser);

    document.getElementById('addProjectBtn').addEventListener('click', openAddProjectModal);
    document.getElementById('saveProjectBtn').addEventListener('click', saveProject);

    document.getElementById('saveContentBtn').addEventListener('click', saveContent);

    document.getElementById('replyMessageBtn').addEventListener('click', replyMessage);
    document.getElementById('deleteMessageBtn').addEventListener('click', () => {
        deleteMessage(currentViewingMessageId);
    });

    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('updateProfileBtn').addEventListener('click', updateSettings);
    document.getElementById('resetDataBtn').addEventListener('click', () => {
        if (confirm('⚠️ WARNING: This will delete ALL data (users, projects, messages, logs) and reset to production mode. Are you sure?')) {
            if (confirm('This action cannot be undone. Click OK to confirm.')) {
                resetAllFirebaseData().then(() => {
                    UIManager.showNotification('✅ All data reset successfully! Refreshing...', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                });
            }
        }
    });

    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', updateSettings);
    });

    document.getElementById('maintenanceToggle').addEventListener('change', updateSettings);

    setupSearch();
    setupNavigation();
}

// ============ REAL-TIME SYNC ============
// Complete A-Z real-time synchronization between admin panel and main site
function setupRealtimeSync() {
    // Listen for storage changes from other tabs/windows
    window.addEventListener('storage', (e) => {
        if (e.key && (e.key.startsWith('laurixy_') || e.key === 'users')) {
            console.log('Real-time sync - Storage updated:', e.key);
            
            // Refresh data if admin panel is open
            if (document.getElementById('adminPanel').style.display !== 'none') {
                // Specific updates based on what changed
                if (e.key === 'laurixy_projects') {
                    UIManager.renderProjects();
                    UIManager.updateStats();
                }
                if (e.key === 'laurixy_messages') {
                    UIManager.renderMessages();
                    UIManager.updateStats();
                }
                if (e.key === 'users') {
                    UIManager.renderUsers();
                    UIManager.updateStats();
                }
                if (e.key === 'laurixy_logs') {
                    UIManager.renderLogs();
                }
                if (e.key === 'laurixy_content') {
                    loadContentForm();
                }
                if (e.key === 'laurixy_settings') {
                    loadSettings();
                }
            }
        }
    });
    
    // Also listen for custom storage events (same-tab updates)
    window.addEventListener('storage', (e) => {
        if (e.key === 'laurixy_logs') {
            const logsSection = document.getElementById('logs');
            if (logsSection && document.getElementById('adminPanel').style.display !== 'none') {
                renderLogs();
            }
        }
    });
    
    // Poll for updates every 500ms (for same-tab real-time sync - faster!)
    setInterval(() => {
        if (document.getElementById('adminPanel').style.display !== 'none') {
            refreshAllData();
        }
    }, 500);
    
    // Also trigger on visibility change (when tab becomes active)
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && document.getElementById('adminPanel').style.display !== 'none') {
            console.log('Tab became visible - refreshing data');
            refreshAllData();
        }
    });
}

// ============ FILE DOWNLOAD HELPER ============
function downloadFileAsZip(dataUrl, fileName) {
    try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log('✅ File download started:', fileName);
    } catch (error) {
        console.error('❌ Download error:', error);
    }
}

// ============ INITIALIZATION ============
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Admin Panel Initializing...');
    
    StorageManager.initializeData();
    setupEventListeners();
    setupRealtimeSync();

    // Initialize Firebase real-time sync if available
    if (typeof initFirebaseRealtimeSync === 'function') {
        console.log('🔥 Starting Firebase real-time sync...');
        initFirebaseRealtimeSync();
    } else {
        console.warn('⚠️ Firebase sync not available');
    }

    const session = JSON.parse(localStorage.getItem(StorageManager.KEYS.SESSION));
    if (session) {
        console.log('✅ Session found - showing admin panel');
        showAdminPanel();
    } else {
        console.log('📝 No session - showing login screen');
        showLoginScreen();
    }
});
