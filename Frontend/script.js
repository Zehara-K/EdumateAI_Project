// ================= AUTH =================
function goToSignup() {
    window.location.href = "signup.html";
}

function redirectToLogin() {
    window.location.href = "login.html";
}

function registerUser() {
    const user = getValue("username");
    const pass = getValue("password");
    const confirmPass = getValue("confirmPassword");

    if (!user || !pass || !confirmPass) {
        setText("signupMsg", "Please fill all fields.");
        return;
    }

    if (pass !== confirmPass) {
        setText("signupMsg", "Password and confirm password do not match.");
        return;
    }

    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);
    saveProfile({
        username: user,
        fullName: user,
        learningFocus: ""
    }, user);
    setText("signupMsg", "Registration successful. Redirecting to login...");

    setTimeout(() => {
        window.location.href = "login.html";
    }, 900);
}

function login() {
    const user = getValue("username");
    const pass = getValue("password");

    if (user === localStorage.getItem("user") && pass === localStorage.getItem("pass")) {
        localStorage.setItem("loggedInUser", user);
        window.location.href = "index.html";
        return;
    }

    setText("loginMsg", "Invalid login!");
}

// ================= APP INIT =================
window.onload = function () {
    const user = localStorage.getItem("loggedInUser");

    if (!user && hasElement("sidebar")) {
        window.location.href = "login.html";
        return;
    }

    renderTasks();
    updatePlannerHint();
    renderPlannerTaskSummary();
    renderPlannerTaskSelect();
    renderProfile();
    highlightActiveNav("home");
};

function logout() {
    localStorage.removeItem("loggedInUser");
    window.location.href = "login.html";
}

function showPage(id) {
    document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));

    const activePage = document.getElementById(id);
    if (activePage) {
        activePage.classList.add("active");
    }

    highlightActiveNav(id);

    if (id === "planner") {
        updatePlannerHint();
        renderPlannerTaskSummary();
        renderPlannerTaskSelect();
    }

    if (id === "profile") {
        renderProfile();
    }
}

function highlightActiveNav(id) {
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("active", link.dataset.page === id);
    });
}

document.addEventListener("click", (event) => {
    if (!event.target.closest(".task-menu-wrap")) {
        closeTaskMenu();
    }
});

// ================= SHARED HELPERS =================
function hasElement(id) {
    return Boolean(document.getElementById(id));
}

function getElement(...ids) {
    for (const id of ids) {
        const element = document.getElementById(id);
        if (element) {
            return element;
        }
    }

    return null;
}

function getValue(...ids) {
    const element = getElement(...ids);
    return element ? element.value.trim() : "";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.innerText = value;
    }
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function getCurrentUser() {
    return localStorage.getItem("loggedInUser") || localStorage.getItem("user") || "guest";
}

function getTasksStorageKey() {
    return `tasks_${getCurrentUser()}`;
}

function getPlannerStorageKey() {
    return `planner_progress_${getCurrentUser()}`;
}

let editingTaskId = null;
let activeTaskMenuId = null;

function getProfileStorageKey(username = getCurrentUser()) {
    return `profile_${username}`;
}

function loadProfile(username = getCurrentUser()) {
    try {
        const fallback = {
            username,
            fullName: username,
            learningFocus: ""
        };
        return JSON.parse(localStorage.getItem(getProfileStorageKey(username)) || JSON.stringify(fallback));
    } catch (error) {
        console.error("Failed to read profile:", error);
        return {
            username,
            fullName: username,
            learningFocus: ""
        };
    }
}

function saveProfile(profile, username = getCurrentUser()) {
    localStorage.setItem(getProfileStorageKey(username), JSON.stringify(profile));
}

function renderProfile() {
    const profile = loadProfile();

    if (hasElement("userDisplay")) {
        const profileName = profile.fullName && profile.fullName.trim() ? profile.fullName : profile.username;
        setText("userDisplay", profileName ? `Hello ${profileName}` : "");
    }

    const usernameInput = document.getElementById("profileUsername");
    const fullNameInput = document.getElementById("profileFullName");
    const focusInput = document.getElementById("profileFocus");

    if (usernameInput) {
        usernameInput.value = profile.username || "";
    }

    if (fullNameInput) {
        fullNameInput.value = profile.fullName || "";
    }

    if (focusInput) {
        focusInput.value = profile.learningFocus || "";
    }
}

