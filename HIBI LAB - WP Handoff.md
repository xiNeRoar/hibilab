# HIBI LAB Store — WordPress / WooCommerce 交接文件

> 給接手嘅 WP dev。呢份係「點樣將 HTML 設計交付物 轉成 Scent.M bespoke theme 入面嘅 WooCommerce 店中店」嘅完整跟進指引。設計稿全部喺 repo 根目錄嘅 `HIBI LAB *.html`。**本文件＝現行單一真相源；§21 關鍵決策與其他章節有出入時以 §21 為準。**

---

## 0. 定位（好緊要，先睇）
- **店中店（shop-in-shop）**：HIBI LAB 店係**套落現有 Scent.M bespoke theme 入面**，唔係另起新站、唔係將 Scent.M 改成純網店。
- **WooCommerce data-driven**：客淨係喺 wp-admin 入結構化 product data，前端 category / filter / 價自動出，唔使逐件寫 code。
- **入口（共 4 個，flip 時全數駁通）**：① Scent.M 全螢幕選單「Explore Hibi Lab」② footer「Hibi Lab →」③ 首頁「Explore Store」CTA（theme 現時三個都係 inert `data-coming-soon` stub）④ **top-nav utility cluster 嘅「HIBI LAB」文字 link（`.hibi-entry`，見 `scentm-home.html`；手機 nav 唯一店入口 — theme 未有，flip 時加入 `header.php`，flip 前唔好加（避免多一個死 link））**。
- **Scent.M 整合時序**：Scent.M 站現時只喺 staging、未 production —— **先做好 HIBI LAB，之後先整合入 Scent.M**。三個 coming-soon stub 嘅「即將開幕」標示／隱藏處理、第 4 入口、首頁描述句等入口層決定全部推遲到整合階段（見 §22 flip checklist）。
- **共通 chrome（nav / footer / 全螢幕選單 / WhatsApp / GSAP+Lenis）= 同 Scent.M 100% 一致**。設計稿已經 embed 咗真 chrome；轉 theme 時共通部分直接用返 theme 現有 partial，唔好另整。

---

## 1. 技術設定
- `add_theme_support('woocommerce')` + `woocommerce/` template override，維持 bespoke 設計全控制（唔使 Blocksy 等）。
- 沿用現有 **workshops CPT / template + ACF pattern**（archive ↔ single、Load-More `/page/N/`、image fallback、bilingual label）。
- Workshops 現有 Stripe 直駁線照舊；Products 用 **WooCommerce Stripe gateway**（on-site checkout、multi-item cart）。兩條 commerce 線並存，互不干擾。
- **Design tokens**：色 `#FDFBF9`(light) / `#F3EAE1`(beige) / `#A64B2A`(terracotta) / `#3B261D`(brown) / `#3B4A3D`(moss，寵物) / `#e8b896`(gold accent)。字 Baskervville + Cactus Classical Serif（serif）、Montserrat + Noto Sans TC（sans）。
- **狀態／輔助 tokens**：成功 `#1f7a4d` · 錯誤 `#b4452a`（付款錯誤 banner 另用 `#fbeae4`/`#e3a58c`/`#8a3618` 三色組）· hairline 分隔 `#ece0d5` · input 邊框 `#d8c8ba` · 售罄灰掣 `#cbb8a6`（§20.8 售罄 disabled 掣色；demo 未 render，屬預留 token）· 圖片 fallback 底 `#efe6dd`。
- **Breakpoint**：store 頁用 **771px**（刻意 store-scoped）— 同 Scent.M theme 嘅 768px 並存，**唔好「修正」統一**（落地方式見 §22）。

---

## 2. 頁面清單（HTML 稿 → 對應 WC template · 完整 inventory）
| 設計稿 | 對應 template | 類型 |
|---|---|---|
| `HIBI LAB Landing.html` | 自訂 page template | 品牌 landing |
| `HIBI LAB Shop.html` | `archive-product.php` + `content-product.php` 卡 + filter | PLP（★ filter 重點） |
| `HIBI LAB Product.html` | `single-product.php` | PDP |
| `HIBI LAB Cart.html` | `cart/cart.php` override | 購物車 |
| `HIBI LAB Checkout.html` | `checkout/form-checkout.php` override | 結帳（詳見 §13/§17） |
| `HIBI LAB Order Received.html` | `checkout/thankyou.php` override | 訂單完成（跟 Scent.M `page-thanks.php` 版式） |
| `HIBI LAB Account.html` | `myaccount/*` override（logged-in） | 會員中心（詳見 §9/§18） |
| `HIBI LAB Account Login.html` | `myaccount/form-login.php` + `form-lost-password.php` + `form-reset-password.php`（logged-out） | 登入／註冊／忘記／重設（詳見 §18） |
| `HIBI LAB Shipping.html` | 靜態 page | 送貨 & 退換政策 |
| `HIBI LAB 404.html` | `404.php`（按 URL 分流：`REQUEST_URI` 以 `/hibi-lab/`（或 WC journey slug）開頭 → render HIBI 版；否則 render 現有 Scent.M 版。兩個設計原封不動，§21） | 404 |
| `HIBI LAB Tier Cards.html` | 會員等級卡設計（融入 `myaccount` dashboard，動態 render，§5/§21） | 等級卡 live 樣板（seed：一般／銀級／金級＋進度條） |
| `HIBI LAB Email.html` | 後台可編輯 email 範本（option 儲存，§21/§22）。**demo 稿現示 5 款；目標 6 款**（加 ⑥補購提醒，隨前台工作補上） | 交易 email 設計稿 |
| `index.html` | —（= `HIBI LAB Landing.html` 嘅 byte-identical alias，方便 repo 直開） | alias |
| `scentm-home.html` | —（Scent.M 首頁 chrome 整合示範：Explore Hibi Lab 連結點樣駁去店；非 HIBI 頁面） | 整合參考 |
| `_p13-shop-emptycat.html` | —（PLP 空分類狀態獨立示範，對應 §22 空狀態變體 (a)） | 狀態示範 helper |

---

## 3. 產品 data model（客喺 wp-admin 入，唔使逐件寫 code）
- **分類** = `product_cat`（護膚品 / 寵物護理 / 助眠系列 / 家居香氛），hierarchical，客自己加減。
- **分類入口動態化**：Landing 4 張入口卡、Shop 分類 pills、PLP 橫幅 map **全部由 WP loop top-level `product_cat` terms 動態 render**（唔 hardcode 4 個 slug）；每個分類嘅 eyebrow／title／intro／橫幅相 = **ACF term fields**（`get_field('…','product_cat_'.$term_id)`），現有 4 個分類嘅稿內文案+`cat-*.png` 做 seed 預設值。客加第 5 個分類 = 入口卡／pill／橫幅／archive 自動齊。Demo 稿嘅 4 卡/4 pill 係呢個 loop 嘅視覺樣板。
- **Filter 軸 = global product attributes**（一次過設定 term，之後每件剔）：`pa_功效` / `pa_適用對象`(人/貓/狗/居家) / `pa_香味`(swatch) / `pa_容量` / `pa_形態`(噴霧/按摩油/洗髮水/消炎水/精華/潔面/擴香)。→ filter facet + count **自動由 attribute 生成**，加新 term 客即場加。
- **容量 = variation attribute** → variable product → PLP 顯示「$X 起」、PDP size 揀掣、容量 filter。
- **Variation 模型（明確版）**：demo PDP 實際係**雙軸 variable product** — `pa_容量`（帶價）×`pa_香味`（配方）；production 用 two-attribute variable product，每個組合獨立庫存（缺貨組合 → 揀掣 disabled，見 §20.8）。
- **ACF field group（逐件產品，跟 workshops ACF pattern）**：產品介紹、整體功效（成分→功效逐項）、成分、用法、適用對象、規格（貨號等）、**建議補購間隔（`hibilab_repurchase_interval`，數字＝週；空＝此產品唔納入補購提醒 opt-in，§21.12）**。
- ⚠️ **紀律**：data 入落**結構化欄位**（剔 attribute term），唔好淨係打落產品名／描述 → filter 讀 attribute，唔 parse 個名。

---

## 4. Filter 引擎 = 全 custom in-theme（§21）
- **實作**：沿用 theme 現有 journal AJAX partial + load-more + `scentmRevealScan` pattern；`tax_query` + AJAX 自己寫；facet live counts 用「先攞符合現有 filter 嘅 product ID set → `wp_get_object_terms` 計數」（boutique 目錄規模零壓力）；價格 slider min/max 由 `wc_product_meta_lookup` 攞；URL 參數（`?pa_香味=薰衣草`，SEO-friendly、可分享）。
- **無 plugin、無年費**（如日後 SKU 過千先再評估 FacetWP 一類）。
- `HIBI LAB Shop.html` 示範咗目標 UI：checkbox facet + count + active chips + price 雙 handle slider + sort + 手機 filter drawer + 載入更多。

---

## 5. 會員帳戶 ＋ VIP 等級（簡化版・已對抗式 review：logic＋money-safety＋copy）
> 完全後台可設定、等級數任意（demo 一般／銀／金＝seed）。詳細裁決見 §21；build guard＋客面文案見 §22。核心：會員價 = 一個**自動 price filter**（非 coupon、never-store、落單一刻 server 用當刻等級重算）。

**A. 後台（ACF repeater「會員等級」，options page「VIP 設定」）**
- 自由**新增／刪除／拖拉排序**等級。每級：中/英名 · 升級門檻（近 12 個月**淨消費** HKD）· **一個全單會員折 %** · **主色一隻**（系統自動搭「深底→主色」漸變卡、符合品牌）· **生日月折扣 %**（只 %、非 $）· **無限「其他會籍禮遇」文字**（描述類 perk、人手兌現）· 啟用／停用。
- **基本級（$0 / 0%）= 明確第一行、不可刪不可停用。** 全域：計算窗口（預設近 12 個月）· **總開關**（OFF = 全站無會員價、所有人原價）· **手動 override**（pin 特定客做指定級，勝過自動計算，直至 admin 清除）。
- 每級有隱藏 stable id；驗證：一個 $0 base、門檻嚴格遞增、auto-sort by 門檻。demo 三級（$0／$2,000／$5,000、Silver 10%／Gold 15%）＝seed 可改值。

