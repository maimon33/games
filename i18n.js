(function () {
  var T = {
    en: {
      'nav.back': '← Back',
      'btn.light': 'Light', 'btn.dark': 'Dark',
      'hub.tagline': 'Think. Solve. Play.',
      'hub.meta': ' games · pure browser · no login',
      'filter.all': 'All', 'filter.logic': 'Logic', 'filter.puzzle': 'Puzzle',
      'filter.arcade': 'Arcade', 'filter.word': 'Word',
      'filter.spatial': 'Spatial', 'filter.deduction': 'Deduction',
      'tag.logic': 'logic', 'tag.puzzle': 'puzzle', 'tag.arcade': 'arcade',
      'tag.word': 'word', 'tag.spatial': 'spatial', 'tag.deduction': 'deduction',
      'badge.new': 'New',
      'game.maze': 'Maze', 'game.sudoku': 'Sudoku', 'game.minesweeper': 'Minesweeper',
      'game.2048': '2048', 'game.sokoban': 'Sokoban', 'game.nonogram': 'Nonogram',
      'game.lights-out': 'Lights Out', 'game.fifteen': '15 Puzzle', 'game.wordle': 'Wordle',
      'game.traffic-jam': 'Traffic Jam', 'game.connect-dots': 'Connect Dots',
      'game.pong': 'Pong', 'game.tank': 'Tank',
      'desc.maze': 'Navigate through a randomly generated maze. New layout every run.',
      'desc.sudoku': 'Fill the 9×9 grid so every row, column, and box contains 1–9.',
      'desc.minesweeper': 'Uncover all safe cells without triggering a mine.',
      'desc.2048': 'Slide tiles and merge matching numbers to reach 2048.',
      'desc.sokoban': 'Push every crate onto its target. Think before you move.',
      'desc.nonogram': 'Use row and column number clues to reveal a hidden pixel picture.',
      'desc.lights-out': 'Toggle cells to turn every light off. Each click flips its neighbors too.',
      'desc.fifteen': 'Slide tiles into order from 1 to 15. Classic sliding tile challenge.',
      'desc.wordle': 'Guess the 5-letter word in 6 tries. Green means right place, yellow means right letter.',
      'desc.traffic-jam': 'Slide cars out of the way to free the red car. Rush Hour–style puzzle.',
      'desc.connect-dots': 'Draw paths to connect matching colored dots. Fill every cell on the board.',
      'desc.pong': 'Classic paddle game. Beat the AI to 7 points. Three difficulty levels.',
      'desc.tank': 'Drive your tank and destroy all enemies. Arrow keys to move, Space to shoot.',
      'btn.new_game': 'New Game', 'btn.new_maze': 'New Maze', 'btn.new_word': 'New Word',
      'btn.restart': 'Restart', 'btn.reset': 'Reset', 'btn.start': 'Start',
      'btn.play_again': 'Play Again', 'btn.undo': 'Undo', 'btn.check': 'Check',
      'btn.reveal': 'Reveal', 'btn.prev': '◀ Prev', 'btn.next': 'Next ▶',
      'btn.diff_easy': 'Easy', 'btn.diff_medium': 'Medium', 'btn.diff_hard': 'Hard',
      'btn.ai_easy': 'AI: Easy', 'btn.ai_medium': 'AI: Medium', 'btn.ai_hard': 'AI: Hard',
      'maze.size_small': 'Size: Small', 'maze.size_medium': 'Size: Medium', 'maze.size_large': 'Size: Large',
      'lo.size_4': 'Size: 4×4', 'lo.size_5': 'Size: 5×5', 'lo.size_6': 'Size: 6×6', 'lo.size_7': 'Size: 7×7',
      'hint.maze': 'Arrow keys or swipe to move',
      'hint.minesweeper': 'Tap to reveal · Long-press or right-click to flag',
      'hint.2048': 'Arrow keys or swipe to slide',
      'hint.sokoban': 'Arrow keys or swipe to move',
      'hint.nonogram': 'Tap to fill · Right-click or long-press to mark ✕',
      'hint.fifteen': 'Tap a tile adjacent to the gap · Arrow keys also work',
      'hint.traffic-jam': 'Click a car then click direction to slide it',
      'hint.connect-dots': 'Drag from a dot to connect matching colors — fill every cell',
      'hint.pong': 'Mouse / touch to move paddle • First to 7 wins',
      'hint.tank': 'Arrow keys + Space to shoot • Destroy all enemies',
      'status.level': 'Level {n}',
      'status.solved': 'Solved!', 'status.cleared': 'Cleared!',
      'status.win': 'You win!', 'status.lose_ai': 'AI wins!',
      'status.reached_2048': 'You reached 2048!', 'status.game_over': 'Game Over',
      'status.no_errors': 'No errors!', 'status.mine_hit': '💥 Mine hit! Game over.',
      'status.all_out': 'All out in {n} move{s}!',
      'status.solved_moves': 'Solved in {n} moves!',
      'status.level_complete': 'Level {n} complete! ({m} moves)',
      'status.level_cleared_next': 'Level cleared! ▶ Next',
      'status.all_levels': 'All levels complete!',
      'status.tank_destroyed': 'You were destroyed!',
      'status.nonogram_solved': '"{name}" solved!',
      'wordle.genius': 'Genius!', 'wordle.magnificent': 'Magnificent!',
      'wordle.impressive': 'Impressive!', 'wordle.splendid': 'Splendid!',
      'wordle.great': 'Great!', 'wordle.phew': 'Phew!', 'wordle.nice': 'Nice!',
      'help.how_to_play': 'How to Play',
      'help.maze.1': 'You start at the <strong>green</strong> cell. Find your way to the <strong>red</strong> exit.',
      'help.maze.2': 'Use <strong>arrow keys</strong> or <strong>swipe</strong> to move through corridors.',
      'help.maze.3': 'Reach the exit to win. Pick a bigger size for more challenge!',
      'help.sudoku.1': 'Click any <strong>empty cell</strong> to select it.',
      'help.sudoku.2': 'Press a <strong>number key 1–9</strong> to fill the cell. Press Delete or 0 to erase.',
      'help.sudoku.3': 'Each <strong>row, column, and 3×3 box</strong> must contain every number 1–9 exactly once.',
      'help.minesweeper.1': 'Click any cell to <strong>reveal</strong> it. The first click is always safe.',
      'help.minesweeper.2': 'Numbers show how many <strong>mines</strong> are in the 8 surrounding cells.',
      'help.minesweeper.3': '<strong>Long-press</strong> or right-click to flag a suspected mine. Clear every safe cell to win!',
      'help.2048.1': 'Use <strong>arrow keys</strong> or <strong>swipe</strong> to slide all tiles in one direction.',
      'help.2048.2': 'When two tiles with the <strong>same number</strong> collide, they merge and double.',
      'help.2048.3': 'Keep merging until you reach the <strong>2048</strong> tile to win!',
      'help.sokoban.1': 'Push every <strong>crate</strong> (📦) onto a <strong>target</strong> (●). Walk into a crate to push it.',
      'help.sokoban.2': 'You can only <strong>push</strong>, never pull — plan your route carefully.',
      'help.sokoban.3': 'Stuck? Use <strong>Undo</strong> to take back a move, or <strong>Restart</strong> to start over.',
      'help.nonogram.1': 'Click to <strong>fill</strong> a cell. Right-click or long-press to mark with ✕.',
      'help.nonogram.2': 'The <strong>numbers</strong> show groups of consecutive filled cells, in order left-to-right / top-to-bottom.',
      'help.nonogram.3': 'Fill all correct cells to reveal the <strong>hidden pixel picture</strong>.',
      'help.lights.1': 'Click any cell to <strong>toggle</strong> it. Each click also flips the 4 adjacent cells.',
      'help.lights.2': 'The goal is to turn <strong>all lights off</strong> — all cells dark.',
      'help.lights.3': 'Work from the <strong>corners inward</strong> to isolate your moves.',
      'help.fifteen.1': 'Only tiles <strong>adjacent to the blank</strong> space can slide into it.',
      'help.fifteen.2': '<strong>Tap</strong> a tile or use <strong>arrow keys</strong> to slide it toward the gap.',
      'help.fifteen.3': 'Arrange all tiles <strong>1–15</strong> in order, blank in the bottom-right corner.',
      'help.wordle.1': 'Type any <strong>5-letter word</strong> and press Enter to guess.',
      'help.wordle.2': '🟩 <strong>Green</strong> = right letter, right place. 🟨 <strong>Yellow</strong> = right letter, wrong place. ⬛ Gray = not in the word.',
      'help.wordle.3': 'You have <strong>6 guesses</strong>. Use the color hints to narrow it down!',
      'help.traffic.1': 'Click a car to <strong>select</strong> it (it highlights). Cars only move in their own direction.',
      'help.traffic.2': 'Click the destination or drag to <strong>slide</strong> the car as far as allowed.',
      'help.traffic.3': 'Clear the path so the <strong>★ red car</strong> can exit from the right side.',
      'help.connect.1': '<strong>Drag</strong> from a colored dot to connect it to its matching pair.',
      'help.connect.2': "Paths can't cross. Dragging over an existing path clears it.",
      'help.connect.3': 'Win when every color is connected <strong>and every cell is filled</strong>.',
      'help.pong.1': 'Move your <strong>left paddle</strong> with the mouse or by dragging on mobile.',
      'help.pong.2': "Deflect the ball past the AI's paddle to <strong>score a point</strong>.",
      'help.pong.3': 'First to <strong>7 points</strong> wins. Ball angle changes based on where it hits the paddle.',
      'help.tank.1': 'Use <strong>arrow keys</strong> to drive your tank. On mobile, use the <strong>D-pad</strong> buttons.',
      'help.tank.2': 'Press <strong>Space</strong> (or the center fire button) to shoot in the direction you\'re facing.',
      'help.tank.3': '<strong>Destroy all enemy tanks</strong> to clear the level. Watch out — they shoot back!',
    },
    he: {
      'nav.back': '← חזור',
      'btn.light': 'בהיר', 'btn.dark': 'כהה',
      'hub.tagline': 'חשוב. פתור. שחק.',
      'hub.meta': ' משחקים · רק בדפדפן · ללא התחברות',
      'filter.all': 'הכל', 'filter.logic': 'לוגיקה', 'filter.puzzle': 'פאזל',
      'filter.arcade': 'ארקייד', 'filter.word': 'מילים',
      'filter.spatial': 'מרחבי', 'filter.deduction': 'ניכוי',
      'tag.logic': 'לוגיקה', 'tag.puzzle': 'פאזל', 'tag.arcade': 'ארקייד',
      'tag.word': 'מילים', 'tag.spatial': 'מרחבי', 'tag.deduction': 'ניכוי',
      'badge.new': 'חדש',
      'game.maze': 'מבוך', 'game.sudoku': 'סודוקו', 'game.minesweeper': 'שדה מוקשים',
      'game.2048': '2048', 'game.sokoban': 'סוקובאן', 'game.nonogram': 'נונוגרם',
      'game.lights-out': 'כיבוי אורות', 'game.fifteen': 'פאזל 15', 'game.wordle': 'וורדל',
      'game.traffic-jam': 'פקק תנועה', 'game.connect-dots': 'חיבור נקודות',
      'game.pong': 'פונג', 'game.tank': 'טנק',
      'desc.maze': 'נווט דרך מבוך שנוצר באקראי. פריסה חדשה בכל פעם.',
      'desc.sudoku': 'מלא את הרשת 9×9 כך שכל שורה, עמודה ותיבה מכילים 1–9.',
      'desc.minesweeper': 'גלה את כל התאים הבטוחים מבלי לפוצץ מוקש.',
      'desc.2048': 'החלק אריחים ומזג מספרים זהים להגעה ל-2048.',
      'desc.sokoban': 'דחוף כל ארגז למקומו. חשוב לפני שתזוז.',
      'desc.nonogram': 'השתמש ברמזי שורות ועמודות לחשיפת תמונת פיקסל נסתרת.',
      'desc.lights-out': 'לחץ על תאים לכיבוי כל האורות. כל לחיצה גם הופכת את השכנים.',
      'desc.fifteen': 'החלק אריחים לסדר 1 עד 15. אתגר קלאסי.',
      'desc.wordle': 'נחש את המילה בת 5 האותיות ב-6 ניסיונות. ירוק = מיקום נכון, צהוב = אות נכונה.',
      'desc.traffic-jam': 'הזז מכוניות כדי לפנות דרך למכונית האדומה. פאזל בסגנון Rush Hour.',
      'desc.connect-dots': 'צייר נתיבים לחיבור נקודות צבעוניות זהות. מלא את כל הלוח.',
      'desc.pong': 'משחק מחבט קלאסי. נצח את הבינה ל-7 נקודות. שלוש רמות קושי.',
      'desc.tank': 'נהג בטנק והשמד את כל האויבים. חצים לנסיעה, רווח לירייה.',
      'btn.new_game': 'משחק חדש', 'btn.new_maze': 'מבוך חדש', 'btn.new_word': 'מילה חדשה',
      'btn.restart': 'התחל מחדש', 'btn.reset': 'אפס', 'btn.start': 'התחל',
      'btn.play_again': 'שחק שוב', 'btn.undo': 'בטל', 'btn.check': 'בדוק',
      'btn.reveal': 'חשוף', 'btn.prev': '◀ קודם', 'btn.next': 'הבא ▶',
      'btn.diff_easy': 'קל', 'btn.diff_medium': 'בינוני', 'btn.diff_hard': 'קשה',
      'btn.ai_easy': 'בינה: קל', 'btn.ai_medium': 'בינה: בינוני', 'btn.ai_hard': 'בינה: קשה',
      'maze.size_small': 'גודל: קטן', 'maze.size_medium': 'גודל: בינוני', 'maze.size_large': 'גודל: גדול',
      'lo.size_4': 'גודל: 4×4', 'lo.size_5': 'גודל: 5×5', 'lo.size_6': 'גודל: 6×6', 'lo.size_7': 'גודל: 7×7',
      'hint.maze': 'חצים או החלקה לניווט',
      'hint.minesweeper': 'הקש לחשיפה · לחיצה ארוכה לסימון',
      'hint.2048': 'חצים או החלקה להזזה',
      'hint.sokoban': 'חצים או החלקה לתזוזה',
      'hint.nonogram': 'הקש למילוי · לחיצה ארוכה לסימון ✕',
      'hint.fifteen': 'הקש על אריח סמוך לחלל · גם חצים עובדים',
      'hint.traffic-jam': 'לחץ על מכונית ואז לחץ לכיוון ההחלקה',
      'hint.connect-dots': 'גרור מנקודה לחיבור צבעים זהים — מלא את כל התאים',
      'hint.pong': 'עכבר / מגע לתזוזת המחבט • ראשון ל-7 מנצח',
      'hint.tank': 'חצים + רווח לירייה • השמד את כל האויבים',
      'status.level': 'שלב {n}',
      'status.solved': 'פתרת!', 'status.cleared': 'נקית!',
      'status.win': 'ניצחת!', 'status.lose_ai': 'הבינה ניצחה!',
      'status.reached_2048': 'הגעת ל-2048!', 'status.game_over': 'המשחק נגמר',
      'status.no_errors': 'אין שגיאות!', 'status.mine_hit': '💥 פגעת במוקש! המשחק נגמר.',
      'status.all_out': 'הכל כבוי ב-{n} מהלכים!',
      'status.solved_moves': 'פתרת ב-{n} מהלכים!',
      'status.level_complete': 'שלב {n} הושלם! ({m} מהלכים)',
      'status.level_cleared_next': 'שלב הושלם! ▶ הבא',
      'status.all_levels': 'כל השלבים הושלמו!',
      'status.tank_destroyed': 'הטנק שלך הושמד!',
      'status.nonogram_solved': '"{name}" נפתר!',
      'wordle.genius': 'גאוני!', 'wordle.magnificent': 'מרשים!',
      'wordle.impressive': 'מדהים!', 'wordle.splendid': 'נפלא!',
      'wordle.great': 'כל הכבוד!', 'wordle.phew': 'אוף!', 'wordle.nice': 'יפה!',
      'help.how_to_play': 'איך משחקים',
      'help.maze.1': 'אתה מתחיל בתא ה<strong>ירוק</strong>. מצא את דרכך אל היציאה ה<strong>אדומה</strong>.',
      'help.maze.2': 'השתמש ב<strong>מקשי חץ</strong> או <strong>החלקה</strong> לניווט.',
      'help.maze.3': 'הגע ליציאה כדי לנצח. בחר גודל גדול לאתגר גדול יותר!',
      'help.sudoku.1': 'לחץ על <strong>תא ריק</strong> כדי לבחור אותו.',
      'help.sudoku.2': 'הקש <strong>מספר 1–9</strong> למילוי. הקש Delete או 0 למחיקה.',
      'help.sudoku.3': 'כל <strong>שורה, עמודה ותיבת 3×3</strong> חייבת להכיל כל מספר מ-1 עד 9 בדיוק פעם אחת.',
      'help.minesweeper.1': 'לחץ על תא כדי <strong>לחשוף</strong> אותו. הלחיצה הראשונה תמיד בטוחה.',
      'help.minesweeper.2': 'מספרים מראים כמה <strong>מוקשים</strong> יש ב-8 התאים הסמוכים.',
      'help.minesweeper.3': '<strong>לחיצה ארוכה</strong> או קליק ימני לסימון מוקש חשוד. גלה כל התאים הבטוחים לניצחון!',
      'help.2048.1': 'השתמש ב<strong>מקשי חץ</strong> או <strong>החלקה</strong> להזזת האריחים.',
      'help.2048.2': 'כששני אריחים עם <strong>אותו מספר</strong> מתנגשים, הם מתמזגים ומכפילים.',
      'help.2048.3': 'המשך למזג עד שתגיע לאריח <strong>2048</strong> לניצחון!',
      'help.sokoban.1': 'דחוף כל <strong>ארגז</strong> (📦) לתוך <strong>יעד</strong> (●). הלך לתוך ארגז לדחיפה.',
      'help.sokoban.2': 'ניתן רק <strong>לדחוף</strong>, לא למשוך — תכנן את המסלול בקפידה.',
      'help.sokoban.3': 'תקוע? השתמש ב<strong>בטל</strong> לחזרת מהלך, או <strong>התחל מחדש</strong>.',
      'help.nonogram.1': 'לחץ <strong>למילוי</strong> תא. לחיצה ימנית או ארוכה לסימון ✕.',
      'help.nonogram.2': 'ה<strong>מספרים</strong> מציינים קבוצות של תאים רצופים ממולאים, לפי הסדר.',
      'help.nonogram.3': 'מלא את כל התאים הנכונים לחשיפת <strong>תמונת הפיקסל הנסתרת</strong>.',
      'help.lights.1': 'לחץ על תא <strong>להפוך</strong> אותו. כל לחיצה גם הופכת את 4 השכנים.',
      'help.lights.2': 'המטרה היא לכבות <strong>את כל האורות</strong> — כל התאים כהים.',
      'help.lights.3': 'עבוד מה<strong>פינות פנימה</strong> לבידוד המהלכים.',
      'help.fifteen.1': 'רק אריחים <strong>הסמוכים לחלל הריק</strong> יכולים להחליק אליו.',
      'help.fifteen.2': '<strong>הקש</strong> על אריח או השתמש ב<strong>מקשי חץ</strong> להחלקה לעבר החלל.',
      'help.fifteen.3': 'סדר את כל האריחים <strong>1–15</strong> לפי הסדר, חלל ריק בפינה הימנית התחתונה.',
      'help.wordle.1': 'הקלד כל <strong>מילה בת 5 אותיות</strong> ולחץ Enter לניחוש.',
      'help.wordle.2': '🟩 <strong>ירוק</strong> = אות נכונה, מיקום נכון. 🟨 <strong>צהוב</strong> = אות נכונה, מיקום שגוי. ⬛ אפור = לא במילה.',
      'help.wordle.3': 'יש לך <strong>6 ניסיונות</strong>. השתמש ברמזי הצבע לצמצום האפשרויות!',
      'help.traffic.1': 'לחץ על מכונית <strong>לבחירתה</strong> (תסומן). מכוניות נעות רק בכיוון שלהן.',
      'help.traffic.2': 'לחץ על היעד או גרור כדי <strong>להחליק</strong> את המכונית עד כמה שניתן.',
      'help.traffic.3': 'פנה את הדרך כדי שה<strong>מכונית האדומה ★</strong> תוכל לצאת מהצד הימני.',
      'help.connect.1': '<strong>גרור</strong> מנקודה צבעונית לחיבורה עם הזוגית שלה.',
      'help.connect.2': 'נתיבים לא יכולים להצטלב. גרירה על נתיב קיים מוחקת אותו.',
      'help.connect.3': 'מנצחים כשכל הצבעים מחוברים <strong>וכל התאים ממולאים</strong>.',
      'help.pong.1': 'הזז את <strong>המחבט השמאלי</strong> עם העכבר או גע ב-מסך וגרור.',
      'help.pong.2': 'הסט את הכדור לעבר מחבט הבינה כדי <strong>לנקוד</strong>.',
      'help.pong.3': 'ראשון ל-<strong>7 נקודות</strong> מנצח. זווית הכדור תלויה היכן הוא פוגע במחבט.',
      'help.tank.1': 'השתמש ב<strong>מקשי חץ</strong> לנהיגה. במובייל השתמש בלחצני <strong>D-pad</strong>.',
      'help.tank.2': 'הקש <strong>רווח</strong> (או כפתור הירייה) לירייה בכיוון שאתה פונה.',
      'help.tank.3': '<strong>השמד את כל טנקי האויב</strong> לניקוי השלב. היזהר — הם ירים בחזרה!',
    }
  };

  var lang = localStorage.getItem('lang') || 'en';

  // Apply dir + lang to <html> immediately (no DOMContentLoaded needed)
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');

  function t(key, vars) {
    var s = (T[lang] || T.en)[key] || T.en[key] || key;
    if (vars) Object.keys(vars).forEach(function(k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  function applyLang(l) {
    lang = l;
    localStorage.setItem('lang', l);
    document.documentElement.setAttribute('lang', l);
    document.documentElement.setAttribute('dir', l === 'he' ? 'rtl' : 'ltr');
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var k = el.dataset.i18n, v = (T[l] || T.en)[k] || T.en[k];
      if (v !== undefined) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach(function(el) {
      var k = el.dataset.i18nHtml, v = (T[l] || T.en)[k] || T.en[k];
      if (v !== undefined) el.innerHTML = v;
    });
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.textContent = l === 'he' ? 'EN' : 'עב';
    });
    // Re-sync theme buttons
    var theme = document.documentElement.getAttribute('data-theme') || 'dark';
    document.querySelectorAll('.theme-btn[onclick="toggleTheme()"]').forEach(function(b) {
      b.textContent = t(theme === 'dark' ? 'btn.light' : 'btn.dark');
    });
    if (typeof onLangChange === 'function') onLangChange();
  }

  function toggleLang() { applyLang(lang === 'en' ? 'he' : 'en'); }

  document.addEventListener('DOMContentLoaded', function() {
    // Set lang button labels
    document.querySelectorAll('.lang-btn').forEach(function(b) {
      b.textContent = lang === 'he' ? 'EN' : 'עב';
    });
    // Apply translations if non-default
    if (lang !== 'en') applyLang(lang);
  });

  window.t = t;
  window.toggleLang = toggleLang;
  window.applyLang = applyLang;
})();
