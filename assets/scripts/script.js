class EnigmaConsole {
    constructor() {
        this.isOpen = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.repoUrl = 'https://github.com/razemsb/MinifierCSS';
        this.init();
        this.makeDraggable();
    }

    init() {
        const div = document.createElement('div');
        div.id = 'enigma-console';
        div.className = `fixed bottom-4 right-4 w-[500px] h-[350px] 
                         bg-gradient-to-br from-black to-[#001100] 
                         border-2 border-[#00ff00]/80 shadow-[0_0_30px_rgba(0,255,0,0.3)] 
                         font-mono text-[11px] z-[9999] rounded-lg 
                         transition-all duration-300 transform 
                         translate-y-[120%] opacity-0 
                         flex flex-col overflow-hidden 
                         select-none cursor-default`;

        div.innerHTML = `
            <div class="scanlines"></div>
            <div class="glitch-overlay"></div>
            
            <div class="drag-handle bg-gradient-to-r from-[#001100] to-[#003300] 
                         border-b border-[#00ff00]/50 p-3 flex justify-between items-center 
                         cursor-move hover:bg-[#002200] transition-colors group">
                <div class="flex items-center gap-2 text-[#00ff00]">
                    <div class="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse"></div>
                    <i class="fas fa-terminal text-xs"></i>
                    <span class="font-bold tracking-wider neon-text">DEBUG_CONSOLE</span>
                    <span class="text-[#008800] text-xs">v1.2</span>
                </div>
                
                <div class="flex gap-2">
                    <button class="control-btn" title="Drag to move" style="cursor: move;">
                        <i class="fas fa-arrows-alt"></i>
                    </button>
                    <button class="control-btn clear-btn" title="Clear logs">
                        <i class="fas fa-eraser"></i>
                    </button>
                    <button class="control-btn close-btn" title="Close console">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div id="en-console-body" class="console-body flex-grow p-4 overflow-y-auto 
                       text-[#00ff00] font-mono leading-relaxed">
                <div class="opacity-50 italic mb-2">
                    > System initialized... <span class="text-[#00ff00]">OK</span>
                </div>
                <div class="opacity-50 italic mb-2">
                    > Error handler ready... <span class="text-[#00ff00]">OK</span>
                </div>
                <div class="opacity-50 italic mb-2">
                    > Listening for exceptions...
                </div>
            </div>

            <div class="p-3 bg-[#001100]/50 border-t border-[#00ff00]/20">
                <div class="flex items-center text-[#00ff00] text-xs">
                    <span class="text-[#008800] mr-2">>_</span>
                    <span class="blink-cursor">Ready for error reports</span>
                </div>
            </div>
        `;

        document.body.appendChild(div);
        this.el = div;
        this.body = div.querySelector('#en-console-body');
        this.dragHandle = div.querySelector('.drag-handle');

        div.querySelector('.clear-btn').onclick = (e) => {
            e.stopPropagation();
            this.clear();
        };

        div.querySelector('.close-btn').onclick = (e) => {
            e.stopPropagation();
            this.toggle();
        };
    }

    makeDraggable() {
        this.dragHandle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.control-btn')) return;

            this.isDragging = true;
            const rect = this.el.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            document.addEventListener('mousemove', this.onMouseMove.bind(this));
            document.addEventListener('mouseup', this.onMouseUp.bind(this));

            this.el.style.transition = 'none';
            this.el.style.cursor = 'grabbing';
        });
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        e.preventDefault();

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        const maxX = window.innerWidth - this.el.offsetWidth;
        const maxY = window.innerHeight - this.el.offsetHeight;

        this.el.style.left = Math.min(Math.max(0, x), maxX) + 'px';
        this.el.style.top = Math.min(Math.max(0, y), maxY) + 'px';
        this.el.style.right = 'auto';
        this.el.style.bottom = 'auto';
        this.el.style.transform = 'translateY(0)';
    }

    onMouseUp() {
        this.isDragging = false;
        this.el.style.transition = 'all 0.3s';
        this.el.style.cursor = 'default';

        document.removeEventListener('mousemove', this.onMouseMove.bind(this));
        document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    }

    toggle() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            this.el.classList.remove('opacity-0', 'translate-y-[120%]');
            this.el.classList.add('opacity-100', 'translate-y-0');
        } else {
            this.el.classList.remove('opacity-100', 'translate-y-0');
            this.el.classList.add('opacity-0', 'translate-y-[120%]');
        }
    }

    clear() {
        this.body.innerHTML = `
            <div class="opacity-50 italic mb-2">
                > Console cleared at ${new Date().toLocaleTimeString()}
            </div>
            <div class="opacity-50 italic mb-2">
                > Listening for errors... <span class="text-[#00ff00]">ACTIVE</span>
            </div>
        `;
    }

    getHex() {
        return '0x' + Math.floor(Math.random() * 16777215).toString(16).toUpperCase().padStart(6, '0');
    }

    getTimestamp() {
        const now = new Date();
        return `${now.getHours().toString().padStart(2, '0')}:` +
            `${now.getMinutes().toString().padStart(2, '0')}:` +
            `${now.getSeconds().toString().padStart(2, '0')}.` +
            `${now.getMilliseconds().toString().padStart(3, '0')}`;
    }

    error({ title = 'UNKNOWN_ERROR', message = 'No details provided', level = 'ERROR', code = null }) {
        if (!this.isOpen) this.toggle();

        const timestamp = this.getTimestamp();
        const errorId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const memoryAddr = this.getHex();
        const pid = Math.floor(Math.random() * 9000) + 1000;

        const logItem = document.createElement('div');
        logItem.className = 'error-entry mb-4 p-3 bg-black/30 border-l-4 border-red-500/80';

        let levelColor = '#ff5555';
        if (level === 'WARNING') levelColor = '#ffff55';
        if (level === 'INFO') levelColor = '#55ffff';
        if (level === 'CRITICAL') levelColor = '#ff00ff';

        logItem.innerHTML = `
            <div class="flex justify-between items-start mb-1">
                <div class="font-bold" style="color: ${levelColor}">
                    <i class="fas fa-exclamation-circle mr-1"></i>
                    [${timestamp}] ${level}: ${title}
                </div>
                <div class="text-[#008800] text-xs">
                    ID: ${errorId}
                </div>
            </div>
            
            <div class="text-[#00cc00] text-xs mb-2 flex gap-4">
                <span><span class="text-white">PID:</span> ${pid}</span>
                <span><span class="text-white">ADDR:</span> ${memoryAddr}</span>
                ${code ? `<span><span class="text-white">CODE:</span> ${code}</span>` : ''}
            </div>
            
            <div class="text-white bg-red-900/20 p-2 rounded border border-red-500/30 mb-3">
                <span class="text-red-400 mr-2">>></span>${message}
            </div>
            
            <div class="flex justify-between items-center text-xs">
                <div class="text-[#008800]">
                    <i class="fas fa-history mr-1"></i>
                    Stack trace saved to buffer
                </div>
                <div class="flex gap-3">
                    <a href="${this.repoUrl}/issues" 
                       target="_blank"
                       class="text-[#00ff00] hover:text-white underline decoration-dashed hover:decoration-solid transition-all">
                        <i class="fas fa-bug mr-1"></i>Report
                    </a>
                    <a href="${this.repoUrl}/pulls" 
                       target="_blank"
                       class="text-[#00ff00] hover:text-white underline decoration-dashed hover:decoration-solid transition-all">
                        <i class="fas fa-code-merge mr-1"></i>Fix
                    </a>
                    <span class="text-[#005500] cursor-pointer hover:text-[#00ff00] copy-btn" 
                          data-content="${title}: ${message}">
                        <i class="fas fa-copy mr-1"></i>Copy
                    </span>
                </div>
            </div>
            
            <div class="mt-2 text-[#005500] text-xs border-t border-[#005500]/30 pt-2">
                <i class="fas fa-lightbulb text-[#ffff55] mr-1"></i>
                <span>Check API endpoints and verify data integrity</span>
            </div>
        `;

        this.body.appendChild(logItem);

        this.body.scrollTop = this.body.scrollHeight;

        const copyBtn = logItem.querySelector('.copy-btn');
        copyBtn.onclick = () => {
            const content = copyBtn.getAttribute('data-content');
            navigator.clipboard.writeText(content).then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i>Copied!';
                copyBtn.classList.remove('text-[#005500]');
                copyBtn.classList.add('text-[#00ff00]');

                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i>Copy';
                    copyBtn.classList.remove('text-[#00ff00]');
                    copyBtn.classList.add('text-[#005500]');
                }, 2000);
            });
        };

        logItem.style.opacity = '0';
        logItem.style.transform = 'translateY(10px)';

        setTimeout(() => {
            logItem.style.transition = 'all 0.3s ease-out';
            logItem.style.opacity = '1';
            logItem.style.transform = 'translateY(0)';
        }, 10);

        this.playErrorSound(level);
    }

    playErrorSound(level) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            let freq = 600;
            if (level === 'WARNING') freq = 400;
            if (level === 'CRITICAL') freq = 800;

            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 0.7, audioContext.currentTime + 0.1);

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (e) {
        }
    }

    log(message, type = 'info') {
        const timestamp = this.getTimestamp();
        const icon = type === 'info' ? 'fas fa-info-circle' :
            type === 'success' ? 'fas fa-check-circle' :
                'fas fa-exclamation-triangle';

        const color = type === 'info' ? '#00ff00' :
            type === 'success' ? '#00ff00' :
                '#ffff00';

        const line = document.createElement('div');
        line.className = 'mb-2 p-2 bg-black/20 rounded';
        line.innerHTML = `
            <div style="color: ${color}">
                <i class="${icon} mr-2"></i>
                [${timestamp}] ${message}
            </div>
        `;

        this.body.appendChild(line);
        this.body.scrollTop = this.body.scrollHeight;
    }
}

