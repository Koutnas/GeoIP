export class Sidebar {
    constructor(callbacks) {
        this.callbacks = callbacks;
        this.routeList = document.getElementById('routeList');
        this.playIcon = document.querySelector('.icon-play');
        this.pauseIcon = document.querySelector('.icon-pause');
        
        this._setupIconListeners();
    }

    _setupIconListeners() {
        document.querySelectorAll('.sidebar-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                
                if (action === 'play' || action === 'pause') {
                    this.callbacks.onTogglePlayback();
                } else if (action === 'settings') {
                    this.callbacks.onSettingsClick();
                } else if (action === 'routes') {
                    this.callbacks.onRoutesClick();
                }
            });
        });
    }
    setPlaybackState(isPaused) {
        if (isPaused) {
            // Stream is paused -> Show Play, Hide Pause
            this.playIcon.classList.remove('hidden');
            this.pauseIcon.classList.add('hidden');
        } else {
            // Stream is playing -> Hide Play, Show Pause
            this.playIcon.classList.add('hidden');
            this.pauseIcon.classList.remove('hidden');
        }
    }
    renderRoutes(state) {
        this.routeList.innerHTML = ''; 

        for (const destIp of state.routes.keys()) {
            const li = document.createElement('li');
            li.className = 'route-item';
            
            if (state.selectedTarget === destIp) {
                li.classList.add('route-selected');
            }
            
            const name = state.hostnames.get(destIp) || destIp;
            li.textContent = name;

            li.onclick = () => this.callbacks.onRouteSelect(destIp);
            this.routeList.appendChild(li);
        }
    }
}