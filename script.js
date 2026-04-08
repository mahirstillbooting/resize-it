let history = [];
let redoStack = [];
const MAX_HISTORY = 20;


document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const canvas = document.getElementById('mainCanvas');
    const ctx = canvas ? canvas.getContext('2d') : null;

    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    const initBtn = document.getElementById('initBtn');
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');
    const bgColorPicker = document.getElementById('bgColorPicker');
    const transparentCheck = document.getElementById('transparentCheck');
    const viewScale = document.getElementById('viewScale');
    const scaleVal = document.getElementById('scaleVal');

    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    // --- State Variables ---
    let img = new Image();
    let isImageLoaded = false;
    let canvasBgColor = "#ffffff";

    let imgState = {
        x: 0, y: 0,
        width: 0, height: 0,
        isDragging: false,
        activeHandle: null,
        dragStartX: 0, dragStartY: 0,
        handleSize: 10
    };

    // --- 1. Step 1: Initialize Workspace ---
    if (initBtn) {
        initBtn.addEventListener('click', () => {
            const w = parseInt(document.getElementById('canvasWidth').value);
            const h = parseInt(document.getElementById('canvasHeight').value);

            if (w >= 100 && h >= 100 && canvas) {
                canvas.width = w;
                canvas.height = h;
                step1.style.display = 'none';
                step2.style.display = 'block';
                draw();
            } else {
                alert("Please enter valid dimensions (min 100px).");
            }
        });
    }

    // --- 2. Step 2: Upload Logic ---
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', e => {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = event => {
                    img.onload = () => {
                        isImageLoaded = true;
                        const ratio = img.width / img.height;
                        imgState.width = canvas.width * 0.7;
                        imgState.height = imgState.width / ratio;
                        if (imgState.height > canvas.height * 0.7) {
                            imgState.height = canvas.height * 0.7;
                            imgState.width = imgState.height * ratio;
                        }
                        imgState.x = (canvas.width - imgState.width) / 2;
                        imgState.y = (canvas.height - imgState.height) / 2;
                        step2.style.display = 'none';
                        step3.style.display = 'flex'; // Changed to flex for your layout
                        draw();
                    };
                    img.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Check for saved user preference
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.innerHTML = '<span class="icon">☀️</span> Light Mode';
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');

        if (body.classList.contains('dark-mode')) {
            themeToggle.innerHTML = '<span class="icon">☀️</span> Light Mode';
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggle.innerHTML = '<span class="icon">🌙</span> Dark Mode';
            localStorage.setItem('theme', 'light');
        }
        draw();
    });

    if (viewScale) {
        viewScale.addEventListener('input', (e) => {
            const scale = e.target.value;
            // This scales the visual display of the canvas without changing 
            // the actual pixel data of your image.
            canvas.style.transform = `scale(${scale})`;
            scaleVal.innerText = `${Math.round(scale * 100)}%`;
        });
    }

    function getHandleCoordinates() {
        const { x, y, width: w, height: h } = imgState;
        return [
            { x: x, y: y, id: 'tl' }, { x: x + w / 2, y: y, id: 'tm' },
            { x: x + w, y: y, id: 'tr' }, { x: x + w, y: y + h / 2, id: 'rm' },
            { x: x + w, y: y + h, id: 'br' }, { x: x + w / 2, y: y + h, id: 'bm' },
            { x: x, y: y + h, id: 'bl' }, { x: x, y: y + h / 2, id: 'lm' }
        ];
    }
    function getCheckerboardPattern(isDark) {
        const patternCanvas = document.createElement('canvas');
        const pCtx = patternCanvas.getContext('2d');
        const size = 20;
        patternCanvas.width = size * 2;
        patternCanvas.height = size * 2;


        // Light Mode: White (#ffffff) and Light Gray (#e2e8f0)
        // Dark Mode: Dark Gray (#2a2a2b) and Gemini Black (#131314)
        const color1 = isDark ? '#2a2a2b' : '#ffffff';
        const color2 = isDark ? '#131314' : '#e2e8f0';

        // Fill the base with Color 1
        pCtx.fillStyle = color1;
        pCtx.fillRect(0, 0, size * 2, size * 2);

        // Draw the alternating squares with Color 2
        pCtx.fillStyle = color2;
        pCtx.fillRect(0, 0, size, size);
        pCtx.fillRect(size, size, size, size);

        return ctx.createPattern(patternCanvas, 'repeat');
    }
    // --- 4. Main Draw Loop (THE UPDATED ONE) ---
    function draw() {
        if (!ctx) return;

        // 1. Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (transparentCheck && transparentCheck.checked) {
            const isDarkMode = document.body.classList.contains('dark-mode');
            ctx.fillStyle = getCheckerboardPattern(isDarkMode);
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = canvasBgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // 3. Draw the Image
        if (isImageLoaded) {
            ctx.drawImage(img, imgState.x, imgState.y, imgState.width, imgState.height);

            // 4. Draw Handles
            const handles = getHandleCoordinates();
            ctx.fillStyle = "#2563eb";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;

            handles.forEach(h => {
                ctx.beginPath();
                ctx.arc(h.x, h.y, imgState.handleSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });
        }
    }

    // --- 5. Interaction Logic ---
    canvas.addEventListener('mousedown', e => {
        if (!isImageLoaded) return;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const handles = getHandleCoordinates();
        imgState.activeHandle = null;

        // 1. Check if we hit a Resize Handle first
        for (const h of handles) {
            const dist = Math.sqrt((mx - h.x) ** 2 + (my - h.y) ** 2);
            if (dist < imgState.handleSize) {
                imgState.activeHandle = h.id;
                saveState(); // Save state at the start of a resize
                return;
            }
        }

        // 2. Check if we hit the Image for Dragging
        if (mx >= imgState.x && mx <= imgState.x + imgState.width &&
            my >= imgState.y && my <= imgState.y + imgState.height) {

            imgState.isDragging = true;
            // This math is crucial: it remembers WHERE on the image you clicked
            imgState.dragStartX = mx - imgState.x;
            imgState.dragStartY = my - imgState.y;

            saveState(); // Save state at the start of a move
            canvas.style.cursor = 'grabbing'; // Visual feedback
        }
    });


    window.addEventListener('mouseup', () => {
        imgState.isDragging = false;
        imgState.activeHandle = null;
        canvas.style.cursor = 'default';
    });

    // Added to make it work on phones
    canvas.addEventListener('touchstart', e => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: false });

    window.addEventListener('touchmove', e => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        window.dispatchEvent(mouseEvent);
        e.preventDefault(); // Prevents the page from scrolling while moving the image
    }, { passive: false });

    window.addEventListener('touchend', () => {
        const mouseEvent = new MouseEvent("mouseup", {});
        window.dispatchEvent(mouseEvent);
    });

    // A single, unified move listener for both Mouse and Touch
    const handleMove = (e) => {
        if (!imgState.isDragging && !imgState.activeHandle) return;

        // Handle both Touch and Mouse coordinates
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const rect = canvas.getBoundingClientRect();
        const mx = clientX - rect.left;
        const my = clientY - rect.top;
        const min = 20;

        if (imgState.activeHandle) {
            const h = imgState.activeHandle;
            const right = imgState.x + imgState.width;
            const bottom = imgState.y + imgState.height;

            if (h.includes('t')) { imgState.y = Math.min(my, bottom - min); imgState.height = bottom - imgState.y; }
            if (h.includes('b')) { imgState.height = Math.max(min, my - imgState.y); }
            if (h.includes('l')) { imgState.x = Math.min(mx, right - min); imgState.width = right - imgState.x; }
            if (h.includes('r')) { imgState.width = Math.max(min, mx - imgState.x); }
            draw();
        } else if (imgState.isDragging) {
            imgState.x = mx - imgState.dragStartX;
            imgState.y = my - imgState.dragStartY;
            draw();
        }

        // Crucial: Stop the phone from scrolling while dragging the image
        if (e.cancelable) e.preventDefault();
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false });

    window.addEventListener('mouseup', () => {
        if (imgState.isDragging || imgState.activeHandle) {
            saveState(); // Capture the position AFTER the move/resize
        }
        imgState.isDragging = false;
        imgState.activeHandle = null;
    });

    // --- 6. Event Listeners for Controls ---
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            canvasBgColor = e.target.value;
            draw();
        });
    }

    if (transparentCheck) {
        transparentCheck.addEventListener('change', draw);
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            // 1. Temporarily hide handles by clearing and drawing without them
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw Background
            if (transparentCheck && !transparentCheck.checked) {
                ctx.fillStyle = canvasBgColor;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Draw Image ONLY (No handles)
            if (isImageLoaded) {
                ctx.drawImage(img, imgState.x, imgState.y, imgState.width, imgState.height);
            }

            // 2. Perform the download
            const link = document.createElement('a');
            link.download = 'purecrop-resized.png';
            link.href = canvas.toDataURL('image/png');
            link.click();

            // 3. Bring the handles back for the user to see
            draw();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Reset current workspace?")) location.reload();
        });
    }
    // Add this to your listeners section in script.js
    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', (e) => {
            canvasBgColor = e.target.value;

            // If the user picks a color, they obviously want to see it.
            // So, we uncheck the transparency box automatically.
            if (transparentCheck) {
                transparentCheck.checked = false;
            }

            draw();
        });
    }

    if (transparentCheck) {
        transparentCheck.addEventListener('change', draw);
    }

    function getMousePos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // We divide by the current scale so your mouse still hits the handles perfectly
        const currentScale = viewScale ? viewScale.value : 1;

        return {
            x: (clientX - rect.left) / currentScale,
            y: (clientY - rect.top) / currentScale
        };
    }


    function saveState() {
        // Clone the current state so we don't just save a reference
        history.push({ ...imgState });
        // Clear redo stack whenever a new action is taken
        redoStack = [];
        if (history.length > MAX_HISTORY) history.shift();
    }

    window.addEventListener('keydown', (e) => {
        const isCtrl = e.ctrlKey || e.metaKey;

        if (isCtrl && e.key.toLowerCase() === 'z') {
            e.preventDefault();

            if (history.length > 1) {
                // 1. Move current state to redo
                redoStack.push(history.pop());

                // 2. Get the previous state
                const prevState = history[history.length - 1];

                // 3. APPLY the state but FORCE interaction to be false
                // This is the "kill switch" for the sticky mouse
                imgState = { ...prevState, isDragging: false, activeHandle: null };

                draw();
            }
        }

        if (isCtrl && e.key.toLowerCase() === 'y') {
            e.preventDefault();

            if (redoStack.length > 0) {
                // 1. Move from redo to history
                const nextState = redoStack.pop();
                history.push(nextState);

                // 2. APPLY and FORCE interaction to be false
                imgState = { ...nextState, isDragging: false, activeHandle: null };

                draw();
            }
        }
    });
    // This prevents the "sticky mouse" if you leave the browser window while dragging
    window.addEventListener('blur', () => {
        imgState.isDragging = false;
        imgState.activeHandle = null;
    });

});
