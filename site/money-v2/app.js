const AFFILIATE_LINKS = {
  legal: "https://example.com/replace-with-legal-affiliate-link",
  cash: "https://example.com/replace-with-cash-affiliate-link"
};

const intentMessages = {
  hensai_today: {
    label: "返済日が今日",
    text: "今日中の支払いに焦っている場合は、遅延時の影響と追加借入の返済見込みを先に確認してください。"
  },
  tokusoku: {
    label: "督促が不安",
    text: "督促や電話が来ている場合は、借入比較よりも相談先の確認を優先する状態かもしれません。"
  },
  seikatsu: {
    label: "生活費不足",
    text: "一時的な不足なのか、毎月続く不足なのかで見るべき選択肢が変わります。"
  },
  multi: {
    label: "複数社返済",
    text: "返済先が複数ある場合は、追加借入の前に毎月返済額と相談の必要性を整理してください。"
  }
};

const questions = [
  {
    id: "situation",
    title: "今いちばん近い状況はどれですか？",
    help: "最初に、検索してきた理由に近いものを選んでください。",
    choices: [
      { label: "返済日が近いが、お金が足りない", score: { watch: 2, cash: 1 } },
      { label: "すでに支払いが遅れている", score: { debt: 3 } },
      { label: "督促や電話が来ている", score: { urgent: 3, debt: 2 } },
      { label: "生活費が一時的に足りない", score: { cash: 2, watch: 1 } }
    ]
  },
  {
    id: "delay",
    title: "滞納や遅れはありますか？",
    help: "正確な日数が分からない場合は、近いものを選んでください。",
    choices: [
      { label: "まだ遅れていない", score: { cash: 1 } },
      { label: "1週間以内の遅れがある", score: { watch: 2, debt: 1 } },
      { label: "1週間以上遅れている", score: { debt: 3 } },
      { label: "督促状・強い請求が来ている", score: { urgent: 3, debt: 2 } }
    ]
  },
  {
    id: "lenders",
    title: "借入先はいくつありますか？",
    help: "クレジットカードのリボ払いやカードローンも含めて考えてください。",
    choices: [
      { label: "0社または1社", score: { cash: 1 } },
      { label: "2社から3社", score: { watch: 2, debt: 1 } },
      { label: "4社以上", score: { debt: 3 } },
      { label: "正確に把握できていない", score: { debt: 2, watch: 1 } }
    ]
  },
  {
    id: "monthly",
    title: "毎月の返済は生活費のあとに残りますか？",
    help: "来月以降も同じ状態が続くかを見ます。",
    choices: [
      { label: "残る。返済の見込みはある", score: { cash: 2 } },
      { label: "ぎりぎり。少し崩れると厳しい", score: { watch: 2 } },
      { label: "足りない月が続いている", score: { debt: 3 } },
      { label: "返済のために別の借入を使っている", score: { debt: 3, urgent: 1 } }
    ]
  },
  {
    id: "timing",
    title: "今日から数日以内にお金が必要ですか？",
    help: "急ぎかどうかで確認する順番が変わります。",
    choices: [
      { label: "はい。給料日までの一時的な不足", score: { cash: 2 } },
      { label: "はい。ただし返済できるか不安", score: { watch: 2, debt: 1 } },
      { label: "急ぎではないが、返済が重い", score: { debt: 2 } },
      { label: "連絡や請求が怖くて急いでいる", score: { urgent: 3 } }
    ]
  },
  {
    id: "risk",
    title: "当てはまるものはありますか？",
    help: "ひとつでも近ければ、その状態を優先して案内します。",
    choices: [
      { label: "闇金や個人間融資に連絡した", score: { urgent: 4 } },
      { label: "家族や会社に知られるのが怖い", score: { debt: 2, watch: 1 } },
      { label: "条件を確認できる正規業者だけ見たい", score: { cash: 2 } },
      { label: "特にない", score: { cash: 1 } }
    ]
  }
];

