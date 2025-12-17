// ===== GLOBAL BANNER ADS FOR ALL PAGES =====
// Include this script on ALL pages to show banner ads at top and bottom

// Initialize banner ads on page load
function initGlobalBannerAds() {
    console.log('📊 Initializing global banner ads...');
    
    // Load Google Mobile Ads SDK
    if (!window.adsbygoogle) {
        const script = document.createElement('script');
        script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
        script.async = true;
        script.onload = () => {
            console.log('✅ Google Mobile Ads SDK loaded');
            createAndLoadBannerAds();
        };
        document.head.appendChild(script);
    } else {
        createAndLoadBannerAds();
    }
}

// Create and load banner ads
function createAndLoadBannerAds() {
    console.log('📊 Creating banner ads...');
    
    // Create top banner if it doesn't exist
    if (!document.getElementById('globalTopBannerAd')) {
        const topBanner = document.createElement('div');
        topBanner.id = 'globalTopBannerAd';
        topBanner.style.cssText = `
            display: block;
            text-align: center;
            background: rgba(10, 10, 15, 0.95);
            border-bottom: 1px solid rgba(0, 240, 255, 0.2);
            padding: 1rem;
            z-index: 999;
            position: relative;
        `;
        topBanner.innerHTML = `
            <ins class="adsbygoogle" 
                 style="display:inline-block;width:728px;height:90px" 
                 data-ad-client="ca-pub-6093952682208910" 
                 data-ad-slot="3634553901">
            </ins>
        `;
        
        // Insert at the beginning of body
        document.body.insertBefore(topBanner, document.body.firstChild);
        console.log('✅ Top banner created');
    }
    
    // Create bottom banner if it doesn't exist
    if (!document.getElementById('globalBottomBannerAd')) {
        const bottomBanner = document.createElement('div');
        bottomBanner.id = 'globalBottomBannerAd';
        bottomBanner.style.cssText = `
            display: block;
            text-align: center;
            background: rgba(10, 10, 15, 0.95);
            border-top: 1px solid rgba(0, 240, 255, 0.2);
            padding: 1rem;
            z-index: 999;
            position: relative;
        `;
        bottomBanner.innerHTML = `
            <ins class="adsbygoogle" 
                 style="display:inline-block;width:728px;height:90px" 
                 data-ad-client="ca-pub-6093952682208910" 
                 data-ad-slot="3634553901">
            </ins>
        `;
        
        // Insert at the end of body
        document.body.appendChild(bottomBanner);
        console.log('✅ Bottom banner created');
    }
    
    // Push AdSense ads
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
        console.log('✅ Global banner ads loaded successfully');
    } catch (e) {
        console.warn('⚠️ Global banner ads loading warning:', e);
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobalBannerAds);
} else {
    initGlobalBannerAds();
}

// Also initialize on page load
window.addEventListener('load', () => {
    console.log('📊 Page fully loaded - banner ads ready');
});