**B. 會員價（自動、非 coupon）**
- 登入會員按等級**自動**享全單 % 折後價（price filter），**四捨五入到整數蚊**。
- vs 產品特價 = **取較平**（先 round 會員價、後同 sale 取 min、**不 re-round sale**）。vs 客人優惠碼 = **二選一取最抵**（§6）。
- **生日月自動加成**：會員生日月內，有效折 = max(tier%, 生日%)，**無 code、無 wallet**；1 號寄祝賀 email；一年一次。生日與否喺**落單一刻**用香港時區定死、寫入 order meta，之後唔再判。

**C. 等級升降（永不儲級、每次即場用淨消費算）**
- 升級：每張單**完成**即時。
- 降級兩種：**退款**令淨消費跌穿門檻 → **即刻扣、即刻反映**（封「買完即退保級」窿）；**舊單過 12 個月**跌出窗口 → **唔期中跌**，到會員各自 12 個月結算日**全部重算**（可一次跌多級、**無軟著陸**）。期內級 = max(即場淨消費級, 周期開始 pin 嘅 floor 級)。**結算日錨定＝各會員註冊日週年（rolling 12 月）；每日 WP-Cron sweep 當日到期會員做 full recompute（同 §22 G8 生日 cron 一樣機制）。**
- Guest：**唔累積**；就算之後同 email 開帳戶，舊 guest 單**唔計**入等級（只計註冊後嘅單；歷史可顯示但唔計級）。

**D. 會員搶先（限會員先買嘅專屬商品）**
- 閘喺**產品**（勾「限會員」+ 揀最低等級）；夠級會員正常買、未夠級／訪客**買唔到**，**server 端攔**（加入購物車＋結帳都攔）。
- 顯示：夠級 → 會員價＋tag＋正常加購；**未夠級會員 → 鎖住提示「需 {級} 會員」＋升級指示（見正常原價、無會員價 tag、無劃線，只係加購位變鎖）**；訪客 → 提示登入（同樣見正常原價）。
- 引用嘅最低等級被刪／停用 → **停售（fail closed，絕不 fail-open）**；gate 用門檻值比較、非 row 次序。同「預訂」分清（搶先＝有貨限會員；預訂＝缺貨任何人，§19）。

**E. 前台顯示**
- Account 概覽頂：**一張自己等級卡**（單張全闊漸變橫額＝名＋近 12 月消費＋進度／已達最高，`Tier Cards.html` 樣板、色按等級自動；**唔做全部等級 ladder**）。
- Shop 卡／PDP：**會員價＋劃線原價＋「{級}會員價」細 tag**；未登入 → **teaser「登入即享會員價 · 全單 X 折起」**（X＝入門付費級折）。
- Cart／Checkout：**一行「會員專屬價 · {級}」**，**不可移除**（自動，標「自動」小章、非 ✕）。

**保留（WC 原生）：** 註冊／登入／忘記密碼（§8；註冊＋帳戶設定收**生日 月+日**）· 訂單／地址／設定（§9）· guest checkout（§17）· 優惠碼（§6）。

**唔做：** 積分 · **優惠券錢包**（生日改自動加成，冇券要儲）· generic 分類／產品／滿額折扣引擎（呢類 promo 用原生 coupon，§6）· 軟著陸。

---

## 6. 優惠券 Coupon（native WC · 一次一張 · vs 會員價二選一取最抵）
- 全部 **WC native**：admin 喺 WooCommerce 原生後台建碼（%／$、限產品／分類／滿額、用量限制、到期）。**無自訂引擎、無 auto-apply**；客人 Cart／Checkout 自己輸入。
- **一次一張**：所有碼 `individual_use`。**冇免運碼、冇並存例外**（免運＝全店門檻 `hibilab_free_ship_threshold`，與 coupon／VIP 無關，§7）。**刪除 demo 遺留嘅 `FREESHIP`／`ship` 類型同「免運碼可並存」分支**（Cart.html:602 / Checkout.html:489,496）。
- **vs 會員價 = 二選一取最抵（全單口徑）**：兩者都喺**全單原價 subtotal** 上比較 —— `member_savings ＝ 全單原價 − 全單會員價`；`coupon_savings ＝ WC 對現購物車計出嘅折扣`。**coupon 嚴格大過會員價先套用**（贏嗰個整單套、輸嗰個完全 suspend、**唔疊加**；平手回會員價）。會員價係**保底**：每次購物車 recalc（qty／刪 line／改運費／apply／remove 都 fire），若已套嘅 coupon 唔再大過會員價 → **自動用返會員價**（fixed-$ coupon 先 clamp 到 subtotal）。落單／付款一刻 server 用**當刻等級＋當刻日期**無條件再跑一次（覆蓋跨午夜／跨結算，唔靠 client 事件）。
- **客面文案（禁「保留／暫停／留」；全套 §22）**：碼唔夠會員價抵 → 唔套用,出「**已為你自動採用更抵嘅會員價,此優惠碼慳幅較少,無需使用。**」；碼贏 → 折扣行 label「**優惠碼 {code}**」＋訊息「**已套用優惠碼,為你慳到最多。你嘅會員價一直生效,日後自動以最抵價錢計算。**」
- **管理 affordance**：Cart 客人自套碼嗰行「移除 ✕」；**會員自動價嗰行唔俾移除**（標「自動」小章）。Checkout 收埋式欄有碼時「已套用 {CODE} · 更改」。套第二張碼 → WC 原生拒絕「一次只可使用一張優惠碼,請先移除現有優惠碼」（經 §22 notices skin）。無效碼**唔影響**已套用嘅碼。
- **免運門檻口徑**：free-shipping min-amount 測「**會員價之後、coupon 之前**」嘅小計（會員自動價當實際貨價；一張 coupon 可令跌穿門檻）。WC free-shipping method 設 evaluate **before** coupon。

---

## 7. 送貨 & 訂單狀態（ShipAny）
- **送貨方式 = 送上門 + 自取點**（智能櫃／便利店／順豐站 — ShipAny 網絡）。Checkout「送貨方式」UI：radio 卡「送上門」／「自取點」（= WC 原生 shipping method 列表嘅品牌 skin）；揀自取點 → 出選點器。**production 選點 UI = ShipAny plugin 自家「pick-up dialog」彈窗**（有地區 filter＋Change Address 掣，手機版另有優化）— demo 嘅 inline mock 下拉+已選點卡係視覺 placeholder，實作以 plugin 彈窗為準、theme 只 skin 外圍。自取點清單「寄生」喺 WC 原生 Local pickup method 上（要喺 Shipping zones 加 Local pickup 先開到 Locker/Store List）。
- **運費 = 商家預設 per-method 費率（唔係 checkout 即時報價）**：官方文檔冇任何「checkout 按地址 live quote」；checkout 費率由商家喺 WC shipping zones／ShipAny Portal「Shipping Profile」（plugin v1.1.70+「Show Shipping Options at Checkout」）預先設定，金額對齊 ShipAny 價目（例：SF E-comm Box F1–F5 = HKD 28–98）。「即時報價比較」係商家出單嗰刻用嘅功能。**Demo 稿內運費銀碼（$45／$32 等）都係示範值。** Shipping Profile 精確行為官方冇公開文檔 — staging 實測定案。
- **免運門檻 = 保留機制、金額後台自訂**：ACF option `hibilab_free_ship_threshold`（demo 顯示 $500 只係示範）；設空／0 = 停用，全站免運文案+nudge 自動隱藏；達門檻 → 任何送貨方式免運（差額商家吸收）。§22「運費字串單一來源」照用（六個消費位，包括側滑車）。plugin 有專屬「Locker/Store List Minimum Checkout Amount for Free Shipping」設定（v1.0.33）管自取點免運；送上門免運行 WC 原生 free shipping — **ACF option 要同兩處設定一致**（health 提示）。
- **4 區地址欄**（香港島／九龍／新界／離島，`woocommerce_states`）；客人揀完自取點 plugin 會 write-back 地址欄（block checkout 曾有 write-back bug、v1.1.101 先修 — 我哋用 classic shortcode checkout，一向係穩陣嗰邊）。
- **訂單狀態／時間線 = 4 步**：已確認 → 處理中 → **已寄出** → 已完成。「已寄出」步顯示**追蹤號 + 追蹤 link**。**ShipAny plugin 唔會改 WC order status（v1.1.103 全源碼 grep `update_status` 零命中）、冇 webhook/callback** — theme 自己註冊 custom status `wc-shipped`（入 `wc_order_is_paid_statuses`），掛 plugin 出單成功嘅 **`do_action('pr_shipping_shipany_label_created', $order_id)`** action（源碼 5 個出單位都 fire）做 processing→shipped 轉換＋觸發寄出通知 email。
- **追蹤資料**：plugin 出單後追蹤存 order meta `_pr_shipment_shipany_label_tracking` ＋寫一條 WC **customer note**（會行原生「Note added to your order」email）；ShipAny 追蹤頁格式 `https://portal.shipany.io/tracking?id={ShipAny shipment UID}`（**id 係 ShipAny UID，唔係順豐單號**）；courier 真單號 `trk_no`＋courier 追蹤 URL `trk_url` 另存 meta，設定 `show_courier_tracking_number_enable` 可一齊顯示。另有 **ShipAny plugin 自帶** token `{shipany_tracking_note}` 同 shortcode `[shipany_tracking_note]`／`[shipany_tracking_link]`（**屬 plugin、唔喺 §22 theme 範本 master placeholder 清單；如要喺我哋品牌範本用要另行支援**）。
- **Email**：寄出時發「寄出通知」email（範本組第 ② 款，見 §21/§22），含 `{tracking_no}`（=courier trk_no）`{tracking_url}`（=trk_url 或 portal tracking link）`{carrier}` — 全部由上述 order meta 讀。**防雙重通知：plugin 設定 `shipany_tracking_note` 設 'yes' 令佢條 tracking note 變 internal-only**，客人只收我哋品牌 ② 款。Shipping 政策頁「出貨後將以電郵提供追蹤資訊」承諾**成立**。
- **WP 實作**：官方 plugin「**ShipAny WooCommerce: Ship, Label, Tracking**」（wordpress.org slug `shipany`，現版 1.1.103 活躍維護，HK-only，HPOS 相容 v1.1.91+，classic checkout 歷史上最穩）。設定流程：裝 plugin → WooCommerce Settings → Shipping tab 貼 portal.shipany.io Settings 攞嘅 API Token → **首次出貨前要喺 portal 增值（top-up）物流費**。商家出單/印單：WC order metabox（Create ShipAny Order／Download Waybill／Send Pickup Request）＋ order list bulk actions（多張 waybill 自動 merge 一個 PDF），或 ShipAny Portal；可設「訂單轉 Processing 自動出單」。**費用：plugin 免費、無月費、按單付運費（先增值後扣）；客人揀自取點嘅清單功能係收費 add-on「Courier Service Point Listing」HKD 100/月 — 該月經 ShipAny 出過 1 單即豁免，14 日免費試用。**
- **已知風險**：① 自取點寄生喺 Local pickup — 想「工作室自取」＋「智能櫃」並存曾有全部 method 被改名做「ShipAny SF Locker」嘅衝突紀錄（v1.0.55 有 fix）— **staging 必測**；② 香水／含酒精產品運輸限制官方文檔零記載 — **客戶要直接同 ShipAny／順豐確認危險品政策**；③ plugin 用戶基數細（200+ installs）但官方活躍維護 — 更新前 staging 先行。
- **Launch gate**（§22）：ShipAny 帳戶開通 + API Token 入好 + portal 增值 + Courier Service Point Listing 開通 + staging 測試「出單→印單→追蹤 write-back→選點」全鏈一次。