function updateProfile() {
    const currentUser = getCurrentUser();
    const updatedProfile = {
        username: currentUser,
        fullName: getValue("profileFullName") || currentUser,
        learningFocus: getValue("profileFocus")
    };

    saveProfile(updatedProfile, currentUser);
    renderProfile();
    setText("profileMsg", "Profile updated successfully.");
}

function appendChatBubble(type, html) {
    const chatOutput = document.getElementById("studyChatOutput");
    if (!chatOutput) {
        return;
    }

    const row = document.createElement("div");
    row.className = type === "user" ? "chat-row user" : "chat-row bot";

    const bubble = document.createElement("div");
    bubble.className = type === "user" ? "chat-bubble user-bubble" : "chat-bubble bot-bubble";
    bubble.innerHTML = html;

    row.appendChild(bubble);
    chatOutput.appendChild(row);
    chatOutput.scrollTop = chatOutput.scrollHeight;
}

function getChatInputValue() {
    const input = document.getElementById("studyChatInput");
    return input ? input.value.trim() : "";
}

function setChatInputValue(value) {
    const input = document.getElementById("studyChatInput");
    if (input) {
        input.value = value;
    }
}

function getTopicFromInput(defaultValue = "study skills") {
    return getChatInputValue() || defaultValue;
}

function shuffleArray(items) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }
    return copy;
}

function createPuzzleWord(topic) {
    const cleaned = topic.replace(/[^a-z0-9]/gi, "").toUpperCase();
    const source = cleaned.length >= 4 ? cleaned : "FOCUS";
    return shuffleArray(source.split("")).join("");
}

function buildQuiz(topic) {
    const label = topic.trim() || "your topic";
    return `
        <strong>Quick Quiz: ${escapeHtml(label)}</strong><br>
        1. What are the three most important ideas in ${escapeHtml(label)}?<br>
        2. Explain ${escapeHtml(label)} in your own words in 4 lines.<br>
        3. Give one real-world example related to ${escapeHtml(label)}.<br>
        4. What is one difficult area you still need to revise?
    `;
}

function buildPuzzle(topic) {
    const label = topic.trim() || "study";
    const scrambled = createPuzzleWord(label);
    return `
        <strong>Puzzle Challenge</strong><br>
        Unscramble this word linked to <strong>${escapeHtml(label)}</strong>:<br>
        <span class="puzzle-word">${escapeHtml(scrambled)}</span><br>
        Hint: Type the correct answer back into chat.
    `;
}

