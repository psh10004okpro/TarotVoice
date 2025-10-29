// API base URL
const API_BASE_URL = window.location.origin;

let currentPage = 1;
let currentSearch = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadStatistics();
    loadAudioFiles();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);

    // Edit form
    document.getElementById('editForm').addEventListener('submit', handleEdit);

    // Search input
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadAudioFiles();
        }
    });

    // Close modals when clicking outside
    window.onclick = (event) => {
        const playerModal = document.getElementById('playerModal');
        const editModal = document.getElementById('editModal');

        if (event.target === playerModal) {
            closePlayer();
        }
        if (event.target === editModal) {
            closeEditModal();
        }
    };
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/audio-manager/statistics`);
        const result = await response.json();

        if (result.success) {
            const { totalFiles, totalSize, totalPlays, totalDownloads } = result.data;

            document.getElementById('totalFiles').textContent = totalFiles;
            document.getElementById('totalSize').textContent = formatFileSize(totalSize);
            document.getElementById('totalPlays').textContent = totalPlays.toLocaleString();
            document.getElementById('totalDownloads').textContent = totalDownloads.toLocaleString();
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load audio files
async function loadAudioFiles(page = 1) {
    currentPage = page;
    currentSearch = document.getElementById('searchInput').value.trim();

    const audioList = document.getElementById('audioList');
    audioList.innerHTML = '<div class="loading">로딩 중...</div>';

    try {
        const url = new URL(`${API_BASE_URL}/api/audio-manager/list`);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', 10);
        if (currentSearch) {
            url.searchParams.append('search', currentSearch);
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
            displayAudioFiles(result.data.items);
            displayPagination(result.data);
        } else {
            audioList.innerHTML = `<div class="alert alert-error">${result.error.message}</div>`;
        }
    } catch (error) {
        console.error('Error loading audio files:', error);
        audioList.innerHTML = '<div class="alert alert-error">파일 목록을 불러오는데 실패했습니다.</div>';
    }
}

// Display audio files
function displayAudioFiles(files) {
    const audioList = document.getElementById('audioList');

    if (files.length === 0) {
        audioList.innerHTML = `
            <div class="empty-state">
                <h3>📁 음성 파일이 없습니다</h3>
                <p>위의 업로드 섹션에서 새로운 음성 파일을 추가하세요.</p>
            </div>
        `;
        return;
    }

    audioList.innerHTML = files.map(file => `
        <div class="audio-item">
            <div class="audio-header">
                <div class="audio-info">
                    <h3>${escapeHtml(file.title)}</h3>
                    <span class="audio-id">ID: ${escapeHtml(file.id)}</span>
                </div>
            </div>

            ${file.description ? `<p class="audio-description">${escapeHtml(file.description)}</p>` : ''}

            <div class="audio-meta">
                <span>📊 ${formatFileSize(file.file_size)}</span>
                <span>🎵 ${file.format.toUpperCase()}</span>
                <span>▶️ ${file.play_count || 0}회</span>
                <span>⬇️ ${file.download_count || 0}회</span>
                <span>📅 ${formatDate(file.created_at)}</span>
            </div>

            <div class="audio-actions">
                <button onclick="playAudio('${file.id}', '${escapeHtml(file.title)}')" class="btn btn-success">
                    ▶️ 재생
                </button>
                <button onclick="downloadAudio('${file.id}')" class="btn btn-info">
                    ⬇️ 다운로드
                </button>
                <button onclick="copyStreamUrl('${file.id}')" class="btn btn-secondary">
                    🔗 스트리밍 URL 복사
                </button>
                <button onclick="openEditModal('${file.id}', '${escapeHtml(file.title)}', '${escapeHtml(file.description || '')}')" class="btn btn-warning">
                    ✏️ 수정
                </button>
                <button onclick="deleteAudio('${file.id}')" class="btn btn-danger">
                    🗑️ 삭제
                </button>
            </div>
        </div>
    `).join('');
}

// Display pagination
function displayPagination(data) {
    const pagination = document.getElementById('pagination');
    const { page, totalPages } = data;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `<button onclick="loadAudioFiles(${page - 1})" ${page === 1 ? 'disabled' : ''}>이전</button>`;

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 ||
            i === totalPages ||
            (i >= page - 2 && i <= page + 2)
        ) {
            html += `<button onclick="loadAudioFiles(${i})" class="${i === page ? 'active' : ''}">${i}</button>`;
        } else if (i === page - 3 || i === page + 3) {
            html += '<span>...</span>';
        }
    }

    // Next button
    html += `<button onclick="loadAudioFiles(${page + 1})" ${page === totalPages ? 'disabled' : ''}>다음</button>`;

    pagination.innerHTML = html;
}

// Handle upload
async function handleUpload(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const uploadBtn = document.getElementById('uploadBtn');
    const uploadBtnText = document.getElementById('uploadBtnText');
    const uploadSpinner = document.getElementById('uploadSpinner');

    // Disable button and show spinner
    uploadBtn.disabled = true;
    uploadBtnText.textContent = '업로드 중...';
    uploadSpinner.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_BASE_URL}/api/audio-manager/upload`, {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (result.success) {
            showAlert('success', '음성 파일이 성공적으로 업로드되었습니다!');
            form.reset();
            loadStatistics();
            loadAudioFiles(1);
        } else {
            showAlert('error', result.error.message);
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        showAlert('error', '파일 업로드 중 오류가 발생했습니다.');
    } finally {
        // Re-enable button and hide spinner
        uploadBtn.disabled = false;
        uploadBtnText.textContent = '업로드';
        uploadSpinner.style.display = 'none';
    }
}

