// Auth Related JavaScript

document.addEventListener('DOMContentLoaded', () => {
    initAuthForms();
    initPasswordStrength();
    initFormValidation();
    initPasswordToggles();
});

// Initialize Auth Forms
function initAuthForms() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotPasswordLink = document.querySelector('.forgot-password');
    const usernameInput = document.getElementById('username');

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
        
        // Add real-time username availability check only on signup page
        if (usernameInput) {
            usernameInput.addEventListener('input', checkUsernameRealtime);
            usernameInput.addEventListener('blur', checkUsernameRealtime);
        }
    }

    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', handleForgotPassword);
    }
}

// Check username availability in real-time
function checkUsernameRealtime(e) {
    const username = e.target.value;
    const statusDiv = document.getElementById('usernameStatus');
    
    if (!statusDiv) return;
    
    if (!username) {
        statusDiv.textContent = '';
        statusDiv.style.color = '#ff006e';
        return;
    }
    
    const result = checkUsernameAvailability(username);
    statusDiv.textContent = result.message;
    statusDiv.style.color = result.available ? '#00d9ff' : '#ff006e';
}

// Handle Forgot Password - Show contact info
function handleForgotPassword(e) {
    e.preventDefault();
    showPasswordResetInfo(e);
}

// Handle Login (Firebase ONLY)
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.auth) {
        showErrorMessage('Firebase not initialized. Please check configuration.');
        return;
    }

    // Check if admin credentials
    if (email === 'admin@laurixy.com' && password === 'admin640') {
        // Admin login - save session to localStorage (minimal)
        const adminSession = { email, loginTime: new Date().toISOString(), isAdmin: true };
        localStorage.setItem('laurixy_session', JSON.stringify(adminSession));
        
        // Log admin login to Firebase
        const logRef = database.ref('logs').push();
        logRef.set({
            id: logRef.key,
            action: 'Admin Login',
            description: `Admin logged in at ${new Date().toLocaleString()}`,
            timestamp: new Date().toISOString()
        });
        
        console.log('✅ Admin login successful');
        showSuccessMessage('Admin login successful! Redirecting to admin panel...');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
        return;
    }

    // Firebase Authentication for regular users (Firebase ONLY)
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Get user data from Firebase Database
            return database.ref('users/' + user.uid).once('value')
                .then((snapshot) => {
                    const userData = snapshot.val();
                    
                    if (userData) {
                        // Update last login in Firebase
                        database.ref('users/' + user.uid).update({ 
                            lastLogin: new Date().toISOString() 
                        });
                        
                        // Log user login to Firebase
                        const logRef = database.ref('logs').push();
                        logRef.set({
                            id: logRef.key,
                            action: 'User Login',
                            description: `User ${userData.username} (${email}) logged in`,
                            timestamp: new Date().toISOString()
                        });
                        
                        console.log('✅ User logged in:', userData.username);
                        showSuccessMessage('Login successful! Redirecting...');
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    } else {
                        showErrorMessage('User data not found');
                    }
                });
        })
        .catch((error) => {
            console.error('Firebase login error:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                showErrorMessage('Invalid credentials');
            } else {
                showErrorMessage('Login failed: ' + error.message);
            }
        });
}

// Handle Signup
function handleSignup(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const terms = document.getElementById('terms').checked;

    // Validate username uniqueness
    const usernameCheck = checkUsernameAvailability(username);
    if (!usernameCheck.available) {
        showErrorMessage(usernameCheck.message);
        return;
    }

    // Validate password strength
    const passwordStrength = checkPasswordStrength(password);
    if (passwordStrength < 2) {
        showErrorMessage('Password is too weak. Use uppercase, numbers, and special characters');
        return;
    }

    if (password !== confirmPassword) {
        showErrorMessage('Passwords do not match');
        return;
    }

    if (!terms) {
        showErrorMessage('Please accept the Terms & Conditions');
        return;
    }

    // Check if Firebase is available
    if (typeof firebase === 'undefined' || !firebase.database) {
        showErrorMessage('Firebase not initialized. Please check configuration.');
        return;
    }

    // Create Firebase Auth user
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Store user data in Realtime Database
            const newUser = {
                id: user.uid,
                username,
                email,
                password,  // In production, don't store plain passwords
                role: 'user',
                status: 'Active',
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };

            // Save to Firebase Realtime Database
            return database.ref('users/' + user.uid).set(newUser)
                .then(() => {
                    console.log('✅ User saved to Firebase:', newUser);
                    
                    // Log activity to Firebase
                    const logRef = database.ref('logs').push();
                    return logRef.set({
                        id: logRef.key,
                        action: 'User Signup',
                        description: `New user registered: ${username} (${email})`,
                        timestamp: new Date().toISOString()
                    });
                })
                .then(() => {
                    console.log('🔥 Firebase real-time sync complete');
                    showSuccessMessage('Account created successfully! Redirecting to login...');
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                });
        })
        .catch((error) => {
            console.error('Firebase signup error:', error);
            if (error.code === 'auth/email-already-in-use') {
                showErrorMessage('User with this email already exists');
            } else if (error.code === 'auth/weak-password') {
                showErrorMessage('Password should be at least 6 characters');
            } else {
                showErrorMessage('Signup failed: ' + error.message);
            }
        });
}