function buildImageMarkup(prompt) {
    const encodedPrompt = encodeURIComponent(`educational illustration, ${prompt}, clean study app style, detailed, bright`);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}`;
    return `
        <strong>Generated Study Image</strong><br>
        <span class="image-caption">Prompt: ${escapeHtml(prompt)}</span>
        <img class="chat-generated-image" src="${imageUrl}" alt="${escapeHtml(prompt)}">
    `;
}

function generateQuickQuiz() {
    const topic = getTopicFromInput("revision");
    appendChatBubble("bot", buildQuiz(topic));
}

function generatePuzzle() {
    const topic = getTopicFromInput("focus");
    appendChatBubble("bot", buildPuzzle(topic));
}

function generateChatImage() {
    const topic = getTopicFromInput("students studying in a modern library");
    appendChatBubble("bot", buildImageMarkup(topic));
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        appendChatBubble("bot", "Voice input is not supported in this browser. Try Chrome or Edge.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    appendChatBubble("bot", "Listening... speak now.");

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setChatInputValue(transcript);
        appendChatBubble("bot", `Voice captured: ${escapeHtml(transcript)}`);
    };

    recognition.onerror = () => {
        appendChatBubble("bot", "Voice input failed. Please try again.");
    };

    recognition.start();
}

function loadTasks() {
    try {
        return JSON.parse(localStorage.getItem(getTasksStorageKey()) || "[]");
    } catch (error) {
        console.error("Failed to read saved tasks:", error);
        return [];
    }
}

function saveTasks(tasks) {
    localStorage.setItem(getTasksStorageKey(), JSON.stringify(tasks));
}

function loadPlannerProgress() {
    try {
        return JSON.parse(localStorage.getItem(getPlannerStorageKey()) || "{}");
    } catch (error) {
        console.error("Failed to read saved planner progress:", error);
        return {};
    }
}

function savePlannerProgress(progress) {
    localStorage.setItem(getPlannerStorageKey(), JSON.stringify(progress));
}

function createTaskId() {
    return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeKnowledgeLevel(level) {
    const value = String(level || "").toLowerCase();

    if (value === "low") {
        return "Low";
    }

    if (value === "strong" || value === "high") {
        return "Strong";
    }

    return "Moderate";
}

function parseDateOnly(value) {
    if (value instanceof Date) {
        const date = new Date(value);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const [year, month, day] = value.split("-").map(Number);
        return new Date(year, month - 1, day);
    }

    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getIndiaNowParts() {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
    });
    const parts = Object.fromEntries(
        formatter.formatToParts(new Date())
            .filter((part) => part.type !== "literal")
            .map((part) => [part.type, part.value])
    );

    return {
        year: Number(parts.year),
        month: Number(parts.month),
        day: Number(parts.day),
        hour: Number(parts.hour),
        minute: Number(parts.minute)
    };
}

function getIndiaCurrentDate() {
    const now = getIndiaNowParts();
    return new Date(now.year, now.month - 1, now.day, now.hour, now.minute, 0, 0);
}

function getDaysLeft(dateValue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = parseDateOnly(dateValue);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function getPriorityFromTask(dateValue, knowledgeLevel) {
    const daysLeft = getDaysLeft(dateValue);
    const normalizedKnowledge = normalizeKnowledgeLevel(knowledgeLevel);

    if (daysLeft <= 1) {
        return { label: "High", color: "red" };
    }

    const thresholds = {
        Low: { high: 3, medium: 10 },
        Moderate: { high: 2, medium: 7 },
        Strong: { high: 1, medium: 5 }
    };
    const currentThreshold = thresholds[normalizedKnowledge];

    if (daysLeft <= currentThreshold.high) {
        return { label: "High", color: "red" };
    }

    if (daysLeft <= currentThreshold.medium) {
        return { label: "Medium", color: "orange" };
    }

    return { label: "Low", color: "green" };
}

function getPriorityFromDate(dateValue) {
    return getPriorityFromTask(dateValue, "Moderate");
}

function formatDate(dateValue) {
    return parseDateOnly(dateValue).toDateString();
}

function formatTime(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");
    return `${displayHours}:${displayMinutes} ${period}`;
}

function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

function getEstimatedHours(priority) {
    if (priority === "High") {
        return 12;
    }

    if (priority === "Medium") {
        return 8;
    }

    return 4;
}

function getDailyStudyHours(priority) {
    if (priority === "High") {
        return 6;
    }

    if (priority === "Medium") {
        return 4;
    }

    return 2;
}

function getPriorityWeight(priority) {
    if (priority === "High") {
        return 3;
    }

    if (priority === "Medium") {
        return 2;
    }

    return 1;
}

function formatHours(hours) {
    const rounded = Math.round(hours * 10) / 10;
    return Number.isInteger(rounded) ? `${rounded}` : `${rounded.toFixed(1)}`;
}

function buildDateRange(startDate, endDate) {
    const dates = [];
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    const lastDate = new Date(endDate);
    lastDate.setHours(0, 0, 0, 0);

    while (cursor <= lastDate) {
        dates.push(new Date(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return dates;
}

function hydrateTask(task, index) {
    const knowledgeLevel = normalizeKnowledgeLevel(task.knowledgeLevel || task.effort);
    const priority = getPriorityFromTask(task.date, knowledgeLevel);

    return {
        ...task,
        id: task.id || task.createdAt || `legacy_${index}_${task.date}`,
        knowledgeLevel,
        priority: priority.label
    };
}

function resetTaskForm() {
    const taskInput = getElement("task", "task-name");
    const dateInput = getElement("deadline", "task-date");
    const knowledgeInput = document.getElementById("taskKnowledge");
    const submitButton = document.getElementById("taskSubmitBtn");
    const cancelButton = document.getElementById("taskCancelBtn");

    editingTaskId = null;

    if (taskInput) {
        taskInput.value = "";
    }

    if (dateInput) {
        dateInput.value = "";
    }

    if (knowledgeInput) {
        knowledgeInput.value = "Moderate";
    }

    if (submitButton) {
        submitButton.innerText = "Add Task";
    }

    if (cancelButton) {
        cancelButton.classList.remove("visible");
    }
}

// ================= TASK MANAGER =================
function addTask() {
    const taskName = getValue("task", "task-name");
    const dateValue = getValue("deadline", "task-date");
    const knowledgeLevel = normalizeKnowledgeLevel(getValue("taskKnowledge"));

    if (!taskName || !dateValue) {
        alert("Please enter task and date");
        return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadline = parseDateOnly(dateValue);
    if (deadline < today) {
        alert("Cannot select past date!");
        return;
    }

    const priority = getPriorityFromTask(dateValue, knowledgeLevel);
    const tasks = loadTasks().map(hydrateTask);

    if (editingTaskId) {
        const targetTask = tasks.find((task) => task.id === editingTaskId);

        if (!targetTask) {
            alert("Task not found for update.");
            resetTaskForm();
            renderTasks();
            return;
        }

        targetTask.name = taskName;
        targetTask.date = dateValue;
        targetTask.knowledgeLevel = knowledgeLevel;
        targetTask.priority = priority.label;
    } else {
        tasks.push({
            id: createTaskId(),
            name: taskName,
            date: dateValue,
            knowledgeLevel,
            priority: priority.label,
            createdAt: new Date().toISOString()
        });
    }

    saveTasks(tasks);
    activeTaskMenuId = null;
    resetTaskForm();
    renderTasks();
    updatePlannerHint();
    renderPlannerTaskSummary();
    renderPlannerTaskSelect();
}

function editTask(taskId) {
    const tasks = loadTasks().map(hydrateTask);
    const task = tasks.find((entry) => entry.id === taskId);
    const taskInput = getElement("task", "task-name");
    const dateInput = getElement("deadline", "task-date");
    const knowledgeInput = document.getElementById("taskKnowledge");
    const submitButton = document.getElementById("taskSubmitBtn");
    const cancelButton = document.getElementById("taskCancelBtn");

    if (!task || !taskInput || !dateInput || !knowledgeInput) {
        return;
    }

    editingTaskId = task.id;
    activeTaskMenuId = null;
    taskInput.value = task.name;
    dateInput.value = task.date;
    knowledgeInput.value = task.knowledgeLevel;

    if (submitButton) {
        submitButton.innerText = "Update Task";
    }

    if (cancelButton) {
        cancelButton.classList.add("visible");
    }

    taskInput.focus();
}

function cancelTaskEdit() {
    resetTaskForm();
}

function toggleTaskMenu(taskId, event) {
    if (event) {
        event.stopPropagation();
    }

    activeTaskMenuId = activeTaskMenuId === taskId ? null : taskId;
    renderTasks();
}

function closeTaskMenu() {
    if (activeTaskMenuId === null) {
        return;
    }

    activeTaskMenuId = null;
    renderTasks();
}

function deleteTask(taskId) {
    const tasks = loadTasks().map(hydrateTask);
    const nextTasks = tasks.filter((task) => task.id !== taskId);

    if (nextTasks.length === tasks.length) {
        return;
    }

    if (editingTaskId === taskId) {
        resetTaskForm();
    }

    activeTaskMenuId = null;
    saveTasks(nextTasks);
    renderTasks();
    updatePlannerHint();
    renderPlannerTaskSummary();
    renderPlannerTaskSelect();
}

function renderTasks() {
    const taskList = getElement("taskList", "task-list");
    if (!taskList) {
        return;
    }

    const tasks = loadTasks()
        .map(hydrateTask)
        .sort((first, second) => {
            if (first.date !== second.date) {
                return first.date.localeCompare(second.date);
            }

            return getPriorityWeight(second.priority) - getPriorityWeight(first.priority);
        });
    taskList.innerHTML = "";

    if (!tasks.length) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "task-empty";
        emptyItem.innerText = "No tasks added yet.";
        taskList.appendChild(emptyItem);
        return;
    }

    tasks.forEach((task) => {
        const priority = getPriorityFromTask(task.date, task.knowledgeLevel);
        const daysLeft = getDaysLeft(task.date);
        const item = document.createElement("li");
        const priorityBackground = priority.label === "High"
            ? "rgba(239, 68, 68, 0.12)"
            : priority.label === "Medium"
                ? "rgba(245, 158, 11, 0.14)"
                : "rgba(34, 197, 94, 0.12)";
        const knowledgeBackground = task.knowledgeLevel === "Strong"
            ? "rgba(37, 99, 235, 0.12)"
            : task.knowledgeLevel === "Moderate"
                ? "rgba(14, 116, 144, 0.1)"
                : "rgba(100, 116, 139, 0.12)";
        const isMenuOpen = activeTaskMenuId === task.id;

        item.innerHTML = `
            <div class="task-card-head">
                <div>
                    <h4 class="task-card-title">${escapeHtml(task.name)}</h4>
                </div>
                <div class="task-card-head-actions">
                    <span class="task-priority-chip" style="color:${priority.color}; background:${priorityBackground};">${priority.label}</span>
                    <div class="task-menu-wrap">
                        <button class="task-menu-btn" onclick="toggleTaskMenu('${escapeHtml(task.id)}', event)" aria-label="Task settings" aria-expanded="${isMenuOpen ? "true" : "false"}">...</button>
                        <div class="task-menu ${isMenuOpen ? "visible" : ""}">
                            <button onclick="editTask('${escapeHtml(task.id)}')">Edit task</button>
                            <button onclick="deleteTask('${escapeHtml(task.id)}')">Delete task</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="task-card-info">
                <div><strong>Deadline:</strong> ${formatDate(task.date)}</div>
                <div><strong>Days Left:</strong> ${daysLeft}</div>
            </div>
            <div class="task-card-meta">
                <div><strong>Knowledge Level:</strong></div>
                <span class="task-effort-chip" style="color:#1e3a8a; background:${knowledgeBackground};">${task.knowledgeLevel}</span>
            </div>
        `;

        taskList.appendChild(item);
    });
}

// ================= STUDY PLANNER =================
function updatePlannerHint() {
    const hintElement = document.getElementById("plannerHint");
    if (!hintElement) {
        return;
    }

    const taskCount = loadTasks().length;
    if (taskCount === 0) {
        hintElement.innerText = "Add tasks first. The planner will build a focused learning schedule for the selected task.";
        return;
    }

    hintElement.innerText = `${taskCount} saved task(s) are ready. Pick one task to generate its learning schedule and track completion.`;
}

function renderPlannerTaskSummary() {
    const summaryElement = document.getElementById("plannerTaskSummary");
    if (!summaryElement) {
        return;
    }

    const tasks = loadTasks()
        .map(hydrateTask)
        .sort((first, second) => first.date.localeCompare(second.date));

    if (!tasks.length) {
        summaryElement.innerHTML = `
            <div class="planner-summary-card">
                <strong>Tasks used for planning</strong><br>
                No saved tasks yet.
            </div>
        `;
        return;
    }

    let content = `
        <div class="planner-summary-card">
            <strong>Tasks used for planning</strong>
    `;

    tasks.forEach((task, index) => {
        const priority = task.priority || getPriorityFromTask(task.date, task.knowledgeLevel).label;
        const estimatedHours = getEstimatedHours(priority);
        const dailyHours = getDailyStudyHours(priority);
        content += `
            <div class="planner-task-item">
                ${index + 1}. ${task.name} | Due ${formatDate(task.date)} | ${task.knowledgeLevel} knowledge | ${priority} priority | ${estimatedHours}h total | up to ${dailyHours}h/day
            </div>
        `;
    });

    content += "</div>";
    summaryElement.innerHTML = content;
}

function renderPlannerTaskSelect() {
    const select = document.getElementById("plannerTaskSelect");
    if (!select) {
        return;
    }

    const tasks = loadTasks()
        .map(hydrateTask)
        .sort((first, second) => first.date.localeCompare(second.date));
    const previousValue = select.value;

    if (!tasks.length) {
        select.innerHTML = `<option value="">No tasks available</option>`;
        select.disabled = true;
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "Add a task first, then generate a planner.");
        return;
    }

    select.disabled = false;
    select.innerHTML = `
        <option value="">Select a task</option>
        ${tasks.map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.name)} | Due ${formatDate(task.date)}</option>`).join("")}
    `;

    const stillExists = tasks.some((task) => task.id === previousValue);
    select.value = stillExists ? previousValue : "";

    if (stillExists) {
        showSelectedTaskPlan();
    } else {
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "Select a task to view or generate its study plan.");
    }
}

