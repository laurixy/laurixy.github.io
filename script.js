
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 Main Site Initializing...');
    
    initParticleSystem();
    initMouseTrail();
    initNavigation();
    initScrollAnimations();
    initTypingAnimation();
    initCounterAnimations();
    initRippleEffect();
    initFormAnimations();
    updateAuthUI();
    
    console.log('📦 Loading projects from Firebase...');
    loadProjectsFromAdmin();
    
    console.log('🔄 Setting up real-time sync...');
    setupMainSiteRealtimeSync();
    
    console.log('✅ Main site ready!');
});

// Check authentication state (Firebase ONLY)
function checkAuthState() {
    if (typeof auth !== 'undefined' && auth) {
        return auth.currentUser !== null;
    }
    return false;
}

// Get current user data (Firebase ONLY)
function getCurrentUser() {
    if (typeof auth !== 'undefined' && auth && auth.currentUser) {
        return {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email
        };
    }
    return null;
}

// Update Auth UI based on login state (Firebase ONLY)
function updateAuthUI() {
    if (typeof auth === 'undefined' || !auth) {
        console.warn('⚠️ Firebase not initialized');
        return;
    }

    auth.onAuthStateChanged((user) => {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');
        const userAvatar = document.getElementById('userAvatar');
        const userName = document.getElementById('userName');
        const navMenu = document.getElementById('navMenu');

        if (user) {
            // Get user data from Firebase
            database.ref('users/' + user.uid).once('value').then(snapshot => {
                const userData = snapshot.val();
                if (userData) {
                    // Hide auth buttons and show user profile
                    authButtons.style.display = 'none';
                    userProfile.style.display = 'flex';
                    
                    // Set user avatar letter
                    if (userAvatar) {
                        userAvatar.textContent = userData.username.charAt(0).toUpperCase();
                    }
                    
                    // Set user name
                    if (userName) {
                        userName.textContent = userData.username;
                    }

                    // Add admin link if user is admin
                    if (userData.role === 'admin') {
                        const adminLink = document.createElement('a');
                        adminLink.href = 'admin.html';
                        adminLink.textContent = 'ADMIN';
                        adminLink.classList.add('nav-link');
                        navMenu.appendChild(adminLink);
                    }
                }
            });
        } else {
            // Show auth buttons and hide user profile
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
        }
    });
}

// Handle logout (Firebase ONLY)
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

// ===== PARTICLE SYSTEM =====
function initParticleSystem() {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Device detection for optimal performance
    const isIPad = /iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document;
    const isMobile = window.innerWidth <= 768 && !isIPad;
    const isTablet = (window.innerWidth > 768 && window.innerWidth <= 1024) || isIPad;
    
    // Adjust particle count based on device
    let particleCount, connectionDistance;
    if (isMobile) {
        particleCount = 40;
        connectionDistance = 100;
    } else if (isTablet) {
        particleCount = 70;
        connectionDistance = 130;
    } else {
        particleCount = 100;
        connectionDistance = 150;
    }
    
    const particles = [];
    
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.5;
            this.vy = (Math.random() - 0.5) * 0.5;
            this.radius = Math.random() * 2 + 1;
        }
        
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
        }
        
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 240, 255, 0.5)';
            ctx.fill();
        }
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
    
    // Animation loop
    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
        
        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < connectionDistance) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(0, 240, 255, ${1 - distance / connectionDistance})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        
        requestAnimationFrame(animate);
    }
    
    animate();
    
    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ===== MOUSE TRAIL =====
function initMouseTrail() {
    // Enable mouse trail on iPad but not on mobile phones
    const isIPad = /iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document;
    const isMobile = window.innerWidth <= 768 && !isIPad;
    
    if (isMobile) {
        return;
    }
    
    const trailContainer = document.getElementById('mouseTrail');
    let lastTime = 0;
    const throttleDelay = 50; // milliseconds
    
    document.addEventListener('mousemove', (e) => {
        const currentTime = Date.now();
        if (currentTime - lastTime < throttleDelay) return;
        lastTime = currentTime;
        
        const dot = document.createElement('div');
        dot.className = 'trail-dot';
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
        
        trailContainer.appendChild(dot);
        
        setTimeout(() => {
            dot.remove();
        }, 1000);
    });
}

