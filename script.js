/* ========================================================
   === BLOCCO 1: STATO DELL'APPLICAZIONE (APPLICATION STATE) ===
   ======================================================== */
// Helper per ottenere la data odierna in formato YYYY-MM-DD
function getTodayIso() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

const currentTodayIso = getTodayIso();

// Dati iniziali degli obiettivi del giorno
const defaultGoals = [
  { id: 1, text: "5 minuti di respirazione consapevole alla finestra", completed: true, completedTime: "09:15" },
  { id: 2, text: "Bere una tisana calda lontano dallo schermo", completed: false, completedTime: null },
  { id: 3, text: "Scrivere tre cose semplici per cui provo gratitudine", completed: false, completedTime: null },
  { id: 4, text: "Una breve passeggiata di 15 minuti all'aria aperta", completed: false, completedTime: null }
];

// Dati iniziali della timeline degli appuntamenti (con data e ora)
const defaultAppointments = [
  { id: 1, date: currentTodayIso, time: "10:30", title: "Colloquio con la Dott.ssa Bianchi", note: "Supporto psicologico • Studio o da remoto", icon: "psychology" },
  { id: 2, date: currentTodayIso, time: "13:00", title: "Pausa pranzo tranquilla senza notifiche", note: "Modalità non disturbare attiva", icon: "restaurant" },
  { id: 3, date: currentTodayIso, time: "16:30", title: "Esercizio guidato di rilassamento muscolare", note: "Audio guida scaricata (20 min)", icon: "self_improvement" },
  { id: 4, date: currentTodayIso, time: "18:00", title: "Chiamata con Marco per un saluto", note: "Connessione e ascolto", icon: "phone_in_talk" }
];

// Registro cronologico degli umori
const defaultMoodHistory = [
  { mood: "felice", note: "Mi sento centrata dopo la meditazione del mattino", time: "09:00" }
];

// Registro delle cose positive (per le ore 10, 16 e 21)
const defaultPositiveThings = [
  { slotHour: 10, time: "10:00", text: "Il profumo del caffè al risveglio e qualche minuto di silenzio." }
];

// Caricamento dei dati salvati in localStorage (o fallback sui predefiniti)
let appGoals = JSON.parse(localStorage.getItem('focal_goals')) || defaultGoals;
let appAppointments = JSON.parse(localStorage.getItem('focal_appointments')) || defaultAppointments;
let appMoods = JSON.parse(localStorage.getItem('focal_moods')) || defaultMoodHistory;
let appPositiveThings = JSON.parse(localStorage.getItem('focal_positive')) || defaultPositiveThings;
let currentSelectedMood = "felice";

// Salvataggio nel browser per preservare le modifiche dell'utente
function saveStateToStorage() {
  localStorage.setItem('focal_goals', JSON.stringify(appGoals));
  localStorage.setItem('focal_appointments', JSON.stringify(appAppointments));
  localStorage.setItem('focal_moods', JSON.stringify(appMoods));
  localStorage.setItem('focal_positive', JSON.stringify(appPositiveThings));
  updateProfileStats();
}

/* ========================================================
   === BLOCCO 2: OROLOGIO E DATA IN TEMPO REALE ===
   ======================================================== */
// Funzione che aggiorna l'orario e la data in italiano
function updateClockAndDate() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const clockElement = document.getElementById('live-clock');
  const dateElement = document.getElementById('live-date');
  
  if (clockElement) {
    clockElement.textContent = hours + ":" + minutes;
  }

  // Nomi dei giorni e dei mesi in italiano
  const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
  const months = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
  
  if (dateElement) {
    dateElement.textContent = days[now.getDay()] + ", " + now.getDate() + " " + months[now.getMonth()];
  }
}

/* ========================================================
   === BLOCCO 3: GESTIONE MODALI E FINESTRE DI DIALOGO ===
   ======================================================== */
// Funzione semplice per aprire una modale tramite il suo ID
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
  }
}