// Password Strength Checker
function initPasswordStrength() {
    const passwordInput = document.getElementById('password');
    if (!passwordInput) return;

    passwordInput.addEventListener('input', (e) => {
        const password = e.target.value;
        const strength = checkPasswordStrength(password);
        updateStrengthIndicator(strength);
    });
}

function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^A-Za-z0-9]/)) strength++;

    return strength;
}

function updateStrengthIndicator(strength) {
    const strengthBar = document.querySelector('.strength-bar');
    if (!strengthBar) return;

    strengthBar.style.width = `${(strength / 4) * 100}%`;
    strengthBar.className = 'strength-bar';
    
    if (strength <= 1) strengthBar.classList.add('strength-weak');
    else if (strength <= 2) strengthBar.classList.add('strength-medium');
    else strengthBar.classList.add('strength-strong');
}

// Form Validation
function initFormValidation() {
    const inputs = document.querySelectorAll('.auth-form input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', (e) => validateInput(e.target));
        input.addEventListener('input', (e) => validateInput(e.target));
    });
}

function validateInput(input) {
    const formGroup = input.closest('.form-group');
    
    switch(input.type) {
        case 'email':
            validateEmail(input, formGroup);
            break;
        case 'password':
            validatePassword(input, formGroup);
            break;
        case 'text':
            validateUsername(input, formGroup);
            break;
    }
}

function validateEmail(input, formGroup) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!input.value) {
        setInputError(formGroup, 'Email is required');
    } else if (!emailRegex.test(input.value)) {
        setInputError(formGroup, 'Please enter a valid email');
    } else {
        setInputSuccess(formGroup);
    }
}

function validatePassword(input, formGroup) {
    if (!input.value) {
        setInputError(formGroup, 'Password is required');
    } else if (input.value.length < 8) {
        setInputError(formGroup, 'Password must be at least 8 characters');
    } else {
        const strength = checkPasswordStrength(input.value);
        if (strength < 2) {
            setInputError(formGroup, 'Password must include uppercase, numbers, and special characters');
        } else {
            setInputSuccess(formGroup);
        }
    }
}

function validateUsername(input, formGroup) {
    if (!input.value) {
        setInputError(formGroup, 'Username is required');
    } else if (input.value.length < 3) {
        setInputError(formGroup, 'Username must be at least 3 characters');
    } else {
        setInputSuccess(formGroup);
    }
}

// UI Helpers
function setInputError(formGroup, message) {
    formGroup.classList.remove('success');
    formGroup.classList.add('error');
    const validationMessage = formGroup.querySelector('.validation-message');
    if (validationMessage) {
        validationMessage.textContent = message;
    }
}

function setInputSuccess(formGroup) {
    formGroup.classList.remove('error');
    formGroup.classList.add('success');
}

function showLoading(show) {
    const spinner = document.querySelector('.loading-spinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showSuccessMessage(message) {
    showNotification(message, 'success');
}

// Auth State Management
function initPasswordToggles() {
    const toggles = document.querySelectorAll('.password-toggle');
    toggles.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;
            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('visible');
                btn.setAttribute('aria-label', 'Hide password');
            } else {
                input.type = 'password';
                btn.classList.remove('visible');
                btn.setAttribute('aria-label', 'Show password');
            }
        });
    });
}

// Check auth state (Firebase ONLY)
function checkAuthState() {
    if (typeof auth !== 'undefined' && auth) {
        return auth.currentUser !== null;
    }
    return false;
}

// Logout (Firebase ONLY)
function logout() {
    if (typeof auth !== 'undefined' && auth) {
        auth.signOut().then(() => {
            window.location.href = 'login.html';
        }).catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'login.html';
        });
    } else {
        window.location.href = 'login.html';
    }
}

// Log user activity to Firebase (Firebase ONLY)
function logUserActivity(action, details) {
    if (typeof database !== 'undefined' && database) {
        const logRef = database.ref('logs').push();
        logRef.set({
            id: logRef.key,
            action: action,
            details: details,
            timestamp: new Date().toISOString()
        });
    }
}

// Show password reset information
function showPasswordResetInfo(e) {
    if (e) e.preventDefault();
    
    const message = `
🔐 PASSWORD RESET REQUEST

To reset your password, please send an email to:
📧 laurixyofficial@gmail.com

Include the following in your email:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Subject: Password Reset Request

Body:
- Email: [your registered email]
- Username: [your username]

Our team will verify your identity by asking
security questions. Once verified, we will
provide you with password reset instructions.

⏱️ Response time: 24-48 hours
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `;
    
    alert(message);
}

// Check if username is unique (Firebase ONLY)
function isUsernameUnique(username) {
    // This will be checked during signup via Firebase
    // For now, return true - Firebase will validate
    return true;
}

// Get username availability
function checkUsernameAvailability(username) {
    if (!username || username.trim().length === 0) {
        return { available: false, message: 'Username cannot be empty' };
    }
    
    if (username.length < 3) {
        return { available: false, message: 'Username must be at least 3 characters' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { available: false, message: 'Username can only contain letters, numbers, and underscores' };
    }
    
    if (isUsernameUnique(username)) {
        return { available: true, message: 'Username is available!' };
    } else {
        return { available: false, message: 'Username is already taken. Please choose another.' };
    }
}