// ===== NAVIGATION =====
function initNavigation() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });
    
    // Close menu when link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // Update active link on scroll
    window.addEventListener('scroll', () => {
        let current = '';
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.pageYOffset >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
    
    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.boxShadow = '0 0 30px rgba(0, 240, 255, 0.3)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });
}

// ===== SCROLL ANIMATIONS =====
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe product cards
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = `all 0.6s ease ${index * 0.1}s`;
        observer.observe(card);
    });
    
    // Observe section titles
    const titles = document.querySelectorAll('.section-title');
    titles.forEach(title => {
        title.style.opacity = '0';
        title.style.transform = 'translateY(30px)';
        title.style.transition = 'all 0.6s ease';
        observer.observe(title);
    });
}

// ===== TYPING ANIMATION =====
function initTypingAnimation() {
    const texts = [
        'Developing Software. Creating Solutions.',
        'Apps, Games & Platforms for Everyone',
        'Engineering Tomorrow\'s Technology Today',
        'Building Software That Empowers Users'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingElement = document.getElementById('typingText');
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDelay = 2000;
    
    function type() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            charIndex--;
        } else {
            charIndex++;
        }
        
        typingElement.textContent = currentText.substring(0, charIndex);
        
        let delay = isDeleting ? deletingSpeed : typingSpeed;
        
        if (!isDeleting && charIndex === currentText.length) {
            delay = pauseDelay;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
        }
        
        setTimeout(type, delay);
    }
    
    setTimeout(type, 1000);
}

// ===== COUNTER ANIMATIONS =====
function initCounterAnimations() {
    const counters = document.querySelectorAll('.stat-number');
    let hasAnimated = false;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasAnimated) {
                hasAnimated = true;
                counters.forEach(counter => {
                    animateCounter(counter);
                });
            }
        });
    }, { threshold: 0.5 });
    
    if (counters.length > 0) {
        observer.observe(counters[0].parentElement.parentElement);
    }
    
    function animateCounter(counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    }
}

// ===== RIPPLE EFFECT =====
function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary, .btn-download, .btn-purchase, .btn-open');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// ===== ADMIN PANEL INTEGRATION =====
// Save contact messages to Firebase ONLY
function saveContactMessage(name, email, subject, message) {
    const messageData = {
        id: 'msg_' + Date.now(),
        name,
        email,
        subject,
        message,
        status: 'Unread',
        createdAt: new Date().toISOString()
    };
    
    // Save to Firebase ONLY
    if (typeof database !== 'undefined' && database) {
        const messageRef = database.ref('messages').push();
        messageData.id = messageRef.key;
        messageRef.set(messageData).then(() => {
            console.log('✅ Message saved to Firebase:', messageData);
        }).catch((error) => {
            console.error('❌ Firebase save error:', error);
        });
    } else {
        console.error('❌ Firebase not initialized - message not saved');
    }
}

// Load projects from admin panel and display on site (Firebase ONLY)
function loadProjectsFromAdmin() {
    console.log('🚀 Loading projects from Firebase...');
    
    // Use Firebase ONLY
    if (typeof database !== 'undefined' && database && typeof getAllProjectsFromFirebase === 'function') {
        getAllProjectsFromFirebase().then(projects => {
            console.log('✅ Loaded', projects.length, 'projects from Firebase:', projects);
            displayProjects(projects);
        }).catch((error) => {
            console.error('❌ Firebase load error:', error);
            console.warn('⚠️ No projects available');
            displayProjects([]);
        });
    } else {
        console.error('❌ Firebase not initialized');
        displayProjects([]);
    }
}