// Funzione semplice per chiudere una modale tramite il suo ID
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
  }
}

// Collega tutti i pulsanti che hanno l'attributo data-close
function setupModalCloseListeners() {
  const closeButtons = document.querySelectorAll('[data-close]');
  closeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      const targetModalId = button.getAttribute('data-close');
      closeModal(targetModalId);
    });
  });

  // Chiude la modale cliccando sullo sfondo oscurato
  const overlays = document.querySelectorAll('.modal-overlay');
  overlays.forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });
  });
}

/* ========================================================
   === BLOCCO 4: CHECK-IN DELL'UMORE ===
   ======================================================== */
// Gestisce la selezione dei pulsanti umore (felice, neutro, triste)
function setupMoodSelector() {
  const moodButtons = document.querySelectorAll('.mood-pill');
  moodButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      moodButtons.forEach(function(btn) {
        btn.classList.remove('active');
      });
      button.classList.add('active');
      currentSelectedMood = button.getAttribute('data-mood');
    });
  });

  // Tasto freccia per salvare l'umore e resettare
  const saveNoteBtn = document.getElementById('save-note-btn');
  const noteInput = document.getElementById('emotion-note');
  const feedbackToast = document.getElementById('mood-feedback');

  if (saveNoteBtn && noteInput) {
    saveNoteBtn.addEventListener('click', function() {
      const noteText = noteInput.value.trim();
      const now = new Date();
      const timeString = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');

      // Registra l'umore nello storico
      appMoods.push({
        mood: currentSelectedMood,
        note: noteText.length > 0 ? noteText : "Check-in rapido senza note",
        time: timeString
      });
      saveStateToStorage();

      // Resetta la casella di testo e l'umore
      noteInput.value = "";
      noteInput.placeholder = "Cosa provi dentro di te in questo momento? Lascia fluire i pensieri...";

      // Mostra messaggio rassicurante
      if (feedbackToast) {
        feedbackToast.textContent = "Pensiero custodito con cura alle " + timeString;
        feedbackToast.classList.add('show');
        setTimeout(function() {
          feedbackToast.classList.remove('show');
        }, 3000);
      }
    });
  }
}

/* ========================================================
   === BLOCCO 5: OBIETTIVI & EFFETTO CORIANDOLI ===
   ======================================================== */
// Genera l'HTML per la lista degli obiettivi
function renderGoals() {
  const container = document.getElementById('goals-container');
  if (!container) return;
  container.innerHTML = "";

  appGoals.forEach(function(goal) {
    const row = document.createElement('div');
    row.className = "goal-row" + (goal.completed ? " completed" : "");
    row.setAttribute('data-id', goal.id);

    const circle = document.createElement('div');
    circle.className = "custom-checkbox-circle";
    circle.innerHTML = '<span class="material-symbols-outlined">check</span>';

    const contentGroup = document.createElement('div');
    contentGroup.className = "goal-content-group";

    const textSpan = document.createElement('span');
    textSpan.className = "goal-label";
    textSpan.textContent = goal.text;
    contentGroup.appendChild(textSpan);

    // Se l'obiettivo è completato, mostra l'orario di completamento
    if (goal.completed && goal.completedTime) {
      const timeSpan = document.createElement('span');
      timeSpan.className = "goal-completion-time";
      timeSpan.textContent = "✓ Completato alle " + goal.completedTime;
      contentGroup.appendChild(timeSpan);
    }

    row.appendChild(circle);
    row.appendChild(contentGroup);

    // Al click sul pallino / riga, inverte lo stato
    row.addEventListener('click', function() {
      toggleGoalStatus(goal.id);
    });

    container.appendChild(row);
  });

  updateProfileStats();
}

