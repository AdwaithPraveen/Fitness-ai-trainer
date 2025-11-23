// public/chatbot.js (replace file)
const chatBox = document.getElementById('chat-box');
const input = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

let state = { step: 0, answers: {} };

const questions = [
  { key: "age", text: "What's your age?" },
  { key: "sex", text: "Sex (M/F)?" },
  { key: "height_cm", text: "Height in cm?" },
  { key: "weight_kg", text: "Weight in kg?" },
  { key: "body_shape", text: "Body shape (skinny / average / fat / athletic)?" },
  { key: "activity_level", text: "Activity level? Choose: Sedentary, Lightly Active, Moderately Active, Very Active, Extremely Active" },
  { key: "goal", text: "Goal? (increase / decrease / maintain / bulk / cut)" },
  { key: "diet_pref", text: "Diet preference? (veg / non-veg)" },
  { key: "equipment", text: "Equipment? (home / gym / any)" },
  { key: "difficulty", text: "Difficulty (beginner / intermediate)?" }
];

sendBtn.onclick = handleSend;
input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

function startConversation() {
  addMessage("Hi! I'm your Gym Trainer. I'll ask a few quick questions to build your plan. Ready?", "bot");
  setTimeout(() => askNext(), 700);
}

function askNext() {
  const q = questions[state.step];
  if (!q) {
    addMessage("Thanks — creating your personalized plan now...", "bot");
    generatePlan();
    return;
  }
  addMessage(q.text, "bot");
  input.focus();
}

async function handleSend() {
  const value = input.value.trim();
  if (!value) return;
  addMessage(value, "user");
  const q = questions[state.step];
  if (q) {
    state.answers[q.key] = value;
    state.step += 1;
    input.value = "";
    setTimeout(askNext, 400);
  } else {
    input.value = "";
  }
}

function addMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message ' + (sender === 'user' ? 'user-message' : 'bot-message');
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msgDiv;
}

function clearChat() { chatBox.innerHTML = ""; }

async function generatePlan() {
  addMessage("Loading plan...", "bot");
  sendBtn.disabled = true;
  input.disabled = true;
  try {
    const payload = {
      age: Number(state.answers.age),
      sex: state.answers.sex,
      height_cm: Number(state.answers.height_cm),
      weight_kg: Number(state.answers.weight_kg),
      body_shape: state.answers.body_shape,
      activity_level: state.answers.activity_level,
      goal: state.answers.goal,
      diet_pref: state.answers.diet_pref,
      equipment: state.answers.equipment,
      difficulty: state.answers.difficulty
    };

    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    // remove loading
    const loading = Array.from(document.querySelectorAll('.bot-message')).reverse().find(n => n.innerText.includes("Loading"));
    if (loading) loading.remove();

    if (data.error) {
      addMessage("Error: " + data.error, "bot");
    } else {
      // Show the structured plan briefly (optional)
      // addMessage("Plan generated. Here is your trainer's message:", "bot");

      // formattedSections is an array from the server (Groq output split into sections)
      const sections = data.formattedSections || [JSON.stringify(data.structuredPlan)];
      for (const sec of sections) {
        // small delay between sections for nicer UX
        await new Promise(r => setTimeout(r, 350));
        addMessage(sec, "bot");
      }
    }
  } catch (err) {
    addMessage("Server error while generating plan.", "bot");
  } finally {
    sendBtn.disabled = false;
    input.disabled = false;
    state = { step: 0, answers: {} };
    addMessage("If you'd like another plan, type anything to restart.", "bot");
  }
}

input.addEventListener('input', () => {
  if (state.step === 0 && input.value.trim().length > 0) {
    clearChat();
    startConversation();
  }
});

startConversation();