function displayProjects(projects) {
    console.log('📊 Displaying projects:', projects.length, 'total');
    
    // Filter active projects and sort by order
    const activeProjects = projects
        .filter(p => p.status === 'Active')
        .sort((a, b) => a.order - b.order);
    
    console.log('✨ Active projects:', activeProjects.length);
    
    // Update Apps section
    const apps = activeProjects.filter(p => p.category === 'App');
    console.log('📱 Apps:', apps.length, apps);
    updateProductsSection('apps', apps);
    
    // Update Websites section
    const websites = activeProjects.filter(p => p.category === 'Website');
    console.log('🌐 Websites:', websites.length, websites);
    updateProductsSection('websites', websites);
    
    // Update Games section
    const games = activeProjects.filter(p => p.category === 'Game');
    console.log('🎮 Games:', games.length, games);
    updateProductsSection('games', games);
    
    // Update real-time stats
    updateRealtimeStats();
}

// Update real-time statistics (Firebase ONLY)
function updateRealtimeStats() {
    console.log('📊 Updating real-time stats from Firebase...');
    
    // Get data from Firebase
    if (typeof database !== 'undefined' && database) {
        Promise.all([
            getAllProjectsFromFirebase(),
            getAllMessagesFromFirebase()
        ]).then(([projects, messages]) => {
            console.log('✅ Got', projects.length, 'projects and', messages.length, 'messages');
            
            // Count active projects
            const activeProjectsCount = projects.filter(p => p.status === 'Active').length;
            
            // Calculate downloads (based on number of messages as proxy)
            const downloadsCount = messages.length * 100 + activeProjectsCount * 50;
            
            // Update project count
            const projectsCountEl = document.getElementById('projectsCount');
            if (projectsCountEl) {
                animateCounter(projectsCountEl, parseInt(projectsCountEl.textContent), activeProjectsCount);
                projectsCountEl.setAttribute('data-target', activeProjectsCount);
            }
            
            // Update downloads count
            const downloadsCountEl = document.getElementById('downloadsCount');
            if (downloadsCountEl) {
                animateCounter(downloadsCountEl, parseInt(downloadsCountEl.textContent), downloadsCount);
                downloadsCountEl.setAttribute('data-target', downloadsCount);
            }
        }).catch(error => {
            console.error('❌ Error updating stats:', error);
        });
    }
}

// Animate counter from current to target
function animateCounter(element, current, target) {
    if (current === target) return;
    
    const increment = Math.ceil((target - current) / 20);
    let count = current;
    
    const timer = setInterval(() => {
        count += increment;
        if (count >= target) {
            count = target;
            clearInterval(timer);
        }
        element.textContent = count.toLocaleString();
    }, 50);
}