window.EnConsole = new EnigmaConsole();

document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        window.EnConsole.toggle();
    }
});

class EnigmaNotifier {
    constructor(options = {}) {
        this.settings = {
            position: 'bottom-right',
            duration: 2000,
            maxNotifications: 3,
            showTime: true,
            autoClose: true,
            ...options,
        };

        this.icons = {
            success: '<i class="fa-solid fa-bolt-lightning"></i>',
            error: '<i class="fa-solid fa-microchip"></i>',
            info: '<i class="fa-solid fa-terminal"></i>',
            warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
        };

        this.initContainers();
    }

    initContainers() {
        const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        positions.forEach((pos) => {
            if (!document.getElementById(`popup-container-${pos}`)) {
                const container = document.createElement('div');
                container.id = `popup-container-${pos}`;
                container.className = `popup-container ${pos}`;
                document.body.appendChild(container);
            }
        });
    }

    show({
        type = 'info',
        message = '',
        title = '',
        duration = this.settings.duration,
        position = this.settings.position,
        showTime = this.settings.showTime,
        autoClose = this.settings.autoClose,
    } = {}) {
        const container = document.getElementById(`popup-container-${position}`);
        if (!container) return;


        if (container.children.length >= this.settings.maxNotifications) {
            const first = container.children[0];
            first.classList.remove('show');
            setTimeout(() => first.remove(), 400);
        }

        const currentTime = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
        const popup = document.createElement('div');

        popup.className = `popup popup-${type}`;
        const displayTitle = title || `SYSTEM_${type.toUpperCase()}`;

        popup.innerHTML = `
            <div class="popup-icon">${this.icons[type]}</div>
            <div class="popup-content">
                <div class="popup-title">${displayTitle}</div>
                <div class="popup-message">${message}</div>
                ${showTime ? `<div class="popup-time">TIMESTAMP: ${currentTime}</div>` : ''}
            </div>
            <button class="popup-close" aria-label="Abort">
                <i class="fa-solid fa-xmark"></i>
            </button>
        `;

        container.appendChild(popup);


        requestAnimationFrame(() => popup.classList.add('show'));

        const closePopup = () => {
            popup.classList.add('hide');
            popup.classList.remove('show');
            popup.addEventListener('transitionend', () => popup.remove(), { once: true });
        };

        let timeoutId;
        if (autoClose) {
            timeoutId = setTimeout(closePopup, duration);
        }

        const closeBtn = popup.querySelector('.popup-close');
        closeBtn.onclick = () => {
            clearTimeout(timeoutId);
            closePopup();
        };


        popup.onmouseenter = () => clearTimeout(timeoutId);
        popup.onmouseleave = () => {
            if (autoClose) timeoutId = setTimeout(closePopup, duration);
        };

        return { close: closePopup };
    }

