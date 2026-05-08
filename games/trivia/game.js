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

const QUESTION_COUNT = 10;
let token = '';
let categories = [];
let questions = [];
let currentIndex = 0;
let score = 0;
let answered = false;
let emptyState = 'loading';

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

function setLoadingState(isLoading) {
  btnNewSet.disabled = isLoading;
  difficultySelect.disabled = isLoading;
  categorySelect.disabled = isLoading;
  btnNext.disabled = isLoading;
  answersEl.querySelectorAll('button').forEach(button => {
    button.disabled = isLoading || answered;
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

async function fetchQuestions(retryCount) {
  const params = new URLSearchParams({
    amount: String(QUESTION_COUNT),
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
    return fetchQuestions(retryCount + 1);
  }

  if (data.response_code === 4 && retryCount < 1) {
    await resetToken();
    return fetchQuestions(retryCount + 1);
  }

  if (data.response_code !== 0 || !Array.isArray(data.results) || !data.results.length) {
    throw new Error('Trivia fetch failed');
  }

  return mapQuestions(data.results);
}

function renderQuestion() {
  const item = questions[currentIndex];
  answered = false;
  btnNext.hidden = true;
  btnNext.disabled = false;

  if (!item) {
    questionEl.textContent = t('trivia.done_title');
    metaLineEl.textContent = t('trivia.complete', { score, total: questions.length });
    answersEl.innerHTML = '';
    questionNumberEl.textContent = `${questions.length}/${questions.length}`;
    difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
    setStatus(t('trivia.done_status', { score, total: questions.length }), 'good');
    return;
  }

  questionEl.textContent = item.question;
  metaLineEl.textContent = t('trivia.meta', {
    current: currentIndex + 1,
    total: questions.length,
    category: item.category,
    difficulty: difficultyLabel(item.difficulty)
  });
  questionNumberEl.textContent = `${currentIndex + 1}/${questions.length}`;
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  answersEl.innerHTML = '';

  item.answers.forEach(answer => {
    const button = document.createElement('button');
    button.className = 'answer-btn';
    button.type = 'button';
    button.textContent = answer;
    button.addEventListener('click', () => submitAnswer(answer, button));
    answersEl.appendChild(button);
  });

  setStatus(t('trivia.english_note'));
}

function submitAnswer(answer, buttonEl) {
  if (answered) return;
  answered = true;

  const item = questions[currentIndex];
  const isCorrect = answer === item.correctAnswer;
  if (isCorrect) {
    score += 1;
    scoreEl.textContent = String(score);
    buttonEl.classList.add('correct');
    setStatus(t('trivia.correct'), 'good');
  } else {
    buttonEl.classList.add('wrong');
    answersEl.querySelectorAll('button').forEach(button => {
      if (button.textContent === item.correctAnswer) button.classList.add('correct');
    });
    setStatus(t('trivia.wrong', { answer: item.correctAnswer }), 'bad');
  }

  answersEl.querySelectorAll('button').forEach(button => {
    button.disabled = true;
  });
  btnNext.hidden = false;
}

function goNext() {
  if (!answered && currentIndex < questions.length) return;
  currentIndex += 1;
  if (currentIndex >= questions.length) {
    renderQuestion();
    btnNext.hidden = true;
    return;
  }
  renderQuestion();
}

async function startNewSet() {
  setLoadingState(true);
  score = 0;
  currentIndex = 0;
  answered = false;
  emptyState = 'loading';
  scoreEl.textContent = '0';
  questionNumberEl.textContent = `0/${QUESTION_COUNT}`;
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);
  questionEl.textContent = t('trivia.loading');
  metaLineEl.textContent = '';
  answersEl.innerHTML = '';
  setStatus(t('trivia.loading'));

  try {
    questions = await fetchQuestions(0);
    emptyState = '';
    renderQuestion();
  } catch (err) {
    questions = [];
    emptyState = 'error';
    questionEl.textContent = t('trivia.error_title');
    metaLineEl.textContent = '';
    answersEl.innerHTML = '';
    setStatus(t('trivia.error_body'), 'bad');
  } finally {
    setLoadingState(false);
  }
}

function onLangChange() {
  languageSelect.value = document.documentElement.lang === 'he' ? 'he' : 'en';
  renderCategories();
  difficultyPillEl.textContent = difficultyLabel(difficultySelect.value);

  if (!questions.length) {
    if (emptyState === 'error') {
      questionEl.textContent = t('trivia.error_title');
      setStatus(t('trivia.error_body'), 'bad');
    } else {
      questionEl.textContent = t('trivia.loading');
      setStatus(t('trivia.loading'));
    }
    return;
  }

  const item = questions[currentIndex];
  if (!item) {
    questionEl.textContent = t('trivia.done_title');
    metaLineEl.textContent = t('trivia.complete', { score, total: questions.length });
    setStatus(t('trivia.done_status', { score, total: questions.length }), 'good');
    return;
  }

  metaLineEl.textContent = t('trivia.meta', {
    current: currentIndex + 1,
    total: questions.length,
    category: item.category,
    difficulty: difficultyLabel(item.difficulty)
  });

  if (!answered) {
    setStatus(t('trivia.english_note'));
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