function getTaskById(taskId) {
    return loadTasks()
        .map(hydrateTask)
        .find((task) => task.id === taskId) || null;
}

function buildTaskPlan(task, existingPlan) {
    const priority = task.priority || getPriorityFromTask(task.date, task.knowledgeLevel).label;
    const totalHours = getEstimatedHours(priority);
    const dailyHours = getDailyStudyHours(priority);
    const now = getIndiaCurrentDate();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const dueDate = parseDateOnly(task.date);

    if (dueDate < today) {
        return null;
    }

    const completionMap = new Map((existingPlan?.sessions || []).map((session) => [`${session.date}|${session.start}|${session.end}`, session.completed]));
    const sessions = [];
    const days = buildDateRange(today, dueDate);
    let remainingHours = totalHours;
    let sessionIndex = 0;

    days.forEach((date, index) => {
        if (remainingHours <= 0) {
            return;
        }

        const remainingDays = days.length - index;
        const plannedHours = Math.min(dailyHours, Math.ceil(remainingHours / remainingDays));
        let dayHoursLeft = plannedHours;
        let cursor = new Date(date);
        const isToday = index === 0;

        if (isToday) {
            cursor = new Date(now);
            cursor.setSeconds(0, 0);

            if (cursor.getMinutes() > 0) {
                cursor.setHours(cursor.getHours() + 1, 0, 0, 0);
            }
        } else {
            cursor.setHours(9, 0, 0, 0);
        }

        const latestStudyEndHour = 22;

        while (dayHoursLeft > 0) {
            if (cursor.getHours() >= 1 && cursor.getHours() < 5) {
                cursor.setHours(5, 0, 0, 0);
            }

            const blockHours = Math.min(dayHoursLeft >= 2 ? 2 : 1, dayHoursLeft);
            const blockStart = new Date(cursor);
            const blockEnd = addMinutes(blockStart, blockHours * 60);

            if (blockStart.getDate() !== date.getDate() && blockStart.getHours() < 5) {
                blockStart.setHours(5, 0, 0, 0);
                blockEnd.setTime(addMinutes(blockStart, blockHours * 60).getTime());
            }

            if (blockEnd.getHours() > latestStudyEndHour || (blockEnd.getHours() === latestStudyEndHour && blockEnd.getMinutes() > 0)) {
                break;
            }

            const dateKey = getDateKey(blockStart);
            const startLabel = formatTime(blockStart);
            const endLabel = formatTime(blockEnd);
            const sessionKey = `${dateKey}|${startLabel}|${endLabel}`;

            sessions.push({
                id: `${task.id}_session_${sessionIndex}`,
                date: dateKey,
                dayLabel: formatDate(dateKey),
                start: startLabel,
                end: endLabel,
                hours: blockHours,
                completed: completionMap.get(sessionKey) || false
            });

            sessionIndex += 1;
            dayHoursLeft -= blockHours;
            remainingHours -= blockHours;
            cursor = addMinutes(blockEnd, 60);
        }
    });

    return {
        taskId: task.id,
        taskName: task.name,
        knowledgeLevel: task.knowledgeLevel,
        priority,
        deadline: task.date,
        totalHours,
        dailyHours,
        sessions
    };
}

