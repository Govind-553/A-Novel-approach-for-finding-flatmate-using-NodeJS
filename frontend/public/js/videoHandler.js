
// videoHandler.js

let videoElement = null;
let videoWrapper = null;
let modalContainer = null;
let modalVideoContainer = null;

document.addEventListener('DOMContentLoaded', () => {
    videoElement = document.getElementById('intro-video');
    videoWrapper = document.getElementById('intro-video-wrapper');
    modalContainer = document.getElementById('video-modal');
    modalVideoContainer = document.getElementById('modal-video-container');
    
    // --- Video Controls ---
    if (videoElement) {
        
        // 1. Big Play Button
        const bigPlayBtns = document.querySelectorAll('.big-play-btn');
        bigPlayBtns.forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                togglePlay();
            };
        });

        // 3. Timeline & Controls
        const controls = document.querySelectorAll('.video-controls-overlay, .video-timeline-container');
        controls.forEach(control => {
            control.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // 4. Events
        videoElement.addEventListener('play', updatePlayButton);
        videoElement.addEventListener('pause', updatePlayButton);
        videoElement.addEventListener('timeupdate', updateTimeline);
        videoElement.addEventListener('loadedmetadata', updateTimeline);
        
        // Error handling for loading source
        videoElement.addEventListener('error', (e) => {
             console.error("Video Error:", videoElement.error);
             alert("Video Source Error: " + (videoElement.error ? videoElement.error.message : "Unknown error"));
        });
    }

    // --- Modal Logic ---
    if (modalContainer) {
        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                minimizeVideo();
            }
        });
    }
});

// Close menu when clicking elsewhere
document.addEventListener('click', (e) => {
    const menu = document.getElementById('settings-menu');
    const menuBtn = document.querySelector('.menu-btn');
    if (menu && menuBtn && !menu.contains(e.target) && !menuBtn.contains(e.target)) {
        menu.style.display = 'none';
        const sub = document.getElementById('speed-submenu');
        if(sub) sub.style.display = 'none';
    }
});

// Make togglePlay globally available for inline onclick
window.togglePlay = togglePlay;

function togglePlay() {
    if (!videoElement) {
        videoElement = document.getElementById('intro-video');
    }
    if (!videoElement) {
        console.error("Video element not found!");
        return;
    }
    
    // Stop propagation check (redundant if handled in HTML, but safe)
    if (window.event) {
        window.event.stopPropagation();
    }
    
    if (videoElement.paused) {
        videoElement.play().catch(err => {
            console.error("Play failed:", err);
            alert("Video Play Error: " + err.message);
        });
    } else {
        videoElement.pause();
    }
}

function updatePlayButton() {
    const playBtnIcon = document.querySelector('.play-btn i');
    const bigPlayBtns = document.querySelectorAll('.big-play-btn');
    
    if (videoElement && !videoElement.paused) {
        // Hide all big play buttons when playing
        bigPlayBtns.forEach(btn => btn.style.opacity = '0');
        if(playBtnIcon) {
            playBtnIcon.classList.remove('fa-play');
            playBtnIcon.classList.add('fa-pause');
        }
    } else {
        // Show all big play buttons when paused
        bigPlayBtns.forEach(btn => btn.style.opacity = '1'); 
        if(playBtnIcon) {
            playBtnIcon.classList.remove('fa-pause');
            playBtnIcon.classList.add('fa-play');
        }
        // Consistent icon update for all big play buttons
        bigPlayBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.classList.remove('fa-pause');
                icon.classList.add('fa-play');
            }
        });
    }
}

function toggleSettingsMenu() {
    const menu = document.getElementById('settings-menu');
    if (menu) {
        menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    }
}

function toggleSpeedSubmenu() {
    const sub = document.getElementById('speed-submenu');
    if (sub) {
        sub.style.display = sub.style.display === 'block' ? 'none' : 'block';
    }
}

function setSpeed(speed) {
    if (videoElement) {
        videoElement.playbackRate = speed;
        
        // Update active class on buttons
        const buttons = document.querySelectorAll('.submenu .menu-item');
        buttons.forEach(btn => {
            if (btn.textContent.includes(speed) || (speed === 1 && btn.textContent === 'Normal')) {
                btn.style.color = '#ff6a00';
            } else {
                btn.style.color = 'white';
            }
        });
    }
    toggleSettingsMenu(); // Close menu
}

function updateTimeline() {
    if (!videoElement) return;
    
    const duration = videoElement.duration || 0;
    const currentTime = videoElement.currentTime || 0;
    const progress = (currentTime / duration) * 100;
    
    const filledBar = document.getElementById('video-progress-filled');
    const thumb = document.getElementById('video-progress-thumb');
    
    if (filledBar) filledBar.style.width = `${progress}%`;
    if (thumb) thumb.style.left = `${progress}%`;

    // Time Display Updates
    const currTimeParam = document.getElementById('current-time');
    const durTimeParam = document.getElementById('duration-time');
    
    if(currTimeParam) currTimeParam.textContent = formatTime(currentTime);
    if(durTimeParam) durTimeParam.textContent = formatTime(duration);
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

function seekVideo(event) {
    if (!videoElement) return;
    const progressBar = document.getElementById('video-progress-bar');
    if (!progressBar) return;
    
    const rect = progressBar.getBoundingClientRect();
    const pos = (event.clientX - rect.left) / rect.width;
    // Clamp pos between 0 and 1
    const safePos = Math.max(0, Math.min(1, pos));
    
    videoElement.currentTime = safePos * videoElement.duration;
}

function downloadVideo() {
    if (videoElement && videoElement.src) {
        const a = document.createElement('a');
        a.href = videoElement.src;
        a.download = 'flatmate-video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } else {
        alert("No video source available to download.");
    }
}

function expandVideo() {
    if (!videoWrapper || !modalContainer || !modalVideoContainer) return;
    modalVideoContainer.appendChild(videoWrapper);
    
    // Show modal
    modalContainer.style.display = 'flex';
    
    // Add expanded class for specific styling if needed
    videoWrapper.classList.add('video-expanded');
    
    // Toggle buttons
    const expandBtn = videoWrapper.querySelector('.expand-btn');
    const minimizeBtn = videoWrapper.querySelector('.minimize-btn');
    
    if(expandBtn) expandBtn.style.display = 'none';
    if(minimizeBtn) minimizeBtn.style.display = 'flex';

}

function minimizeVideo() {
    if (!videoWrapper || !modalContainer) return;

    // Move wrapper back to original location
    const flipCardBack = document.querySelector('.flip-card-back');
    if (flipCardBack) {
        flipCardBack.appendChild(videoWrapper);
    }

    // Hide modal
    modalContainer.style.display = 'none';
    
    // Remove expanded class
    videoWrapper.classList.remove('video-expanded');
    
    // Show expand button again, hide minimize button
    const expandBtn = videoWrapper.querySelector('.expand-btn');
    const minimizeBtn = videoWrapper.querySelector('.minimize-btn');

    if(expandBtn) expandBtn.style.display = 'flex'; // Changed to flex to maintain centering if styled that way
    if(minimizeBtn) minimizeBtn.style.display = 'none';
    
    // Ensure play button visibility is correct (sometimes state might drag)
    const bigPlayBtns = document.querySelectorAll('.big-play-btn');
    if (videoElement && videoElement.paused) {
         bigPlayBtns.forEach(btn => btn.style.opacity = '1');
    }
}
