const form = document.querySelector("#reelForm");
const results = document.querySelector("#results");
const statusText = document.querySelector("#resultStatus");
const copyAllButton = document.querySelector("#copyAllButton");
const shareButton = document.querySelector("#shareButton");
const sampleButton = document.querySelector("#sampleButton");
const clearButton = document.querySelector("#clearButton");
const resultsSection = document.querySelector("#resultsSection");
const template = document.querySelector("#resultBlockTemplate");

let latestBlocks = [];
const STORAGE_KEY = "hair-salon-recruit-reels-form";

const sampleData = {
  role: "スタイリスト",
  area: "渋谷",
  strength1: "高単価",
  strength2: "髪質改善特化",
  strength3: "教育制度がしっかりしている",
  workStyle: "週休2日・マンツーマン施術・無理な掛け持ちなし",
  salary: "月30万〜。指名売上に応じて歩合あり",
  teamMood: "落ち着いていて、困った時にすぐ相談できる雰囲気",
  dailyFlow: "朝は予約確認からスタート。営業中はマンツーマンでお客様に集中。空き時間に技術共有や撮影、終わったら長い終礼なしで退勤。",
  point1: "新規入客しやすい",
  point2: "営業中に練習や撮影の時間を取りやすい",
  point3: "プライベートの時間も大切にできる",
  targetTalent: "技術を伸ばしたい人・お客様と丁寧に向き合いたい人"
};

restoreFormData();
updateShareButtonState();

sampleButton.addEventListener("click", () => {
  Object.entries(sampleData).forEach(([key, value]) => {
    const input = form.elements[key];
    if (input) input.value = value;
  });
  persistFormData();
});

form.addEventListener("input", persistFormData);
form.addEventListener("change", persistFormData);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = getFormData();
  latestBlocks = buildOutputs(data);
  renderResults(latestBlocks, data.missing);
  resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

copyAllButton.addEventListener("click", async () => {
  const text = latestBlocks.map((block) => `【${block.title}】\n${block.body}`).join("\n\n");
  await copyText(text, copyAllButton);
});

shareButton.addEventListener("click", async () => {
  if (!latestBlocks.length) return;
  const text = latestBlocks.map((block) => `【${block.title}】\n${block.body}`).join("\n\n");

  try {
    await navigator.share({
      title: "美容師求人リールメーカー",
      text
    });
  } catch (error) {
    if (error && error.name === "AbortError") return;
    await copyText(text, shareButton);
  }
});

clearButton.addEventListener("click", () => {
  form.reset();
  localStorage.removeItem(STORAGE_KEY);
  latestBlocks = [];
  results.innerHTML = "<p>ここに求人リール台本・テロップ・編集指示・キャプション・CTA・ハッシュタグが表示されます。</p>";
  results.classList.add("empty-state");
  statusText.textContent = "入力を消しました。必要な内容を入れて生成してください。";
  copyAllButton.disabled = true;
  updateShareButtonState();
});

