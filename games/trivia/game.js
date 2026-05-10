const difficultySelect = document.getElementById('difficulty-select');
const languageSelect = document.getElementById('language-select');
const categorySelect = document.getElementById('category-select');
const btnNewSet = document.getElementById('btn-new-set');
const btnNext = document.getElementById('btn-next');
const questionEl = document.getElementById('question');
const metaLineEl = document.getElementById('meta-line');
const answersEl = document.getElementById('answers');
const statusEl = document.getElementById('status');
const scoreEl = document.getElementById('score');
const questionNumberEl = document.getElementById('question-number');
const difficultyPillEl = document.getElementById('difficulty-pill');
const sourcePillEl = document.getElementById('source-pill');
const translatePillEl = document.getElementById('translate-pill');

const INITIAL_BUFFER = 5;
const MAX_BUFFER = 10;
const FAST_ANSWER_MS = 1000;
const SLOW_ANSWER_MS = 5000;
const TRANSLATE_ENDPOINTS = [
  'https://translate.fedilab.app/translate',
  'https://translate.cutie.dating/translate'
];

let token = '';
let categories = [];
let queue = [];
let currentQuestion = null;
let askedCount = 0;
let score = 0;
let answered = false;
let emptyState = 'loading';
let isLoadingRound = false;
let isRefilling = false;
let roundId = 0;
let answerStartedAt = 0;
let currentRefillStep = 1;
const translationCache = new Map();

function decodeText(value) {
  try {
    return decodeURIComponent(value);
  } catch (err) {
    return value;
  }
}

function shuffle(list) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function difficultyLabel(value) {
  if (value === 'easy') return t('difficulty.easy');
  if (value === 'medium') return t('btn.diff_medium');
  if (value === 'hard') return t('difficulty.hard');
  return t('trivia.diff_any');
}

function activeLang() {
  return document.documentElement.lang === 'he' ? 'he' : 'en';
}

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || '';
}

function updateSourcePill() {
  sourcePillEl.textContent = t('trivia.buffer_short', { n: queue.length });
}

function updateTranslationPill() {
  if (activeLang() !== 'he') {
    translatePillEl.textContent = 'EN';
    return;
  }
  if (!currentQuestion) {
    translatePillEl.textContent = t('trivia.pending_short');
    return;
  }
  if (currentQuestion.translations.he) {
    translatePillEl.textContent = t('trivia.translated_short');
    return;
  }
  if (currentQuestion.translationState === 'failed') {
    translatePillEl.textContent = t('trivia.fallback_short');
    return;
  }
  translatePillEl.textContent = t('trivia.pending_short');
}

function setSetupLocked(isLocked) {
  btnNewSet.disabled = isLocked;
  difficultySelect.disabled = isLocked;
  categorySelect.disabled = isLocked;
}

function setAnswerButtonsLocked(isLocked) {
  btnNext.disabled = isLocked;
  answersEl.querySelectorAll('button').forEach(button => {
    button.disabled = isLocked || answered;
  });
}

async function ensureToken() {
  if (token) return token;
  const res = await fetch('https://opentdb.com/api_token.php?command=request');
  const data = await res.json();
  token = data.token || '';
  return token;
}