const results = {
  urgent: {
    kicker: "診断結果：相談優先度が高い状態",
    title: "督促・強い請求・闇金不安がある場合は、先に専門相談を確認してください",
    summary: "追加借入を探すより、連絡方法や請求への対応を相談できる窓口を先に確認する状態です。",
    checks: [
      "相手の登録番号、会社名、連絡先が確認できるか",
      "家族や勤務先への連絡が不安なことを相談時に伝える",
      "支払いを急かされても、条件が不明な相手へ送金しない"
    ],
    actions: [
      "債務整理や督促対応の相談先を確認する",
      "闇金や個人間融資が絡む場合は、専門対応の有無を確認する",
      "借入比較は、状況が整理できてから見る"
    ],
    ctas: [
      { label: "相談先を確認する", href: AFFILIATE_LINKS.legal, className: "warn", track: "cta_urgent_legal" }
    ],
    note: "緊急性が高い状態では、返済のための追加借入が負担を増やすことがあります。"
  },
  debt: {
    kicker: "診断結果：返済整理を先に見る状態",
    title: "複数社・滞納・返済不足がある場合は、借入前に相談先を確認してください",
    summary: "毎月の返済が生活費を圧迫している場合、追加借入よりも返済計画や債務整理の相談が合うことがあります。",
    checks: [
      "借入先、残高、毎月返済額を紙やメモに出す",
      "来月以降も返済できる見込みがあるか確認する",
      "督促や滞納がある場合は、相談時にそのまま伝える"
    ],
    actions: [
      "無料相談の対象か確認する",
      "任意整理、個人再生、自己破産の違いを聞く",
      "借入比較は、返済見込みが立つ場合だけ見る"
    ],
    ctas: [
      { label: "無料相談の案内を見る", href: AFFILIATE_LINKS.legal, className: "primary", track: "cta_debt_legal" }
    ],
    note: "債務整理の結果は状況により異なります。減額や解決を保証するものではありません。"
  },
  watch: {
    kicker: "診断結果：整理してから判断する状態",
    title: "今すぐ決めず、支払い順と返済見込みを確認してください",
    summary: "急いで申し込む前に、遅れてはいけない支払い、来月以降の返済額、相談が必要なラインを整理する状態です。",
    checks: [
      "家賃、公共料金、税金、携帯料金など優先度を分ける",
      "追加借入後の毎月返済額を確認する",
      "来月も不足するなら相談先を先に見る"
    ],
    actions: [
      "返済が続く不安があるなら相談先を確認する",
      "一時的不足なら正規業者の条件を比較する",
      "遅れが出る前に連絡方法を決める"
    ],
    ctas: [
      { label: "相談先を確認する", href: AFFILIATE_LINKS.legal, className: "primary", track: "cta_watch_legal" },
      { label: "借入条件を比較する", href: AFFILIATE_LINKS.cash, className: "cash", track: "cta_watch_cash" }
    ],
    note: "返済見込みが弱い状態での借入は慎重に判断してください。"
  },
  cash: {
    kicker: "診断結果：一時的な不足を比較する状態",
    title: "滞納がなく返済見込みがある場合は、条件を確認して比較してください",
    summary: "一時的な生活費不足で、返済の見込みがある場合は、正規業者の条件を確認したうえで比較する選択肢があります。",
    checks: [
      "金利、返済額、返済日、遅延時の扱いを確認する",
      "在籍確認や郵送物の有無を公式情報で確認する",
      "必要額だけに絞り、返済予定日を決める"
    ],
    actions: [
      "条件が分かる正規業者だけを見る",
      "複数申し込みを急がず、必要条件から絞る",
      "返済が難しそうなら相談ルートへ戻る"
    ],
    ctas: [
      { label: "借入条件を比較する", href: AFFILIATE_LINKS.cash, className: "cash", track: "cta_cash_compare" },
      { label: "返済が不安なら相談先を見る", href: AFFILIATE_LINKS.legal, className: "secondary", track: "cta_cash_legal" }
    ],
    note: "借入は返済が前提です。契約前に必ず公式情報と契約条件を確認してください。"
  }
};

const state = {
  index: 0,
  score: { urgent: 0, debt: 0, watch: 0, cash: 0 },
  answers: [],
  started: false
};