// Update products section with admin data
function updateProductsSection(sectionId, projects) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const grid = section.querySelector('.products-grid');
    if (!grid) return;
    
    // Clear existing cards (keep structure)
    const cards = grid.querySelectorAll('.product-card');
    cards.forEach(card => card.remove());
    
    // Add projects from admin panel
    projects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Determine action button based on project type (strict priority)
        let actionButton = '';
        
        console.log(`🔍 Project: ${project.title}, Type: ${project.type}, websiteUrl: ${project.websiteUrl}, appFileName: ${project.appFileName}`);
        
        // Priority 1: Check explicit type first
        if (project.type === 'website') {
            // Website / Uploadable project
            actionButton = `<button class="btn-open" onclick="visitWebsite('${project.websiteUrl}', '${project.title}')">VISIT SITE</button>`;
            console.log(`✅ Website/Uploadable: ${project.title}`);
        } else if (project.type === 'website-link') {
            // Website / Link project
            const target = project.openNewTab ? '_blank' : '_self';
            actionButton = `<button class="btn-open" onclick="window.open('${project.websiteLink}', '${target}')">VISIT SITE</button>`;
            console.log(`✅ Website/Link: ${project.title}`);
        } else if (project.type === 'app-upload') {
            // App / Upload project
            actionButton = `<button class="btn-download" onclick="downloadUploadedApp('${project.id}', '${project.appFileName}', '${project.title}')">DOWNLOAD NOW</button>`;
            console.log(`✅ App/Upload: ${project.title}`);
        } else if (project.type === 'app-link') {
            // App / Link project
            actionButton = `<button class="btn-download" onclick="downloadProject('${project.downloadLink}', '${project.title}')">DOWNLOAD NOW</button>`;
            console.log(`✅ App/Link: ${project.title}`);
        } else if (project.type === 'app') {
            // Legacy app project
            actionButton = `<button class="btn-download" onclick="downloadProject('${project.downloadLink}', '${project.title}')">DOWNLOAD NOW</button>`;
            console.log(`✅ Legacy App: ${project.title}`);
        } else if (project.websiteUrl) {
            // Fallback: has websiteUrl property
            actionButton = `<button class="btn-open" onclick="visitWebsite('${project.websiteUrl}', '${project.title}')">VISIT SITE</button>`;
            console.log(`✅ Fallback Website: ${project.title}`);
        } else if (project.appFileName) {
            // Fallback: has appFileName property
            actionButton = `<button class="btn-download" onclick="downloadUploadedApp('${project.id}', '${project.appFileName}', '${project.title}')">DOWNLOAD NOW</button>`;
            console.log(`✅ Fallback App Upload: ${project.title}`);
        } else if (project.downloadLink && !project.link) {
            // Fallback: has downloadLink but no legacy link
            actionButton = `<button class="btn-download" onclick="downloadProject('${project.downloadLink}', '${project.title}')">DOWNLOAD NOW</button>`;
            console.log(`✅ Fallback Download Link: ${project.title}`);
        } else if (project.link) {
            // Legacy: determine by link content
            if (project.link.includes('.apk') || project.link.includes('.exe') || project.link.includes('.ipa')) {
                actionButton = `<button class="btn-download" onclick="downloadProject('${project.link}', '${project.title}')">DOWNLOAD NOW</button>`;
                console.log(`✅ Legacy App Link: ${project.title}`);
            } else {
                actionButton = `<button class="btn-open" onclick="visitWebsite('${project.link}', '${project.title}')">VISIT SITE</button>`;
                console.log(`✅ Legacy Website Link: ${project.title}`);
            }
        } else {
            // Default: VISIT SITE
            actionButton = `<button class="btn-open" onclick="visitWebsite('${project.websiteUrl || project.link || '#'}', '${project.title}')">VISIT SITE</button>`;
            console.log(`⚠️ Default VISIT SITE: ${project.title}`);
        }
        
        card.innerHTML = `
            <div class="product-number">${String(index + 1).padStart(2, '0')}</div>
            <div class="product-icon" style="font-size: 2.5rem; background: url('${project.image}') center/cover; border-radius: 10px; height: 100px; display: flex; align-items: center; justify-content: center; color: white; text-shadow: 0 0 10px rgba(0,0,0,0.5);">
                ${!project.image || project.image.includes('placeholder') ? (project.type === 'website' ? '🌐' : '📦') : ''}
            </div>
            <h3 class="product-title">${project.title}</h3>
            <p class="product-description">${project.description}</p>
            <div class="product-tags">
                <span class="tag">${project.category}</span>
            </div>
            <div class="product-actions">
                ${actionButton}
            </div>
        `;
        grid.appendChild(card);
    });
}