    success(msg, title) {
        return this.show({ type: 'success', message: msg, title });
    }
    error(msg, title) {
        return this.show({ type: 'error', message: msg, title });
    }
    info(msg, title) {
        return this.show({ type: 'info', message: msg, title });
    }
    warning(msg, title) {
        return this.show({ type: 'warning', message: msg, title });
    }
}

const Notifier = new EnigmaNotifier();
const inputEl = document.getElementById('inputCss');
const outputEl = document.getElementById('outputCss');
const codeEl = document.getElementById('highlighting-code');
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');
const copyBtn = document.getElementById('copyBtn');
const clearBtn = document.getElementById('clearBtn');
const inputArea = document.getElementById('inputCss');
const outputArea = document.getElementById('outputCss');
const MAX_CHARS = 80000;

function updateButtonStates() {
    try {
        const currentLen = inputArea.value.length;
        clearBtn.disabled = currentLen === 0;
        copyBtn.disabled = outputArea.value.trim().length === 0;
        const counter = document.getElementById('charCounter');
        const progress = document.getElementById('charProgress');

        if (counter && progress) {
            const displayLen = currentLen > 999 ? (currentLen / 1000).toFixed(1) + 'k' : currentLen;
            counter.innerText = `${displayLen} / 80k`;

            const percent = Math.min((currentLen / MAX_CHARS) * 100, 100);
            progress.style.width = `${percent}%`;

            if (currentLen > MAX_CHARS * 0.9) {
                counter.style.color = '#ff003c';
                counter.style.textShadow = '0 0 10px rgba(255, 0, 60, 0.6)';
                progress.style.backgroundColor = '#ff003c';
                progress.style.boxShadow = '0 0 12px rgba(255, 0, 60, 0.4)';
            } else if (currentLen > MAX_CHARS * 0.5) {
                counter.style.color = '#ffb800';
                counter.style.textShadow = '0 0 10px rgba(255, 184, 0, 0.5)';
                progress.style.backgroundColor = '#ffb800';
                progress.style.boxShadow = '0 0 12px rgba(255, 184, 0, 0.3)';
            } else {
                counter.style.color = '';
                counter.style.textShadow = '';

                progress.style.backgroundColor = '';
                progress.style.boxShadow = '';
                progress.classList.add('bg-neon-blue');
            }
        }
    } catch (e) {
        EnConsole.error({
            title: 'Error',
            message: `Error with updateButtonStates().`,
            level: 'ERROR',
            code: 413
        });
    }
}

