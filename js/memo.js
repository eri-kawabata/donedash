const memoForm = document.getElementById('memoForm');
const memoInput = document.getElementById('memoInput');
const memoList = document.getElementById('memoList');

// ページ読み込み時にメモをロード
window.addEventListener('load', loadMemos);

// メモの読み込み
function loadMemos() {
    const memos = JSON.parse(localStorage.getItem('memos')) || [];
    memos.forEach(memo => addMemoToList(memo.content, memo.date));

    // 全メモの色を更新
    Array.from(memoList.children).forEach(li => {
        const dateText = li.querySelector('.memo-date').textContent;
        updateMemoColor(li, dateText);
    });
}

// メモの追加
memoForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const content = memoInput.value.trim();
    if (content) {
        addMemoToList(content, null, true);
        memoInput.value = '';
    }
});

// メモをリストに追加
function addMemoToList(content, date = null, saveToStorage = false) {
    const li = document.createElement('li');
    li.draggable = true;

    const contentElement = document.createElement('span');
    contentElement.textContent = content;
    contentElement.classList.add('memo-content');
    contentElement.onclick = () => editMemo(contentElement, content);
    li.appendChild(contentElement);

    // 日付の表示
    const dateElement = document.createElement('span');
    dateElement.classList.add('memo-date');
    const currentDate = date || new Date().toISOString().split('T')[0];
    dateElement.textContent = currentDate;
    li.appendChild(dateElement);

    updateMemoColor(li, currentDate);

    // 削除ボタン
    const deleteBtn = document.createElement('span');
    deleteBtn.textContent = '×';
    deleteBtn.classList.add('delete-btn');
    deleteBtn.onclick = () => {
        li.classList.add('peel-off-animation');
        li.addEventListener('animationend', () => {
            li.remove();
            removeMemoFromStorage(content);
        });
    };
    li.appendChild(deleteBtn);

    // ドラッグ＆ドロップのイベントリスナーを追加
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    memoList.appendChild(li);

    if (saveToStorage) saveMemoToStorage(content, currentDate);
}

// メモの色を経過日数に応じて更新
function updateMemoColor(element, memoDate) {
    const now = new Date();
    const memoDateObj = new Date(memoDate);
    const daysDiff = Math.floor((now - memoDateObj) / (1000 * 60 * 60 * 24));

    element.classList.remove('memo-warning', 'memo-danger', 'memo-critical');

    if (daysDiff >= 10) {
        element.classList.add('memo-critical');
    } else if (daysDiff >= 7) {
        element.classList.add('memo-danger');
    } else if (daysDiff >= 3) {
        element.classList.add('memo-warning');
    }
}

// メモの削除
function removeMemoFromStorage(content) {
    let memos = JSON.parse(localStorage.getItem('memos')) || [];
    memos = memos.filter(memo => memo.content !== content);
    localStorage.setItem('memos', JSON.stringify(memos));
}

// メモの編集
function editMemo(contentElement, oldContent) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = contentElement.textContent;
    input.classList.add('edit-input');

    input.focus();
    input.onkeydown = (event) => {
        if (event.key === 'Enter') {
            const newContent = input.value.trim();
            if (newContent) {
                contentElement.textContent = newContent;
                updateMemoInStorage(oldContent, newContent);
            }
            contentElement.style.display = '';
            input.remove();
        }
    };

    contentElement.style.display = 'none';
    contentElement.parentNode.insertBefore(input, contentElement);
}

// メモの保存
function saveMemoToStorage(content, date) {
    const memos = JSON.parse(localStorage.getItem('memos')) || [];
    memos.push({ content, date });
    localStorage.setItem('memos', JSON.stringify(memos));
}

// メモ内容の更新
function updateMemoInStorage(oldContent, newContent) {
    const memos = JSON.parse(localStorage.getItem('memos')) || [];
    const memo = memos.find(m => m.content === oldContent);
    if (memo) {
        memo.content = newContent;
        localStorage.setItem('memos', JSON.stringify(memos));
    }
}

// ドラッグ＆ドロップ処理
function handleDragStart(event) {
    event.target.classList.add('dragging');
    event.dataTransfer.setData('text/plain', event.target.innerHTML);
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    const draggingItem = document.querySelector('.dragging');
    const targetItem = event.target.closest('li');

    if (targetItem && targetItem !== draggingItem) {
        const bounding = targetItem.getBoundingClientRect();
        const offset = bounding.y + bounding.height / 2;
        const afterDraggingItem = (event.clientY - offset) > 0;

        if (afterDraggingItem) {
            targetItem.after(draggingItem);
        } else {
            targetItem.before(draggingItem);
        }
    }
}

function handleDrop(event) {
    event.preventDefault();
    const draggingItem = document.querySelector('.dragging');
    draggingItem.classList.remove('dragging');
    updateMemoOrderInStorage();
}

// メモの並び順をローカルストレージに保存
function updateMemoOrderInStorage() {
    const updatedMemos = Array.from(memoList.children).map(li => {
        const content = li.querySelector('.memo-content').textContent;
        const date = li.querySelector('.memo-date').textContent;
        return { content, date };
    });
    localStorage.setItem('memos', JSON.stringify(updatedMemos));
}