// ===== PROJECT ACTIONS =====
// Download project (APK or file) - Requires login
function downloadProject(url, title) {
    // Check if user is logged in
    if (typeof auth === 'undefined' || !auth || !auth.currentUser) {
        console.warn('⚠️ User not logged in - redirecting to login');
        showNotification('❌ Please login first to download', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    console.log('✅ User logged in - starting download:', title);
    showNotification(`✅ Download started for ${title}`);
    window.location.href = url;
}

// Download uploaded app/game file - Requires login
function downloadUploadedApp(projectId, fileName, title) {
    // Check if user is logged in
    if (typeof auth === 'undefined' || !auth || !auth.currentUser) {
        console.warn('⚠️ User not logged in - redirecting to login');
        showNotification('❌ Please login first to download', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    console.log('📥 Downloading uploaded app:', title);
    showNotification(`✅ Preparing download for ${title}...`);
    
    try {
        // Try to get from localStorage first
        const storageKey = `app_${projectId}_${fileName}`;
        let fileData = null;
        
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                fileData = JSON.parse(stored);
                console.log('✅ Found app in localStorage');
            }
        } catch (e) {
            console.warn('⚠️ localStorage access failed, trying IndexedDB');
        }
        
        // If not in localStorage, try IndexedDB
        if (!fileData && window.indexedDB) {
            const dbRequest = indexedDB.open('LaurixyAppFiles', 1);
            dbRequest.onsuccess = function(event) {
                const db = event.target.result;
                const tx = db.transaction('files', 'readonly');
                const store = tx.objectStore('files');
                const request = store.get(storageKey);
                
                request.onsuccess = function() {
                    if (request.result) {
                        fileData = request.result;
                        console.log('✅ Found app in IndexedDB');
                        performDownload(fileData, fileName, title);
                    } else {
                        console.error('❌ App file not found');
                        showNotification('❌ App file not found. Please try again.', 'error');
                    }
                };
            };
            return;
        }
        
        if (fileData) {
            performDownload(fileData, fileName, title);
        } else {
            console.error('❌ App file not found in storage');
            showNotification('❌ App file not found. Please try again.', 'error');
        }
    } catch (error) {
        console.error('❌ Download error:', error);
        showNotification('❌ Error downloading app: ' + error.message, 'error');
    }
}

// Helper function to perform the actual download
function performDownload(fileData, fileName, title) {
    try {
        const link = document.createElement('a');
        link.href = fileData.dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('✅ Download started:', fileName);
        showNotification(`✅ ${title} download started!`, 'success');
    } catch (error) {
        console.error('❌ Download error:', error);
        showNotification('❌ Error starting download: ' + error.message, 'error');
    }
}

// Visit website project - Requires login
function visitWebsite(websiteUrl, title) {
    // Check if user is logged in
    if (typeof auth === 'undefined' || !auth || !auth.currentUser) {
        console.warn('⚠️ User not logged in - redirecting to login');
        showNotification('❌ Please login first to visit', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    console.log('✅ User logged in - visiting website:', title);
    showNotification(`✅ Opening ${title}...`);
    // Navigate to website on same domain
    window.location.href = websiteUrl;
}

// ===== FORM ANIMATIONS =====
function initFormAnimations() {
    const form = document.querySelector('.contact-form');
    
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const subject = document.getElementById('subject').value;
            const message = document.getElementById('message').value;
            
            // Save message to localStorage for admin panel
            saveContactMessage(name, email, subject, message);
            
            // Show success message
            showNotification('✅ Your message was sent to the LAURIXY team! We will get back to you soon.');
            
            // Reset form after a delay
            setTimeout(() => {
                form.reset();
            }, 1500);
        });
    }
    
    // Add focus effects to form inputs
    const inputs = document.querySelectorAll('.form-group input, .form-group textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'translateY(-2px)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'translateY(0)';
        });
    });
}

// ===== NOTIFICATION SYSTEM =====
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #00f0ff, #ff00ff);
        color: white;
        padding: 1.5rem 2rem;
        border-radius: 10px;
        box-shadow: 0 0 30px rgba(0, 240, 255, 0.5);
        font-family: 'Rajdhani', sans-serif;
        font-weight: 600;
        letter-spacing: 1px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Add notification animations to CSS dynamically
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ===== PARALLAX EFFECT =====
// Enable on desktop and iPad devices
const isIPad = /iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document;
const enableParallax = window.innerWidth > 768 || isIPad;

if (enableParallax) {
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        const hero = document.querySelector('.hero-content');
        if (hero) {
            const moveX = (mouseX - 0.5) * (isIPad ? 15 : 20);
            const moveY = (mouseY - 0.5) * (isIPad ? 15 : 20);
            hero.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
    });
}