async function resetToken() {
  if (!token) return ensureToken();
  const res = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${encodeURIComponent(token)}`);
  const data = await res.json();
  token = data.token || token;
  return token;
}

async function loadCategories() {
  try {
    const res = await fetch('https://opentdb.com/api_category.php');
    const data = await res.json();
    categories = Array.isArray(data.trivia_categories) ? data.trivia_categories : [];
  } catch (err) {
    categories = [];
  }
  renderCategories();
}

function renderCategories() {
  const selected = categorySelect.value || 'any';
  categorySelect.innerHTML = '';

  const anyOption = document.createElement('option');
  anyOption.value = 'any';
  anyOption.textContent = t('trivia.category_any');
  categorySelect.appendChild(anyOption);

  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = String(category.id);
    option.textContent = category.name;
    categorySelect.appendChild(option);
  });

  categorySelect.value = [...categorySelect.options].some(option => option.value === selected) ? selected : 'any';
}

function mapQuestions(results) {
  return results.map(item => {
    const correctAnswer = decodeText(item.correct_answer);
    const answers = shuffle(
      [correctAnswer].concat(item.incorrect_answers.map(answer => decodeText(answer)))
    );
    return {
      category: decodeText(item.category),
      difficulty: item.difficulty || 'any',
      question: decodeText(item.question),
      correctAnswer,
      answers,
      translations: { en: null, he: null },
      translationState: 'idle'
    };
  });
}

function questionSignature(item) {
  return JSON.stringify([
    item.question,
    item.category,
    item.correctAnswer,
    ...item.answers
  ]);
}

async function translateTexts(strings, targetLang) {
  let lastError = null;
  for (const endpoint of TRANSLATE_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: strings,
          source: 'en',
          target: targetLang,
          format: 'text'
        })
      });
      if (!res.ok) throw new Error(`translate ${res.status}`);
      const data = await res.json();
      const translated = Array.isArray(data.translatedText)
        ? data.translatedText
        : typeof data.translatedText === 'string'
          ? [data.translatedText]
          : null;
      if (!translated || translated.length !== strings.length) {
        throw new Error('translate shape');
      }
      return translated;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('translate failed');
}

async function ensureQuestionTranslation(item, lang) {
  if (lang !== 'he') return;
  if (item.translations.he) return;

  const signature = questionSignature(item);
  if (translationCache.has(signature)) {
    item.translations.he = translationCache.get(signature);
    item.translationState = 'ready';
    return;
  }

  item.translationState = 'pending';
  const translated = await translateTexts(
    [item.question, item.category].concat(item.answers),
    'he'
  );

  const payload = {
    question: translated[0],
    category: translated[1],
    answers: translated.slice(2)
  };
  translationCache.set(signature, payload);
  item.translations.he = payload;
  item.translationState = 'ready';
}

async function localizeQuestions(items, lang) {
  if (lang !== 'he') {
    items.forEach(item => {
      item.translations.en = {
        question: item.question,
        category: item.category,
        answers: item.answers.slice()
      };
    });
    return items;
  }

  await Promise.allSettled(items.map(item => ensureQuestionTranslation(item, lang)));
  items.forEach(item => {
    if (!item.translations.he && item.translationState !== 'ready') item.translationState = 'failed';
  });
  return items;
}

function displayText(item) {
  const lang = activeLang();
  if (lang === 'he' && item.translations.he) return item.translations.he;
  return {
    question: item.question,
    category: item.category,
    answers: item.answers
  };
}

async function fetchBatch(amount, retryCount) {
  const params = new URLSearchParams({
    amount: String(amount),
    type: 'multiple',
    encode: 'url3986'
  });
  const difficulty = difficultySelect.value;
  const category = categorySelect.value;
  if (difficulty !== 'any') params.set('difficulty', difficulty);
  if (category !== 'any') params.set('category', category);

  await ensureToken();
  if (token) params.set('token', token);

  const res = await fetch(`https://opentdb.com/api.php?${params.toString()}`);
  const data = await res.json();

  if (data.response_code === 3 && retryCount < 1) {
    token = '';
    await ensureToken();
    return fetchBatch(amount, retryCount + 1);
  }

  if (data.response_code === 4 && retryCount < 1) {
    await resetToken();
    return fetchBatch(amount, retryCount + 1);
  }

  if (data.response_code !== 0 || !Array.isArray(data.results) || !data.results.length) {
    throw new Error('Trivia fetch failed');
  }

  return mapQuestions(data.results);
}

function remainingSlots() {
  return Math.max(0, currentBufferTarget() - queue.length);
}

function currentBufferTarget() {
  return Math.min(MAX_BUFFER, INITIAL_BUFFER + Math.max(0, currentRefillStep - 1));
}

function updateMetaLine() {
  if (!currentQuestion) {
    metaLineEl.textContent = '';
    return;
  }

  const shown = displayText(currentQuestion);
  metaLineEl.textContent = t('trivia.meta', {
    current: askedCount,
    category: shown.category,
    difficulty: difficultyLabel(currentQuestion.difficulty)
  });
}

function rerenderUnansweredQuestion() {
  if (!currentQuestion || answered) return;
  const startedAt = answerStartedAt;
  renderQuestion();
  answerStartedAt = startedAt;
}