// Inverte lo stato dell'obiettivo (completato / non completato)
function toggleGoalStatus(goalId) {
  const now = new Date();
  const timeString = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');

  appGoals = appGoals.map(function(goal) {
    if (goal.id === goalId) {
      const newCompleted = !goal.completed;
      if (newCompleted) {
        // Se appena completato, lancia i coriandoli e salva l'ora
        triggerConfetti();
        return {
          id: goal.id,
          text: goal.text,
          completed: true,
          completedTime: timeString
        };
      } else {
        return {
          id: goal.id,
          text: goal.text,
          completed: false,
          completedTime: null
        };
      }
    }
    return goal;
  });

  saveStateToStorage();
  renderGoals();
}

// Aggiunta di un nuovo obiettivo tramite la modale
function setupGoalCreation() {
  const addGoalBtn = document.getElementById('add-goal-btn');
  const saveGoalModalBtn = document.getElementById('save-goal-modal-btn');
  const goalInputText = document.getElementById('goal-input-text');

  if (addGoalBtn) {
    addGoalBtn.addEventListener('click', function() {
      if (goalInputText) goalInputText.value = "";
      openModal('goal-modal');
    });
  }

  if (saveGoalModalBtn && goalInputText) {
    saveGoalModalBtn.addEventListener('click', function() {
      const text = goalInputText.value.trim();
      if (text.length > 0) {
        const newGoal = {
          id: Date.now(),
          text: text,
          completed: false,
          completedTime: null
        };
        appGoals.push(newGoal);
        saveStateToStorage();
        renderGoals();
        closeModal('goal-modal');
      }
    });
  }
}

// Effetto coriandoli puro Vanilla JS usando un Canvas HTML5
function triggerConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#1b6b4e', '#8ad6b3', '#336380', '#9dcced', '#f5d990', '#f8c2b5'];

  // Creazione di 65 particelle colorate
  for (let i = 0; i < 65; i++) {
    particles.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 80,
      y: canvas.height * 0.45 + (Math.random() - 0.5) * 40,
      sizeX: Math.random() * 7 + 4,
      sizeY: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 8,
      speedY: Math.random() * -7 - 3,
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 12,
      opacity: 1
    });
  }

  const startTime = Date.now();
  function drawFrame() {
    const elapsed = Date.now() - startTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.22; // forza di gravità
      p.rotation += p.rotSpeed;

      if (elapsed > 1200) {
        p.opacity -= 0.025;
      }

      if (p.opacity > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.fillRect(-p.sizeX / 2, -p.sizeY / 2, p.sizeX, p.sizeY);
        ctx.restore();
      }
    }

    if (elapsed < 2200) {
      requestAnimationFrame(drawFrame);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  drawFrame();
}

/* ========================================================
   === BLOCCO 6: APPUNTAMENTI & TIMELINE CON DATA E ORA ===
   ======================================================== */
// Trasforma una stringa orario "HH:MM" in minuti totali dalla mezzanotte
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

// Formatta il badge orario/data in modo compatto ed elegante
function formatApptBadge(dateStr, timeStr) {
  const today = getTodayIso();
  if (!dateStr || dateStr === today) {
    return timeStr;
  }
  const parts = dateStr.split('-');
  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  const day = parseInt(parts[2], 10);
  const monthName = months[parseInt(parts[1], 10) - 1] || "";
  return day + " " + monthName + " • " + timeStr;
}