// ===== SMOOTH SCROLL FOR BUTTONS =====
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(button => {
    button.addEventListener('click', (e) => {
        if (button.textContent.includes('DISCOVER INNOVATION')) {
            e.preventDefault();
            document.getElementById('apps').scrollIntoView({ behavior: 'smooth' });
        } else if (button.textContent.includes('CONNECT WITH LAURIXY')) {
            e.preventDefault();
            document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===== PRODUCT CARD HOVER EFFECTS =====
document.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s ease';
    });
});

// ===== ENHANCED BUTTON INTERACTIONS =====
document.querySelectorAll('.btn-download').forEach(button => {
    button.addEventListener('click', function(e) {
        const productTitle = this.closest('.product-card').querySelector('.product-title').textContent;
        showNotification(`Download initiated for ${productTitle}`);
        
        // Add your download link here
        // window.location.href = 'your-download-link.zip';
    });
});

// Handle OPEN NOW buttons for websites - opens in new tab
document.querySelectorAll('.btn-open').forEach(button => {
    button.addEventListener('click', function(e) {
        const url = this.getAttribute('data-url');
        const productTitle = this.closest('.product-card').querySelector('.product-title').textContent;
        
        if (url && url !== 'https://example.com') {
            window.open(url, '_blank', 'noopener,noreferrer');
            showNotification(`Opening ${productTitle}...`);
        } else {
            showNotification(`Please configure the URL for ${productTitle}`);
        }
    });
});

// ===== PERFORMANCE OPTIMIZATION =====
// Throttle scroll events
let scrollTimeout;
window.addEventListener('scroll', () => {
    if (scrollTimeout) {
        window.cancelAnimationFrame(scrollTimeout);
    }
    scrollTimeout = window.requestAnimationFrame(() => {
        // Scroll-based animations will be handled here
    });
});

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const hamburger = document.getElementById('hamburger');
        const navMenu = document.getElementById('navMenu');
        if (navMenu.classList.contains('active')) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }
    }
});

// ===== LOADING ANIMATION =====
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

// ===== DEVICE DETECTION =====
function detectDevice() {
    const isIPad = /iPad|Macintosh/i.test(navigator.userAgent) && 'ontouchend' in document;
    const isMobile = window.innerWidth <= 768 && !isIPad;
    const isTablet = (window.innerWidth > 768 && window.innerWidth <= 1024) || isIPad;
    
    return { isIPad, isMobile, isTablet };
}

// ===== MOBILE OPTIMIZATIONS =====
const device = detectDevice();

// Disable animations on very low-end devices
if (device.isMobile && !device.isIPad) {
    // Reduce animation complexity on mobile phones only
    document.body.style.setProperty('--animation-duration', '0.2s');
}

// Handle orientation change (especially important for iPad)
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        // Refresh particle canvas size
        const canvas = document.getElementById('particleCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        // Reload page for optimal layout
        window.location.reload();
    }, 300);
});

