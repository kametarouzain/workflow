let draggedElement = null;
let stepCounter = 2;
let currentPatternId = null;

// 承認者データ（テーブルから取得想定）
const approversData = [
    { id: 'manager_a', name: '田中 太郎', position: '課長A', department: '営業部' },
    { id: 'manager_b', name: '鈴木 一郎', position: '課長B', department: '営業部' },
    { id: 'director_x', name: '山田 次郎', position: '部長X', department: '営業部' },
    { id: 'manager_c', name: '高橋 美咲', position: '課長C', department: '開発部' },
    { id: 'director_y', name: '伊藤 健太', position: '部長Y', department: '開発部' },
    { id: 'manager_d', name: '佐藤 花子', position: '課長D', department: '人事部' },
    { id: 'director_z', name: '渡辺 聡', position: '部長Z', department: '人事部' },
    { id: 'manager_e', name: '松本 裕子', position: '課長E', department: '経理部' },
    { id: 'manager_f', name: '中村 隆', position: '課長F', department: '法務部' }
];

// 保存されたワークフローパターン（実際はサーバーから取得）
let workflowPatterns = [
    {
        id: 'pattern_1',
        name: '営業部標準フロー',
        description: '営業部の一般的な承認フロー',
        trigger_approver: 'manager_a',
        steps: [
            { approver_id: 'manager_b', is_required: true },
            { approver_id: 'director_x', is_required: true }
        ],
        created_at: '2024-01-15'
    },
    {
        id: 'pattern_2',
        name: '開発部承認フロー',
        description: '開発部プロジェクト用の承認フロー',
        trigger_approver: 'manager_c',
        steps: [
            { approver_id: 'director_y', is_required: true }
        ],
        created_at: '2024-01-20'
    },
    {
        id: 'pattern_3',
        name: '高額案件フロー',
        description: '100万円以上の案件用',
        trigger_approver: 'manager_a',
        steps: [
            { approver_id: 'manager_b', is_required: true },
            { approver_id: 'manager_e', is_required: true },
            { approver_id: 'director_x', is_required: true }
        ],
        created_at: '2024-01-22'
    }
];

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    populateTriggerApprovers();
    filterApproversByDepartment();
    updatePreview();
});

// 起点承認者変更時の処理
function onTriggerChange() {
    updatePreview();
}