// Renderizza la timeline confrontando data e ora con il momento attuale
function renderAppointments() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  // Preserva la linea di connessione verticale
  container.innerHTML = '<div class="timeline-line"></div>';

  const today = getTodayIso();

  // Ordina gli appuntamenti cronologicamente per data e ora
  appAppointments.sort(function(a, b) {
    const dateA = a.date || today;
    const dateB = b.date || today;
    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let activeFound = false;

  appAppointments.forEach(function(appt) {
    const apptDate = appt.date || today;
    const apptMinutes = timeToMinutes(appt.time);
    const item = document.createElement('div');
    item.className = "appointment-item";

    // Calcola se l'appuntamento è passato confrontando data e minuti
    let isPast = false;
    if (apptDate < today) {
      isPast = true;
    } else if (apptDate === today && apptMinutes < currentMinutes) {
      isPast = true;
    }

    // Determina lo stato visivo (passato, in arrivo/prossimo, o futuro)
    if (isPast) {
      item.classList.add('past');
    } else if (!activeFound) {
      item.classList.add('active');
      activeFound = true;
    }

    // Icona del nodo
    const node = document.createElement('div');
    node.className = "appointment-node";
    node.innerHTML = '<span class="material-symbols-outlined">' + (appt.icon || 'event') + '</span>';

    // Informazioni descrittive
    const info = document.createElement('div');
    info.className = "appointment-info";

    const titleRow = document.createElement('div');
    titleRow.className = "appointment-title-row";

    const titleSpan = document.createElement('span');
    titleSpan.className = "appointment-title";
    titleSpan.textContent = appt.title;

    const timeSpan = document.createElement('span');
    timeSpan.className = "time-badge";
    timeSpan.textContent = formatApptBadge(appt.date, appt.time);

    titleRow.appendChild(titleSpan);
    titleRow.appendChild(timeSpan);

    const desc = document.createElement('p');
    desc.className = "appointment-desc";
    desc.textContent = appt.note || "Nessun dettaglio specificato";

    info.appendChild(titleRow);
    info.appendChild(desc);

    item.appendChild(node);
    item.appendChild(info);

    container.appendChild(item);
  });
}

// Gestione aggiunta appuntamento da modale (con data e ora)
function setupAppointmentCreation() {
  const addApptBtn = document.getElementById('add-appointment-btn');
  const saveApptBtn = document.getElementById('save-appt-modal-btn');
  const titleInput = document.getElementById('appt-title-input');
  const noteInput = document.getElementById('appt-note-input');
  const dateInput = document.getElementById('appt-date-input');
  const timeInput = document.getElementById('appt-time-input');

  if (addApptBtn) {
    addApptBtn.addEventListener('click', function() {
      if (titleInput) titleInput.value = "";
      if (noteInput) noteInput.value = "";
      // Imposta come data predefinita il giorno odierno
      if (dateInput) dateInput.value = getTodayIso();
      openModal('appointment-modal');
    });
  }

  if (saveApptBtn && titleInput && timeInput) {
    saveApptBtn.addEventListener('click', function() {
      const title = titleInput.value.trim();
      const note = noteInput ? noteInput.value.trim() : "";
      const date = (dateInput && dateInput.value) ? dateInput.value : getTodayIso();
      const time = timeInput.value || "12:00";
      const icon = 'event';

      if (title.length > 0) {
        const newAppt = {
          id: Date.now(),
          date: date,
          title: title,
          note: note,
          time: time,
          icon: icon
        };
        appAppointments.push(newAppt);
        saveStateToStorage();
        renderAppointments();
        closeModal('appointment-modal');
      }
    });
  }
}

/* ========================================================
   === BLOCCO 7: COSA POSITIVA & CONTROLLO ORARIO (10, 16, 21) ===
   ======================================================== */
// Controlla se è il momento di mostrare il pop-up delle 10:00, 16:00 o 21:00
function checkPositiveThingPrompts() {
  const now = new Date();
  const currentHour = now.getHours();
  const todayDateKey = now.toDateString();

  // Orari target per il pop-up positivo
  const targetHours = [10, 16, 21];

  targetHours.forEach(function(hour) {
    const promptKey = "focal_prompt_" + hour + "_" + todayDateKey;
    const alreadyShown = localStorage.getItem(promptKey);

    // Se l'ora attuale è passata o pari all'orario target e non è ancora stato mostrato oggi
    if (currentHour >= hour && !alreadyShown) {
      localStorage.setItem(promptKey, "true");
      triggerPositivePrompt(hour);
    }
  });
}

// Apre la modale per la cosa positiva con titolo personalizzato
function triggerPositivePrompt(slotHour) {
  const titleEl = document.getElementById('positive-modal-title');
  const descEl = document.getElementById('positive-modal-desc');
  const inputEl = document.getElementById('positive-thing-input');

  if (titleEl) {
    titleEl.textContent = "Pausa di Positività (Ore " + slotHour + ":00)";
  }
  if (descEl) {
    descEl.textContent = "Sono passate le ore " + slotHour + ":00. Qual è 1 cosa positiva accaduta finora da custodire?";
  }
  if (inputEl) {
    inputEl.value = "";
    inputEl.setAttribute('data-slot', slotHour);
  }
  openModal('positive-thing-modal');
}

// Salvataggio della cosa positiva inserita dall'utente
function setupPositiveThingSaving() {
  const saveBtn = document.getElementById('save-positive-btn');
  const inputEl = document.getElementById('positive-thing-input');

  if (saveBtn && inputEl) {
    saveBtn.addEventListener('click', function() {
      const text = inputEl.value.trim();
      if (text.length > 0) {
        const now = new Date();
        const timeString = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0');
        const slot = inputEl.getAttribute('data-slot') || now.getHours();

        appPositiveThings.push({
          slotHour: parseInt(slot, 10),
          time: timeString,
          text: text
        });

        saveStateToStorage();
        closeModal('positive-thing-modal');
      }
    });
  }
}

/* ========================================================
   === BLOCCO 8: RIEPILOGO SERALE DELLE 22:00 (REPORT) ===
   ======================================================== */
// Genera l'HTML del report consolidato in ordine cronologico
function generateDailyReport() {
  const container = document.getElementById('daily-report-content');
  if (!container) return;

  const eventsTimeline = [];

  // Aggiunge gli umori registrati
  appMoods.forEach(function(m) {
    eventsTimeline.push({
      time: m.time,
      category: "Umore",
      icon: m.mood === 'felice' ? 'sentiment_satisfied' : (m.mood === 'neutro' ? 'sentiment_neutral' : 'sentiment_dissatisfied'),
      title: "Stato d'animo: " + m.mood.toUpperCase(),
      desc: m.note
    });
  });

  // Aggiunge le cose positive registrate
  appPositiveThings.forEach(function(p) {
    eventsTimeline.push({
      time: p.time,
      category: "Cosa Positiva",
      icon: "favorite",
      title: "Momento di gratitudine",
      desc: p.text
    });
  });

  // Aggiunge gli obiettivi completati
  appGoals.forEach(function(g) {
    if (g.completed) {
      eventsTimeline.push({
        time: g.completedTime || "Giornata",
        category: "Obiettivo Completato",
        icon: "check_circle",
        title: "Traguardo raggiunto",
        desc: g.text
      });
    }
  });

  // Aggiunge gli appuntamenti effettuati
  appAppointments.forEach(function(a) {
    eventsTimeline.push({
      time: formatApptBadge(a.date, a.time),
      category: "Appuntamento",
      icon: a.icon || "event",
      title: a.title,
      desc: a.note
    });
  });

  // Ordina tutti gli eventi cronologicamente
  eventsTimeline.sort(function(a, b) {
    return timeToMinutes(a.time) - timeToMinutes(b.time);
  });

  // Costruzione dell'output visuale del report
  let html = "";
  if (eventsTimeline.length === 0) {
    html = '<p style="font-size: 13px; color: var(--color-text-subtle);">Nessuna attività registrata per oggi.</p>';
  } else {
    eventsTimeline.forEach(function(item) {
      html += '<div class="report-block">';
      html += '  <div class="report-block-title">';
      html += '    <span class="report-time-pill">' + item.time + '</span>';
      html += '    <span class="material-symbols-outlined" style="font-size: 16px;">' + item.icon + '</span>';
      html += '    <span>' + item.title + '</span>';
      html += '  </div>';
      html += '  <p class="report-item-text">' + item.desc + '</p>';
      html += '</div>';
    });
  }

  container.innerHTML = html;
}

// Controlla se sono le ore 22:00 per mostrare automaticamente il report
function checkEveningReportTime() {
  const now = new Date();
  const todayDateKey = now.toDateString();
  const reportShownKey = "focal_report_shown_" + todayDateKey;

  if (now.getHours() >= 22 && !localStorage.getItem(reportShownKey)) {
    localStorage.setItem(reportShownKey, "true");
    generateDailyReport();
    openModal('report-modal');
  }
}

/* ========================================================
   === BLOCCO 9: CALENDARIO & CONSULTAZIONE STORICO ===
   ======================================================== */
// Genera una vista calendario del mese corrente per consultare lo storico
function buildCalendarView() {
  const grid = document.getElementById('calendar-days-grid');
  const summaryBox = document.getElementById('calendar-day-summary');
  if (!grid) return;

  grid.innerHTML = "";

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  // Intestazioni dei giorni della settimana
  const dayHeaders = ["L", "M", "M", "G", "V", "S", "D"];
  dayHeaders.forEach(function(dh) {
    const headerCell = document.createElement('div');
    headerCell.className = "calendar-day-header";
    headerCell.textContent = dh;
    grid.appendChild(headerCell);
  });

  // Calcola il primo giorno del mese
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const offset = (firstDayOfMonth === 0 ? 7 : firstDayOfMonth) - 1;
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Celle vuote prima del primo del mese
  for (let i = 0; i < offset; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = "calendar-cell empty";
    grid.appendChild(emptyCell);
  }

  // Giorni del mese
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = "calendar-cell";
    cell.textContent = d;

    const dateIso = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    const dayAppts = appAppointments.filter(function(a) { return a.date === dateIso; });

    if (d === currentDay) {
      cell.classList.add('today');
    } else if (dayAppts.length > 0 || (d < currentDay && (d === currentDay - 1 || d === currentDay - 2))) {
      // Giorni precedenti con storico o con appuntamenti pianificati
      cell.classList.add('has-data');
    }

    cell.addEventListener('click', function() {
      document.querySelectorAll('.calendar-cell').forEach(function(c) {
        c.style.outline = "none";
      });
      cell.style.outline = "2px solid var(--color-primary)";

      let apptInfoHtml = '';
      if (dayAppts.length > 0) {
        apptInfoHtml = '<div style="margin-top: 8px; padding-top: 6px; border-top: 1px dashed #cbd5e1;"><strong>Appuntamenti in programma:</strong><ul style="margin: 4px 0 0 18px; padding: 0;">';
        dayAppts.forEach(function(a) {
          apptInfoHtml += '<li><span style="font-weight:600;">' + a.time + '</span> — ' + a.title + '</li>';
        });
        apptInfoHtml += '</ul></div>';
      }

      if (summaryBox) {
        if (d === currentDay) {
          summaryBox.innerHTML = '<div style="background:#eefaf3; padding:10px; border-radius:12px; border:1px solid #8ad6b3;">' +
            '<strong>Oggi (' + d + ' Ottobre):</strong> Consulta il riepilogo odierno o la schermata principale.' +
            apptInfoHtml +
            '</div>';
        } else if (d < currentDay) {
          summaryBox.innerHTML = '<div style="background:#eefaf3; padding:10px; border-radius:12px; border:1px solid #8ad6b3;">' +
            '<strong>Resoconto di ' + d + ' Ottobre:</strong><br>' +
            '• Umore prevalente: Sereno / Rilassato<br>' +
            '• 3 Obiettivi gentili completati<br>' +
            '• Cosa positiva: <em>"Passeggiata senza telefono al tramonto."</em>' +
            apptInfoHtml +
            '</div>';
        } else {
          summaryBox.innerHTML = '<div style="background:#f8fafc; padding:10px; border-radius:12px; border:1px solid #e2e8f0;">' +
            '<strong>Pianificazione (' + d + ' Ottobre):</strong>' +
            (dayAppts.length > 0 ? apptInfoHtml : '<br><em>Nessun appuntamento o impegno registrato.</em>') +
            '</div>';
        }
      }
    });

    grid.appendChild(cell);
  }
}

