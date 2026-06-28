let tasks = [];
let currentFilter = "all";
let taskIdCounter = 1;

// DOM References
const taskForm = document.querySelector("#taskForm");
const taskInput = document.querySelector("#taskInput");
const categorySelect = document.querySelector("#categorySelect");
const clearAllBtn = document.querySelector("#clearAllBtn");
const taskContainer = document.querySelector("#taskContainer");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter-btn");
const completedCount = document.getElementById("completedCount");
const pendingCount = document.getElementById("pendingCount");
const totalCount = document.getElementById("totalCount");
const taskCount = document.getElementById("taskCount");
const themeToggle = document.getElementById("themeToggle");

// ===== LOCAL STORAGE =====
function loadFromStorage() {
    const saved = localStorage.getItem("taskflow_tasks");
    if (saved) {
        tasks = JSON.parse(saved);
        if (tasks.length > 0) {
            taskIdCounter = Math.max(...tasks.map(t => t.id)) + 1;
        }
    }
}

function saveToStorage() {
    localStorage.setItem("taskflow_tasks", JSON.stringify(tasks));
}

function loadTheme() {
    const saved = localStorage.getItem("taskflow_theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    document.body.setAttribute("data-theme", saved);
    themeToggle.textContent = saved === "dark" ? "🌙" : "☀️";
}

function saveTheme(theme) {
    localStorage.setItem("taskflow_theme", theme);
}

// ===== CREATE TASK CARD =====
function createTaskCard(task) {
    const card = document.createElement("div");
    card.className = "task-card";
    card.setAttribute("data-id", task.id);
    card.setAttribute("data-status", task.status);
    card.setAttribute("data-category", task.category);

    const header = document.createElement("div");
    header.className = "task-header";

    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = task.title;

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.className = "task-title-input";
    titleInput.value = task.title;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "task-btn edit";
    editBtn.dataset.action = "edit";
    editBtn.textContent = "✏️ Edit";

    const completeBtn = document.createElement("button");
    completeBtn.className = "task-btn complete";
    completeBtn.dataset.action = "complete";
    completeBtn.textContent = task.status === "completed" ? "↩ Undo" : "✅ Done";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "task-btn delete";
    deleteBtn.dataset.action = "delete";
    deleteBtn.textContent = "🗑 Del";

    actions.append(editBtn, completeBtn, deleteBtn);
    header.append(titleSpan, titleInput, actions);

    const footer = document.createElement("div");
    footer.className = "task-footer";

    const tag = document.createElement("span");
    tag.className = "task-tag";
    tag.dataset.cat = task.category;
    const labels = { work: "💼 Work", personal: "🏠 Personal", study: "📚 Study" };
    tag.textContent = labels[task.category] || task.category;

    const idBadge = document.createElement("span");
    idBadge.className = "task-id";
    idBadge.textContent = `#${task.id}`;

    footer.append(tag, idBadge);
    card.append(header, footer);

    if (task.status === "completed") {
        card.style.opacity = "0.6";
    }

    return card;
}

// ===== RENDER TASKS =====
function renderTasks(data = tasks) {
    const existingCards = taskContainer.querySelectorAll(".task-card");
    existingCards.forEach(card => card.remove());

    const query = searchInput.value.toLowerCase().trim();
    const filtered = data.filter(task => {
        const matchesFilter = currentFilter === "all" || task.category === currentFilter;
        const matchesSearch = task.title.toLowerCase().includes(query);
        return matchesFilter && matchesSearch;
    });

    emptyState.style.display = filtered.length === 0 ? "flex" : "none";
    taskCount.textContent = `${filtered.length} task${filtered.length !== 1 ? 's' : ''}`;

    if (filtered.length === 0) return;

    const fragment = document.createDocumentFragment();
    filtered.forEach(task => {
        fragment.appendChild(createTaskCard(task));
    });
    taskContainer.append(fragment);

    updateCounters();
}

function updateCounters() {
    const completed = tasks.filter(t => t.status === "completed").length;
    const pending = tasks.filter(t => t.status === "pending").length;
    completedCount.textContent = completed;
    pendingCount.textContent = pending;
    totalCount.textContent = tasks.length;
}

// ===== ADD TASK =====
taskForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const title = taskInput.value.trim();
    if (!title) {
        taskInput.focus();
        taskInput.style.borderColor = "var(--accent-red)";
        setTimeout(() => { taskInput.style.borderColor = ""; }, 800);
        return;
    }

    const newTask = {
        id: taskIdCounter++,
        title: title,
        category: categorySelect.value,
        status: "pending"
    };

    tasks.unshift(newTask);
    saveToStorage();
    taskInput.value = "";
    taskInput.focus();
    renderTasks();
});