function renderQuestion() {
  answered = false;
  btnNext.hidden = true;
  btnNext.disabled = false;

  if (!currentQuestion) {
    questionEl.textContent = t('trivia.loading_next');
    metaLineEl.textContent = '';
    answersEl.innerHTML = '';
    questionNumberEl.textContent = String(askedCount);
    difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
    updateSourcePill();
    updateTranslationPill();
    setStatus(t('trivia.loading_next'));
    return;
  }

  const shown = displayText(currentQuestion);
  questionEl.textContent = shown.question;
  updateMetaLine();
  questionNumberEl.textContent = String(askedCount);
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  answersEl.innerHTML = '';

  shown.answers.forEach((answer, idx) => {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.type = 'button';
    button.textContent = answer;
    button.dataset.answerIndex = String(idx);
    button.addEventListener('click', () => submitAnswer(idx, button));
    answersEl.appendChild(button);
  });

  answerStartedAt = Date.now();
  updateSourcePill();
  updateTranslationPill();
  if (activeLang() === 'he') {
    if (currentQuestion.translations.he) {
      if (isRefilling) setStatus(t('trivia.prefetching_hebrew', { n: queue.length }));
      else setStatus(t('trivia.machine_hebrew'));
    } else if (currentQuestion.translationState === 'failed') {
      setStatus(t('trivia.translate_failed'));
    } else {
      setStatus(t('trivia.translating_now'));
    }
  } else if (isRefilling) {
    setStatus(t('trivia.prefetching', { n: queue.length }));
  } else {
    setStatus(t('trivia.english_note'));
  }
}

function refillStepForDuration(ms) {
  if (ms < FAST_ANSWER_MS) return 4;
  if (ms > SLOW_ANSWER_MS) return 1;
  return 2;
}

async function ensureQueue(targetFill, sourceRoundId) {
  if (isRefilling) return;
  if (!currentQuestion && !isLoadingRound && !queue.length) return;

  isRefilling = true;
  updateSourcePill();
  if (currentQuestion && !answered) {
    setStatus(t('trivia.prefetching', { n: queue.length }));
  }

  try {
    while (roundId === sourceRoundId) {
      const need = Math.min(targetFill - queue.length, remainingSlots());
      if (need <= 0) break;
      const batch = await fetchBatch(need, 0);
      if (roundId !== sourceRoundId) return;
      await localizeQuestions(batch, activeLang());
      if (roundId !== sourceRoundId) return;
      queue.push(...batch.slice(0, need));
      updateSourcePill();
      if (!currentQuestion && !isLoadingRound && queue.length) {
        promoteNextQuestion();
      }
    }
  } catch (err) {
    if (roundId !== sourceRoundId) return;
    if (!currentQuestion && !queue.length) {
      emptyState = 'error';
      questionEl.textContent = t('trivia.error_title');
      metaLineEl.textContent = '';
      answersEl.innerHTML = '';
      setStatus(t('trivia.error_body'), 'bad');
    }
  } finally {
    if (roundId === sourceRoundId) {
      isRefilling = false;
      updateSourcePill();
      updateTranslationPill();
      if (currentQuestion && !answered) {
        if (activeLang() === 'he' && currentQuestion.translations.he) setStatus(t('trivia.machine_hebrew'));
        else if (activeLang() === 'he' && currentQuestion.translationState === 'failed') setStatus(t('trivia.translate_failed'));
        else if (activeLang() === 'he') setStatus(t('trivia.translating_now'));
        else setStatus(t('trivia.english_note'));
      }
    }
  }
}

function promoteNextQuestion() {
  currentQuestion = queue.shift() || null;
  if (!currentQuestion) {
    questionEl.textContent = t('trivia.loading_next');
    metaLineEl.textContent = '';
    answersEl.innerHTML = '';
    questionNumberEl.textContent = String(askedCount + 1);
    updateSourcePill();
    updateTranslationPill();
    setStatus(t('trivia.loading_next'));
    return;
  }

  askedCount += 1;
  renderQuestion();
}

function submitAnswer(answerIndex, buttonEl) {
  if (answered || !currentQuestion) return;
  answered = true;

  const responseMs = Date.now() - answerStartedAt;
  currentRefillStep = refillStepForDuration(responseMs);
  const correctIndex = currentQuestion.answers.indexOf(currentQuestion.correctAnswer);
  const isCorrect = answerIndex === correctIndex;

  if (isCorrect) {
    score += 1;
    scoreEl.textContent = String(score);
    buttonEl.classList.add('correct');
    setStatus(t('trivia.correct'), 'good');
  } else {
    buttonEl.classList.add('wrong');
    answersEl.querySelectorAll('button').forEach(button => {
      if (Number(button.dataset.answerIndex) === correctIndex) button.classList.add('correct');
    });
    const shown = displayText(currentQuestion);
    setStatus(t('trivia.wrong', { answer: shown.answers[correctIndex] }), 'bad');
  }

  answersEl.querySelectorAll('button').forEach(button => {
    button.disabled = true;
  });

  updateSourcePill();
  btnNext.hidden = false;

  ensureQueue(currentBufferTarget(), roundId);
}