function updateHighlighting(text) {
    try {
        if (text.length > MAX_CHARS) {
            inputEl.value = text.substring(0, MAX_CHARS);
            text = inputEl.value;

            Notifier.warning(`Превышен лимит символов (${MAX_CHARS}). Код был обрезан.`, '413 Payload Too Large');

            EnConsole.error({
                title: 'BUFFER_OVERFLOW',
                message: `Input exceeded ${MAX_CHARS} chars. Truncated automatically.`,
                level: 'WARNING',
                code: 413
            });
        }

        let content = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

        const highlightEl = document.getElementById('highlighting-code');
        if (highlightEl) {
            highlightEl.innerHTML = content + "\n";
            Prism.highlightElement(highlightEl);
        }

        updateButtonStates();

    } catch (e) {
        EnConsole.error({
            title: 'SYNTAX_HIGHLIGHT_FAIL',
            message: e.message || 'PrismJS failed to render token stream.',
            level: 'ERROR',
            code: 500
        });
    }
}

function syncScroll(el) {
    const pre = document.getElementById('highlighting-content');
    if (pre) {
        pre.scrollTop = el.scrollTop;
        pre.scrollLeft = el.scrollLeft;
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i];
}

function minify() {
    const raw = inputEl.value;
    if (!raw.trim()) {
        Notifier.error('Введите CSS для минимизирования', '400 Bad Request');
        return;
    }

    statusText.innerText = 'PROCESSING...';
    statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-neon-blue animate-ping';

    setTimeout(() => {
        try {
            const minified = raw
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .replace(/\s+/g, ' ')
                .replace(/\s*([{}:;,])\s*/g, '$1')
                .replace(/;}/g, '}')
                .trim();

            outputEl.value = minified;

            const inSize = new Blob([raw]).size;
            const outSize = new Blob([minified]).size;

            document.getElementById('inputSize').innerText = formatBytes(inSize);
            document.getElementById('outputSize').innerText = formatBytes(outSize);

            updateButtonStates();

            const savedPct = (((inSize - outSize) / inSize) * 100).toFixed(1);
            document.getElementById('savedPercent').innerText = savedPct + '%';

            Notifier.success('Файл успешно минимизирован!', '200 OK');

            statusText.innerText = 'SUCCESS';
            statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-neon-green';

            EnConsole.log(`Minification complete. Reduced by ${savedPct}%.`, 'success');

        } catch (e) {
            statusText.innerText = 'ERROR';
            statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-red-500';

            Notifier.error('Критическая ошибка при обработке!', '500 Internal Error');

            EnConsole.error({
                title: 'PARSING_EXCEPTION',
                message: `Regex engine failure: ${e.message}`,
                level: 'CRITICAL',
                code: 500
            });
        }
    }, 300);
}