const progressBar = document.querySelector("#progress-bar");
const stepLabel = document.querySelector("#step-label");
const questionTitle = document.querySelector("#question-title");
const questionHelp = document.querySelector("#question-help");
const choicesEl = document.querySelector("#choices");
const quizCard = document.querySelector("#quiz-card");
const resultPanel = document.querySelector("#result-panel");
const resetButton = document.querySelector("#reset-quiz");
const intentPanel = document.querySelector("#intent-panel");
const intentLabel = document.querySelector("#intent-label");
const intentText = document.querySelector("#intent-text");

function track(eventName, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}

function hydrateIntentMessage() {
  const params = new URLSearchParams(window.location.search);
  const intent = params.get("intent");
  const message = intentMessages[intent];

  if (!message || !intentPanel) return;

  intentLabel.textContent = message.label;
  intentText.textContent = message.text;
  intentPanel.hidden = false;
  track("intent_view", { intent });
}

function renderQuestion() {
  const question = questions[state.index];
  const progress = (state.index / questions.length) * 100;

  progressBar.style.width = `${progress}%`;
  stepLabel.textContent = `Q${state.index + 1} / ${questions.length}`;
  questionTitle.textContent = question.title;
  questionHelp.textContent = question.help;
  choicesEl.innerHTML = "";

  question.choices.forEach((choice, choiceIndex) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice";
    button.innerHTML = `
      <span class="choice-mark">${choiceIndex + 1}</span>
      <span class="choice-text">${choice.label}</span>
    `;
    button.addEventListener("click", () => selectChoice(question, choice));
    choicesEl.appendChild(button);
  });
}

function selectChoice(question, choice) {
  if (!state.started) {
    state.started = true;
    track("quiz_start");
  }

  Object.entries(choice.score).forEach(([key, value]) => {
    state.score[key] += value;
  });

  state.answers.push({ question: question.id, answer: choice.label });
  track("quiz_answer", {
    question_id: question.id,
    answer: choice.label,
    step: state.index + 1
  });

  state.index += 1;

  if (state.index >= questions.length) {
    showResult();
    return;
  }

  renderQuestion();
}

function pickResultKey() {
  if (state.score.urgent >= 4) return "urgent";
  if (state.score.debt >= 6) return "debt";
  if (state.score.cash >= 6 && state.score.debt < 3 && state.score.urgent < 3) return "cash";
  if (state.score.debt >= state.score.cash) return "debt";
  return "watch";
}

function showResult() {
  const key = pickResultKey();
  const result = results[key];

  progressBar.style.width = "100%";
  stepLabel.textContent = "結果";
  quizCard.hidden = true;
  resultPanel.hidden = false;

  document.querySelector("#result-kicker").textContent = result.kicker;
  document.querySelector("#result-title").textContent = result.title;
  document.querySelector("#result-summary").textContent = result.summary;
  document.querySelector("#result-note").textContent = result.note;
  fillList("#result-checks", result.checks);
  fillList("#result-actions", result.actions);
  renderCtas(result.ctas, key);

  track("quiz_complete", {
    result: key,
    score_urgent: state.score.urgent,
    score_debt: state.score.debt,
    score_watch: state.score.watch,
    score_cash: state.score.cash
  });
}

function fillList(selector, items) {
  const list = document.querySelector(selector);
  list.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function renderCtas(ctas, resultKey) {
  const container = document.querySelector("#result-ctas");
  container.innerHTML = "";

  ctas.forEach((cta) => {
    const link = document.createElement("a");
    link.className = `button ${cta.className}`;
    link.href = cta.href;
    link.rel = "nofollow sponsored";
    link.textContent = cta.label;
    link.addEventListener("click", () => {
      track(cta.track, { result: resultKey, destination: cta.href });
    });
    container.appendChild(link);
  });
}

function resetQuiz() {
  state.index = 0;
  state.score = { urgent: 0, debt: 0, watch: 0, cash: 0 };
  state.answers = [];
  state.started = false;
  quizCard.hidden = false;
  resultPanel.hidden = true;
  renderQuestion();
  track("quiz_reset");
}

document.querySelectorAll("[data-track]").forEach((element) => {
  element.addEventListener("click", () => {
    track(element.dataset.track);
  });
});

resetButton.addEventListener("click", resetQuiz);

renderQuestion();
hydrateIntentMessage();
track("quiz_view");