function groupPlanDays(planData) {
    if (!planData) {
        return [];
    }

    const grouped = new Map();

    planData.sessions.forEach((session) => {
        if (!grouped.has(session.date)) {
            grouped.set(session.date, []);
        }

        grouped.get(session.date).push(session);
    });

    return Array.from(grouped.entries())
        .sort((first, second) => first[0].localeCompare(second[0]))
        .map(([dateKey, sessions]) => ({
            date: parseDateOnly(dateKey),
            totalHours: sessions.reduce((sum, session) => sum + session.hours, 0),
            sessions
        }));
}

function renderPlannerProgress(planData) {
    const progressElement = document.getElementById("plannerProgress");
    if (!progressElement) {
        return;
    }

    if (!planData) {
        progressElement.innerHTML = "";
        return;
    }

    const completedHours = planData.sessions
        .filter((session) => session.completed)
        .reduce((sum, session) => sum + session.hours, 0);
    const nextSession = planData.sessions.find((session) => !session.completed);

    progressElement.innerHTML = `
        <div class="planner-progress-card">
            <div class="planner-progress-top">
                <div>
                    <strong>${escapeHtml(planData.taskName)}</strong><br>
                    Due ${formatDate(planData.deadline)} | ${planData.knowledgeLevel} knowledge | ${planData.priority} priority
                </div>
                <div class="planner-progress-hours">${formatHours(completedHours)}h / ${formatHours(planData.totalHours)}h done</div>
            </div>
            <div class="planner-progress-next">
                ${nextSession
                    ? `Next session: ${nextSession.dayLabel} | ${nextSession.start} - ${nextSession.end}`
                    : "All planned sessions for this task are completed."}
            </div>
        </div>
    `;
}