// 起点承認者のプルダウンを更新
function populateTriggerApprovers() {
    const select = document.getElementById('triggerApprover');
    select.innerHTML = '<option value="">選択してください</option>';

    approversData.forEach(approver => {
        const option = document.createElement('option');
        option.value = approver.id;
        option.textContent = `${approver.position} (${approver.name}) - ${approver.department}`;
        if (approver.id === 'manager_a') {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// 部署フィルターによる承認者リスト更新
function filterApproversByDepartment() {
    const selectedDepartment = document.getElementById('departmentFilter').value;
    const approverList = document.getElementById('approverList');
    const approverCount = document.getElementById('approverCount');

    // フィルター処理
    let filteredApprovers = approversData;
    if (selectedDepartment) {
        filteredApprovers = approversData.filter(approver => approver.department === selectedDepartment);
    }

    // 承認者数を更新
    approverCount.textContent = `承認者数: ${filteredApprovers.length}名`;

    // 承認者リストを再生成
    approverList.innerHTML = '';
    filteredApprovers.forEach(approver => {
        const item = document.createElement('div');
        item.className = 'approver-item';
        item.draggable = true;
        item.dataset.approver = approver.id;
        item.innerHTML = `
            <div class="click-hint">Click</div>
            <strong>${approver.position}</strong><br>
            <span style="font-size: 12px; color: #7f8c8d;">${approver.name}</span><br>
            <span style="font-size: 11px; color: #95a5a6;">${approver.department}</span>
        `;

        // クリックイベント
        item.addEventListener('click', function() {
            this.classList.add('clicked');
            const approverId = this.dataset.approver;
            const approverData = approversData.find(a => a.id === approverId);
            if (approverData) {
                addWorkflowStep(approverId, approverData);
                updatePreview();
            }
            // クリックエフェクトを解除
            setTimeout(() => {
                this.classList.remove('clicked');
            }, 200);
        });

        // ドラッグイベント
        item.addEventListener('dragstart', function(e) {
            draggedElement = this;
            this.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'copy';
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedElement = null;
        });

        approverList.appendChild(item);
    });
}

// ドロップ許可
function allowDrop(ev) {
    ev.preventDefault();
}

// ドロップ処理
function drop(ev) {
    ev.preventDefault();

    if (draggedElement) {
        const approverId = draggedElement.dataset.approver;
        const approverData = approversData.find(a => a.id === approverId);
        if (approverData) {
            addWorkflowStep(approverId, approverData);
            updatePreview();
        }
    }
}

// ワークフローステップ追加
function addWorkflowStep(approverId, approverData, isRequired = true) {
    // 重複チェック
    const existingStep = document.querySelector(`[data-step][data-approver="${approverId}"]`);
    if (existingStep) {
        alert('この承認者は既に追加されています');
        return;
    }

    stepCounter++;
    const workflowSteps = document.getElementById('workflowSteps');

    // 既存のステップがある場合は矢印を追加
    if (workflowSteps.children.length > 0) {
        const arrow = document.createElement('div');
        arrow.className = 'arrow';
        arrow.textContent = '↓';
        workflowSteps.appendChild(arrow);
    }

    const step = document.createElement('div');
    step.className = 'workflow-step';
    step.dataset.step = stepCounter;
    step.dataset.approver = approverId;
    step.innerHTML = `
        <div class="step-info">
            <div class="step-number">${stepCounter}</div>
            <div class="step-details">
                <div class="step-name">${approverData.position} (${approverData.name})</div>
                <div class="step-role" style="color: ${isRequired ? '#7f8c8d' : '#f39c12'}">${isRequired ? '必須承認' : '任意承認'}</div>
            </div>
        </div>
        <div class="step-actions">
            <button class="btn btn-small btn-secondary" onclick="toggleRequired(${stepCounter})">必須切替</button>
            <button class="btn btn-small btn-danger" onclick="removeStep(${stepCounter})">削除</button>
        </div>
    `;

    workflowSteps.appendChild(step);
}

// ステップ削除
function removeStep(stepNum) {
    const step = document.querySelector(`[data-step="${stepNum}"]`);
    if (step && step.previousElementSibling && step.previousElementSibling.classList.contains('arrow')) {
        step.previousElementSibling.remove();
    }
    if (step) {
        step.remove();
    }
    updatePreview();
}

// 必須/任意切り替え
function toggleRequired(stepNum) {
    const step = document.querySelector(`[data-step="${stepNum}"]`);
    const roleElement = step.querySelector('.step-role');

    if (roleElement.textContent === '必須承認') {
        roleElement.textContent = '任意承認';
        roleElement.style.color = '#f39c12';
    } else {
        roleElement.textContent = '必須承認';
        roleElement.style.color = '#7f8c8d';
    }
    updatePreview();
}

// 並列承認追加
function addParallelStep() {
    alert('並列承認機能は実装予定です');
}

// プレビュー更新
function updatePreview() {
    const previewFlow = document.getElementById('previewFlow');
    const triggerSelect = document.getElementById('triggerApprover');
    const workflowTarget = document.getElementById('workflowTarget');
    const targetInfo = document.getElementById('targetInfo');
    const targetDisplay = document.getElementById('targetDisplay');
    const steps = document.querySelectorAll('.workflow-step');

    // 適用対象の表示
    if (workflowTarget.value) {
        const targetText = workflowTarget.options[workflowTarget.selectedIndex].text;
        targetDisplay.textContent = targetText;
        targetInfo.style.display = 'block';
    } else {
        targetInfo.style.display = 'none';
    }

    // 起点承認者
    const triggerApprover = approversData.find(a => a.id === triggerSelect.value);
    let previewHTML = '';

    if (!triggerApprover) {
        previewHTML = '<div class="preview-step">起点承認者を選択してください</div>';
    } else {
        previewHTML = `<div class="preview-step">${triggerApprover.position} (起点)</div>`;

        // 承認ステップ
        steps.forEach((step, index) => {
            const stepName = step.querySelector('.step-name').textContent;
            previewHTML += '<div class="preview-arrow">→</div>';
            previewHTML += `<div class="preview-step">${stepName}</div>`;
        });

        if (steps.length > 0) {
            previewHTML += '<div class="preview-arrow">→</div>';
            previewHTML += '<div class="preview-step">承認完了</div>';
        } else {
            previewHTML += '<div class="preview-arrow">→</div>';
            previewHTML += '<div class="preview-step" style="color: #e74c3c;">承認ステップを追加してください</div>';
        }
    }

    previewFlow.innerHTML = previewHTML;
}

// パターン選択モーダル
function showPatternModal() {
    const modal = document.getElementById('patternModal');
    const patternList = document.getElementById('patternList');

    // パターンリストを生成
    patternList.innerHTML = '';
    workflowPatterns.forEach(pattern => {
        const triggerApprover = approversData.find(a => a.id === pattern.trigger_approver);

        const item = document.createElement('div');
        item.className = 'pattern-item';
        item.onclick = () => loadPattern(pattern.id);

        // フローの表示を生成
        let flowText = triggerApprover ? triggerApprover.position : '不明';
        pattern.steps.forEach(step => {
            const approver = approversData.find(a => a.id === step.approver_id);
            flowText += ` → ${approver ? approver.position : '不明'}`;
        });

        item.innerHTML = `
            <div class="pattern-name">${pattern.name}</div>
            <div class="pattern-description">${pattern.description}</div>
            <div class="pattern-flow">
                <span>フロー:</span>
                <span>${flowText}</span>
            </div>
        `;

        patternList.appendChild(item);
    });

    modal.style.display = 'flex';
}

function closePatternModal() {
    document.getElementById('patternModal').style.display = 'none';
}

function loadPattern(patternId) {
    const pattern = workflowPatterns.find(p => p.id === patternId);
    if (!pattern) return;

    // 起点承認者を設定
    document.getElementById('triggerApprover').value = pattern.trigger_approver;

    // 適用対象があれば設定（パターンに含める場合）
    if (pattern.target) {
        document.getElementById('workflowTarget').value = pattern.target;
    }

    // 既存のワークフローをクリア
    document.getElementById('workflowSteps').innerHTML = '';
    stepCounter = 0;

    // パターンのステップを復元
    pattern.steps.forEach(step => {
        const approverData = approversData.find(a => a.id === step.approver_id);
        if (approverData) {
            addWorkflowStep(step.approver_id, approverData, step.is_required);
        }
    });

    // 現在のパターン表示
    currentPatternId = patternId;
    document.getElementById('currentPatternName').textContent = pattern.name;
    document.getElementById('currentPattern').style.display = 'block';

    updatePreview();
    closePatternModal();

    alert(`パターン「${pattern.name}」を読み込みました`);
}

// パターン保存モーダル
function showSavePatternModal() {
    const triggerApprover = document.getElementById('triggerApprover').value;
    const steps = document.querySelectorAll('.workflow-step');

    if (!triggerApprover) {
        alert('起点承認者を選択してください');
        return;
    }

    if (steps.length === 0) {
        alert('承認ステップを追加してください');
        return;
    }

    document.getElementById('patternName').value = '';
    document.getElementById('patternDescription').value = '';
    document.getElementById('savePatternModal').style.display = 'flex';
}

function closeSavePatternModal() {
    document.getElementById('savePatternModal').style.display = 'none';
}

function saveCurrentPattern() {
    const patternName = document.getElementById('patternName').value.trim();
    const patternDescription = document.getElementById('patternDescription').value.trim();

    if (!patternName) {
        alert('パターン名を入力してください');
        return;
    }

    const triggerApprover = document.getElementById('triggerApprover').value;
    const workflowTarget = document.getElementById('workflowTarget').value;
    const steps = Array.from(document.querySelectorAll('.workflow-step')).map(step => {
        const approverId = step.dataset.approver;
        const roleElement = step.querySelector('.step-role');
        const isRequired = roleElement.textContent === '必須承認';
        return { approver_id: approverId, is_required: isRequired };
    });

    const newPattern = {
        id: 'pattern_' + (workflowPatterns.length + 1),
        name: patternName,
        description: patternDescription || '説明なし',
        trigger_approver: triggerApprover,
        target: workflowTarget, // 適用対象も保存
        steps: steps,
        created_at: new Date().toISOString().split('T')[0]
    };

    workflowPatterns.push(newPattern);

    // 現在のパターンとして設定
    currentPatternId = newPattern.id;
    document.getElementById('currentPatternName').textContent = newPattern.name;
    document.getElementById('currentPattern').style.display = 'block';

    closeSavePatternModal();
    alert(`パターン「${patternName}」を保存しました`);
}

// モーダル外クリックで閉じる
window.onclick = function(event) {
    const patternModal = document.getElementById('patternModal');
    const savePatternModal = document.getElementById('savePatternModal');

    if (event.target === patternModal) {
        closePatternModal();
    }
    if (event.target === savePatternModal) {
        closeSavePatternModal();
    }
}