---

## 8. 登入 / 註冊 / 忘記密碼（原生 — 只 skin）
- 登入 / 註冊 / **忘記密碼（lost-password → email → reset）** / 重設密碼 / 登出 = **WooCommerce + WP 原生**（endpoint + email 全包）。**唔使寫 auth 邏輯。**
- 唯一工作 = **template override + CSS 套返品牌樣式**：`myaccount/form-login.php`、`form-lost-password.php`、`form-reset-password.php`。
- 四個 view — 登入／註冊／忘記密碼／重設密碼 — 已全數喺 `HIBI LAB Account Login.html`；demo 切換流程見 §18。

---

## 9. 會員中心面板（`HIBI LAB Account.html`，對應 my-account endpoints）
- **概覽**：歡迎句 + 統計（累積訂單／累積消費）+ **自己等級卡**（概覽頂一張，loop VIP repeater 出當前級＋近 12 月消費＋進度條／已達最高；主色讀該級設定；`Tier Cards.html` 樣板）+ 最近訂單。**唔做全部等級 ladder、唔做獨立「會員等級」nav、唔做優惠券錢包**（生日改自動加成、冇券要儲；demo Account nav ＝ 概覽／訂單／地址／設定／登出）。
- **補購提醒**：管理面板 — 睇／改／取消喺結帳 opt-in 咗嘅補購提醒（產品／間隔／下次寄送日）。**Data model：客揀嘅間隔＋下次寄送日存 Action Scheduler 排程記錄（＋鏡射一份落 user-meta 供面板列表）；產品建議間隔＝ACF `hibilab_repurchase_interval`（§3）做預帶。** §21。
- **訂單記錄**：可展開詳情（**4 步狀態時間線** 已確認→處理中→已寄出→已完成，「已寄出」步顯示追蹤號+追蹤 link + 商品明細 + 小計/運費/總計 + 送貨地址 + 再次購買 + 「查詢此訂單」細 link）。
  - **非快樂狀態視覺**：已退款／已取消／付款失敗 → **唔出 4 步時間線**，改單行狀態 label（已退款/已取消 = muted brown、付款失敗 = `#b4452a`）+ 已退款單加「已退款 −HK$X」金額行；處理中/已寄出照 timeline。Label token 對照見 §22。
  - **再次購買 = WC 原生 order-again endpoint**：全部可購 line 以**現價**重新入車，唔可購（售罄/下架）項出 per-item notice；成張單冇 line 可購 → 藏個掣。demo 個單一 PDP link 只係 placeholder。
