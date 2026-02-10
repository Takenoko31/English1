const contentData = [
  {
    id: "a16z",
    label: "a16z (sample)",
    audio: "",
    sentences: [
      "Great founders are excellent at rapid learning loops.",
      "Distribution can be as important as product quality in the early stage.",
      "Strong conviction should coexist with fast iteration."
    ]
  },
  {
    id: "yc",
    label: "Y Combinator (sample)",
    audio: "",
    sentences: [
      "Make something people want, then talk to users every week.",
      "A startup is a company designed to grow fast.",
      "Progress comes from shipping, measuring, and refining."
    ]
  },
  {
    id: "venture-deals",
    label: "Venture Deals (sample)",
    audio: "",
    sentences: [
      "A term sheet is a roadmap for the financing round.",
      "Liquidation preference affects return outcomes significantly.",
      "Founders should understand dilution before signing."
    ]
  },
  {
    id: "think-fast-talk-smart",
    label: "Think Fast Talk Smart (sample)",
    audio: "",
    sentences: [
      "Clear communication starts with audience awareness.",
      "Structure your message so the key point lands early.",
      "Confidence grows when preparation and practice align."
    ]
  }
];

const state = {
  contentIdx: 0,
  sentenceIdx: 0,
  quizQueue: [],
  currentQuiz: null
};

const savedKey = "savedExpressionsV1";

const el = {
  contentSelect: document.querySelector("#contentSelect"),
  sentenceSelect: document.querySelector("#sentenceSelect"),
  audioPlayer: document.querySelector("#audioPlayer"),
  scriptText: document.querySelector("#scriptText"),
  speakBtn: document.querySelector("#speakBtn"),
  slowSpeakBtn: document.querySelector("#slowSpeakBtn"),
  lookupSelectionBtn: document.querySelector("#lookupSelectionBtn"),
  saveSelectionBtn: document.querySelector("#saveSelectionBtn"),
  dictationInput: document.querySelector("#dictationInput"),
  checkDictationBtn: document.querySelector("#checkDictationBtn"),
  showAnswerBtn: document.querySelector("#showAnswerBtn"),
  dictationResult: document.querySelector("#dictationResult"),
  lookupInput: document.querySelector("#lookupInput"),
  lookupBtn: document.querySelector("#lookupBtn"),
  lookupResult: document.querySelector("#lookupResult"),
  savedList: document.querySelector("#savedList"),
  savedItemTemplate: document.querySelector("#savedItemTemplate"),
  startQuizBtn: document.querySelector("#startQuizBtn"),
  nextQuizBtn: document.querySelector("#nextQuizBtn"),
  showQuizAnswerBtn: document.querySelector("#showQuizAnswerBtn"),
  quizArea: document.querySelector("#quizArea")
};

function getCurrentSentence() {
  return contentData[state.contentIdx].sentences[state.sentenceIdx];
}

function loadSavedExpressions() {
  try {
    return JSON.parse(localStorage.getItem(savedKey)) || [];
  } catch {
    return [];
  }
}

function persistSavedExpressions(items) {
  localStorage.setItem(savedKey, JSON.stringify(items));
}

function renderSavedExpressions() {
  const items = loadSavedExpressions();
  el.savedList.innerHTML = "";

  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = "保存された表現はまだありません。";
    el.savedList.append(li);
    return;
  }

  items.forEach((entry, idx) => {
    const fragment = el.savedItemTemplate.content.cloneNode(true);
    fragment.querySelector(".saved-expression").textContent = `${entry.expression} (${entry.type})`;
    fragment.querySelector(".delete-saved").addEventListener("click", () => {
      const next = loadSavedExpressions().filter((_, i) => i !== idx);
      persistSavedExpressions(next);
      renderSavedExpressions();
    });
    el.savedList.append(fragment);
  });
}