function renderPlannerBoard(planData, days) {
    const board = document.getElementById("plannerBoard");
    if (!board) {
        return;
    }

    if (!planData || !days || !days.length) {
        board.innerHTML = "";
        return;
    }

    let html = "";

    days.forEach((day) => {
        html += `
            <div class="planner-day-card">
                <div class="planner-day-header">
                    <div class="planner-day-title">${day.date.toDateString()}</div>
                    <div class="planner-day-total">${formatHours(day.totalHours)}h planned</div>
                </div>
        `;

        day.sessions.forEach((session) => {
            html += `
                <label class="planner-session ${session.completed ? "completed" : ""}">
                    <div class="planner-session-check">
                        <input type="checkbox" ${session.completed ? "checked" : ""} onchange="togglePlannerSession('${escapeHtml(planData.taskId)}', '${escapeHtml(session.id)}')">
                    </div>
                    <div class="planner-session-main">
                        <div class="planner-session-time">${session.start} - ${session.end}</div>
                    </div>
                </label>
            `;
        });

        html += `</div>`;
    });

    board.innerHTML = html;
}

function showSelectedTaskPlan() {
    const taskId = getValue("plannerTaskSelect");
    if (!taskId) {
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "Select a task to view or generate its study plan.");
        return;
    }

    const task = getTaskById(taskId);
    const plannerProgress = loadPlannerProgress();
    const planData = task ? buildTaskPlan(task, plannerProgress[taskId]) : null;

    if (!planData) {
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "No saved plan yet for this task. Click Generate Planner to create one.");
        return;
    }

    plannerProgress[taskId] = planData;
    savePlannerProgress(plannerProgress);

    if (!planData.sessions.length) {
        renderPlannerProgress(planData);
        renderPlannerBoard(null, []);
        setText("plan", "No remaining study slots are available between the current time and this task's deadline.");
        return;
    }

    renderPlannerProgress(planData);
    renderPlannerBoard(planData, groupPlanDays(planData));
    setText("plan", `${planData.priority} priority study plan loaded. Keep checking sessions as you complete them.`);
}