function goNext() {
  if (!answered) return;
  currentQuestion = null;
  promoteNextQuestion();
  if (currentQuestion) ensureQueue(currentBufferTarget(), roundId);
}

async function startNewSet() {
  const thisRound = ++roundId;
  isLoadingRound = true;
  isRefilling = false;
  score = 0;
  askedCount = 0;
  answered = false;
  emptyState = 'loading';
  currentRefillStep = 1;
  currentQuestion = null;
  queue = [];
  scoreEl.textContent = '0';
  questionNumberEl.textContent = '0';
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  updateSourcePill();
  updateTranslationPill();
  questionEl.textContent = t('trivia.loading');
  metaLineEl.textContent = '';
  answersEl.innerHTML = '';
  setStatus(t('trivia.loading'));
  setSetupLocked(true);
  setAnswerButtonsLocked(true);

  try {
    await ensureQueue(INITIAL_BUFFER, thisRound);
    if (roundId !== thisRound) return;
    emptyState = '';
    promoteNextQuestion();
    ensureQueue(currentBufferTarget(), thisRound);
  } catch (err) {
    if (roundId !== thisRound) return;
    emptyState = 'error';
    questionEl.textContent = t('trivia.error_title');
    metaLineEl.textContent = '';
    answersEl.innerHTML = '';
    setStatus(t('trivia.error_body'), 'bad');
  } finally {
    if (roundId === thisRound) {
      isLoadingRound = false;
      setSetupLocked(false);
      setAnswerButtonsLocked(false);
      updateSourcePill();
      updateTranslationPill();
    }
  }
}

function onLangChange() {
  languageSelect.value = document.documentElement.lang === 'he' ? 'he' : 'en';
  renderCategories();
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  updateSourcePill();
  updateTranslationPill();

  if (activeLang() === 'he') {
    if (currentQuestion) ensureQuestionTranslation(currentQuestion, 'he').then(() => {
      if (currentQuestion && !answered) rerenderUnansweredQuestion();
    }).catch(() => {});
    queue.forEach(item => {
      ensureQuestionTranslation(item, 'he').catch(() => {});
    });
  }

  if (emptyState === 'error') {
    questionEl.textContent = t('trivia.error_title');
    setStatus(t('trivia.error_body'), 'bad');
    return;
  }

  if (isLoadingRound && !currentQuestion) {
    questionEl.textContent = t('trivia.loading');
    setStatus(t('trivia.loading'));
    return;
  }

  if (!currentQuestion) {
    questionEl.textContent = t('trivia.loading_next');
    setStatus(t('trivia.loading_next'));
    return;
  }

  if (currentQuestion && !answered) rerenderUnansweredQuestion();
  else if (currentQuestion) questionEl.textContent = displayText(currentQuestion).question;
  updateMetaLine();
  if (!answered) {
    if (activeLang() === 'he') {
      if (currentQuestion.translations.he) {
        if (isRefilling) setStatus(t('trivia.prefetching_hebrew', { n: queue.length }));
        else setStatus(t('trivia.machine_hebrew'));
      } else if (currentQuestion.translationState === 'failed') {
        setStatus(t('trivia.translate_failed'));
      } else {
        setStatus(t('trivia.translating_now'));
      }
    } else if (isRefilling) {
      setStatus(t('trivia.prefetching', { n: queue.length }));
    } else {
      setStatus(t('trivia.english_note'));
    }
  }
}

btnNewSet.addEventListener('click', startNewSet);
btnNext.addEventListener('click', goNext);
languageSelect.addEventListener('change', () => applyLang(languageSelect.value));
difficultySelect.addEventListener('change', startNewSet);
categorySelect.addEventListener('change', startNewSet);

document.addEventListener('DOMContentLoaded', async () => {
  languageSelect.value = document.documentElement.lang === 'he' ? 'he' : 'en';
  await loadCategories();
  await startNewSet();
});