// ===== EVENT DELEGATION =====
taskContainer.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (!action) return;

    const card = e.target.closest(".task-card");
    if (!card) return;

    const taskId = parseInt(card.dataset.id);
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    if (action === "delete") {
        card.style.transition = "opacity 0.2s, transform 0.2s";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        setTimeout(() => {
            card.remove();
            tasks.splice(taskIndex, 1);
            saveToStorage();
            updateCounters();
            if (tasks.length === 0) emptyState.style.display = "flex";
            taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
        }, 200);
    } else if (action === "complete") {
        const task = tasks[taskIndex];
        const titleSpan = card.querySelector(".task-title");
        const btn = card.querySelector('[data-action="complete"]');

        if (task.status === "pending") {
            task.status = "completed";
            card.dataset.status = "completed";
            titleSpan.style.textDecoration = "line-through";
            btn.textContent = "↩ Undo";
            card.style.opacity = "0.6";
        } else {
            task.status = "pending";
            card.dataset.status = "pending";
            titleSpan.style.textDecoration = "";
            btn.textContent = "✅ Done";
            card.style.opacity = "1";
        }

        tasks[taskIndex] = task;
        saveToStorage();
        updateCounters();
    } else if (action === "edit") {
        const titleSpan = card.querySelector(".task-title");
        const titleInput = card.querySelector(".task-title-input");
        const editBtn = card.querySelector('[data-action="edit"]');

        const isEditing = card.hasAttribute("data-editing");

        if (!isEditing) {
            card.setAttribute("data-editing", "true");
            titleSpan.style.display = "none";
            titleInput.style.display = "block";
            titleInput.value = tasks[taskIndex].title;
            titleInput.focus();
            titleInput.select();
            editBtn.textContent = "💾 Save";

            const saveHandler = (e) => {
                if (e.key === "Enter") {
                    saveEdit(card, taskIndex, titleSpan, titleInput, editBtn);
                    titleInput.removeEventListener("keydown", saveHandler);
                }
            };
            titleInput.addEventListener("keydown", saveHandler);
        } else {
            saveEdit(card, taskIndex, titleSpan, titleInput, editBtn);
        }
    }
});

function saveEdit(card, taskIndex, titleSpan, titleInput, editBtn) {
    const newTitle = titleInput.value.trim();
    if (!newTitle) return;

    tasks[taskIndex].title = newTitle;
    saveToStorage();

    titleSpan.textContent = newTitle;
    titleSpan.style.display = "";
    titleInput.style.display = "none";
    editBtn.textContent = "✏️ Edit";
    card.removeAttribute("data-editing");
}

// ===== SEARCH & FILTER =====
searchInput.addEventListener("input", renderTasks);

document.querySelector(".filter-tabs").addEventListener("click", (e) => {
    if (!e.target.classList.contains("filter-btn")) return;

    filterBtns.forEach(btn => btn.classList.remove("active"));
    e.target.classList.add("active");

    currentFilter = e.target.dataset.filter;
    renderTasks();
});

// ===== CLEAR ALL =====
clearAllBtn.addEventListener("click", () => {
    if (tasks.length === 0) return;
    if (!confirm("Delete all tasks? ⚠️")) return;

    tasks = [];
    saveToStorage();
    renderTasks();
});

// ===== THEME TOGGLE =====
themeToggle.addEventListener("click", () => {
    const body = document.body;
    const isDark = body.dataset.theme === "dark";

    if (isDark) {
        body.dataset.theme = "light";
        document.documentElement.setAttribute("data-theme", "light");
        themeToggle.textContent = "☀️";
        saveTheme("light");
    } else {
        body.dataset.theme = "dark";
        document.documentElement.setAttribute("data-theme", "dark");
        themeToggle.textContent = "🌙";
        saveTheme("dark");
    }
});

// ===== INIT =====
function init() {
    loadTheme();
    loadFromStorage();

    if (tasks.length === 0) {
        saveToStorage();
    }

    renderTasks();
}

init();