function getFallbackNotes(topic) {
    const label = topic.trim() || "this topic";
    return `Full Notes: ${label}

1. Introduction
${label} is an important study topic. Begin by understanding its meaning, why it is used, and where it appears in real academic or practical situations.

2. Core Definition
Write the exact definition of ${label}. Learn the keywords in the definition because those are often used in exams, viva questions, and short answers.

3. Main Concepts
- Understand the basic idea behind ${label}
- Learn the parts, elements, or stages involved
- Identify how it works step by step
- Study where it is applied
- Know the advantages, limitations, and important conditions

4. Detailed Explanation
Break ${label} into small subtopics. For each subtopic, learn:
- what it is
- why it is needed
- how it works
- one example
- one important point to remember

5. Key Points To Remember
- Learn all important terms and meanings
- Memorize formulas, rules, laws, or conditions if any
- Understand diagrams, flow, or process involved
- Compare with similar concepts if needed

6. Applications
Study where ${label} is used in real life, in exams, in systems, or in practical examples. Applications help you write long answers better.

7. Advantages
- Improves understanding of the topic
- Helps solve practical problems
- Often forms the base for advanced chapters

8. Limitations
- May be hard to apply without basics
- Needs examples for deeper understanding
- Can be confusing if related terms are mixed up

9. Important Exam Questions
- Define ${label}
- Explain ${label} with an example
- Write advantages and limitations of ${label}
- Differentiate ${label} from related concepts
- Explain the working or steps of ${label}

10. Short Revision
Revise definition, key terms, working steps, one example, and one comparison. That gives you a strong quick-review set for this topic.`;
}