/* ========================================================
   === BLOCCO 10: STATISTICHE PROFILO & PULSANTI IMPOSTAZIONI ===
   ======================================================== */
// Aggiorna i contatori nel modal profilo
function updateProfileStats() {
  const completedGoals = appGoals.filter(function(g) { return g.completed; }).length;
  const goalsStatEl = document.getElementById('stat-completed-goals');
  const moodStatEl = document.getElementById('stat-mood-count');

  if (goalsStatEl) {
    goalsStatEl.textContent = completedGoals + "/" + appGoals.length;
  }
  if (moodStatEl) {
    moodStatEl.textContent = appMoods.length;
  }
}

// Configura i pulsanti del profilo, impostazioni e test
function setupHeaderAndSettingsButtons() {
  // Icona profilo
  const profileBtn = document.getElementById('profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', function() {
      updateProfileStats();
      openModal('profile-modal');
    });
  }

  // Icona impostazioni
  const settingsBtn = document.getElementById('settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', function() {
      openModal('settings-modal');
    });
  }

  // Icona calendario
  const calendarBtn = document.getElementById('calendar-btn');
  if (calendarBtn) {
    calendarBtn.addEventListener('click', function() {
      buildCalendarView();
      openModal('calendar-modal');
    });
  }

  // Voce "Mostra riepilogo" nelle impostazioni
  const openReportBtn = document.getElementById('open-report-from-settings-btn');
  if (openReportBtn) {
    openReportBtn.addEventListener('click', function() {
      closeModal('settings-modal');
      generateDailyReport();
      openModal('report-modal');
    });
  }

  // Simulatore pop-up positivo (per scopi di test/didattici)
  const simPositiveBtn = document.getElementById('simulate-positive-btn');
  if (simPositiveBtn) {
    simPositiveBtn.addEventListener('click', function() {
      closeModal('settings-modal');
      triggerPositivePrompt(10);
    });
  }

  // Simulatore report serale delle 22:00
  const simEveningBtn = document.getElementById('simulate-evening-report-btn');
  if (simEveningBtn) {
    simEveningBtn.addEventListener('click', function() {
      closeModal('settings-modal');
      generateDailyReport();
      openModal('report-modal');
    });
  }

  // Reset dei dati ai valori originali di prova
  const resetBtn = document.getElementById('reset-sample-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (confirm("Vuoi ripristinare i dati di prova dell'applicazione?")) {
        localStorage.clear();
        appGoals = defaultGoals;
        appAppointments = defaultAppointments;
        appMoods = defaultMoodHistory;
        appPositiveThings = defaultPositiveThings;
        saveStateToStorage();
        renderGoals();
        renderAppointments();
        closeModal('settings-modal');
      }
    });
  }
}

/* ========================================================
   === INIZIALIZZAZIONE GLOBALE DELL'APPLICAZIONE ===
   ======================================================== */
document.addEventListener('DOMContentLoaded', function() {
  // 1. Avvia l'orologio e la data
  updateClockAndDate();
  setInterval(updateClockAndDate, 10000);

  // 2. Registra listener per modali e bottoni
  setupModalCloseListeners();
  setupHeaderAndSettingsButtons();
  setupMoodSelector();
  setupGoalCreation();
  setupAppointmentCreation();
  setupPositiveThingSaving();

  // 3. Renderizza i dati dinamici
  renderGoals();
  renderAppointments();

  // 4. Aggiorna lo stato dei compiti ogni minuto (es. appuntamenti passati)
  setInterval(renderAppointments, 60000);

  // 5. Controlla notifiche orarie (ore 10, 16, 21 e report ore 22)
  checkPositiveThingPrompts();
  checkEveningReportTime();
  setInterval(function() {
    checkPositiveThingPrompts();
    checkEveningReportTime();
  }, 60000);
});