- **地址**：帳單 + 送貨地址卡 + 編輯 / 新增表單（對應 WC billing/shipping address）。
- **帳戶設定**：個人資料（名/電郵/電話/**生日**）+ 變更密碼（對應 WC account details）。生日欄供生日月自動加成用（§5）。
- ⚠️ 稿內數字全部係 placeholder → 由 WC / user data 取代。

---

## 10. 全站設計鐵則（轉 theme 時要守）
- **HIBI LAB 內容區文字最小 16px**（label / eyebrow / 註腳 / 按鈕 一律 ≥16px）。**例外**：共通 Scent.M chrome（nav/footer/menu）維持原樣；icon glyph 不受管；及 `Landing.html` 現有 sub-16px 元素獲豁免 — 維持原樣，其餘 9 頁照守。
- 同排 card **等高**（flex-col + 圖固定 4:5 aspect + 價/CTA `mt-auto` 釘底）。
- **產品圖 borderless**：`object-cover` 填滿 4:5 框、統一暖色 fallback `#efe6dd`（因商家自上載相、背景唔一致）。**唔好逐張 sample 相片色做 card bg**。
- 無假數據（唔放假評價數 / 假頭像）。
- 全站一個 `max-w` 容器、`px` 同層對齊。
- 動畫：scroll-reveal 為主；hover 用 image-zoom（`group-hover:scale-105` / `duration-500`）；禁 cheap lift/shadow。

---

## 11. 商家上載相片規範
- 白底 / 透明背景最佳；但 borderless 卡設計對任何背景都 graceful。

---

## 12. 共用店面組件 `store-chrome.js`（搜尋 + 側滑購物車 — 單一真相源）
- **係咩**：全站共用嘅 search overlay（command-palette 式）+ slide cart（側滑抽屜）。**一份 source**，每個店頁 `<script src="store-chrome.js"></script>` 載入，自動注入 markup + wire 返 nav 嘅搜尋掣同購物車 icon。**唔好逐頁 copy**。
- **觸發**：nav `#nav-search-btn` → 搜尋；`a[aria-label="購物車"]` → 側滑車（intercept click，`href` 作 fallback）。
- **Scroll-lock**：抽屜 / overlay 開啟時鎖背景 —— 依賴每頁 chrome 將 Lenis 實例 expose 做 `window.hbLenis`（`const lenis = window.hbLenis = new Lenis(...)`）；`store-chrome.js` 用 `hbLenis.stop()/start()`（`overflow:hidden` 實際由 Lenis 嘅 `.lenis-stopped` CSS 提供）。**新頁必須照樣 expose，否則背景會 scroll-through。WP 側：theme 嘅 `assets/js/theme.js` 已經 expose 咗 `window.hbLenis`（theme.js:25；header.php no-js guard 亦已依賴佢）— 唔使再加。**
- **搜尋資料**：`store-chrome.js` 內含 `PRODUCTS_JSON`（demo static；Shop 有 `#plp-data` 就用返，其餘頁自動注入）。**Production：兩份都由 WooCommerce 產品資料取代 — overlay 行 §22 拍板嘅自訂 REST endpoint、直入 `?s=` 301 去 PLP（單一來源，見 §20.5/§22 搜尋契約）；static dataset 只係 demo。**
- **WP 對應**：`store-chrome.js` → theme JS（`wp_enqueue_script`）；抽屜/overlay markup → 一個 `get_template_part('template-parts/store-chrome')`，喺 footer include 一次。購物車內容接 WooCommerce cart fragments（`woocommerce_add_to_cart_fragments`）即時更新；**drawer 嘅 qty +/− 同 移除 = 自訂 wc-ajax endpoints（§22 — fragments 只係 re-render 機制，唔包 mutation）**；drawer 空狀態見 §22；結帳掣 → `wc_get_checkout_url()`。
- **一致性守則**：nav utility cluster（搜尋 + 會員 + 購物車 icon，全部 ≥ 手機可見）+ `store-chrome.js` include **每個店頁都要有**，順序一致。

---

## 13. 新增頁面 + 購買旅程接線（skin，交接用）
- **新頁（全部 = WooCommerce 原生流程嘅品牌 skin；邏輯用原生，呢啲係樣式參考）：**
  - `HIBI LAB Checkout.html` → `woocommerce/checkout/form-checkout.php` override（聯絡 / 送貨 / **送貨方式（ShipAny 送上門+自取點，§7）** / Stripe 付款 / 訂單摘要 + 優惠碼收埋式欄 + 預訂同意 checkbox（如車內有預訂項，§19/§20.1）+ 補購提醒 opt-in（適用產品，§21）)。
  - `HIBI LAB Order Received.html` → `woocommerce/checkout/thankyou.php`（訂單完成頁）。**沿用 Scent.M `page-thanks.php` 編輯式版式**（serif-italic eyebrow + fluid-display 標題 + 白底 `<dl>` 詳情卡 + underline 連結）；可直接 reuse thanks template + 訂單詳情卡，一如 workshop booking completion（`?booking=ID&token=`）。
  - `HIBI LAB Account Login.html` → `myaccount/form-login.php` + `form-lost-password.php`（登入 / 註冊 / 忘記密碼，tab 切換 = demo；實際 3 個原生 template）。
- **旅程接線（前端）：** Landing 4 類別門 → `Shop.html?cat=<slug>`；Shop 讀 `?cat=` 自動套 dept filter（沿用現有 dept pill；demo slug = skincare/pet/sleep/home，**production slug 跟 top-level `product_cat` terms 動態出，唔 hardcode — §3**）；搜尋結果直接喺 overlay 顯示全部（唔再外跳）；PDP「加入購物車」→ 彈 slide cart 確認；Cart / slide cart「去結帳」→ Checkout → 確認及付款 → Order Received。
- **WP 對應：** `?cat=` → `product_cat` archive 或預套 filter；結帳 / 訂單完成 / 登入全部係原生 endpoint，只做 template override + CSS skin，唔改邏輯 / payment。

---

## 14. Demo 硬資料 → WP 綁定對照（交接檢查表）
> 所有靜態頁上嘅數字 / 文字 / 相片都係 **demo placeholder**（靜態設計交付物本質），全部應由後端資料取代：
- 產品(名/價/相/容量/成分/功效) + 搜尋資料(`store-chrome.js` `PRODUCTS_JSON`) → **WooCommerce products / 產品查詢**。
- 購物車行項目 + nav 購物車數字「2」+ 小計/折扣/總計 → **WC session cart / cart totals**。
- 會員(Amanda、電郵、訂單 #HL-…、地址、**等級／近 12 月消費**) → **登入用戶 / WC 訂單 / VIP 等級計算（§5）**。
- **Demo 每頁嘅 `<head>`（title/description/canonical/JSON-LD）全部係 throwaway** — production 由 theme 嘅 `inc/seo.php` SEO 層統一生成（per-page canonical、Product/BreadcrumbList schema、journey 頁 noindex），唔好照搬。
- 免運門檻、Checkout 摘要、Order Received 訂單編號/金額、運費、VIP 門檻/折扣 → **ACF options + WC order data + WC shipping zones 商家預設 per-method 費率（§7）+ VIP repeater（§5）**。
- Menu(About/ODM/Workshops/Journal/Testimonials/Contact)、Privacy/Terms 連結 → **現有 Scent.M 站頁面**（production 解析，非 HIBI 範圍）。
- Scent.M nav logo → `home_url('/')`（靜態暫指 `index.html`）。
- **WP-readiness**：共用 chrome 全站一致、`store-chrome.js`=partial、`?cat=` 要接；轉 theme 時 HTML→PHP template + Tailwind 由 `build-css.js` 編譯（唔用 CDN）。

---

## 15. PDP 內容區塊 = ACF Flexible Content（merchant 自由 create + 拖拉排序，同 Journal/Workshop 一致）
PDP 下半部**一定要做成 ACF Flexible Content field**（建議 `pdp_blocks`）：商家喺 wp-admin **自由新增 / 刪除 / 拖拉排序** block，同 `scentm-wp` Journal / Workshop 嘅 flexible-content **完全一樣 pattern**；`single-product.php` loop 每個 layout render。現靜態稿每個 section = 對應 block layout 嘅**視覺樣板（1:1）**。
**Block layout 目錄（= 現稿 section）：**
- `rich_text` — 標題 + 正文(產品介紹)
- `spec_list` — 標籤/值對照(成分→功效逐項、規格)
- `steps` — 編號步驟(用法 01/02/03)
- `callout` — 提示框(安全使用須知，左 terracotta 邊)
- `stat_row` — 數字統計(為何純露 1% / 0.2–0.3% / 0.1%)
- `faq` — 問答 repeater
- `image` / `gallery` — 單圖 / 多圖
- `video` — 影片(使用示範)

每個 layout 欄位 + 樣式跟現稿 token（serif 標題 / ≥16px 正文 / `#ece0d5` 分隔 / terracotta accent）。安全須知 / 純露科普 / **保存期限（保存期限・開封後使用期・儲存方法，`spec_list` layout — 純露類產品標準購買疑慮；內容由客戶上架時提供，launch checklist 有項）** 若全線通用可設 theme 預設 block，逐件可加自己版本 override。上半部（相片庫 / 標題 / 價 / 香味 variation / 加入購物車）= WooCommerce 固定 summary，唔入 flexible-content。

---

## 16. WhatsApp 浮動掣 ＋ 支援渠道
- **WhatsApp 浮動掣（context-aware · 兩個號碼，WP 後台可入）**：Scent.M 頁 = B2B「Bespoke Inquiry」；HIBI LAB 店頁 = B2C「Customer Care」（客服 label 用英文，同 Scent.M chrome 一致；預填訊息維持廣東話）。**兩個 WhatsApp 號碼由客喺 wp-admin 自己入**（ACF/theme options：`scentm_opt('whatsapp_number')` + `whatsapp_text`；HIBI LAB 加平行 option `hibilab_whatsapp_number` + `_text`，**只喺有號碼先 render、唔 fallback 去錯號碼**（同 `footer.php` `if($wa)` 一致）），前端按頁面 context 出對應號碼 + 文案；綠色 WA 本體不變，只換 label / 預填 / 號碼。HIBI LAB demo 沿用 inert `href="#"` + `data-wa-pending`（唔 render 假號碼）；上線由客喺 wp-admin 填客服號碼先出現（同 Scent.M 嘅 hide-if-empty 行為一致）。
- **支援 email**：平行 option `hibilab_support_email` — Shipping 政策頁「退換流程／有疑問」以 mailto render，hide-if-empty；「查詢此訂單」link 嘅 fallback 渠道。**兩個支援渠道（WA 號碼＋support email）都係 §22 launch gate 硬項** — hide-if-empty 唔可以變成「店開咗但零支援渠道」。

---

## 17. 登入狀態 → Cart / Checkout 顯示
- **Guest checkout 允許**（`Accounts & Privacy → Allow guest checkout`），設計稿 Cart / Checkout 預設 guest。
- **Guest vs Member 顯示唔同**：小計 + 運費（送貨方式於結帳計算，§7；免運門檻 admin option）+ 總計；coupon 欄可用（§6 規則）。**登入會員**額外出 **會員專屬價行（自動會員價，不可移除，§5）**＋（若同時輸入優惠碼）**「二選一取最抵」結果（§6：coupon 嚴格大過先套、否則回會員價）**；guest 冇會員行、可用優惠碼。Cart 可加「登入即享會員價」一類提示（guest 見）。
- **Checkout「已有帳戶？登入」= WC 原生 inline returning-customer 展開式表單**（`woocommerce_checkout_login_form`，用 `.co-field` tokens skin，喺 checkout 頁內展開，**唔係**跳去 Account Login 頁 — demo 個跳頁 link 只係 placeholder）。登入成功留喺 checkout，購物車不變。
- **其他入口嘅登入後返回路徑**：任何由店頁去 login 嘅 link 帶 `?redirect_to={當前 URL}`；theme hook `woocommerce_login_redirect` + registration redirect 尊重佢（fallback = my-account）。
- **Cart summary = 可編輯估算**（coupon + qty）；**Checkout summary = 唯讀 review**（line items 縮圖 + 最終數 + **收埋式優惠碼欄**，無 qty 編輯，改數返 Cart）。cart / checkout 總計必須一致（共用 `WC()->cart`）。

---

## 18. 帳戶 auth = 單一 `/my-account/` route（session 切換 · WooCommerce 標準）
- 設計稿有兩個 state 檔：`HIBI LAB Account Login.html`（logged-out：登入 / 註冊 / 忘記密碼 / 重設連結已寄 / 重設密碼）+ `HIBI LAB Account.html`（logged-in dashboard）。
- **Production 唔係兩條獨立 public route** —— WooCommerce = 一個 `/my-account/` core page 按 session 自動切換：未登入 → login/register；已登入 → dashboard；`/my-account/lost-password/`；email 重設連結 → reset form。
- Theme override：`woocommerce/myaccount/form-login.php` / `form-lost-password.php` / `form-reset-password.php` / `dashboard.php`，**唔好將 static HTML 原封搬入 production**。
- **Login 頁 eyebrow「HIBI LAB」= link 去 `/hibi-lab/`**（Login 係唯一冇 breadcrumb 嘅店頁，eyebrow 做返回路徑；demo 已改 `<a>`，form-login.php override 要跟）。
- Demo flow loop（已通，非 orphan）：會員 icon → Account（假設已登入）→ 登出 → Account Login → 登入 submit → Account。兩份稿 = 同一 route 兩個 state；auth 邏輯 + email 全 WooCommerce 原生，theme 只 on-brand skin。

---

## 19. 庫存狀態 product state（有貨 / 預訂 / 售罄）
- **資料來源：** WooCommerce 原生庫存 ＋ backorder 設定。**三態**：有貨（正常）／**預訂**（缺貨但開放 backorder，客即刻付款、約 1–3 週到貨）／售罄（缺貨且不開放）。
- **售罄：** 產品卡 + PDP 圖上 `售罄` badge（深啡底淺字）· 圖 `opacity:.55` · 加入購物車掣 disabled 灰態「已售罄」。（**唔做「補貨通知」訂閱** — 售罄只顯示灰態掣。缺貨想收訂單就設「預訂」，唔設就係售罄。）
- **預訂：** 產品卡 + PDP 圖上 `預訂` badge ＋ 卡/PDP 出「約 1–3 週到貨」行；PDP「加入購物車」→「預訂」掣（**仍可撳、即刻付款**）；結帳必填同意 checkbox（§20.1）。badge class **`.stk-pre`**（樣式建議 terracotta 系，別於售罄深啡）。
- **會員搶先（同「預訂」分清）：** 有貨、只限 qualifying tier 會員先買 → PDP 出「會員搶先」badge、非會員/未達級鎖定加入購物車。**呢個唔係缺貨預訂**（§5）。
- badge class `.stk-out`（深啡）/ `.stk-pre`（預訂），`position:absolute;top:12px;left:12px;font-size:16px;padding:5px 13px;border-radius:30px`（demo `.stk` 實值）。WP 由庫存條件 render，設計稿提供視覺 pattern。
- **搜尋 overlay 結果行同樣要出 售罄／預訂 tag**（重用 `.stk` token；§22 搜尋 endpoint payload 嘅 `stock` 欄為 `in|preorder|out`，overlay 消費佢 — 免得撳個結果入到 PDP 先見到狀態）。

---

## 20. 前端狀態、a11y、data-source 補充（交接必讀）

### 20.1 結帳付款狀態（前端已呈現）
- **表單驗證** → 原生 `required` / `checkValidity` / `reportValidity`（卡號、到期、CVC、地址、條款 checkbox、**（如車內有預訂項）預訂同意 checkbox「我明白並接受約 1–3 週到貨」§19**）。
- **處理中** → 全屏 `#pay-overlay`（role=dialog aria-live）+ spinner，防重複提交。
- **失敗 / 重試** → `#pay-error`（role=alert）紅色 banner；demo 用測試卡 `4000 0000 0000 0002` 觸發拒絕，客可改卡重試。
- **成功** → 跳 Order Received。
- **交俾 WP / Stripe（前端唔自造）：** 3DS/SCA 驗證 = Stripe hosted，唔喺本站設計；`pending`（銀行未 confirm）、`on-hold`、`failed` = WooCommerce order status，由 WC + Stripe gateway 處理，前端只顯示對應訂單狀態文字。**唔好自己寫 payment math。**

### 20.2 送貨方式呈現（ShipAny，可揀列表係預設）
- Checkout「送貨方式」= **radio 卡列表**：送上門／自取點（§7），每卡顯示**商家預設 per-method 費率**（§7，對齊 ShipAny 價目 — 唔係即時報價；≥免運門檻 → 顯示 免費 + 劃線原價）；揀自取點 → 展開選點器（production = plugin 自家彈窗，§7）。
- WP theme loop `WC()->shipping` packages/rates render，唔寫死；方式/運費變動經 `update_order_review` 即時反映落 summary 運費行。
- 「單一方法 → 陳述行」規則只喺 ShipAny 停用嘅 fallback 情境先適用。

### 20.3 庫存狀態
- 見 §19。PLP demo 示範 售罄 badge；WP 由 WC 庫存條件 render 三態（有貨／預訂／售罄）＋會員搶先 badge（§5）。

### 20.4 無障礙（a11y，已實作）
- Search overlay + slide cart + 手機篩選抽屜 = `role="dialog"` `aria-modal="true"` `aria-label` + focus-trap（Tab 循環）+ ESC 關閉 + 關閉後 return focus 返觸發掣；觸發掣有 `aria-haspopup`/`aria-expanded`/`aria-controls`。
- 付款 overlay = `role="dialog" aria-live`；錯誤 banner = `role="alert"`。
- WP 遷移保留呢啲屬性；新增互動元件沿用同一 pattern。

### 20.5 產品資料單一來源（重要）
- Demo 有兩份 product JSON：PLP 內嵌 `#plp-data` + `store-chrome.js` 內 `PRODUCTS_JSON`（俾非 PLP 頁嘅搜尋用）。
- **Production：** 兩者都由 **WooCommerce 產品資料** 取代（PLP query + overlay 自訂 REST endpoint，§22 搜尋契約）→ 單一來源，唔會有兩份 JSON。

### 20.6 帳戶地址模型
- Account 地址 = **帳單 + 送貨兩組**（對應 WooCommerce core billing/shipping，已移除誤導性「新增地址」無限地址簿 UI）。若客要多地址簿 = 需額外 plugin / custom，現階段唔做。

### 20.7 「使用示範」影片 block 行為
- PDP / ACF `使用示範` block = 靜態封面圖 + 播放鈕 + 時長標。**行為規格：** 桌面 = 點擊開 **lightbox**（居中 modal + dim 背景 + ESC / 點背景關，沿用 store-chrome dialog a11y pattern：role=dialog/aria-modal/focus-trap）；手機 = 全寬 inline 展開播放。
- **來源：** 建議 self-host（MP4/WebM，`<video>` + poster）或 YouTube/Vimeo `<iframe>` privacy-enhanced；由 ACF 影片欄位（file 或 oEmbed URL）驅動，無片則整個 block 唔 render。時長標由影片 metadata 出，勿 hardcode（現稿「0:45」為 placeholder）。

### 20.8 PDP 條件狀態（WP 按 WC 庫存 render）
- **變體缺貨（已示範）：** PDP 香味/容量 `<input disabled>` + `.box{opacity:.45;line-through}` + 「· 缺貨」標 + 「部分配方暫時缺貨」註（**只喺對應軸有缺貨組合先出**）；WC variation 無庫存時自動 disabled。
- **整件售罄：** gallery 左上 `售罄` badge（深啡 `#3B261D` 底淺字，同 PLP `.stk-out`）+ 主圖 `opacity:.6`；加入購物車掣 → disabled 灰態 `background:#cbb8a6;cursor:not-allowed`，文案「已售罄」。WC `!is_in_stock()` 且不開放 backorder 觸發。（**唔加「補貨通知」訂閱 input**。）
- **整件預訂：** gallery `預訂` badge（`.stk-pre`）+「約 1–3 週到貨」行；加入購物車掣 → **「預訂」（仍 active、即刻付款）**；結帳必填同意 checkbox。WC 缺貨且開放 backorder 觸發。
- **會員搶先鎖定：** 有貨但 tier-gated 產品 → 出「會員搶先」badge；非會員／未達級 → 加入購物車掣鎖定＋提示登入/升級。**同「預訂」分清**（搶先＝有貨限會員；預訂＝缺貨任何人）。

### 20.9 圖片最佳化（deploy build-step）
- **未做壓縮（刻意）：** 13 張攝影 PNG（cat-* ×4、prod-* ×6、hero-product、promise-candle、by-scentm）每張約 0.5–2.3MB。**唔喺 HTML 交付階段手轉**，因為部分有透明背景，canvas 硬轉 JPEG 會整爛透明底。**正確做法 = deploy build-step：** 用 Squoosh / imagemin / `cwebp` 轉 **WebP（保留 alpha）每張 ≤300KB**，`<img>` 可加 `<picture>` WebP + PNG fallback；WordPress 版由媒體庫 + WebP plugin（如 Imagify / EWWW）自動處理。原圖已係高清母檔，壓縮喺上線 pipeline 做。

---

## 21. 關鍵決策（客戶拍板 — 與其他章節有出入時以本節為準）

**A. 商店結構 / 技術**
1. **URL 結構**：landing = `/hibi-lab/`；PLP = `/hibi-lab/shop/`；product permalink base = `/hibi-lab/shop/%product%`；分類 archive = `/hibi-lab/shop/{cat}/`（render 同一 PLP template + 對應 dept pill 預選；`?cat=` deep-link canonical 指向對應 archive）。cart / checkout / my-account 沿用 WC 預設 slug（journey 頁 noindex，§18；WPE cache exclusions 亦以預設 Woo 路徑最穩）。品牌內容 URL 全部歸一喺 `/hibi-lab/` cluster 下。
2. **Filter 引擎 = 全 custom in-theme**（無 plugin、無年費）：詳見 §4。
3. **分類入口動態化**：Landing 入口卡／Shop pills／橫幅由 top-level `product_cat` loop 出，內容 ACF term fields，現有 4 個做 seed。詳見 §3。
4. **404 = 按 URL 分流**：一個 `404.php`，`/hibi-lab/` 前綴（或 WC journey slug）→ HIBI 版；否則 Scent.M 版。見 §2 表。
5. **店內 menu 底部 link 改字改指向**：HIBI LAB 店頁嘅 fullscreen menu 底部「Explore Hibi Lab」→ **「HIBI LAB 全部商品」→ `/hibi-lab/shop/`**；brochure 頁維持「Explore Hibi Lab」→ Landing。
6. **後台文案語言**：wp-admin 一切介面文字（欄位說明／提示／按鈕／確認框／通知，包括 Woo 後台自訂部分同店主內部警示電郵）一律用**港式書面語**；前台網站文案同客人電郵維持品牌廣東話（demo 為準）。

**B. 會員 / VIP**
7. **VIP 會員等級 = 做真、完全後台可設定（簡化版・已對抗式 review：logic＋money-safety＋copy）**：任意等級數（demo 一般／銀／金＝seed）。每級一個**全單會員折 %**（自動會員價 price filter、非 coupon、never-store、四捨五入整數蚊）＋主色一隻（系統自動搭「深底→主色」漸變卡）＋**生日月折扣 %**（自動加成、無 code／無錢包）＋無限「其他會籍禮遇」自由文字（**會員搶先＝喺產品度 gate：勾「限會員」＋揀最低等級、非 per-tier 欄位，見 §5.D／§20.8**）。ACF repeater 自由增／刪／排序；全域計算窗口（預設近 12 月）＋總開關（OFF＝全站原價）＋手動 override（pin 客做指定級、勝過自動、直至 admin 清）。**等級永不儲、每次即場用近 12 月淨消費算**：升級每單完成即時；降級＝**退款即刻扣**（封「買完即退保級」窿），舊單自然過 12 月**唔期中跌**、到會員各自 12 月結算日全重算（可跌多級、**無軟著陸**）。**guest 唔累積**（只計註冊後嘅單）。基本級（$0／0%）不可刪不可停用。demo 值（$0／$2,000／$5,000、10%／15%）可改。詳見 §5／§9，build guard §22。**唔做積分／優惠券錢包／軟著陸／generic 折扣引擎**。
8. **會員價 × 優惠碼 = 二選一取最抵（全單口徑）**：兩者喺全單原價 subtotal 比較，coupon **嚴格大過**會員價先套用（贏嗰個整單套、輸嗰個 suspend、**唔疊加**；平手回會員價）；會員價係**保底**，每次 recalc＋落單一刻無條件重算。客面**禁「保留／暫停／留」**字眼（§6／§22 文案）。詳見 §6。
9. **優惠碼 = 一次一張**：全部碼 `individual_use`；**冇免運碼／冇並存例外**（免運＝全店門檻 §7，與 coupon／VIP 無關）；已套用狀態要有「移除／更改」affordance。詳見 §6。
10. **Guest 售後閉環**：thankyou「查看訂單」條件 render（登入→my-account orders；guest→「建立帳戶以追蹤訂單」＝WC 原生 post-checkout account creation，email 預填＋連結訂單）；email 加 `{order_url}`（WC order-received URL 連 order key，guest-safe）；email 狀態句 guest 變體（唔講「會員中心」）。

**C. 商品 / 訂單新功能**
11. **預訂 = 第三個庫存狀態**：缺貨產品可作「預訂」落單，客即刻俾錢（WC Stripe，charge-now，無扣款 cycle），交貨期約 1–3 週。前台三態（有貨/預訂/售罄）+ `.stk-pre` badge +「約 1–3 週到貨」+ PDP「預訂」掣 + 結帳**必填**同意 checkbox「我明白並接受約 1–3 週到貨」（入 place-order 驗證）+ 訂單摘要/Order Received/email/Shipping 政策均標示。**混合購物車（現貨＋預訂點寄）＝DEFERRED**（本輪只做狀態＋同意 UI）。詳見 §19/§20.8。
12. **補購提醒 opt-in（Amazon 式）**：結帳時適用產品可 opt-in「到期提醒我補購」；**間隔由客人自己揀／設定**（產品後台建議值做預帶，客可改）。到期由 WooCommerce 內建 **Action Scheduler** 寄一封品牌補購提醒 email（一鍵再買連結）— **絕無自動扣錢／訂閱**。Account 加管理面板（睇／改／取消）。交易 email 由 5 增至 **6 款**。**多件唔同間隔嘅寄送合併／逐件＝DEFERRED**。詳見 §9/§22。
13. **ShipAny Phase 1**：送上門＋自取點；運費行 ShipAny 體系（checkout 顯示商家預設 per-method 費率，官方冇 live-quote）；免運門檻機制保留、金額 admin 後台自訂（demo $500 示範，設空/0=停用）；訂單狀態 4 步（已確認→處理中→已寄出→已完成），已寄出步出追蹤號＋link（theme 掛 `pr_shipping_shipany_label_created` 轉 `wc-shipped`）；寄出通知 email。詳見 §7。
14. **送貨地區 = 4 個**（香港島／九龍／新界／離島，`woocommerce_states` 補 離島）；運費行 ShipAny 商家預設 per-method 費率（§7）。Account demo 嘅 3 區下拉以 4 區為準。

**D. 分析 / 隱私**
15. **GA4 分析 ＋ cookie 同意**：裝一個免費官方 plugin「Google Analytics for WooCommerce」行 GA4；前台加**全站 cookie 同意橫額，硬性 gate（未同意就唔追蹤）**，GA4 事件（view_item/add_to_cart/begin_checkout/purchase）只喺同意後先 fire。分析主力＝WooCommerce 內建 Analytics ＋ 自建唯讀「購買洞察」後台報表（時段熱力圖／星期分佈／地區 rollup／回購週期／新舊客總覽，直讀 `wc_order_stats`／`wc_customer_lookup`，零 plugin；時段用 local 時間）。GA4 補結帳漏斗流失等行為數據。**購物車停留時間（cart dwell）任何免費方法都攞唔到，明確唔做。**
16. **Checkout 優惠訊息 opt-in**：保留，**預設不剔**（PDPO 正路）；剔咗 → 寫入現有 `scentm_subscriber` 訂閱系統（同 Scent.M 聯絡表共用「Subscribers 訂閱」後台名單 + CSV export）+ order meta 留痕。**Label 只可以係 marketing**（「接收優惠及新品消息」）— 交易 email 一定發，唔可以出現喺 opt-out 選項度。

**E. 電郵 / 支付 / 支援 / 政策**
17. **Woo 交易 email = WP dev 設計**，跟 Scent.M 現有收據範本 pattern：品牌 wrapper + **後台可編輯範本**（option 儲存、placeholder、live preview、測試寄送）；訂單編號用 `HL-` 顯示格式。六款變體，詳見 §22。
18. **Stripe webhook 隔離 = 上線硬閘**：共用一個 Stripe 帳戶（統一對數）；theme 嘅 workshop webhook handler 加 guard — 事件 metadata 冇 `workshop_id` → 直接 200 略過；Woo gateway 用**獨立 webhook endpoint + 獨立 signing secret**。
19. **支援渠道 = WhatsApp ＋ 後台自訂 email**：政策頁支援渠道 = WA 浮動掣 ＋ 支援 email（ACF option `hibilab_support_email`，mailto，hide-if-empty）；**唔用**「前往聯絡我們」指向（B2B contact form 唔做 B2C 支援路徑）。兩渠道均入 launch gate（§22）。
20. **瑕疵退換期 = 7 日**（全部統一）：Shipping 頁「不適用」段補明「商品本身瑕疵或運送損壞：收貨後 7 天內聯絡我哋」；Scent.M `page-terms.php` §5 fallback 7 天（如客已喺 ACF 儲過舊值，launch 前後台同步改）。**Terms 無 FPS／銀行轉帳句**（無業務線收 FPS）。
21. **取消訂單政策**（客戶指定文案）：Shipping 頁退換 section —「訂單確認後如需取消或修改，請於出貨前儘快透過 WhatsApp 聯絡我哋。我哋會盡力配合，惟不保證能夠成功取消或修改；如訂單已進入處理或包裝程序，或需收取相關額外費用。訂單一經寄出，恕無法取消，可於收貨後按退換政策處理。」確認 email 結尾加「如需取消或修改訂單，請於出貨前儘快聯絡我哋。」

**F. 其他**
22. **Footer「Shipping & Returns」連結 = 全站**（包括 Scent.M 頁 — 共用 chrome 變更）；footer「HIBI LAB →」指去 `/hibi-lab/`。
23. **真實回饋 = 客戶後台自己入**（ACF repeater：名＋內容；星星為固定視覺樣式）；未有內容前 Landing 該區 hide-if-empty。
24. **產品目錄由空白入起**（唔 seed demo 產品）；入口 link 維持 coming-soon，直至客戶入好首批產品＋gateway 驗證通過。
25. **Scent.M 整合推遲**：先做好 HIBI LAB，再整合入 Scent.M；入口層（coming-soon 標示／第 4 nav 入口／首頁描述句）全部到整合階段先處理（§0／§22 flip checklist）。
26. **Wishlist／最近瀏覽 = 明確 deferred**（現目錄規模唔做；SKU 過 ~50 再評估）。

---

## 22. 技術補遺（實作規範，補齊各章未定細節）
- **HPOS**：啟用 High-Performance Order Storage（現代預設；Orders 為 `woocommerce` 頂層選單嘅 submenu）。
- **Stripe plugin**：官方 **WooCommerce Stripe Gateway**（`woocommerce-gateway-stripe`）。Payment Element 用 appearance API 對齊 `.co-field` tokens —— **iframe 內部無法逐 pixel 對齊 demo 輸入框，屬明示豁免**。Cart / Checkout 頁一律轉 **classic shortcode**（block 版會繞過 §2 嘅 template override，一定要轉）。
- **Checkout 欄位對照**（`woocommerce_checkout_fields`）：電郵先行；單一「名字」→ `billing_first_name`（last_name 隱藏＋非必填）；地區＝`billing_state` 自訂 HK 四區（§14）；無 postcode；電話必填；billing 複製 shipping（單一地址組，§20.6 兩組地址只喺 Account 管理）。
- **Coupon 規則**：所有碼 `individual_use`（一次一張）；**冇免運碼／冇並存例外**（免運＝全店門檻 §7；**刪 demo `FREESHIP`／`ship` 類型同並存分支**）；已套用碼「移除／更改」skin WC 原生 remove-coupon link（§6）；無效碼唔影響已套用碼；重複套碼 → WC 原生拒絕 notice 經全域 notices skin 出。**會員價 × 優惠碼 = 二選一取最抵（全單口徑，單一 canonical predicate）**：`member_savings＝全單原價−全單會員價` vs `coupon_savings＝WC 現車折扣`，**coupon 嚴格大過先套用**（贏嗰個整單套、輸嗰個 suspend、平手回會員價）；掛 `woocommerce_after_calculate_totals` 每次 recalc（fixed-$ 先 clamp subtotal），落單／PaymentIntent 一刻 server 無條件重跑（G3–G5）。客面文案禁「保留／暫停」（見下「VIP／Coupon 客面文案」）。
- **VIP 等級引擎**：ACF repeater「會員等級」（options page「VIP 設定」）＝單一真相源；`resolve_tier()` **每次讀都用近 12 月淨消費對現行 enabled 等級表重新 bucket、永不認舊 stored tier id**（G1）；會員價＝當前級折扣％ 施於 regular price（自動、非 coupon、四捨五入整數蚊）；生日月加成／手動 override／總開關全部經同一 `computeTier()`／`resolve_member_discount()`；前台等級卡／會員價／主色 loop repeater（加級零改 code，同分類動態化 §3 一樣）。**計算窗口「近 12 月」＝全域 option `hibilab_vip_calc_window`（預設 12、admin 可改）；G1／G7／G9／結算／e2e 一律讀此 option、切勿 hardcode 12。** 詳見 §5／§21。

- **VIP × Coupon money-safety guards（新增，補之前 break-test 嗰套：server-authoritative total／never-store computed price／order-build 重算／PaymentIntent 用最終 total／context-gate on WC_Order／cache vary-by-tier＋admin-write invalidate／trailing net-of-refund excl in-flight／單一 rounding point／搶先 server-side gate — 以下不重覆）**：
  - **G1 `resolve_tier()` 永不認 stored id** — 每次用近 12 月淨消費對現行 enabled 表 bucket，取「門檻 ≤ 消費」最高者，冇 match 跌 $0 base（防刪等級靜靜收原價／`->discount` null fatal）。單元測試：mid-request 刪剛 resolve 嘅級 → 斷言回 base、非 null／fatal。
  - **G2 單一 canonical「有效會員單價」函數**（一處定義、處處呼叫）＝`min( round(regular×(1−有效%)), sale )`，有效%＝`max(tier%, 生日月則 birthday%)`；**先 round 會員價、後同 sale 取 min、絕不 re-round sale**；顯示／best-wins 比較／order-build 全用呢個值。
  - **G3 best-wins 單一 order-level predicate**，entry 同每次 recalc 一致：coupon **嚴格大於**會員 savings 先套（平手回會員價；取消 demo「entry≥reject／recalc<revert」不對稱，佢會令平手 coupon 卡住＋flicker）。
  - **G4 掛 `woocommerce_after_calculate_totals`**（qty／刪 line／改運費都 fire，唔止 apply／remove）：每次 (1) fixed-$ coupon `min(val,subtotal)` clamp；(2) 由現時 snapshot 重算 member vs coupon；(3) member≥coupon 就移除 coupon 回會員價（堵「大車套碼→縮車→coupon 變差但 stale 留住→收穿底價」）。
  - **G5 server order-build／PaymentIntent create 無條件重跑 best-wins**（當刻等級＋當刻日期重算有效會員價＋重跑比較，coupon 唔再勝就丟），**唔靠 client recalc 事件**（覆蓋購物車跨午夜／跨結算但無 mutation）。
  - **G6 移除 coupon 嘅比較函數 idempotent／單向／無副作用**：移除前 check `WC_Cart->has_discount`；系統發起嘅移除 suppress WC notice；request-scoped guard flag 防 recursion（避免 notice storm＋數字唔一致）。
  - **G7 trailing spend 只數 `customer_user==會員 id` 且 `date_created≥用戶註冊時間`**；**不**用 billing_email match、**不**數 native 認領返嚟嘅 guest 單入級（堵 guest 期間狂買→註冊即頂級；歷史可顯示但唔計級）。
  - **G8 生日 boost 落單一刻 pin**：checkout submit 用香港時區 resolve boolean＋所用%，寫 immutable order meta `_hibilab_birthday_boost`；price filter 之後只讀 pinned flag，order-build／settle **唔准**再行 `is_birthday_month()`。1 號祝賀 email 係另一件 WP-Cron 事、唔 gate 價。
  - **G9 退款即時扣消費**：net-of-refund 即時反映（可期中降級，封「買完即退保級」窿）；純時間到期降級只喺會員各自 12 月結算日全重算。**期內等級＝`max(即場淨消費級, 該周期開始 pin 嘅 floor 級)`**。
  - **G10 override＝顯式 typed state `{tier_id,set_at,optional_expiry}`，勝過 computed tier 直至 admin 清除**；結算全重算＋completed-order 即時升級遇 override 都 no-op；刪等級時 admin-write handler 主動清指向該 id 嘅 override＋出 admin notice。
  - **G11 搶先 gate fail closed**：引用最低等級被刪／停用＝**停售**（絕不 fail-open 俾人買會員專售）；gate 用門檻值（消費額）比較、非 row 次序（reorder 唔翻資格）。**$0 base 等級 non-deletable／non-disableable**（validation 鎖 enable toggle）。**主色 validation**：enabled 級必須有合法 hex，save 拒空；render 時色缺失／非法 fallback base `#e4d6c5`，永不 emit 含空 stop 嘅 `linear-gradient`。
  - **G12 confirm 步 server-authoritative 且自洽**：PaymentIntent create／confirm 重算整份 order review（line items＋會員折扣行＋total）並**重繪客人確認摘要**，顯示＝＝收費；若重算 total 與客上次所見不同 → **阻止靜默收費**、展示更新摘要要求再確認（「價格已更新,請確認新總額」）；絕不用「recalc 前算出嘅 amount」建／confirm PaymentIntent。**免運門檻測「會員價之後、coupon 之前」小計**（WC free-shipping method evaluate **before** coupon）。

- **VIP／Coupon 客面文案（專業品牌廣東話，取代 demo 口語；全站 `HK$`＋千位逗號；禁「保留／暫停／留」；客面只用「會員價／會員專屬價」，「折扣／優惠碼」只留 coupon）**：
  1. **PDP／商品卡會員價**：PDP「**銀級會員價 HK$306**」＋劃線 `HK$340`＋細行「會員專屬 · 已為你自動計算」；卡 pill「**{級}會員價**」疊價、原價劃線。tag 一律「{級}會員價」，絕不寫「折扣」。
  2. **未登入 teaser**：「**登入即享會員價 · 全單 9 折起**」；PDP 具體「登入享會員價,此產品低至 HK$306」（禁「限時／優惠」，會員價係永久）。
  3. **coupon 因會員價已較平被拒**（取代 demo 錯用嘅「優惠碼無效,請再試」）：「**已為你自動採用更抵嘅會員價,此優惠碼慳幅較少,無需使用。**」（暖版：「你嘅會員價已經比呢張優惠碼抵,照用會員價。」）
  4. **coupon 贏會員價、成功套用**：「**已套用優惠碼,為你慳到最多。你嘅會員價一直生效,日後自動以最抵價錢計算。**」折扣行 label「優惠碼 {code}」。
  5. **Cart／Checkout 會員自動折扣行（不可移除）**：label「**會員專屬價 · 銀級會員**」金額 `−HK$34`；**唔畫 ✕**，改放不可互動小章「自動」（或鎖 icon＋hover「會員自動享有」）。
  6. **等級卡（修 demo）**：非頂級「距離 **銀級會員** 還差 HK$1,320」＋「HK$680 / HK$2,000」＋暖行「再消費 HK$1,320 即升銀級會員」；頂級保留「尊尚會籍 · 已達最高等級」，右欄「維持中」。
  7. **生日月啟用提示**：cart／banner「**生日快樂 🎂 呢個月你享有生日會員價,已自動為你計算,無需優惠碼。**」；PDP tag（生日月取代常規 tag）「生日會員價 HK$299」。
  8. **搶先鎖（兩態＋server 拒絕 notice 同句）**：訪客「**此為會員搶先發售產品,登入 HIBI LAB 會員帳戶即可選購。**」＋登入／註冊 CTA；未夠級會員「**此產品為 銀級或以上會員 搶先發售,你目前為 一般會員。累積消費至 銀級即可選購。**」＋連去等級卡（唔露 raw WC error）。
  9. **生日祝賀 email 開首**：「Amanda,生日快樂。由今日起整個生日月,你嘅會員價會自動升級為生日禮遇價 — 無需優惠碼,購物時已為你計好。」（明寫「無需優惠碼」免客搵 code）。
- **PLP 分頁**：未篩選＝crawlable `/page/N/`（跟 workshops archive-loadmore pattern）；有 filter 狀態＝AJAX＋URL 參數（`?pa_scent=…`），filter 版 canonical 指返基礎 archive（唔入 index）。「顯示 X / Y 件」由 query `found_posts` 出。
- **排序對照**：精選推薦＝`menu_order asc`＋date desc fallback（客喺 Products 排序畫面拖）；價格低至高／高至低＝price asc/desc（meta lookup）；名稱 A–Z＝title asc（custom orderby）。
- **series ↔ catLabel**：series＝`product_cat` **子分類**（寵物護理 → 情緒／身體／日常）；卡 label 組合規則＝「父分類 · 子分類」，無子分類只出父分類；PDP breadcrumb 連去子分類 archive。
- **audLabel 單一來源**：卡面「適用」label＝ACF 文字欄位「適用對象顯示」（自由文案，例「幼貓幼犬適用」）；`pa_audience` attribute 只做 filter 軸。兩者用途唔同、分別維護。
- **運費字串單一來源**：免運門檻（`hibilab_free_ship_threshold`，admin 自訂，空/0=停用）＝ **ACF option**；**六**個消費位 — PDP／Cart（nudge「再加購 HK$X 即享免運費」）／Checkout／Order Received／Shipping 政策頁／**側滑車 footer**（文案「滿 HK$X 免運 · 運費於結帳按送貨方式計算」＋低於門檻時同款 nudge）— 全部由 option 讀同源計算，**金額一律 `HK$`＋千位逗號（§22 客面文案）**；門檻停用時六處免運文案自動隱藏。運費本身 = **商家預設 per-method 費率（§7 — 唔係即時報價）**。⚠ 免運門檻要同**兩處**設定一致：WC 原生 free shipping（送上門）＋ ShipAny plugin「Locker/Store List Minimum Checkout Amount for Free Shipping」（自取點，v1.0.33）— health 提示要驗埋兩邊。
- **搜尋契約**：overlay 數據＝自訂 REST endpoint（product query → JSON：name／catLabel／audLabel／price／img／url／stock）；**overlay 結果行要消費 `stock` 欄出 售罄／預訂 tag（§19）**；直入 `?s=` → 301 去 `/hibi-lab/shop/?s=…` 由 PLP render 結果（無獨立 search.php 設計）。**匹配欄位契約：overlay 同 PLP `?s=` 兩條路必須查同一組欄位 — 產品 title＋`product_cat` label＋`pa_香味` terms＋`pa_功效` terms** — 一個定義兩邊實作。Overlay 零結果 → 熱門 term 顯示為 tappable chips（**撳＝喺 overlay 內即場重新搜尋**）＋「睇全部商品」link 去 PLP。
- **PLP 空狀態三變體 ＋ Cart 清空**：#plp-empty 按狀態切換 — (a) 無 filter 無搜尋（空分類）→「呢個系列即將上架」＋「瀏覽全部商品」掣（切返「全部」pill）；(b) 有 filter →「未有符合的商品／試下放寬篩選條件」＋「清除全部篩選」；(c) 有搜尋字 →「搜尋「X」冇結果 — 清除搜尋或試下其他關鍵字」＋「清除搜尋」。clearAll() 喺空分類情境要一併 reset 返「全部」分類。**Cart 清空**：items 列換 cart-empty block 時，成個訂單摘要 aside 一齊藏（production 行 WC 原生 `cart-empty.php` 分支自然無 aside）。
- **側滑車 qty／移除接線**（§12 fragments 唔夠）：drawer 嘅 qty ＋／−／移除 = **自訂 wc-ajax endpoints** 呼叫 `WC()->cart->set_quantity()`／`remove_cart_item()` 後回傳 refreshed fragments；stepper 唔可以加超過可購庫存。**Drawer 空狀態**：最後一件移除 → 「購物車暫時係空嘅」＋「繼續購物」（關 drawer），藏 查看購物車／去結帳／小計。
- **全域 WC notices skin**：`woocommerce/notices/{error,notice,success}.php` overrides，用現有 token（error 三色組 `#fbeae4`/`#e3a58c`/`#8a3618`、成功 `#1f7a4d`）＋zh-HK 字串；覆蓋 session 過期／庫存不足移除／coupon 錯誤／order-again 通知等全部原生 notice（render 喺 Cart items 上方＋Checkout form 上方）。**Stripe 付款錯誤例外** — 繼續入 summary 嘅 `#pay-error` 槽。
- **order-pay ／ order-failed ／ cancelled**：用 `#pay-error` 語彙 skin WC notices＋thankyou.php 失敗分支（沿用 Order Received 版式，紅 banner 取代綠 tick）；無需新設計稿。
- **Account 訂單狀態 label map**：已確認／處理中／已寄出（timeline 步）＝正常 4 步；**已退款／已取消＝muted brown（brown/45）單行 label、付款失敗＝`#b4452a`** — 非快樂狀態唔出 timeline，改單行狀態＋（退款單）「已退款 −HK$X」行。同 email 變體 ④ 對齊。
- **3DS overlay 生命週期**：`#pay-overlay` 只喺 `stripe.confirmPayment` in-flight 而且無可見 challenge 時顯示；3DS iframe／modal 出現 → 藏 overlay；錯誤／使用者放棄 → 藏 overlay＋錯誤入 `#pay-error`。
- **Woo 交易 email**：品牌範本由 WP dev 設計（見 repo `HIBI LAB Email.html`），跟 Scent.M 收據 pattern 做 **後台可編輯**（option 儲存＋placeholder＋live preview＋測試寄送）；訂單編號顯示 `HL-` 格式；new-order 通知收件人＝店主通知地址（非 admin_email）。**六款變體（同一 wrapper）**：①訂單確認（4 步狀態條第 1 步 active；`{discount_rows}` 出會員專屬價／已用碼行、預訂項標示「約 1–3 週到貨」）②**寄出通知**（第 3 步 active＋追蹤號卡 `{tracking_no}` `{tracking_url}` `{carrier}`）③訂單完成（第 4 步）④退款通知（退款金額行，唔出狀態條）⑤店主新訂單通知（內部，加客人聯絡資料）⑥**補購提醒**（到期由 Action Scheduler 觸發，`{reorder_url}` 一鍵再買連結、`{product}` 產品名；非扣款）。**另**：VIP **生日祝賀 email**（每年 WP-Cron、生日月 1 號寄；只祝賀＋提示生日會員價已自動生效，**唔附 coupon／錢包**）＝同一 wrapper skin，唔另設計。**Placeholders**：`{name} {order} {date} {items} {subtotal} {discount_rows} {shipping} {shipping_method} {total} {address} {tracking_no} {tracking_url} {carrier} {order_url} {status_note} {product} {reorder_url}`。`{order_url}`＝WC order-received URL 連 order key（guest-safe）；狀態句 guest 變體（改「透過此電郵內嘅連結查看訂單狀態」）；結尾段含取消政策句（§21.21）。**Welcome／密碼重設 email 用同一品牌 wrapper 做 WC template override skin**（唔另設計內容 — 避免 reset email 似 phishing）。
- **登入後 redirect**：checkout 用 WC 原生 inline returning-customer form（§17，唔跳頁）；其他店頁登入 link 帶 `?redirect_to=`，theme hook `woocommerce_login_redirect`＋registration redirect 尊重（fallback＝my-account）。
- **「查詢此訂單」**：Account 訂單詳情＋thankyou 各加一條細 link — `wa.me/{hibilab_whatsapp_number}` 預填「你好，我想查詢訂單 #HL-XXXX」；WA option 未設定 → 藏（mailto `hibilab_support_email` fallback）。
- **no-js 韌性**（theme＋store 頁通用）：head 加 2 行 `no-js`→`js` class swap；CSS 加 `html.no-js .ani-this{opacity:1;transform:none}`（hero 類 `opacity-0` 元素同理）— JS 失敗／關閉時內容照現形，JS 用戶零視覺差異。
- **771px scoped 實作**：771px media block 只喺 **store body class**（如 `body.hibi-store`）之下嘅 store-scoped stylesheet 生效；共通 chrome 維持 768。`body{overflow-x:clip}` 同樣只喺 store body class 落 —— theme 手機版嘅 `overflow-x:hidden` 會殺死 PLP sticky filter bar，**不可全局合併**。
- **上線 e2e 測試（必行 gate）**：staging＋Stripe test mode → 落單（4242）→ 訂單／庫存／email 全鏈 → **ShipAny 全鏈：出單 → 印單（waybill）→ 追蹤 write-back（order meta＋internal note）→ `wc-shipped` 轉換＋寄出 email → 自取點選點彈窗（揀點＋地址 write-back）** → **404 分流驗證**（`/hibi-lab/xxx` 出 HIBI 版、其他 URL 出 Scent.M 版）→ Dashboard 退款 → 確認 **workshop webhook 冇誤鳴** → Woo webhook 正常收 → **VIP**：後台加/改一個等級（門檻/折扣/顏色/福利）→ 前台**單張自己等級卡**/會員價自動出（動態 render，**唔出全級 ladder**）＋門檻計算（近 12 月淨消費、`resolve_tier()` 每次重算 G1）＋退款即刻扣消費（G9）＋自動會員價出 Shop/PDP/Cart/Checkout＋會員價 vs 優惠碼二選一取最抵（嚴格大過先套 G3–G5）＋生日月自動加成（落單 pin G8）＋會員搶先鎖定/解鎖（引用刪級 fail-closed G11）＋**總開關 OFF→全站即時回原價/無會員價行/coupon 照原價計、ON 復原**＋**手動 override：pin 客做指定級，前台/order-build 用 override 級（勝過自動 G10）、12 月結算與即時升級遇 override 皆 no-op、刪引用級自動清 override＋admin notice**＋**guest 狂買→註冊後唔頂級（只計註冊後單 G7）**＋**PaymentIntent confirm 重算：中途改價（如退款觸發降級）令 total 變 → 阻止靜默收費、要客再確認 G12**→ **預訂**：缺貨開 backorder → 前台三態、charge-now 落單、結帳必填同意 checkbox 攔截、確認 email 標示 1–3 週 → **補購**：結帳 opt-in＋客設間隔 → Action Scheduler 到期只寄 email 唔扣錢、Account 管理面板可改/取消 → **GA4**：cookie 同意硬性 gate（未同意零 GA4 hit、同意後事件正常）＋內建 Analytics＋「購買洞察」報表出數 → **checklist**：ShipAny 帳戶＋API Token＋portal 增值＋Courier Service Point Listing add-on／`hibilab_whatsapp_number`／`hibilab_support_email`／免運門檻 option 同 WC free shipping＋ShipAny locker minimum 兩處一致／Terms 7 日文案／PDP 保存期限 block 內容／VIP 等級 repeater 已設好／admin 文案港式書面語（§21.6）／`/hibi-lab/` landing＋shop flip 前保持 noindex（或 unpublished），flip＝入口 live＋noindex 移除同一 deploy → 先至 flip coming-soon 入口（§0 四個，含 nav `.hibi-entry`；flip 時同步剷 theme 首頁 CTA 嘅 `target="_blank"`）。

---

*本文件＝現行單一真相源（repo 內最新 commit）。已批准 spec 総覽：店中店套落 Scent.M theme（§0）、WooCommerce data-driven、PDP=Flexible Content（§15）、filter 全 custom in-theme（§4）、分類入口動態化（§3）、guest checkout 允許＋登入會員享自動會員價（§17）、**VIP 等級・完全後台可設定・生日月自動加成・會員搶先（§5）**、**會員價對 coupon 二選一取最抵・一次一張（§6）**、**預訂第三庫存態・即收錢・1–3 週・必填同意（§19）**、**補購提醒 opt-in・客設間隔・Action Scheduler 無扣錢（§9/§22）**、**GA4＋硬性 cookie 同意＋內建/自建購買洞察（§21.15）**、**ShipAny Phase 1・4 步訂單狀態（§7）**、404 URL 分流（§2）、Landing 16px 豁免＋771px store-scoped（§10/§22）、後台文案港式書面語（§21.6）。§21 關鍵決策 + §22 實作規範為準。*