async function generateStudyNotes() {
    const topic = getValue("studyTopic");
    const output = document.getElementById("studyNotesOutput");

    if (!output) {
        return;
    }

    if (!topic) {
        output.innerText = "First enter what you are going to study.";
        return;
    }

    output.innerText = "Preparing full notes...";

    const notesPrompt = `Create complete and detailed study notes for the topic "${topic}". 
Explain from basics to advanced points in simple student-friendly language.
Do not skip important points.
Include:
1. introduction
2. full definition
3. detailed explanation of all main concepts
4. step-by-step working if applicable
5. important keywords
6. advantages
7. limitations
8. applications
9. examples
10. important exam questions
11. short revision summary
Format clearly with headings and bullet points where useful.`;

    try {
        const notes = await getAIResponse(notesPrompt);
        output.innerText = notes && notes.trim() ? notes : getFallbackNotes(topic);
    } catch (error) {
        console.error("Failed to generate notes:", error);
        output.innerText = getFallbackNotes(topic);
    }
}

function generatePlan() {
    const taskId = getValue("plannerTaskSelect");
    if (!taskId) {
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "Select a task first to generate its learning plan.");
        return;
    }

    const task = getTaskById(taskId);
    if (!task) {
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "The selected task could not be found.");
        return;
    }

    const plannerProgress = loadPlannerProgress();
    const planData = buildTaskPlan(task, plannerProgress[taskId]);

    if (!planData) {
        renderPlannerProgress(null);
        renderPlannerBoard(null, []);
        setText("plan", "This task deadline is already in the past, so no planner can be generated.");
        return;
    }

    plannerProgress[taskId] = planData;
    savePlannerProgress(plannerProgress);

    if (!planData.sessions.length) {
        renderPlannerProgress(planData);
        renderPlannerBoard(null, []);
        setText("plan", "No remaining study slots are available between the current time and this task's deadline.");
        return;
    }

    renderPlannerProgress(planData);
    renderPlannerBoard(planData, groupPlanDays(planData));
    setText("plan", `${planData.priority} priority study plan ready. Total target: ${formatHours(planData.totalHours)}h. Daily cap: ${formatHours(planData.dailyHours)}h.`);
}

function togglePlannerSession(taskId, sessionId) {
    const plannerProgress = loadPlannerProgress();
    const planData = plannerProgress[taskId];

    if (!planData) {
        return;
    }

    planData.sessions = planData.sessions.map((session) => (
        session.id === sessionId
            ? { ...session, completed: !session.completed }
            : session
    ));

    plannerProgress[taskId] = planData;
    savePlannerProgress(plannerProgress);

    if (getValue("plannerTaskSelect") === taskId) {
        generatePlan();
    }
}

// ================= AI CHATBOT =================
async function getAIResponse(prompt) {
    const message = prompt.trim();

    if (message.toLowerCase().includes("hi") || message.toLowerCase().includes("hello")) {
        return "Hello! Ask me anything.";
    }

    try {
        const response = await fetch("http://127.0.0.1:3000/api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: message })
        });

        if (!response.ok) {
            throw new Error("Failed to fetch from AI server");
        }

        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error("Request failed:", error);
        return "Failed to connect to AI server.";
    }
}

async function studyChatAI() {
    const input = document.getElementById("studyChatInput");
    if (!input) {
        return;
    }

    const userMessage = input.value.trim();
    if (!userMessage) {
        return;
    }

    appendChatBubble("user", escapeHtml(userMessage));

    const chatOutput = document.getElementById("studyChatOutput");
    const typing = document.createElement("div");
    typing.id = "typing";
    typing.className = "chat-row bot";
    typing.innerHTML = `<div class="chat-bubble bot-bubble">Thinking...</div>`;
    chatOutput.appendChild(typing);
    chatOutput.scrollTop = chatOutput.scrollHeight;

    const botResponse = await getAIResponse(userMessage);
    const typingElement = document.getElementById("typing");
    if (typingElement) {
        typingElement.remove();
    }

    appendChatBubble("bot", escapeHtml(botResponse).replaceAll("\n", "<br>"));
    input.value = "";
}