function saveExpression(expression, type = "manual") {
  const value = expression.trim();
  if (!value) return;

  const items = loadSavedExpressions();
  const exists = items.some((item) => item.expression.toLowerCase() === value.toLowerCase());
  if (exists) {
    alert("同じ表現は既に保存されています。");
    return;
  }

  items.push({ expression: value, type, createdAt: new Date().toISOString() });
  persistSavedExpressions(items);
  renderSavedExpressions();
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreDictation(input, answer) {
  const normalizedInput = normalizeText(input);
  const normalizedAnswer = normalizeText(answer);

  if (!normalizedInput) {
    return { score: 0, message: "入力が空です。" };
  }

  const inputWords = normalizedInput.split(" ");
  const answerWords = normalizedAnswer.split(" ");
  const correctCount = inputWords.filter((w, i) => w === answerWords[i]).length;
  const score = Math.round((correctCount / answerWords.length) * 100);

  return {
    score,
    message: `一致率: ${score}% (${correctCount}/${answerWords.length} words in exact position)`
  };
}

function updateSentenceView() {
  const sentence = getCurrentSentence();
  el.scriptText.textContent = sentence;
  el.dictationInput.value = "";
  el.dictationResult.textContent = "";

  const current = contentData[state.contentIdx];
  el.audioPlayer.src = current.audio || "";
}

function renderContentOptions() {
  el.contentSelect.innerHTML = "";
  contentData.forEach((content, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = content.label;
    el.contentSelect.append(opt);
  });
}

function renderSentenceOptions() {
  el.sentenceSelect.innerHTML = "";
  contentData[state.contentIdx].sentences.forEach((sentence, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = `${idx + 1}. ${sentence.slice(0, 60)}`;
    el.sentenceSelect.append(opt);
  });
}

async function lookupWord(query) {
  const keyword = query.trim();
  if (!keyword) return;

  el.lookupResult.textContent = "検索中...";

  let englishDefinition = "No English definition found.";
  let japaneseTranslation = "日本語訳が取得できませんでした。";

  try {
    const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(keyword)}`);
    if (dictRes.ok) {
      const data = await dictRes.json();
      englishDefinition = data?.[0]?.meanings?.[0]?.definitions?.[0]?.definition || englishDefinition;
    }
  } catch {
    englishDefinition = "Dictionary lookup failed (network or API issue).";
  }

  try {
    const transRes = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(keyword)}&langpair=en|ja`
    );
    if (transRes.ok) {
      const data = await transRes.json();
      japaneseTranslation = data?.responseData?.translatedText || japaneseTranslation;
    }
  } catch {
    japaneseTranslation = "翻訳取得に失敗しました。";
  }

  el.lookupResult.innerHTML = `
    <p><strong>Query:</strong> ${keyword}</p>
    <p><strong>英英:</strong> ${englishDefinition}</p>
    <p><strong>英和:</strong> ${japaneseTranslation}</p>
  `;
}

function getSelectionText() {
  return window.getSelection ? window.getSelection().toString().trim() : "";
}

function speakCurrentSentence(rate = 1) {
  const sentence = getCurrentSentence();
  if (!("speechSynthesis" in window)) {
    alert("このブラウザはSpeech Synthesisに対応していません。");
    return;
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(sentence);
  utter.lang = "en-US";
  utter.rate = rate;
  window.speechSynthesis.speak(utter);
}

function createQuizQuestion() {
  const items = loadSavedExpressions();
  if (!items.length) {
    el.quizArea.textContent = "先に表現を保存してください。";
    return null;
  }

  const index = Math.floor(Math.random() * items.length);
  const selected = items[index];
  return {
    prompt: `次の表現の意味・用法を説明してください: "${selected.expression}"`,
    answer: `保存表現: ${selected.expression} (${selected.type})`
  };
}

function setQuizQuestion() {
  state.currentQuiz = createQuizQuestion();
  if (!state.currentQuiz) return;
  el.quizArea.innerHTML = `<p>${state.currentQuiz.prompt}</p>`;
}

el.contentSelect.addEventListener("change", (e) => {
  state.contentIdx = Number(e.target.value);
  state.sentenceIdx = 0;
  renderSentenceOptions();
  updateSentenceView();
});

el.sentenceSelect.addEventListener("change", (e) => {
  state.sentenceIdx = Number(e.target.value);
  updateSentenceView();
});

el.speakBtn.addEventListener("click", () => speakCurrentSentence(1));
el.slowSpeakBtn.addEventListener("click", () => speakCurrentSentence(0.7));

el.lookupSelectionBtn.addEventListener("click", () => {
  const selection = getSelectionText();
  if (!selection) {
    alert("先にスクリプト上の語句を選択してください。");
    return;
  }
  el.lookupInput.value = selection;
  lookupWord(selection);
});

el.saveSelectionBtn.addEventListener("click", () => {
  const selection = getSelectionText();
  if (!selection) {
    alert("先にスクリプト上の語句を選択してください。");
    return;
  }
  saveExpression(selection, "selection");
});

el.checkDictationBtn.addEventListener("click", () => {
  const answer = getCurrentSentence();
  const result = scoreDictation(el.dictationInput.value, answer);
  el.dictationResult.textContent = result.message;
});

el.showAnswerBtn.addEventListener("click", () => {
  el.dictationResult.textContent = `正解: ${getCurrentSentence()}`;
});

el.lookupBtn.addEventListener("click", () => lookupWord(el.lookupInput.value));

el.lookupInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    lookupWord(el.lookupInput.value);
  }
});

el.startQuizBtn.addEventListener("click", () => setQuizQuestion());
el.nextQuizBtn.addEventListener("click", () => setQuizQuestion());
el.showQuizAnswerBtn.addEventListener("click", () => {
  if (!state.currentQuiz) {
    el.quizArea.textContent = "先にテストを開始してください。";
    return;
  }
  el.quizArea.innerHTML = `<p>${state.currentQuiz.prompt}</p><p><strong>答え例:</strong> ${state.currentQuiz.answer}</p>`;
});

renderContentOptions();
renderSentenceOptions();
renderSavedExpressions();
updateSentenceView();
