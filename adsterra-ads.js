// ============================================
// ADSTERRA ADS INTEGRATION - APPROVED CODE
// ============================================
// Approved Adsterra banner ad code
// Key: cbcd213f36f3fc208b64d6309fd93a03
// ============================================

console.log('🎯 Initializing Adsterra ads (Approved Code)...');

// ============================================
// INITIALIZE ADSTERRA BANNER ADS
// ============================================
function initAdsterraBannerAds() {
    console.log('📊 Initializing Adsterra banner ads...');

    // Create top banner if it doesn't exist
    if (!document.getElementById('adsterra-top-banner')) {
        const topBanner = document.createElement('div');
        topBanner.id = 'adsterra-top-banner';
        topBanner.style.cssText = `
            text-align: center;
            background: rgba(10, 10, 15, 0.95);
            border-bottom: 1px solid rgba(0, 240, 255, 0.2);
            padding: 1rem;
            z-index: 999;
            position: relative;
            min-height: 100px;
        `;

        // Add Adsterra approved banner code
        topBanner.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 90px;">
                <script type="text/javascript">
                    atOptions = {
                        'key' : 'cbcd213f36f3fc208b64d6309fd93a03',
                        'format' : 'iframe',
                        'height' : 90,
                        'width' : 728,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="//www.highperformanceformat.com/cbcd213f36f3fc208b64d6309fd93a03/invoke.js"></script>
            </div>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(topBanner, document.body.firstChild);
        console.log('✅ Top banner created with approved code');
    }

    // Create bottom banner if it doesn't exist
    if (!document.getElementById('adsterra-bottom-banner')) {
        const bottomBanner = document.createElement('div');
        bottomBanner.id = 'adsterra-bottom-banner';
        bottomBanner.style.cssText = `
            text-align: center;
            background: rgba(10, 10, 15, 0.95);
            border-top: 1px solid rgba(0, 240, 255, 0.2);
            padding: 1rem;
            z-index: 999;
            position: relative;
            min-height: 100px;
        `;

        // Add Adsterra approved banner code
        bottomBanner.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; min-height: 90px;">
                <script type="text/javascript">
                    atOptions = {
                        'key' : 'cbcd213f36f3fc208b64d6309fd93a03',
                        'format' : 'iframe',
                        'height' : 90,
                        'width' : 728,
                        'params' : {}
                    };
                </script>
                <script type="text/javascript" src="//www.highperformanceformat.com/cbcd213f36f3fc208b64d6309fd93a03/invoke.js"></script>
            </div>
        `;

        // Insert at the end of body
        document.body.appendChild(bottomBanner);
        console.log('✅ Bottom banner created with approved code');
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded - initializing Adsterra ads');
        initAdsterraBannerAds();
    });
} else {
    console.log('📄 DOM already loaded - initializing Adsterra ads');
    initAdsterraBannerAds();
}

// ============================================
// REINITIALIZE ON PAGE CHANGES
// ============================================
window.addEventListener('load', () => {
    console.log('✅ Page fully loaded - Adsterra ads ready');
});

console.log('✅ Adsterra ads script loaded successfully with approved code');