function copyOutput() {
    if (!outputEl.value) {
        EnConsole.log('Attempted copy on empty buffer.', 'warning');
        return;
    }

    navigator.clipboard.writeText(outputEl.value)
        .then(() => {
            const btn = document.getElementById('copyBtn');
            Notifier.success('Скопировано!', '200 OK');
            btn.innerText = '[ COPIED! ]';

            EnConsole.log('Buffer content exported to system clipboard.', 'success');

            setTimeout(() => {
                btn.innerText = '[ Copy ]';
            }, 2000);
        })
        .catch(err => {
            Notifier.error('Нет доступа к буферу обмена', '403 Forbidden');

            EnConsole.error({
                title: 'CLIPBOARD_ACCESS_DENIED',
                message: `Browser prevented write access: ${err.message}`,
                level: 'ERROR',
                code: 403
            });
        });
}

function clearAll() {
    try {
        inputArea.value = '';
        outputArea.value = '';

        document.getElementById('inputSize').innerText = '0B';
        document.getElementById('outputSize').innerText = '0B';
        document.getElementById('savedPercent').innerText = '0.0%';

        updateHighlighting('');
        updateButtonStates();

        statusText.innerText = 'IDLE';
        statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-gray-600';

        Notifier.warning('Успешно очищено!', '307 Temporary Redirect');
        EnConsole.log('Memory buffers flushed. System idle.', 'info');

    } catch (e) {
        EnConsole.error({
            title: 'MEMORY_FLUSH_FAIL',
            message: `Failed to clear DOM elements: ${e.message}`,
            level: 'ERROR',
            code: 500
        });
    }
}

inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        try {
            let start = this.selectionStart;
            let end = this.selectionEnd;
            this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
            this.selectionStart = this.selectionEnd = start + 4;
            updateHighlighting(this.value);
        } catch (e) {
            EnConsole.error({
                title: 'INPUT_HANDLER_ERROR',
                message: `Tab key insertion failed: ${e.message}`,
                level: 'WARNING',
                code: 400
            });
        }
    }
});