// Play audio
function playAudio(id, title) {
    const modal = document.getElementById('playerModal');
    const player = document.getElementById('audioPlayer');
    const playerTitle = document.getElementById('playerTitle');

    playerTitle.textContent = title;
    player.src = `${API_BASE_URL}/api/audio-manager/stream/${id}`;
    modal.style.display = 'block';
    player.play();
}

// Close player
function closePlayer() {
    const modal = document.getElementById('playerModal');
    const player = document.getElementById('audioPlayer');

    player.pause();
    player.src = '';
    modal.style.display = 'none';
}

// Download audio
function downloadAudio(id) {
    window.location.href = `${API_BASE_URL}/api/audio-manager/download/${id}`;

    // Reload statistics after a short delay
    setTimeout(() => {
        loadStatistics();
        loadAudioFiles(currentPage);
    }, 1000);
}

// Copy stream URL
function copyStreamUrl(id) {
    const url = `${API_BASE_URL}/api/audio-manager/stream/${id}`;

    navigator.clipboard.writeText(url).then(() => {
        showAlert('success', '스트리밍 URL이 클립보드에 복사되었습니다!', 2000);
    }).catch(err => {
        console.error('Failed to copy URL:', err);
        showAlert('error', 'URL 복사에 실패했습니다.');
    });
}

// Open edit modal
function openEditModal(id, title, description) {
    document.getElementById('editId').value = id;
    document.getElementById('editTitle').value = title;
    document.getElementById('editDescription').value = description;

    document.getElementById('editModal').style.display = 'block';
}

// Close edit modal
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Handle edit
async function handleEdit(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;

    try {
        const response = await fetch(`${API_BASE_URL}/api/audio-manager/update/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, description }),
        });

        const result = await response.json();

        if (result.success) {
            showAlert('success', '음성 파일 정보가 수정되었습니다!');
            closeEditModal();
            loadAudioFiles(currentPage);
        } else {
            showAlert('error', result.error.message);
        }
    } catch (error) {
        console.error('Error updating file:', error);
        showAlert('error', '파일 정보 수정 중 오류가 발생했습니다.');
    }
}

// Delete audio
async function deleteAudio(id) {
    if (!confirm(`정말로 '${id}' 음성 파일을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/audio-manager/delete/${id}`, {
            method: 'DELETE',
        });

        const result = await response.json();

        if (result.success) {
            showAlert('success', '음성 파일이 삭제되었습니다.');
            loadStatistics();
            loadAudioFiles(currentPage);
        } else {
            showAlert('error', result.error.message);
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        showAlert('error', '파일 삭제 중 오류가 발생했습니다.');
    }
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    loadAudioFiles(1);
}

// Show alert
function showAlert(type, message, duration = 3000) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.container');
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, duration);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Utility functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
