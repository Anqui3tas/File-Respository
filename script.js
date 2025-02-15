document.addEventListener('DOMContentLoaded', () => {
    const expandBtn = document.querySelector(".expand-btn");
    const img = expandBtn.querySelector("img");
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const toggleViewButton = document.getElementById("toggle-view");
    const fileExplorer = document.getElementById("file-explorer");
    const previewContainer = document.getElementById("preview-container");
    const backButton = document.getElementById("back-button");

    let isGalleryView = false;
    let files = [];
    let currentDirectory = '';

    applyDarkMode();

    function applyDarkMode() {
        const darkModeEnabled = localStorage.getItem('dark-mode') !== 'disabled'; 
        document.body.classList.toggle('dark-mode', darkModeEnabled);
        moonIcon.style.display = darkModeEnabled ? 'block' : 'none';
        sunIcon.style.display = darkModeEnabled ? 'none' : 'block';
    }

    darkModeBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('dark-mode', document.body.classList.contains('dark-mode') ? 'enabled' : 'disabled');
        applyDarkMode();
    });

    document.addEventListener("click", (event) => {
        const folderLink = event.target.closest("a[data-folder]");
        if (folderLink) {
            event.preventDefault();
            const folderName = folderLink.dataset.folder;
            if (folderName) {
                fetchFiles(folderName);
            }
        }
    });

    expandBtn.addEventListener("click", () => {
        document.body.classList.toggle("collapsed");
        img.style.transform = document.body.classList.contains("collapsed") ? "rotate(180deg)" : "rotate(0deg)";
    });

    function fetchFiles(directory = '') {
        console.log(`Fetching files from: ${directory || 'Root'}`);
        fetch(`files.php?dir=${encodeURIComponent(directory)}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert('Error: ' + data.error);
                } else {
                    files = data.files;
                    currentDirectory = directory;
                    updateView();
                }
            })
            .catch(error => console.error('Error fetching files:', error));
    }

    function getFileIconSrc(file) {
        if (file.type === 'folder') {
          return 'assets/folder-icon.png';
        }
        // Get the file extension in lowercase
        const ext = file.name.split('.').pop().toLowerCase();
        // Check for common image extensions including SVG
        if (["png", "jpg", "jpeg", "gif", "dds", "tga", "bmp", "webp", "svg"].includes(ext)) {
          // Prepend "Files/" so the path becomes e.g. "Files/Websites/..."
          return `Files/${file.path}`;
        }
        // Check for code file types
        if (["html", "css"].includes(ext)) {
          return "assets/txt.png";
        }
        // Fallback for all other file types
        return "assets/generic-file.png";
      }

// -----------------------------
// Loading Overlay Helpers
// -----------------------------
function showLoadingOverlay() {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0, 0, 0, 0.5)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '10000';
        // Insert the cube loading icon HTML with inline CSS variables for size.
        // Adjust --cube-side and --cube-side-half as needed.
        overlay.innerHTML = `
            <div class="cube-wrapper" style="--cube-side: 80px; --cube-side-half: 40px;">
                <div class="cube">
                    <div class="sides">
                        <div class="top"></div>
                        <div class="right"></div>
                        <div class="bottom"></div>
                        <div class="left"></div>
                        <div class="front"></div>
                        <div class="back"></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
}

// Hide the loading overlay after a specified delay (default 5000ms)
// You can adjust the delay time by changing the parameter value.
function hideLoadingOverlay(delay = 5000) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        setTimeout(() => {
            overlay.style.display = 'none';
        }, delay);
    }
}
// -----------------------------
// Create Download Link
// -----------------------------
function createDownloadLink(file) {
    const downloadLink = document.createElement('a');
    downloadLink.className = 'download-link';
    // Add the download attribute to hint browsers to download rather than navigate
    downloadLink.setAttribute('download', '');
    // Use a down arrow icon as the link content
    downloadLink.innerHTML = `<img src="assets/down.svg" alt="Download" class="download-icon">`;
    
    if (file.type === 'folder') {
        downloadLink.href = `download.php?folder=${encodeURIComponent(file.path)}`;
        // Folder download event listener:
        downloadLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoadingOverlay();
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = downloadLink.href;
            document.body.appendChild(iframe);
            // Hide the overlay after 6 seconds (6000ms) then remove the iframe
            setTimeout(() => {
                hideLoadingOverlay(0);
                setTimeout(() => { iframe.remove(); }, 500);
            }, 6000);
        });
    } else {
        downloadLink.href = `download.php?file=${encodeURIComponent(file.path)}`;
        // File download event listener:
        downloadLink.addEventListener('click', (e) => {
            e.preventDefault();
            showLoadingOverlay();
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = downloadLink.href;
            document.body.appendChild(iframe);
            // Hide the overlay after 6 seconds (6000ms) then remove the iframe
            setTimeout(() => {
                hideLoadingOverlay(0);
                setTimeout(() => { iframe.remove(); }, 500);
            }, 6000);
        });
    }
    return downloadLink;
}

    function updateView() {
        const fileManager = document.getElementById("file-manager");
        // Clear file explorer content
        fileExplorer.innerHTML = "";
        // Remove any previous view classes from the file-manager
        fileManager.classList.remove("gallery-view", "grid-view");
        // Toggle the preview container based on view mode:
        if (isGalleryView) {
            fileManager.classList.add("gallery-view");
            previewContainer.style.display = 'flex';
            renderGalleryView();
        } else {
            fileManager.classList.add("grid-view");
            previewContainer.style.display = 'none';
            renderGridView();
        }
    }

    function renderGridView() {
        // Clear out any previous content
        fileExplorer.innerHTML = "";
    
        // ALWAYS create and append the Back button if we're not at root
        if (currentDirectory && currentDirectory !== '/') {
          const backItem = document.createElement('div');
          backItem.className = 'file-item back-item';
          backItem.innerHTML = `<img src="assets/back-folder.png" alt="Back"><div class="file-info"><span>Back</span></div>`;
          backItem.addEventListener('click', () => {
            let parentDirectory = currentDirectory.substring(0, currentDirectory.lastIndexOf('/'));
            fetchFiles(parentDirectory || '');
          });
          fileExplorer.appendChild(backItem);
        }
    
        // If folder is empty, show a message but do NOT overwrite the entire container
        if (files.length === 0) {
          const noFilesMsg = document.createElement('p');
          noFilesMsg.textContent = "No files found.";
          fileExplorer.appendChild(noFilesMsg);
          return;
        }
    
        // Otherwise, render files
        files.forEach(file => {
          const fileItem = document.createElement('div');
          fileItem.className = 'file-item';
    
          if (file.type === 'folder') {
            fileItem.innerHTML = `<img src="assets/folder-icon.png" alt="Folder"><div class="file-info"><span>${file.name}</span></div>`;
            fileItem.addEventListener('click', () => fetchFiles(file.path));
          } else {
            const iconSrc = getFileIconSrc(file);
            fileItem.innerHTML = `<img src="${iconSrc}" alt="${file.name}" onerror="this.src='assets/generic-file.png';"><div class="file-info"><span>${file.name}</span></div>`;
            fileItem.addEventListener('click', () => updatePreview(iconSrc, file.name, file.type));
          }
    
          // Create and insert the download link into the .file-info container
          const dlLink = createDownloadLink(file);
          const fileInfo = fileItem.querySelector('.file-info');
          if (fileInfo) {
            fileInfo.insertBefore(dlLink, fileInfo.firstChild);
          } else {
            fileItem.appendChild(dlLink);
          }
    
          fileExplorer.appendChild(fileItem);
        });
    }

    function renderGalleryView() {
        fileExplorer.innerHTML = "";
    
        // Create the gallery list wrapper
        const galleryList = document.createElement('div');
        galleryList.className = 'gallery-list';
    
        // ALWAYS create and append the Back button if not in root directory
        if (currentDirectory && currentDirectory !== '/') {
          const backItem = document.createElement('div');
          backItem.className = 'file-item back-item';
          backItem.innerHTML = `<img src="assets/back-folder.png" alt="Back"><div class="file-info"><span>Back</span></div>`;
          backItem.addEventListener('click', () => {
            let parentDirectory = currentDirectory.substring(0, currentDirectory.lastIndexOf('/'));
            fetchFiles(parentDirectory || '');
          });
          galleryList.appendChild(backItem);
        }
    
        // If folder is empty, show a message but do NOT overwrite the entire container
        if (files.length === 0) {
          const noFilesMsg = document.createElement('p');
          noFilesMsg.textContent = "No files found.";
          galleryList.appendChild(noFilesMsg);
          fileExplorer.appendChild(galleryList);
          return;
        }
    
        // Otherwise, render files
        let firstFile = null;
        files.forEach(file => {
          const fileItem = document.createElement('div');
          fileItem.className = 'file-item gallery-item';
    
          let iconSrc = (file.type === 'folder') 
            ? 'assets/folder-icon.png' 
            : getFileIconSrc(file);
    
          fileItem.innerHTML = `<img src="${iconSrc}" alt="${file.name}" onerror="this.src='assets/generic-file.png';">
                                <div class="file-info"><span>${file.name}</span></div>`;
    
          fileItem.addEventListener('click', () => {
            if (file.type === 'folder') {
              fetchFiles(file.path);
            } else {
              updatePreview(iconSrc, file.name, file.type);
            }
          });
    
          // Create and insert the download link into the .file-info container
          const dlLink = createDownloadLink(file);
          const fileInfo = fileItem.querySelector('.file-info');
          if (fileInfo) {
            fileInfo.insertBefore(dlLink, fileInfo.firstChild);
          } else {
            fileItem.appendChild(dlLink);
          }
    
          galleryList.appendChild(fileItem);
          if (!firstFile) firstFile = file;
        });
    
        // Auto-preview the first file if available
        if (firstFile) {
          updatePreview(getFileIconSrc(firstFile), firstFile.name, firstFile.type);
        }
    
        fileExplorer.appendChild(galleryList);
    }

    function updatePreview(imageSrc, name, type) {
        previewContainer.style.display = "flex";
        // Add inline styles for rounded corners and padding
        previewContainer.innerHTML = `
            <div class="preview-box" style="border-radius: 1rem; overflow: hidden; margin: 1rem; width: calc(100% - 2rem);">
                <img src="${(type === 'folder' ? 'assets/folder-icon.png' : imageSrc)}" alt="${name}" onerror="this.src='assets/generic-file.png';">
                <p>${name}</p>
            </div>`;
    }

    toggleViewButton.addEventListener("click", () => {
        isGalleryView = !isGalleryView;
        console.log("Toggled Gallery View:", isGalleryView);
        updateView();
        toggleViewButton.innerHTML = `<img src="assets/${isGalleryView ? 'grid' : 'gallery'}.svg" alt="${isGalleryView ? 'Grid View' : 'Gallery View'}">`;
    });

    fetchFiles();
});