const contentData = [
  {
    id: "a16z",
    label: "a16z Podcast (sample)",
    mediaType: "spotify",
    mediaEmbedUrl: "https://open.spotify.com/embed/episode/7makk4oTQel546B0PZlDM5",
    mediaPageUrl: "https://open.spotify.com/episode/7makk4oTQel546B0PZlDM5",
    transcriptSourceUrl: "https://a16z.com/podcasts/",
    audio: "",
    sentences: [
      "Great founders are excellent at rapid learning loops.",
      "Distribution can be as important as product quality in the early stage.",
      "Strong conviction should coexist with fast iteration."
    ]
  },
  {
    id: "yc",
    label: "Y Combinator Video (sample)",
    mediaType: "youtube",
    mediaEmbedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    mediaPageUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    transcriptSourceUrl: "https://www.ycombinator.com/library",
    audio: "",
    sentences: [
      "Make something people want, then talk to users every week.",
      "A startup is a company designed to grow fast.",
      "Progress comes from shipping, measuring, and refining."
    ]
  },
  {
    id: "venture-deals",
    label: "Venture Deals Podcast (sample)",
    mediaType: "spotify",
    mediaEmbedUrl: "https://open.spotify.com/embed/show/5CfCWKI5pZ28U0uOzXkDHe",
    mediaPageUrl: "https://open.spotify.com/show/5CfCWKI5pZ28U0uOzXkDHe",
    transcriptSourceUrl: "https://www.kauffmanfellows.org/journal",
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
    mediaType: "spotify",
    mediaEmbedUrl: "https://open.spotify.com/embed/show/6ll0mwL2Y0kVYV8Yl7v4Sk",
    mediaPageUrl: "https://open.spotify.com/show/6ll0mwL2Y0kVYV8Yl7v4Sk",
    transcriptSourceUrl: "https://fastersmarter.io/episodes/",
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
  mediaStatus: document.querySelector("#mediaStatus"),
  audioPlayer: document.querySelector("#audioPlayer"),
  mediaEmbed: document.querySelector("#mediaEmbed"),
  scriptText: document.querySelector("#scriptText"),
  speakBtn: document.querySelector("#speakBtn"),
  slowSpeakBtn: document.querySelector("#slowSpeakBtn"),
  fetchScriptBtn: document.querySelector("#fetchScriptBtn"),
  scriptSourceLink: document.querySelector("#scriptSourceLink"),
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

function getCurrentContent() {
  return contentData[state.contentIdx];
}

function getCurrentSentence() {
  return getCurrentContent().sentences[state.sentenceIdx];
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

function setMediaStatus(message) {
  el.mediaStatus.textContent = message;
}

function updateMediaView() {
  const current = getCurrentContent();
  const hasAudio = Boolean(current.audio);
  const hasEmbed = Boolean(current.mediaEmbedUrl);

  if (hasAudio) {
    el.audioPlayer.src = current.audio;
    el.audioPlayer.style.display = "block";
  } else {
    el.audioPlayer.removeAttribute("src");
    el.audioPlayer.load();
    el.audioPlayer.style.display = "none";
  }

  if (hasEmbed) {
    el.mediaEmbed.src = current.mediaEmbedUrl;
    el.mediaEmbed.style.display = "block";
  } else {
    el.mediaEmbed.removeAttribute("src");
    el.mediaEmbed.style.display = "none";
  }

  if (current.transcriptSourceUrl) {
    el.scriptSourceLink.href = current.transcriptSourceUrl;
    el.scriptSourceLink.style.display = "inline-flex";
  } else {
    el.scriptSourceLink.removeAttribute("href");
    el.scriptSourceLink.style.display = "none";
  }

  if (hasAudio && hasEmbed) {
    setMediaStatus("音声URLと埋め込みの両方が設定されています。必要な方を使ってください。");
  } else if (hasAudio) {
    setMediaStatus("音声URLから再生します。読み込めない場合は埋め込みURLを設定してください。");
  } else if (hasEmbed) {
    setMediaStatus("Spotify / YouTube の埋め込みを表示中です。");
  } else {
    setMediaStatus("音声が未設定です。教材データに mediaEmbedUrl または audio を設定してください。");
  }
}

function updateSentenceView() {
  const sentence = getCurrentSentence();
  el.scriptText.textContent = sentence;
  el.dictationInput.value = "";
  el.dictationResult.textContent = "";
  updateMediaView();
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
  getCurrentContent().sentences.forEach((sentence, idx) => {
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

async function fetchOfficialScript() {
  const current = getCurrentContent();
  if (!current.transcriptSourceUrl) {
    alert("この教材はスクリプト出典URLが未設定です。");
    return;
  }

  el.fetchScriptBtn.disabled = true;
  setMediaStatus("公式スクリプトを取得中...");

  try {
    const proxiedUrl = `https://r.jina.ai/http://${current.transcriptSourceUrl.replace(/^https?:\/\//, "")}`;
    const res = await fetch(proxiedUrl);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const text = await res.text();
    if (!text.trim()) {
      throw new Error("empty response");
    }

    const cleaned = text.replace(/\n{3,}/g, "\n\n").slice(0, 6000);
    el.scriptText.textContent = cleaned;
    setMediaStatus("公式サイト由来のテキストを読み込みました（取得できる範囲）。");
  } catch {
    setMediaStatus("自動取得に失敗しました。出典リンクを開いて手動で確認してください。");
  } finally {
    el.fetchScriptBtn.disabled = false;
  }
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
el.fetchScriptBtn.addEventListener("click", () => fetchOfficialScript());

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