// Prevent zoom on double tap on mobile (but allow on iPad for accessibility)
if (device.isMobile) {
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// iPad-specific optimizations
if (device.isIPad) {
    // Add iPad-specific class to body for additional styling if needed
    document.body.classList.add('ipad-device');
    
    // Optimize scroll performance on iPad
    document.addEventListener('touchstart', () => {}, { passive: true });
}

// ===== LOG INITIALIZATION =====
console.log('%c LAURIXY ', 'background: linear-gradient(135deg, #00f0ff, #ff00ff); color: white; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c Digital Innovation Hub Initialized Successfully ', 'color: #00f0ff; font-size: 14px;');

let deviceType = 'Desktop';
if (device.isIPad) deviceType = 'iPad';
else if (device.isTablet) deviceType = 'Tablet';
else if (device.isMobile) deviceType = 'Mobile';

console.log('%c Device: ' + deviceType + ' (' + window.innerWidth + 'x' + window.innerHeight + ')', 'color: #ff00ff; font-size: 12px;');

// ===== REAL-TIME STATS WATCHER =====
// Watch for changes in localStorage and update stats
window.addEventListener('storage', (e) => {
    if (e.key === 'laurixy_projects' || e.key === 'laurixy_messages') {
        console.log('Data updated:', e.key);
        updateRealtimeStats();
        loadProjectsFromAdmin();
    }
});

// Also check for updates every 2 seconds (for same-tab updates)
setInterval(() => {
    updateRealtimeStats();
}, 2000);

// ===== COMPREHENSIVE REAL-TIME SYNC =====
// Complete A-Z real-time synchronization between main site and admin panel
function setupMainSiteRealtimeSync() {
    // Watch for ALL localStorage changes
    window.addEventListener('storage', (e) => {
        console.log('Real-time sync triggered:', e.key);
        
        // Projects changed
        if (e.key === 'laurixy_projects') {
            loadProjectsFromAdmin();
            updateRealtimeStats();
        }
        
        // Messages changed
        if (e.key === 'laurixy_messages') {
            updateRealtimeStats();
        }
        
        // Content changed (update homepage content)
        if (e.key === 'laurixy_content') {
            updateSiteContent();
        }
        
        // Settings changed
        if (e.key === 'laurixy_settings') {
            applySiteSettings();
        }
        
        // Users changed
        if (e.key === 'users') {
            updateAuthUI();
        }
        
        // Activity logs changed
        if (e.key === 'laurixy_logs') {
            console.log('Activity logged');
        }
    });
    
    // Poll for updates every 2 seconds (same-tab sync) - Don't reload projects too frequently
    setInterval(() => {
        updateRealtimeStats();
        updateSiteContent();
        applySiteSettings();
    }, 2000);
}

// Update site content from admin panel
function updateSiteContent() {
    const content = JSON.parse(localStorage.getItem('laurixy_content')) || {};
    
    // Update hero title
    if (content.heroTitle) {
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) heroTitle.textContent = content.heroTitle;
    }
    
    // Update hero subtitle
    if (content.heroSubtitle) {
        const heroSubtitle = document.querySelector('.hero-subtitle');
        if (heroSubtitle) heroSubtitle.textContent = content.heroSubtitle;
    }
    
    // Update about section
    if (content.aboutTitle) {
        const aboutTitle = document.querySelector('.about-title');
        if (aboutTitle) aboutTitle.textContent = content.aboutTitle;
    }
    
    if (content.aboutDescription) {
        const aboutDesc = document.querySelector('.about-description');
        if (aboutDesc) aboutDesc.textContent = content.aboutDescription;
    }
    
    // Update footer
    if (content.footerText) {
        const footer = document.querySelector('.footer-text');
        if (footer) footer.textContent = content.footerText;
    }
}

// Apply site settings from admin panel (Firebase + localStorage)
function applySiteSettings() {
    console.log('⚙️ Applying site settings...');
    
    // Try Firebase first, fallback to localStorage
    if (typeof database !== 'undefined' && database) {
        database.ref('settings').once('value').then(snapshot => {
            const settings = snapshot.val() || {};
            console.log('🔥 Settings from Firebase:', settings);
            applySettingsToUI(settings);
        }).catch(() => {
            console.warn('⚠️ Firebase settings failed, using localStorage');
            const settings = JSON.parse(localStorage.getItem('laurixy_settings')) || {};
            applySettingsToUI(settings);
        });
    } else {
        console.warn('⚠️ Firebase not available, using localStorage');
        const settings = JSON.parse(localStorage.getItem('laurixy_settings')) || {};
        applySettingsToUI(settings);
    }
}

// Apply settings to UI
function applySettingsToUI(settings) {
    // Apply theme
    if (settings.theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
    
    // Apply maintenance mode
    if (settings.maintenanceMode) {
        console.log('🔧 Maintenance mode enabled');
        showMaintenanceMessage();
    } else {
        console.log('✅ Maintenance mode disabled');
        hideMaintenanceMessage();
    }
}

// Show maintenance message
function showMaintenanceMessage() {
    const existing = document.getElementById('maintenanceMessage');
    if (existing) return;
    
    const message = document.createElement('div');
    message.id = 'maintenanceMessage';
    message.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #ff006e, #8338ec);
        color: white;
        padding: 15px;
        text-align: center;
        z-index: 10000;
        font-weight: bold;
    `;
    message.textContent = '🔧 Site under maintenance. Check back soon!';
    document.body.insertBefore(message, document.body.firstChild);
}

// Hide maintenance message
function hideMaintenanceMessage() {
    const existing = document.getElementById('maintenanceMessage');
    if (existing) {
        existing.remove();
    }
}