function getFormData() {
  const values = Object.fromEntries(new FormData(form).entries());
  const strengths = [values.strength1, values.strength2, values.strength3]
    .map(clean)
    .filter(Boolean)
    .slice(0, 3);
  const points = [values.point1, values.point2, values.point3]
    .map(clean)
    .filter(Boolean)
    .slice(0, 3);

  const normalized = {
    role: clean(values.role) || "美容師",
    area: clean(values.area) || "エリア未設定",
    strengths,
    workStyle: clean(values.workStyle) || "無理なく続けやすい働き方",
    salary: clean(values.salary) || "頑張りが給与に反映される給与モデル",
    teamMood: clean(values.teamMood) || "相談しやすく、落ち着いた雰囲気",
    dailyFlow: clean(values.dailyFlow) || "予約確認から始まり、施術に集中。空き時間に練習や共有をして、営業後はメリハリをつけて退勤。",
    points,
    targetTalent: clean(values.targetTalent) || "美容師として成長したい人・働き方を見直したい人"
  };

  normalized.strengthText = strengths.length ? strengths.join("・") : "高単価・教育制度・働きやすさ";
  normalized.pointText = points.length ? points.join("・") : "入客しやすい・相談しやすい・プライベートも大切にできる";
  normalized.mainStrength = strengths[0] || "働きやすさ";
  normalized.mainPoint = points[0] || "無理なく続けやすい";
  normalized.roleLabel = normalized.role === "美容師" ? "美容師" : `${normalized.role}美容師`;
  normalized.hasArea = normalized.area !== "エリア未設定";
  normalized.missing = Object.values(values).every((value) => !clean(value));

  return normalized;
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildOutputs(data) {
  return [
    {
      title: "① リール台本（40秒構成）",
      body: buildScript(data)
    },
    {
      title: "② テロップ一覧",
      body: buildTelops(data)
    },
    {
      title: "③ CapCut編集指示",
      body: buildCapCut(data)
    },
    {
      title: "④ Instagram投稿用キャプション",
      body: buildCaption(data)
    },
    {
      title: "⑤ CTA文",
      body: buildCta(data)
    },
    {
      title: "⑥ ハッシュタグ候補",
      body: buildHashtags(data)
    }
  ];
}

function buildScript(data) {
  return `0〜3秒：フック
「こんな${data.role}さん、絶対見て」
「${data.workStyle}で働きたい人いる？」
画：スタッフが笑っている瞬間、営業中の自然なカット、サロンの入口をテンポよく

3〜10秒：共感
「単価が上がらない、休みが取りにくい、人間関係で気を使いすぎる。そんな理由で、美容師を続けるのが少ししんどくなる時ってありますよね。」
画：予約表を見る手元、片付け、ふっと一息つくスタッフ

10〜25秒：サロンのリアル
「うちは${data.strengthText}が強みのサロンです。働き方は${data.workStyle}。スタッフの雰囲気は${data.teamMood}です。」
「1日は、${data.dailyFlow}」
画：カウンセリング、施術、スタッフ同士の会話、練習や撮影、退勤前の自然な様子

25〜35秒：魅力
「給与モデルは${data.salary}。おすすめポイントは、${data.pointText}。」
「${data.targetTalent}には、かなり合う環境だと思います。」
画：仕上がり撮影、スタッフの手元、笑顔、サロン内の空気感

35〜40秒：CTA
「気になる人はDMください。見学だけでもOKです。」
「いきなり応募じゃなくて、まずは話を聞くだけでも大丈夫です。」`;
}

function buildTelops(data) {
  return `感情を動かすワード
・この働き方、正直うらやましい
・美容師を長く続けたい人へ
・無理しすぎないサロン選び
・${data.role}として、もう一度ちゃんと伸びたい
・ここなら頑張れそう

共感ワード
・低単価で疲れていませんか？
・休みが少なくて余裕がない
・人間関係で気を使いすぎる
・入客できずに不安
・今の働き方、ずっと続けられる？

安心ワード
・見学だけでもOK
・DMで質問だけでも大丈夫
・いきなり応募じゃなくてOK
・働き方の相談できます
・${data.teamMood}サロンです

動画内で使いやすい短文
・${data.area}で${data.role}募集
・強み：${data.strengthText}
・働き方：${data.workStyle}
・給与：${data.salary}
・こんな人に：${data.targetTalent}`;
}

function buildCapCut(data) {
  return `全体設定
・尺：40秒
・比率：9:16
・BGM：${chooseBgm(data)}。求人感を出しすぎず、日常の雰囲気が伝わる曲
・文字：白ベース。重要語だけグリーンまたは黒太字
・テンポ：前半は少し速め、10秒以降はリアルが伝わるように落ち着かせる

カット秒数
・0〜3秒：フック。スタッフの笑顔、営業風景、店内を0.7秒刻みで3〜4カット
・3〜10秒：共感。悩みテロップを1.2秒ごとに切り替え
・10〜25秒：サロンのリアル。施術、会話、練習、撮影、片付けを自然に見せる
・25〜35秒：魅力。給与、休日、強み、おすすめポイントを1項目ずつ表示
・35〜40秒：CTA。スタッフの集合感または店内カットに固定テロップ

ズーム指示
・0〜3秒：軽いズームインで目を止める
・3〜10秒：手元や表情に寄って、悩みのリアル感を出す
・10〜25秒：引きの店内カットと寄りの施術カットを交互に
・25〜35秒：魅力テロップに合わせてゆっくりズームアウト
・35〜40秒：画面を安定させ、CTAを読みやすく固定

テロップ位置
・フック：中央大きめ
・共感：中央やや下
・サロンのリアル：下3分の1
・魅力：左寄せまたは中央。1行を短く
・CTA：下部固定。DM導線が指で隠れない位置

推奨テロップ
「こんな${data.role}さん、見て」
「今の働き方、ずっと続けられる？」
「${data.strengthText}が強み」
「${data.salary}」
「見学だけでもOK」`;
}

function chooseBgm(data) {
  const emotionalWords = ["落ち着", "プライベート", "マンツーマン", "少人数", "丁寧"];
  return emotionalWords.some((word) => `${data.workStyle} ${data.teamMood} ${data.pointText}`.includes(word)) ? "エモい" : "明るい";
}

function buildCaption(data) {
  const areaLead = data.hasArea ? `${data.area}で` : "";
  return `${areaLead}${data.role}として、今の働き方を少し見直したい方へ。

「休みが取りにくい」
「単価が上がらない」
「人間関係で気を使いすぎる」
「もっとちゃんと技術を伸ばしたい」

そんな気持ちがあるなら、一度うちの雰囲気を見てほしいです。

うちの強みは、${data.strengthText}。
働き方は${data.workStyle}で、スタッフの雰囲気は${data.teamMood}です。

1日の流れは、${data.dailyFlow}
求人票だけだと伝わりにくいですが、サロンの空気感はかなり大事だと思っています。

給与モデルは${data.salary}。
おすすめポイントは、${data.pointText}。

${data.targetTalent}には、きっと働きやすい環境です。

気になる方は、いきなり応募じゃなくて大丈夫です。
DMで質問だけでもOKですし、見学だけでも歓迎しています。

「求人見ました」と送ってください。`;
}

function buildCta(data) {
  return `DM誘導
・気になる方はDMで「求人見ました」と送ってください。
・${data.role}募集について、質問だけでもDMで大丈夫です。
・今の働き方で迷っている方は、まずはDMで相談してください。

見学誘導
・応募前にサロン見学だけでもOKです。
・スタッフの雰囲気を見てから決めても大丈夫です。
・${data.area}でサロンを探している方は、一度見に来てください。

質問しやすい一言
・給与、休み、入客、練習時間など、聞きにくいこともDMで聞いてください。
・「自分でも合いますか？」だけでもOKです。
・まだ転職を決めていなくても、話を聞くだけで大丈夫です。`;
}

function buildHashtags(data) {
  const baseTags = [
    "美容師求人",
    "美容師募集",
    "美容師転職",
    "美容師採用",
    "美容室求人",
    "アシスタント募集",
    "スタイリスト募集",
    "美容師新卒",
    "美容師中途採用",
    "サロン見学",
    "美容師の働き方",
    "美容師求人募集",
    "美容師さんと繋がりたい",
    "20代美容師",
    "30代美容師"
  ];

  const customTags = [
    data.area,
    data.role,
    data.workStyle,
    ...data.strengths,
    ...data.points
  ].flatMap(splitTagSource).map(toHashtag);

  return unique([...customTags, ...baseTags.map(toHashtag)])
    .filter((tag) => tag.length > 1 && tag !== "#エリア未設定")
    .slice(0, 15)
    .join(" ");
}

function splitTagSource(value) {
  return String(value || "")
    .split(/[、,・/／\s]+/)
    .map(clean)
    .filter(Boolean)
    .slice(0, 4);
}

function toHashtag(value) {
  return `#${String(value || "").replace(/[ #　、,・/／〜~.。]+/g, "")}`;
}

function unique(items) {
  return [...new Set(items)];
}

function renderResults(blocks, usedDefaults) {
  results.innerHTML = "";
  results.classList.remove("empty-state");

  if (usedDefaults) {
    const notice = document.createElement("p");
    notice.className = "notice";
    notice.textContent = "未入力だったため、よくある美容師求人リール向けの内容で生成しました。サロンのリアルを入れるほど、応募前の不安を減らせる文章になります。";
    results.append(notice);
  }

  blocks.forEach((block) => {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector("h3").textContent = block.title;
    fragment.querySelector("pre").textContent = block.body;
    const copyButton = fragment.querySelector(".copy-button");
    copyButton.addEventListener("click", () => copyText(block.body, copyButton));
    results.append(fragment);
  });

  statusText.textContent = "生成しました。求人投稿・リール編集にそのまま使えます。";
  copyAllButton.disabled = false;
  updateShareButtonState();
}

async function copyText(text, button) {
  const original = button.textContent;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "コピー済み";
    button.disabled = true;
    window.setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 1200);
  } catch (error) {
    fallbackCopy(text);
    button.textContent = "コピー済み";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  }
}

function fallbackCopy(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

function persistFormData() {
  const values = Object.fromEntries(new FormData(form).entries());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
}

function restoreFormData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const values = JSON.parse(stored);
    Object.entries(values).forEach(([key, value]) => {
      const input = form.elements[key];
      if (input) input.value = value;
    });
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function updateShareButtonState() {
  shareButton.disabled = !latestBlocks.length;
  if (!("share" in navigator)) {
    shareButton.textContent = "共有代わりにコピー";
    return;
  }
  shareButton.textContent = "共有";
}
