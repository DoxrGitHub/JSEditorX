// DOM Elements
const fileMenu = document.querySelector('.file-pane');
const codeEditor = document.querySelector('#editor');
const codeOutput = document.querySelector('#output');
const resizeHandle = document.querySelector('#resizer');

// State variables
let currentFile = '';
let modified = false;

// Initialize CodeMirror editor
const editor = CodeMirror(codeEditor, {
    value: `/* ******* JSEditorX - Main ******* */
// Write some JavaScript code here - this stays in your browser!
// Press Ctrl + S to save your code to a file.
// To run, press Ctrl + Enter, or click on the word "Output" to the right!
// You can open and save files by hovering over to the left; a menu will pop up.
`,
    lineNumbers: true,
    theme: "dracula",
    mode: "javascript",
    scrollbarStyle: "null"
});

// Event listener to execute code when the output box is clicked
codeOutput.addEventListener('click', () => {
    codeOutput.innerHTML = '<h4 style="color: #55ff55">💨 Running...</h4>';
    setTimeout(executeCode, 1);
});

// Keyboard shortcuts for saving and running code
codeEditor.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.keyCode === 13) {
        codeOutput.click(); // Run code on Ctrl + Enter
    }

    // Mark file as modified if changes are detected
    if (!modified && editor.getValue() !== localStorage.getItem(currentFile)) {
        const currentFileItem = fileMenu.querySelector('.current');
        if (currentFileItem) {
            modified = true;
            currentFileItem.classList.add('modified');
        }
    }
});

// Resize handling for the output pane
resizeHandle.addEventListener('mousedown', initDrag);

function initDrag(e) {
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(codeOutput).width, 10);
    document.documentElement.addEventListener('mousemove', doDrag);
    document.documentElement.addEventListener('mouseup', stopDrag);
}

function doDrag(e) {
    codeOutput.style.width = `${startWidth - e.clientX + startX}px`;
}

function stopDrag() {
    document.documentElement.removeEventListener('mousemove', doDrag);
    document.documentElement.removeEventListener('mouseup', stopDrag);
}

// Execute the code from the editor
function executeCode() {
    // Restrict access to potentially unsafe globals
    const document = undefined;
    const window = undefined;
    const location = undefined;
    "use strict";

    let output = '';
    const setInterval = () => console.log("setInterval is not supported!");
    const setTimeout = () => console.log("setTimeout is not supported!");
    console.log = (value) => {
        if (typeof value === 'object') {
            value = `<pre>${JSON.stringify(value, null, 2)}</pre>`;
        }
        output += `${value}<br/>`;
    };

    const code = editor.getValue().trim();

    if (!code) {
        codeOutput.innerHTML = '<h4 style="color: #ff5555">Write some code first; we won\'t judge!</h4>';
        return;
    }

    try {
        const startTime = new Date();
        const returnValue = eval(code);
        const endTime = new Date();
        const executionTime = endTime - startTime;

        codeOutput.innerHTML = output + 
            `<h4 style="color: #55ff55">🚀 Execution took ${executionTime} ms</h4>` +
            `<h4 style="color: #55ff55">💻 Code Returned: <span style="color: #f0f0f0">${returnValue}</span></h4>`;
    } catch (error) {
        codeOutput.innerHTML = `<h4 style="color: #ffcc55">Uh oh, your code produced an error.</h4>` +
            `<h4 style="color: #ff5555">${error.name}: <span style="color: #f0f0f0">${error.message}</span></h4>` +
            `<h4 style="color: #ff5555">Problem at line: <span style="color: #f0f0f0">${error.lineNumber || 'unknown'}</span></h4>`;
    }

    codeOutput.scrollTo(0, codeOutput.scrollHeight);
}

// Save file on Ctrl + S
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        if (!currentFile) {
            createFile(true);
        } else {
            localStorage.setItem(currentFile, editor.getValue());
            modified = false;
            refreshFileMenu();
        }
    }
});

// File management
function createFile(save) {
    vex.dialog.prompt({
        message: 'Provide file name:',
        placeholder: 'File name',
        callback: (value) => {
            if (!value || value.includes(',')) {
                vex.dialog.alert(value ? "Special characters are not allowed!" : "File name cannot be empty!");
                return;
            }

            const files = localStorage.getItem('files')?.split(',') || [];
            if (files.includes(value)) {
                vex.dialog.alert("This file name is already in use!");
                return;
            }

            currentFile = value;
            files.push(currentFile);
            localStorage.setItem('files', files.join(','));
            localStorage.setItem(currentFile, save ? editor.getValue() : `// ${currentFile}: write some code`);
            editor.setValue(localStorage.getItem(currentFile));
            refreshFileMenu();
        }
    });
}

function refreshFileMenu() {
    const filesContainer = fileMenu.querySelector('.files');
    filesContainer.innerHTML = '';

    const files = localStorage.getItem('files')?.split(',') || [];
    files.forEach((file) => {
        const fileItem = document.createElement('li');
        fileItem.innerText = file;
        fileItem.dataset.file = file;

        if (file === currentFile) fileItem.classList.add('current');

        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete';
        deleteBtn.textContent = 'X';
        deleteBtn.addEventListener('click', () => confirmDeletion(file));

        fileItem.appendChild(deleteBtn);
        filesContainer.appendChild(fileItem);

        fileItem.addEventListener('click', () => {
            currentFile = file;
            editor.setValue(localStorage.getItem(currentFile) || '// Write some code');
            refreshFileMenu();
        });
    });

    editor.focus();
}

function confirmDeletion(file) {
    vex.dialog.confirm({
        message: `Are you sure you want to delete "${file}"?`,
        callback: (confirmed) => {
            if (confirmed) {
                const files = localStorage.getItem('files')?.split(',') || [];
                const updatedFiles = files.filter((f) => f !== file);
                localStorage.setItem('files', updatedFiles.join(','));
                localStorage.removeItem(file);
                if (file === currentFile) {
                    currentFile = '';
                    editor.setValue('// Write some code');
                }
                refreshFileMenu();
            }
        }
    });
}

// Initialize file menu
refreshFileMenu();
