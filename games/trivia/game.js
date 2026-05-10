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

const QUESTION_COUNT = 10;
const INITIAL_BUFFER = 5;
const MAX_BUFFER = 10;
const FAST_ANSWER_MS = 1000;
const SLOW_ANSWER_MS = 5000;

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

function setStatus(message, kind) {
  statusEl.textContent = message;
  statusEl.className = kind || '';
}

function updateSourcePill() {
  sourcePillEl.textContent = t('trivia.buffer_short', { n: queue.length });
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
      answers
    };
  });
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
  const current = currentQuestion ? 1 : 0;
  return Math.max(0, QUESTION_COUNT - askedCount - queue.length - current);
}

function currentBufferTarget() {
  return Math.min(MAX_BUFFER, INITIAL_BUFFER + Math.max(0, currentRefillStep - 1));
}

function updateMetaLine() {
  if (!currentQuestion) {
    metaLineEl.textContent = '';
    return;
  }

  metaLineEl.textContent = t('trivia.meta', {
    current: askedCount,
    total: QUESTION_COUNT,
    category: currentQuestion.category,
    difficulty: difficultyLabel(currentQuestion.difficulty)
  });
}

function renderQuestion() {
  answered = false;
  btnNext.hidden = true;
  btnNext.disabled = false;

  if (!currentQuestion) {
    questionEl.textContent = t('trivia.done_title');
    metaLineEl.textContent = t('trivia.complete', { score, total: QUESTION_COUNT });
    answersEl.innerHTML = '';
    questionNumberEl.textContent = `${QUESTION_COUNT}/${QUESTION_COUNT}`;
    difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
    updateSourcePill();
    setStatus(t('trivia.done_status', { score, total: QUESTION_COUNT }), 'good');
    return;
  }

  questionEl.textContent = currentQuestion.question;
  updateMetaLine();
  questionNumberEl.textContent = `${askedCount}/${QUESTION_COUNT}`;
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  answersEl.innerHTML = '';

  currentQuestion.answers.forEach(answer => {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.type = 'button';
    button.textContent = answer;
    button.addEventListener('click', () => submitAnswer(answer, button));
    answersEl.appendChild(button);
  });

  answerStartedAt = Date.now();
  updateSourcePill();
  if (isRefilling) {
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
  if (!currentQuestion && !isLoadingRound && !queue.length && askedCount >= QUESTION_COUNT) return;

  isRefilling = true;
  updateSourcePill();
  if (currentQuestion && !answered) {
    setStatus(t('trivia.prefetching', { n: queue.length }));
  }

  try {
    while (roundId === sourceRoundId) {
      const missingToTarget = targetFill - queue.length;
      const remaining = remainingSlots();
      const need = Math.min(missingToTarget, remaining);
      if (need <= 0) break;
      const batch = await fetchBatch(need, 0);
      if (roundId !== sourceRoundId) return;
      queue.push(...batch.slice(0, need));
      updateSourcePill();
      if (!currentQuestion && !isLoadingRound && askedCount < QUESTION_COUNT && queue.length) {
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
      if (currentQuestion && !answered) setStatus(t('trivia.english_note'));
    }
  }
}

function promoteNextQuestion() {
  if (askedCount >= QUESTION_COUNT) {
    currentQuestion = null;
    renderQuestion();
    return;
  }

  currentQuestion = queue.shift() || null;
  if (!currentQuestion) {
    questionEl.textContent = t('trivia.loading_next');
    metaLineEl.textContent = '';
    answersEl.innerHTML = '';
    questionNumberEl.textContent = `${Math.min(askedCount + 1, QUESTION_COUNT)}/${QUESTION_COUNT}`;
    updateSourcePill();
    setStatus(t('trivia.loading_next'));
    return;
  }

  askedCount += 1;
  renderQuestion();
}

function submitAnswer(answer, buttonEl) {
  if (answered || !currentQuestion) return;
  answered = true;

  const responseMs = Date.now() - answerStartedAt;
  currentRefillStep = refillStepForDuration(responseMs);
  const isCorrect = answer === currentQuestion.correctAnswer;

  if (isCorrect) {
    score += 1;
    scoreEl.textContent = String(score);
    buttonEl.classList.add('correct');
    setStatus(t('trivia.correct'), 'good');
  } else {
    buttonEl.classList.add('wrong');
    answersEl.querySelectorAll('button').forEach(button => {
      if (button.textContent === currentQuestion.correctAnswer) button.classList.add('correct');
    });
    setStatus(t('trivia.wrong', { answer: currentQuestion.correctAnswer }), 'bad');
  }

  answersEl.querySelectorAll('button').forEach(button => {
    button.disabled = true;
  });

  updateSourcePill();
  btnNext.hidden = false;

  if (askedCount < QUESTION_COUNT) {
    ensureQueue(currentBufferTarget(), roundId);
  }
}

function goNext() {
  if (!answered && askedCount <= QUESTION_COUNT) return;
  currentQuestion = null;
  promoteNextQuestion();
  if (currentQuestion && askedCount < QUESTION_COUNT) {
    ensureQueue(currentBufferTarget(), roundId);
  }
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
  questionNumberEl.textContent = `0/${QUESTION_COUNT}`;
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  updateSourcePill();
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
    }
  }
}

function onLangChange() {
  languageSelect.value = document.documentElement.lang === 'he' ? 'he' : 'en';
  renderCategories();
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  updateSourcePill();

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

  if (!currentQuestion && askedCount >= QUESTION_COUNT) {
    questionEl.textContent = t('trivia.done_title');
    metaLineEl.textContent = t('trivia.complete', { score, total: QUESTION_COUNT });
    setStatus(t('trivia.done_status', { score, total: QUESTION_COUNT }), 'good');
    return;
  }

  if (!currentQuestion) {
    questionEl.textContent = t('trivia.loading_next');
    setStatus(t('trivia.loading_next'));
    return;
  }

  updateMetaLine();
  if (!answered) {
    if (isRefilling) setStatus(t('trivia.prefetching', { n: queue.length }));
    else setStatus(t('trivia.english_note'));
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
