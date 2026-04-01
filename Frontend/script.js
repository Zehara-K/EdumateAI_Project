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

function parseDateOnly(value) {
    const date = new Date(value);
    date.setHours(0, 0, 0, 0);
    return date;
}

function getDaysLeft(dateValue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = parseDateOnly(dateValue);
    return Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
}

function getPriorityFromDate(dateValue) {
    const daysLeft = getDaysLeft(dateValue);

    if (daysLeft <= 2) {
        return { label: "High", color: "red" };
    }

    if (daysLeft <= 5) {
        return { label: "Medium", color: "orange" };
    }

    return { label: "Low", color: "green" };
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

// ================= TASK MANAGER =================
function addTask() {
    const taskName = getValue("task", "task-name");
    const dateValue = getValue("deadline", "task-date");

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

    const priority = getPriorityFromDate(dateValue);
    const tasks = loadTasks();

    tasks.push({
        name: taskName,
        date: dateValue,
        priority: priority.label,
        createdAt: new Date().toISOString()
    });

    saveTasks(tasks);
    renderTasks();
    updatePlannerHint();
    renderPlannerTaskSummary();

    const taskInput = getElement("task", "task-name");
    const dateInput = getElement("deadline", "task-date");

    if (taskInput) {
        taskInput.value = "";
    }

    if (dateInput) {
        dateInput.value = "";
    }
}

function renderTasks() {
    const taskList = getElement("taskList", "task-list");
    if (!taskList) {
        return;
    }

    const tasks = loadTasks().sort((first, second) => first.date.localeCompare(second.date));
    taskList.innerHTML = "";

    if (!tasks.length) {
        const emptyItem = document.createElement("li");
        emptyItem.innerText = "No tasks added yet.";
        taskList.appendChild(emptyItem);
        return;
    }

    tasks.forEach((task) => {
        const priority = getPriorityFromDate(task.date);
        const daysLeft = getDaysLeft(task.date);
        const item = document.createElement("li");

        item.innerHTML = `
            <b>${task.name}</b><br>
            Deadline: ${formatDate(task.date)}<br>
            Priority: <span style="color:${priority.color}">${priority.label}</span><br>
            Days Left: ${daysLeft}
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
        hintElement.innerText = "Add tasks first. The planner will build a realistic schedule directly from your tasks.";
        return;
    }

    hintElement.innerText = `${taskCount} saved task(s) will be scheduled automatically with a maximum of 12 study hours per day.`;
}

function renderPlannerTaskSummary() {
    const summaryElement = document.getElementById("plannerTaskSummary");
    if (!summaryElement) {
        return;
    }

    const tasks = loadTasks().sort((first, second) => first.date.localeCompare(second.date));

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
        const priority = task.priority || getPriorityFromDate(task.date).label;
        const estimatedHours = getEstimatedHours(priority);
        content += `
            <div class="planner-task-item">
                ${index + 1}. ${task.name} | Due ${formatDate(task.date)} | ${priority} priority | ${estimatedHours}h
            </div>
        `;
    });

    content += "</div>";
    summaryElement.innerHTML = content;
}

function renderPlannerBoard(days) {
    const board = document.getElementById("plannerBoard");
    if (!board) {
        return;
    }

    if (!days || !days.length) {
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

        if (!day.sessions.length) {
            html += `<div class="planner-session empty">Free day / recovery / revision buffer</div>`;
        } else {
            day.sessions.forEach((session) => {
                html += `
                    <div class="planner-session">
                        <div class="planner-session-time">${session.time}</div>
                        <div class="planner-session-task">${session.title}</div>
                        <div class="planner-session-meta">${session.meta}</div>
                    </div>
                `;
            });
        }

        html += `</div>`;
    });

    board.innerHTML = html;
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
    const startDateValue = getValue("startDate", "examDate", "study-start-date");
    if (!startDateValue) {
        renderPlannerBoard([]);
        setText("plan", "Please select a valid start date.");
        return;
    }

    const startDate = parseDateOnly(startDateValue);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
        renderPlannerBoard([]);
        setText("plan", "Start date cannot be in the past.");
        return;
    }

    const savedTasks = loadTasks()
        .map((task) => ({
            ...task,
            dueDate: parseDateOnly(task.date),
            estimatedHours: getEstimatedHours(task.priority || getPriorityFromDate(task.date).label)
        }))
        .filter((task) => task.dueDate >= startDate)
        .sort((first, second) => {
            if (first.date !== second.date) {
                return first.date.localeCompare(second.date);
            }

            return getPriorityWeight(second.priority) - getPriorityWeight(first.priority);
        });

    if (!savedTasks.length) {
        renderPlannerBoard([]);
        setText("plan", "No future tasks found from your task list. Add tasks with upcoming dates to generate a planner.");
        return;
    }

    const lastDeadline = savedTasks.reduce((latest, task) => (task.dueDate > latest ? task.dueDate : latest), new Date(startDate));

    const planDays = buildDateRange(startDate, lastDeadline).map((date) => ({
        date,
        hours: 0,
        items: []
    }));

    const targetHoursPerDay = 8;
    const maxHoursPerDay = 12;
    const warnings = [];
    const taskQueue = savedTasks.map((task) => ({
        ...task,
        remainingHours: task.estimatedHours
    }));

    planDays.forEach((day) => {
        let plannedToday = 0;
        const availableTasks = taskQueue
            .filter((task) => task.remainingHours > 0 && task.dueDate >= day.date)
            .sort((first, second) => {
                if (first.date !== second.date) {
                    return first.date.localeCompare(second.date);
                }

                return getPriorityWeight(second.priority) - getPriorityWeight(first.priority);
            });

        availableTasks.forEach((task) => {
            if (plannedToday >= targetHoursPerDay) {
                return;
            }

            const freeHours = maxHoursPerDay - day.hours;
            if (freeHours <= 0) {
                return;
            }

            const daysLeft = Math.max(1, buildDateRange(day.date, task.dueDate).length);
            const minimumToday = Math.ceil(task.remainingHours / daysLeft);
            const preferredToday = Math.min(3, task.remainingHours);
            const hoursForTask = Math.min(task.remainingHours, freeHours, Math.max(minimumToday, preferredToday));

            if (hoursForTask <= 0) {
                return;
            }

            day.items.push({
                name: task.name,
                hours: hoursForTask,
                priority: task.priority,
                deadline: task.dueDate
            });
            day.hours += hoursForTask;
            plannedToday += hoursForTask;
            task.remainingHours -= hoursForTask;
        });
    });

    taskQueue.forEach((task) => {
        if (task.remainingHours > 0) {
            warnings.push(`${task.name} still needs ${formatHours(task.remainingHours)} more hour(s) before ${task.dueDate.toDateString()}.`);
        }
    });

    const plannerDays = planDays.map((day) => {
        const sessions = [];
        let cursor = new Date(day.date);
        cursor.setHours(9, 0, 0, 0);
        let studyBlocks = 0;

        day.items.forEach((item) => {
            let remaining = item.hours;

            while (remaining > 0) {
                const blockHours = Math.min(2, remaining);
                const blockStart = new Date(cursor);
                const blockEnd = addMinutes(blockStart, blockHours * 60);

                sessions.push({
                    time: `${formatTime(blockStart)} - ${formatTime(blockEnd)}`,
                    title: item.name,
                    meta: `${formatHours(blockHours)}h | ${item.priority} priority | Due ${item.deadline.toDateString()}`
                });

                cursor = new Date(blockEnd);
                remaining -= blockHours;
                studyBlocks += 1;

                if (remaining > 0) {
                    cursor = addMinutes(cursor, 15);
                } else if (studyBlocks % 2 === 0) {
                    cursor = addMinutes(cursor, 45);
                } else {
                    cursor = addMinutes(cursor, 15);
                }
            }
        });

        return {
            date: day.date,
            totalHours: day.hours,
            sessions
        };
    });

    renderPlannerBoard(plannerDays);

    let output = "Actual Study Planner\n\n";
    output += `Planner starts: ${startDate.toDateString()}\n`;
    output += `Tasks scheduled: ${savedTasks.length}\n`;
    output += `Target study time: ${targetHoursPerDay}h/day\n`;
    output += `Hard maximum: ${maxHoursPerDay}h/day\n\n`;
    output += "Open the planner cards above to see the day-by-day time blocks.\n";

    if (warnings.length) {
        output += "\nWarnings\n";
        warnings.forEach((warning) => {
            output += `- ${warning}\n`;
        });
    }

    setText("plan", output.trim());
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
