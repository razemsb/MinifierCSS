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
            counter.classList.remove('text-white');
            counter.classList.add('text-neon-blue');
            counter.style.textShadow = '0 0 8px rgba(0, 240, 255, 0.6)';
            progress.classList.replace('bg-neon-blue', 'bg-neon-green'); 
        } else {
            counter.classList.add('text-white');
            counter.classList.remove('text-neon-blue');
            counter.style.textShadow = 'none';
            progress.classList.add('bg-neon-blue');
        }
    }
}

function updateHighlighting(text) {
    if (text.length > MAX_CHARS) {
        inputEl.value = text.substring(0, MAX_CHARS);
        text = inputEl.value;
        Notifier.warning(`Превышен лимит символов (${MAX_CHARS}). Код был обрезан.`, '413 Payload Too Large');
    }

    let content = text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    document.getElementById('highlighting-code').innerHTML = content + "\n";
    Prism.highlightElement(document.getElementById('highlighting-code'));

    updateButtonStates();
}

function syncScroll(el) {
    const pre = document.getElementById('highlighting-content');
    pre.scrollTop = el.scrollTop;
    pre.scrollLeft = el.scrollLeft;
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
        document.getElementById('savedPercent').innerText =
            (((inSize - outSize) / inSize) * 100).toFixed(1) + '%';
        Notifier.success('Файл успешно минимизирован!', '200 OK');

        statusText.innerText = 'SUCCESS';
        statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-neon-green';
    }, 300);
}

function copyOutput() {
    if (!outputEl.value) return;
    navigator.clipboard.writeText(outputEl.value);
    const btn = document.getElementById('copyBtn');
    Notifier.success('Скопировано!', '200 OK');
    btn.innerText = '[ COPIED! ]';
    setTimeout(() => {
        btn.innerText = '[ Copy ]';
    }, 2000);
}

function clearAll() {
    inputArea.value = '';
    outputArea.value = '';
    updateHighlighting('');
    updateButtonStates();
    inputEl.value = '';
    updateHighlighting('');
    outputEl.value = '';
    Notifier.warning('Успешно очищено!', '307 Temporary Redirect');
    document.getElementById('savedPercent').innerText = '0.0%';
    statusText.innerText = 'IDLE';
    statusIndicator.className = 'w-1.5 h-1.5 rounded-full bg-gray-600';
}


inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        let start = this.selectionStart;
        let end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '    ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 4;
        updateHighlighting(this.value);
    }
});