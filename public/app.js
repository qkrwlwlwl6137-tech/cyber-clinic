(function () {
  const state = {
    card: null,
    attempt: 0,
    maxAttempts: 3,
    lastAnswers: null,
    redrawCount: 0,
    maxRedraws: 2,
    deckAssignment: [],
  };

  // ---- 자동 저장 / 복원 (새로고침해도 진단 작성 내용이 사라지지 않도록) ----
  const STORAGE_KEY = "cyberClinicProgress";

  function saveProgress() {
    try {
      const data = {
        card: state.card,
        attempt: state.attempt,
        lastAnswers: state.lastAnswers,
        form: {
          principle: getSelectedPrinciple(),
          reason: inputReason ? inputReason.value : "",
          action: inputAction ? inputAction.value : "",
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage를 못 쓰는 환경이면 자동저장만 조용히 건너뜁니다 (활동 진행엔 문제 없음)
    }
  }

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearProgress() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // 무시
    }
  }

  const screens = {
    start: document.getElementById("screen-start"),
    diagnose: document.getElementById("screen-diagnose"),
    loading: document.getElementById("screen-loading"),
    transition: document.getElementById("screen-transition"),
    prescription: document.getElementById("screen-prescription"),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove("visible"));
    screens[name].classList.add("visible");
    updateProgressDots(name);
    updateProcedureSteps(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateProgressDots(name) {
    const map = { start: 1, diagnose: 2, loading: 2, transition: 3, prescription: 3 };
    const step = map[name] || 1;
    document.querySelectorAll("#progressDots .dot").forEach((dot) => {
      dot.classList.toggle("active", Number(dot.dataset.step) <= step);
    });
  }

  // ---- 활동 절차 패널 ----
  function updateProcedureSteps(name) {
    const doneSteps = [];
    const currentSteps = [];
    if (name === "start") {
      currentSteps.push(1);
    } else if (name === "diagnose" || name === "loading") {
      doneSteps.push(1);
      currentSteps.push(2, 3);
    } else if (name === "transition" || name === "prescription") {
      doneSteps.push(1, 2, 3);
      currentSteps.push(4);
    }
    document.querySelectorAll("#procedureList li").forEach((li) => {
      const step = Number(li.dataset.step);
      li.classList.remove("step-done", "step-current");
      if (doneSteps.includes(step)) li.classList.add("step-done");
      if (currentSteps.includes(step)) li.classList.add("step-current");
    });
  }

  const procedureToggle = document.getElementById("procedureToggle");
  const procedureBody = document.getElementById("procedureBody");
  procedureToggle.addEventListener("click", function () {
    const isOpen = procedureBody.style.display !== "none";
    procedureBody.style.display = isOpen ? "none" : "block";
    procedureToggle.classList.toggle("open", !isOpen);
  });

  // ---- 1. 타로 카드 뽑기 화면 ----
  const tarotDeck = document.getElementById("tarotDeck");
  const tarotGuide = document.getElementById("tarotGuide");
  const symptomCardEl = document.getElementById("symptomCard");
  const afterDrawEl = document.getElementById("afterDraw");
  const cardCategory = document.getElementById("cardCategory");
  const cardTitle = document.getElementById("cardTitle");
  const cardContent = document.getElementById("cardContent");
  const redrawBtn = document.getElementById("redrawBtn");
  const goDiagnoseBtn = document.getElementById("goDiagnoseBtn");
  const redrawNote = document.getElementById("redrawNote");

  function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildDeck() {
    state.deckAssignment = shuffle(SYMPTOM_CARDS);
    tarotDeck.innerHTML = "";
    symptomCardEl.style.display = "none";
    afterDrawEl.style.display = "none";
    tarotGuide.style.display = "block";

    state.deckAssignment.forEach(function (card, idx) {
      const cardEl = document.createElement("div");
      cardEl.className = "tarot-card";
      cardEl.dataset.index = idx;
      cardEl.innerHTML =
        '<div class="tarot-face tarot-back">🩺</div>' +
        '<div class="tarot-face tarot-front">📄</div>';
      cardEl.addEventListener("click", function () {
        handleCardPick(cardEl, card);
      });
      tarotDeck.appendChild(cardEl);
    });

    updateRedrawUI();
  }

  function handleCardPick(cardEl, card) {
    if (cardEl.classList.contains("flipped") || cardEl.classList.contains("disabled")) return;

    // 다른 카드들은 비활성화
    document.querySelectorAll(".tarot-card").forEach(function (el) {
      if (el !== cardEl) el.classList.add("disabled");
    });
    cardEl.classList.add("flipped");
    tarotGuide.style.display = "none";

    state.card = card;
    saveProgress();

    setTimeout(function () {
      cardCategory.textContent = card.category;
      cardTitle.textContent = card.title;
      cardContent.textContent = card.content;
      symptomCardEl.style.display = "block";
      afterDrawEl.style.display = "flex";
    }, 400);
  }

  function updateRedrawUI() {
    const remaining = state.maxRedraws - state.redrawCount;
    if (remaining <= 0) {
      redrawBtn.style.display = "none";
      redrawNote.textContent = "다시 뽑기 기회를 모두 사용했어요. 이 카드로 진단을 시작해볼까요?";
    } else {
      redrawBtn.style.display = "inline-block";
      redrawNote.textContent = "다시 뽑기 가능 횟수: " + remaining + "번";
    }
  }

  redrawBtn.addEventListener("click", function () {
    if (state.redrawCount >= state.maxRedraws) return;
    state.redrawCount += 1;
    buildDeck();
  });

  function fillRecapCard() {
    const recapCard = document.getElementById("recapCard");
    recapCard.innerHTML =
      '<span class="tag">' + state.card.category + "</span>" +
      "<h2>" + state.card.title + "</h2>" +
      "<p>" + state.card.content + "</p>";
  }

  goDiagnoseBtn.addEventListener("click", function () {
    fillRecapCard();
    state.attempt = 0;
    resetDiagnoseForm();
    saveProgress();
    showScreen("diagnose");
  });

  // ---- 2. 진단 작성 화면 ----
  const principleRadios = document.querySelectorAll('input[name="principle"]');
  const inputReason = document.getElementById("input-reason");
  const inputAction = document.getElementById("input-action");
  const submitBtn = document.getElementById("submitBtn");
  const nextBtn = document.getElementById("nextBtn");
  const attemptNote = document.getElementById("attemptNote");
  const praiseArea = document.getElementById("praiseArea");

  const blocks = {
    principle: document.getElementById("block-principle"),
    reason: document.getElementById("block-reason"),
    action: document.getElementById("block-action"),
  };
  const fieldFeedbacks = {
    principle: document.getElementById("feedback-principle"),
    reason: document.getElementById("feedback-reason"),
    action: document.getElementById("feedback-action"),
  };

  principleRadios.forEach((radio) => {
    radio.addEventListener("change", function () {
      document.querySelectorAll(".principle-options label").forEach((label) => label.classList.remove("picked"));
      radio.closest("label").classList.add("picked");
      saveProgress();
    });
  });

  // 입력할 때마다 자동 저장 (너무 자주 저장하지 않도록 약간의 지연을 둡니다)
  let saveTimer = null;
  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveProgress, 400);
  }
  inputReason.addEventListener("input", scheduleSave);
  inputAction.addEventListener("input", scheduleSave);

  function resetDiagnoseForm() {
    principleRadios.forEach((r) => (r.checked = false));
    document.querySelectorAll(".principle-options label").forEach((label) => label.classList.remove("picked"));
    inputReason.value = "";
    inputAction.value = "";
    clearFieldStates();
    praiseArea.innerHTML = "";
    submitBtn.textContent = "피드백 받기";
    submitBtn.disabled = false;
    submitBtn.style.display = "inline-block";
    nextBtn.style.display = "none";
    attemptNote.textContent = "작성 후 피드백 받기 (최대 " + state.maxAttempts + "회)";
  }

  function clearFieldStates() {
    Object.values(blocks).forEach((b) => b.classList.remove("needs-revision"));
    Object.values(fieldFeedbacks).forEach((f) => {
      f.classList.remove("visible");
      f.textContent = "";
    });
  }

  function getSelectedPrinciple() {
    const checked = document.querySelector('input[name="principle"]:checked');
    return checked ? checked.value : "";
  }

  function validateBeforeSubmit() {
    const principle = getSelectedPrinciple();
    const reason = inputReason.value.trim();
    const action = inputAction.value.trim();
    if (!principle) {
      alert("도덕 원칙을 하나 선택해주세요.");
      return null;
    }
    if (!reason) {
      alert("이유를 작성해주세요.");
      return null;
    }
    if (!action) {
      alert("실천 방안을 작성해주세요.");
      return null;
    }
    return { principle, reason, action };
  }

  // ---- 네트워크 재시도 유틸 ----
  // 요청이 실패(네트워크 오류 또는 5xx 서버 오류)하면 최대 maxRetryAttempts번까지
  // 1초 -> 2초 -> 3초 간격으로 점점 늘려가며 자동으로 다시 시도합니다.
  // 모바일/태블릿 환경에서 서버리스 함수의 "콜드 스타트" 지연 때문에 첫 요청만
  // 실패하는 경우를 사람이 다시 누르지 않아도 자동으로 넘기기 위한 로직입니다.
  async function fetchWithRetry(url, options, onRetry, maxRetryAttempts) {
    const attempts = maxRetryAttempts || 4;
    let lastError = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok && response.status >= 500) {
          // 서버 쪽 타임아웃/오류 -> 재시도 대상으로 취급
          lastError = new Error("서버 오류 status " + response.status);
          if (attempt < attempts) {
            if (typeof onRetry === "function") onRetry(attempt, attempts);
            await new Promise((r) => setTimeout(r, attempt * 1000));
            continue;
          }
          return response; // 마지막 시도였다면 그대로 반환해서 호출 쪽에서 에러 메시지 처리
        }
        return response; // 성공 (2xx~4xx 포함, 4xx는 호출 쪽에서 처리)
      } catch (err) {
        lastError = err;
        if (attempt < attempts) {
          if (typeof onRetry === "function") onRetry(attempt, attempts);
          await new Promise((r) => setTimeout(r, attempt * 1000));
          continue;
        }
      }
    }
    throw lastError;
  }

  submitBtn.addEventListener("click", async function () {
    const answers = validateBeforeSubmit();
    if (!answers) return;

    // 주의: 여기서는 아직 state.attempt를 올리지 않습니다.
    // AI 응답이 성공적으로 도착한 뒤에만 "작성 횟수"를 차감합니다.
    // 이렇게 해야, AI가 응답하는 동안(로딩 화면) 새로고침을 하거나
    // 통신이 실패해도 학생의 작성 횟수가 억울하게 깎이지 않습니다.
    state.lastAnswers = answers;
    saveProgress();
    clearFieldStates();
    praiseArea.innerHTML = "";
    showScreen("loading");

    const attemptNumberForThisTry = state.attempt + 1;

    try {
      const res = await fetchWithRetry(
        "/api/feedback",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cardTitle: state.card.title,
            cardContent: state.card.content,
            principle: answers.principle,
            reason: answers.reason,
            action: answers.action,
            attemptNumber: attemptNumberForThisTry,
          }),
        },
        function (attempt, total) {
          // 재시도가 발생할 때마다 호출됩니다 (현재는 콘솔 로그만, 필요하면 화면 문구로 바꿀 수 있어요)
          console.log("피드백 요청 재시도 중... (" + attempt + "/" + total + ")");
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || "피드백을 받아오지 못했어요. 잠시 후 다시 시도해주세요.");
        showScreen("diagnose");
        // 실패했으니 횟수는 그대로 둡니다 (아직 올리지 않았으므로 되돌릴 것도 없음).
        return;
      }

      const data = await res.json();
      // 응답을 정상적으로 받았을 때만 작성 횟수를 확정해서 올립니다.
      state.attempt = attemptNumberForThisTry;
      saveProgress();
      handleFeedbackResult(data);
    } catch (e) {
      console.error(e);
      alert("네트워크 문제로 피드백을 받아오지 못했어요. 다시 시도해주세요.");
      showScreen("diagnose");
      // 실패했으니 횟수는 그대로 둡니다.
    }
  });

  function handleFeedbackResult(data) {
    const praise = Array.isArray(data.praise) ? data.praise : [];
    const fields = data.fields || {};
    const anyNeedsRevision = Object.values(fields).some((f) => f && f.needsRevision);
    const reachedMax = state.attempt >= state.maxAttempts;

    showScreen("diagnose");

    // 칭찬 표시
    praiseArea.innerHTML = praise
      .map((p) => '<div class="feedback-panel"><div class="praise-item">' + escapeHtml(p) + "</div></div>")
      .join("");

    // 빨간 하이라이트 + 힌트 표시
    Object.keys(blocks).forEach((key) => {
      const f = fields[key];
      if (f && f.needsRevision) {
        blocks[key].classList.add("needs-revision");
        if (f.hint) {
          fieldFeedbacks[key].textContent = "💡 " + f.hint;
          fieldFeedbacks[key].classList.add("visible");
        }
      }
    });

    if (reachedMax) {
      // 3회 종료 → 피드백을 다 읽은 뒤 버튼을 눌러야 다음으로 넘어감
      attemptNote.textContent = "작성 횟수를 모두 사용했어요. 피드백을 확인하고 다음으로 넘어가볼까요?";
      submitBtn.style.display = "none";
      nextBtn.style.display = "inline-block";
      return;
    }

    if (!anyNeedsRevision) {
      // 이미 다 잘 작성함 → 피드백을 다 읽은 뒤 버튼을 눌러야 다음으로 넘어감
      attemptNote.textContent = "정말 잘 작성했어요! 피드백을 확인하고 다음으로 넘어가볼까요?";
      submitBtn.style.display = "none";
      nextBtn.style.display = "inline-block";
      return;
    }

    attemptNote.textContent =
      "표시된 부분을 조금만 더 다듬어볼까요? (" + state.attempt + "/" + state.maxAttempts + "회 작성)";
    submitBtn.textContent = state.attempt >= state.maxAttempts - 1 ? "마지막으로 다시 제출하기" : "다시 제출하기";
  }

  nextBtn.addEventListener("click", function () {
    goToTransition();
  });

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  // ---- 3. 전환 화면 ----
  const transitionMsg = document.getElementById("transitionMsg");
  const goPrescriptionBtn = document.getElementById("goPrescriptionBtn");

  function goToTransition() {
    const messages = [
      "정말 잘 작성해줬어요!<br>이제 처방전을 완성해볼까요?",
      "진단이 끝났어요!<br>이제 Mr. 가상공간님을 위한 처방전을 써볼까요?",
      "여기까지 오느라 수고했어요!<br>이제 처방전 페이지로 가볼게요.",
    ];
    transitionMsg.innerHTML = messages[Math.floor(Math.random() * messages.length)];
    showScreen("transition");
  }

  goPrescriptionBtn.addEventListener("click", function () {
    fillPrescription();
    showScreen("prescription");
  });

  // ---- 4. 처방전 화면 ----
  const rxPrinciple = document.getElementById("rx-principle");
  const rxReason = document.getElementById("rx-reason");
  const rxAction = document.getElementById("rx-action");
  const rxDate = document.getElementById("rx-date");
  const printBtn = document.getElementById("printBtn");
  const rxCardCategory = document.getElementById("rxCardCategory");
  const rxCardTitle = document.getElementById("rxCardTitle");
  const rxCardContent = document.getElementById("rxCardContent");
  const rxDoctorName = document.getElementById("rx-doctor-name");

  function fillPrescription() {
    const answers = state.lastAnswers || { principle: "", reason: "", action: "" };
    rxPrinciple.textContent = answers.principle || "____";
    rxReason.value = answers.reason || "";
    rxAction.value = answers.action || "";

    if (state.card) {
      rxCardCategory.textContent = state.card.category;
      rxCardTitle.textContent = state.card.title;
      rxCardContent.textContent = state.card.content;
    }

    // 날짜는 활동 당일 날짜로 항상 자동 갱신됩니다.
    const now = new Date();
    rxDate.textContent = now.getFullYear() + "년 " + (now.getMonth() + 1) + "월 " + now.getDate() + "일";

    rxDoctorName.value = "";
    resetSignatureDisplay();
  }

  // ---- 다운로드하기 (처방전을 PNG 이미지로 저장) ----
  printBtn.addEventListener("click", function () {
    if (typeof html2canvas !== "function") {
      alert("이미지 생성 기능을 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침 후 다시 시도해주세요.");
      return;
    }
    const target = document.querySelector(".prescription");
    const originalLabel = printBtn.textContent;
    printBtn.disabled = true;
    printBtn.textContent = "이미지 생성 중...";

    html2canvas(target, {
      backgroundColor: "#ffffff",
      scale: 2,
      onclone: function (clonedDoc) {
        // html2canvas는 textarea 안의 줄바꿈된 글자를 제대로 못 읽어서 잘려 보일 수 있습니다.
        // 이미지를 찍기 직전에, 복제된 화면 안의 textarea를 같은 내용의 div로 바꿔서 해결합니다.
        var clonedTarget = clonedDoc.querySelector(".prescription");
        if (!clonedTarget) return;
        var textareas = clonedTarget.querySelectorAll("textarea");
        textareas.forEach(function (ta) {
          var div = clonedDoc.createElement("div");
          div.className = ta.className;
          div.textContent = ta.value;
          div.style.whiteSpace = "pre-wrap";
          div.style.wordBreak = "break-word";
          div.style.overflow = "visible";
          div.style.height = "auto";
          div.style.minHeight = window.getComputedStyle(ta).minHeight;
          div.style.width = window.getComputedStyle(ta).width;
          div.style.boxSizing = "border-box";
          ta.parentNode.replaceChild(div, ta);
        });
      },
    })
      .then(function (canvas) {
        const link = document.createElement("a");
        const now = new Date();
        const stamp =
          now.getFullYear() + "" + (now.getMonth() + 1) + "" + now.getDate();
        link.download = "가상공간_처방전_" + stamp + ".png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        // 다운로드까지 끝났으니 활동이 완료된 것으로 보고 자동저장 데이터를 지웁니다.
        // (다음에 새로고침하거나 다음 학생이 쓸 때 이전 내용이 남아있지 않도록)
        clearProgress();
      })
      .catch(function (err) {
        console.error(err);
        alert("이미지를 만드는 중 문제가 발생했어요. 다시 시도해주세요.");
      })
      .finally(function () {
        printBtn.disabled = false;
        printBtn.textContent = originalLabel;
      });
  });

  // ---- 서명 모달 (클릭해서 서명하기) ----
  const signatureModal = document.getElementById("signatureModal");
  const signatureOpenBtn = document.getElementById("signatureOpenBtn");
  const signatureRedoBtn = document.getElementById("signatureRedoBtn");
  const signatureCancelBtn = document.getElementById("signatureCancelBtn");
  const signatureConfirmBtn = document.getElementById("signatureConfirmBtn");
  const signatureClearModalBtn = document.getElementById("signatureClearModalBtn");
  const signatureImg = document.getElementById("signatureImg");

  const sigCanvas = document.getElementById("rx-signature-pad");
  const sigCtx = sigCanvas.getContext("2d");
  let sigDrawing = false;
  let sigLastPoint = null;

  sigCtx.lineWidth = 3;
  sigCtx.lineCap = "round";
  sigCtx.strokeStyle = "#273347";

  function getCanvasPoint(evt) {
    const rect = sigCanvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * sigCanvas.width,
      y: ((clientY - rect.top) / rect.height) * sigCanvas.height,
    };
  }

  function sigStart(evt) {
    evt.preventDefault();
    sigDrawing = true;
    sigLastPoint = getCanvasPoint(evt);
  }

  function sigMove(evt) {
    if (!sigDrawing) return;
    evt.preventDefault();
    const point = getCanvasPoint(evt);
    sigCtx.beginPath();
    sigCtx.moveTo(sigLastPoint.x, sigLastPoint.y);
    sigCtx.lineTo(point.x, point.y);
    sigCtx.stroke();
    sigLastPoint = point;
  }

  function sigEnd() {
    sigDrawing = false;
    sigLastPoint = null;
  }

  sigCanvas.addEventListener("mousedown", sigStart);
  sigCanvas.addEventListener("mousemove", sigMove);
  window.addEventListener("mouseup", sigEnd);
  sigCanvas.addEventListener("touchstart", sigStart, { passive: false });
  sigCanvas.addEventListener("touchmove", sigMove, { passive: false });
  sigCanvas.addEventListener("touchend", sigEnd);

  function clearSignaturePad() {
    sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
  }

  function openSignatureModal() {
    clearSignaturePad();
    signatureModal.style.display = "flex";
  }

  function closeSignatureModal() {
    signatureModal.style.display = "none";
  }

  function resetSignatureDisplay() {
    signatureImg.src = "";
    signatureImg.style.display = "none";
    signatureOpenBtn.style.display = "inline-block";
    signatureRedoBtn.style.display = "none";
  }

  signatureOpenBtn.addEventListener("click", openSignatureModal);
  signatureRedoBtn.addEventListener("click", openSignatureModal);
  signatureCancelBtn.addEventListener("click", closeSignatureModal);
  signatureClearModalBtn.addEventListener("click", clearSignaturePad);

  signatureConfirmBtn.addEventListener("click", function () {
    // 배경이 투명한 PNG로 저장 (캔버스는 그린 선 외에는 투명함)
    const dataUrl = sigCanvas.toDataURL("image/png");
    signatureImg.src = dataUrl;
    signatureImg.style.display = "block";
    signatureOpenBtn.style.display = "none";
    signatureRedoBtn.style.display = "inline-block";
    closeSignatureModal();
  });

  // ---- 초기화 (저장된 진행 상황이 있으면 복원, 없으면 처음부터 시작) ----
  const saved = loadProgress();

  if (saved && saved.card) {
    state.card = saved.card;
    state.attempt = saved.attempt || 0;
    state.lastAnswers = saved.lastAnswers || null;

    buildDeck(); // 카드 뽑기 화면 자체는 평소처럼 준비해두되, 화면은 바로 아래에서 진단 화면으로 전환합니다.
    fillRecapCard();
    resetDiagnoseForm();

    // 저장된 입력값 복원
    if (saved.form) {
      if (saved.form.principle) {
        const radio = document.querySelector(
          'input[name="principle"][value="' + saved.form.principle.replace(/"/g, '\\"') + '"]'
        );
        if (radio) {
          radio.checked = true;
          radio.closest("label").classList.add("picked");
        }
      }
      inputReason.value = saved.form.reason || "";
      inputAction.value = saved.form.action || "";
    }

    if (state.attempt > 0) {
      attemptNote.textContent =
        "이어서 작성해볼까요? (" + state.attempt + "/" + state.maxAttempts + "회 작성함)";
      submitBtn.textContent =
        state.attempt >= state.maxAttempts - 1 ? "마지막으로 다시 제출하기" : "다시 제출하기";
    }

    showScreen("diagnose");
  } else {
    buildDeck();
    updateProcedureSteps("start");
  }
})();
