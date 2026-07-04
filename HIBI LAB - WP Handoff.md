# HIBI LAB Store — WordPress / WooCommerce 交接文件

> 給接手嘅 WP dev。呢份係「點樣將 HTML 設計交付物 轉成 Scent.M bespoke theme 入面嘅 WooCommerce 店中店」嘅完整跟進指引。設計稿全部喺 repo 根目錄嘅 `HIBI LAB *.html`。

---

## 0. 定位（好緊要，先睇）
- **店中店（shop-in-shop）**：HIBI LAB 店係**套落現有 Scent.M bespoke theme 入面**，唔係另起新站、唔係將 Scent.M 改成純網店。
- **WooCommerce data-driven**：客淨係喺 wp-admin 入結構化 product data，前端 category / filter / 價自動出，唔使逐件寫 code。
- **入口（共 4 個，flip 時全數駁通）**：① Scent.M 全螢幕選單「Explore Hibi Lab」② footer「Hibi Lab →」③ 首頁「Explore Store」CTA（theme 現時三個都係 inert `data-coming-soon` stub）④ **top-nav utility cluster 嘅「HIBI LAB」文字 link（`.hibi-entry`，見 `scentm-home.html`；手機 nav 唯一店入口 — theme 未有，flip 時加入 `header.php`，flip 前唔好加（避免多一個死 link））**。
- **Scent.M 整合時序（客戶拍板 2026-07-03）**：Scent.M 站現時只喺 staging、未 production —— **先做好 HIBI LAB，之後先整合入 Scent.M**。三個 coming-soon stub 嘅「即將開幕」標示／隱藏處理、第 4 入口、首頁描述句等入口層決定全部推遲到整合階段（見 §22 flip checklist）。
- **共通 chrome（nav / footer / 全螢幕選單 / WhatsApp / GSAP+Lenis）= 同 Scent.M 100% 一致**。設計稿已經 embed 咗真 chrome；轉 theme 時共通部分直接用返 theme 現有 partial，唔好另整。

---

## 1. 技術設定
- `add_theme_support('woocommerce')` + `woocommerce/` template override，維持 bespoke 設計全控制（唔使 Blocksy 等）。
- 沿用現有 **workshops CPT / template + ACF pattern**（archive ↔ single、Load-More `/page/N/`、image fallback、bilingual label）。
- Workshops 現有 Stripe 直駁線照舊；Products 用 **WooCommerce Stripe gateway**（on-site checkout、multi-item cart）。兩條 commerce 線並存，互不干擾。
- **Design tokens**：色 `#FDFBF9`(light) / `#F3EAE1`(beige) / `#A64B2A`(terracotta) / `#3B261D`(brown) / `#3B4A3D`(moss，寵物) / `#e8b896`(gold accent)。字 Baskervville + Cactus Classical Serif（serif）、Montserrat + Noto Sans TC（sans）。
- **狀態／輔助 tokens**：成功 `#1f7a4d` · 錯誤 `#b4452a`（付款錯誤 banner 另用 `#fbeae4`/`#e3a58c`/`#8a3618` 三色組）· hairline 分隔 `#ece0d5` · input 邊框 `#d8c8ba` · 售罄灰掣 `#cbb8a6` · 圖片 fallback 底 `#efe6dd`。
- **Breakpoint（客戶拍板 2026-07-03）**：store 頁沿用 **771px**（刻意 store-scoped）— 同 Scent.M theme 嘅 768px 並存，**唔好「修正」統一**。

---

## 2. 頁面清單（HTML 稿 → 對應 WC template · 完整 inventory，repo 14 檔）
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
| `HIBI LAB 404.html` | `404.php`（✅ 已拍板 2026-07-03：**按 URL 分流** — 一個 `404.php`，`REQUEST_URI` 以 `/hibi-lab/`（或 WC journey slug）開頭 → render HIBI 版（全部商品／HIBI LAB／Scent.M 三連結）；否則 render 現有 Scent.M 版。兩個設計原封不動） | 404 |
| `HIBI LAB Tier Cards.html` | —（**✕ 已作廢** — VIP 等級機制已取消，§21.12） | 歷史設計參考（勿實作） |
| `HIBI LAB Email.html` | 後台可編輯 email 範本（option 儲存，§21.10/§22 — 五款 variant 同一 wrapper） | 交易 email 設計稿 |
| `index.html` | —（= `HIBI LAB Landing.html` 嘅 byte-identical alias，方便 repo 直開） | alias |
| `scentm-home.html` | —（Scent.M 首頁 chrome 整合示範：Explore Hibi Lab 連結點樣駁去店；非 HIBI 頁面） | 整合參考 |

---

## 3. 產品 data model（客喺 wp-admin 入，唔使逐件寫 code）
- **分類** = `product_cat`（護膚品 / 寵物護理 / 助眠系列 / 家居香氛），hierarchical，客自己加減。
- **分類入口動態化（✅ 已拍板 2026-07-03）**：Landing 4 張入口卡、Shop 分類 pills、PLP 橫幅 map **全部由 WP loop top-level `product_cat` terms 動態 render**（唔 hardcode 4 個 slug）；每個分類嘅 eyebrow／title／intro／橫幅相 = **ACF term fields**（`get_field('…','product_cat_'.$term_id)`），現有 4 個分類嘅稿內文案+`cat-*.png` 做 seed 預設值。客加第 5 個分類 = 入口卡／pill／橫幅／archive 自動齊。Demo 稿嘅 4 卡/4 pill 係呢個 loop 嘅視覺樣板。
- **Filter 軸 = global product attributes**（一次過設定 term，之後每件剔）：`pa_功效` / `pa_適用對象`(人/貓/狗/居家) / `pa_香味`(swatch) / `pa_容量` / `pa_形態`(噴霧/按摩油/洗髮水/消炎水/精華/潔面/擴香)。→ filter facet + count **自動由 attribute 生成**，加新 term 客即場加。
- **容量 = variation attribute** → variable product → PLP 顯示「$X 起」、PDP size 揀掣、容量 filter。
- **Variation 模型（明確版）**：demo PDP 實際係**雙軸 variable product** — `pa_容量`（帶價）×`pa_香味`（配方）；production 用 two-attribute variable product，每個組合獨立庫存（缺貨組合 → 揀掣 disabled，見 §20.8）。
- **ACF field group（逐件產品，跟 workshops ACF pattern）**：產品介紹、整體功效（成分→功效逐項）、成分、用法、適用對象、規格（貨號等）。
- ⚠️ **紀律**：data 入落**結構化欄位**（剔 attribute term），唔好淨係打落產品名／描述 → filter 讀 attribute，唔 parse 個名。

---

## 4. Filter 引擎（~~三選一~~ ✅ 已拍板 §21.2 = 全 custom in-theme，本節其餘選項僅留紀錄）
- ~~**FacetWP（推薦）**~~（已被 §21.2 否決 — 客戶唔要 plugin/年費）：facet live count / swatch / range slider / AJAX 即有，CSS theme 到貼設計。
- **原生 widget**（免費）：Filter by Attribute / Price，work 但 page reload、樣基本。
- **全 custom in-theme**：`tax_query` + AJAX 自己寫（facet count 要自己整）。
- `HIBI LAB Shop.html` 示範咗目標 UI：checkbox facet + count + active chips + price 雙 handle slider + sort + 手機 filter drawer + 載入更多。Production 用 **custom in-theme AJAX（§21.2）** + URL 參數（`?pa_香味=薰衣草`，SEO-friendly、可分享）。

---

## 5. 會員帳戶（✅ 2026-07-03 重大改動 — **VIP／等級機制已全面取消**）
> 客戶裁定：「唔做 VIP 機制」「連生日禮遇都唔要，只保留 coupon 機制」。本節取代舊「VIP 會員等級」全章；§21.4（等級福利做真）同步作廢。

**唔做（全部唔實作、唔設計、唔留 hook）：**
- 等級制全套：一般／銀級／金級、消費門檻、tier 自動折扣（9折／85折）、滾動 12 個月計算、軟著陸、保級進度、等級卡／會員階梯 UI（`Tier Cards.html` 作廢）
- 生日禮遇全套：註冊生日欄、生日鎖定／防刷、生日 WP-Cron、生日 coupon、生日 email
- 優惠券錢包（Account 錢包 panel + user-meta 券 index）
- 會員搶先預購／VIP 鎖定（商品淨返「有貨／售罄」兩態，見 §19/§20.8）
- 會員專屬價（PDP「登入享會員價」一類 teaser 全部唔出）
- 積分（原 Phase 2 構想一併擱置；如日後重啟另議）

**保留（= WooCommerce 原生會員帳戶，零自訂福利邏輯）：**
- 註冊／登入／忘記密碼（§8 原生 + skin；註冊欄位 = 名／電郵／密碼，**無生日**）
- 訂單記錄 + 地址簿 + 帳戶設定（§9）
- Guest checkout 照舊允許（§17）
- 優惠碼機制（§6）：admin 喺 WC 後台建碼／發碼（marketing 用途），客人 Cart 輸入

---

## 6. 優惠券 Coupon（✅ 2026-07-03 簡化拍板）
- 全部 **WC native**（% / 滿減 / 免運 / 首單）。自己 wrap admin 用 `WC_Coupon` API 建券。
- **一次只套一張碼**：所有折扣碼 `individual_use`，一張起一張止。**免運類碼**（FREESHIP 類）例外，可與一張折扣碼並存。
- **已套用狀態要有管理 affordance**：Cart 折扣行加「移除 ✕」；Checkout 收埋式欄有碼時 summary 轉「已套用 {CODE} · 更改」— 兩者 skin WC 原生 remove-coupon link。套第二張折扣碼 → WC 原生拒絕 notice（「一次只可使用一張優惠碼，請先移除現有優惠碼」，經 §22 全域 notices skin 出）。輸入無效碼**唔會**影響已套用嘅碼。

---

## 7. 送貨 & 訂單狀態（✅ 2026-07-03 重大改動 — **ShipAny 提前到 Phase 1**）
> 客戶裁定：Phase 1 就用 ShipAny。取代舊「WC 原生 flat rate + ShipAny Phase 2」方案；§21.6 嘅 flat $50 部分同步作廢（4 區地址欄保留）。

- **送貨方式 = 送上門 + 自取點**（智能櫃／便利店／順豐站 — ShipAny 網絡）。Checkout「送貨方式」UI：radio 卡「送上門」／「自取點」（= WC 原生 shipping method 列表嘅品牌 skin）；揀自取點 → 出選點器。**實證修正（2026-07-03 官方文檔研究）：production 選點 UI = ShipAny plugin 自家「pick-up dialog」彈窗**（有地區 filter＋Change Address 掣，手機版另有優化）— demo 嘅 inline mock 下拉+已選點卡係視覺 placeholder，實作以 plugin 彈窗為準、theme 只 skin 外圍。自取點清單「寄生」喺 WC 原生 Local pickup method 上（要喺 Shipping zones 加 Local pickup 先開到 Locker/Store List）。
- **運費 = 商家預設 per-method 費率（實證修正 — 唔係 checkout 即時報價）**：官方文檔冇任何「checkout 按地址 live quote」嘅記載；checkout 費率由商家喺 WC shipping zones／ShipAny Portal「Shipping Profile」（plugin v1.1.70+「Show Shipping Options at Checkout」）預先設定，金額對齊 ShipAny 價目（例：SF E-comm Box F1–F5 = HKD 28–98）。「即時報價比較」係商家出單嗰刻用嘅功能。**Demo 稿內運費銀碼（$45／$32 等）都係示範值。**Shipping Profile 精確行為官方冇公開文檔 — staging 實測定案。
- **免運門檻 = 保留機制、金額後台自訂**：ACF option `hibilab_free_ship_threshold`（demo 顯示 $500 只係示範）；設空／0 = 停用，全站免運文案+nudge 自動隱藏；達門檻 → 任何送貨方式免運（差額商家吸收）。§22「運費字串單一來源」照用（六個消費位，包括側滑車）。**實證：plugin 有專屬「Locker/Store List Minimum Checkout Amount for Free Shipping」設定（v1.0.33）管自取點免運；送上門免運行 WC 原生 free shipping — ACF option 要同兩處設定一致（health 提示）。**
- **4 區地址欄維持**（香港島／九龍／新界／離島，`woocommerce_states`）；客人揀完自取點 plugin 會 write-back 地址欄（block checkout 曾有 write-back bug、v1.1.101 先修 — 我哋 §22 本身已裁定用 classic shortcode checkout，一向係穩陣嗰邊）。
- **訂單狀態／時間線 = 4 步**：已確認 → 處理中 → **已寄出** → 已完成。「已寄出」步顯示**追蹤號 + 追蹤 link**。**實證修正：ShipAny plugin 唔會改 WC order status（v1.1.103 全源碼 grep update_status 零命中）、冇 webhook/callback** — theme 自己註冊 custom status `wc-shipped`（入 `wc_order_is_paid_statuses`），掛 plugin 出單成功嘅 **`do_action('pr_shipping_shipany_label_created', $order_id)`** action（源碼 5 個出單位都 fire）做 processing→shipped 轉換＋觸發寄出通知 email。
- **追蹤資料（實證）**：plugin 出單後追蹤存 order meta `_pr_shipment_shipany_label_tracking` ＋寫一條 WC **customer note**（會行原生「Note added to your order」email）；ShipAny 追蹤頁格式 `https://portal.shipany.io/tracking?id={ShipAny shipment UID}`（**id 係 ShipAny UID，唔係順豐單號**）；courier 真單號 `trk_no`＋courier 追蹤 URL `trk_url` 另存 meta，設定 `show_courier_tracking_number_enable` 可一齊顯示。另有 email placeholder `{shipany_tracking_note}` 同 shortcode `[shipany_tracking_note]`／`[shipany_tracking_link]` 可直接喺範本用。
- **Email**：寄出時發「寄出通知」email（範本組第 ② 款，見 §21.10/§22），含 `{tracking_no}`（=courier trk_no）`{tracking_url}`（=trk_url 或 portal tracking link）`{carrier}` — 全部由上述 order meta 讀。**防雙重通知：plugin 設定 `shipany_tracking_note` 設 'yes' 令佢條 tracking note 變 internal-only**，客人只收我哋品牌 ② 款。Shipping 政策頁「出貨後將以電郵提供追蹤資訊」承諾**成立**。
- **WP 實作（實證）**：官方 plugin「**ShipAny WooCommerce: Ship, Label, Tracking**」（wordpress.org slug `shipany`，現版 1.1.103 活躍維護，HK-only，HPOS 相容 v1.1.91+，classic checkout 歷史上最穩）。設定流程：裝 plugin → WooCommerce Settings → Shipping tab 貼 portal.shipany.io Settings 攞嘅 API Token → **首次出貨前要喺 portal 增值（top-up）物流費**。商家出單/印單：WC order metabox（Create ShipAny Order／Download Waybill／Send Pickup Request）＋ order list bulk actions（多張 waybill 自動 merge 一個 PDF），或 ShipAny Portal；可設「訂單轉 Processing 自動出單」。**費用：plugin 免費、無月費、按單付運費（先增值後扣）；客人揀自取點嘅清單功能係收費 add-on「Courier Service Point Listing」HKD 100/月 — 該月經 ShipAny 出過 1 單即豁免，14 日免費試用。**
- **已知風險（官方 support/changelog 紀錄）**：① 自取點寄生喺 Local pickup — 想「工作室自取」＋「智能櫃」並存曾有全部 method 被改名做「ShipAny SF Locker」嘅衝突紀錄（v1.0.55 有 fix）— **staging 必測**；② 香水／含酒精產品運輸限制官方文檔零記載 — **客戶要直接同 ShipAny／順豐確認危險品政策**；③ plugin 用戶基數細（200+ installs）但官方活躍維護 — 更新前 staging 先行。
- **Launch gate 加**（§22）：ShipAny 帳戶開通 + API Token 入好 + portal 增值 + Courier Service Point Listing 開通 + staging 測試「出單→印單→追蹤 write-back→選點」全鏈一次。

---

## 8. 登入 / 註冊 / 忘記密碼（原生 — 只 skin）
- 登入 / 註冊 / **忘記密碼（lost-password → email → reset）** / 重設密碼 / 登出 = **WooCommerce + WP 原生**（endpoint + email 全包）。**唔使寫 auth 邏輯。**
- 唯一工作 = **template override + CSS 套返品牌樣式**：`myaccount/form-login.php`、`form-lost-password.php`、`form-reset-password.php`。
- （✅ 四個 view — 登入／註冊／忘記密碼／重設密碼 — 已全數喺 `HIBI LAB Account Login.html`；demo 切換流程見 §18。）

---

## 9. 會員中心面板（`HIBI LAB Account.html`，對應 my-account endpoints · ✅ 2026-07-03 隨 VIP 取消簡化）
- **概覽**：歡迎句 + 統計（累積訂單／累積消費）+ 最近訂單。（VIP 等級卡／會員階梯／優惠券錢包 panel **已刪** — §5。）
- **訂單記錄**：可展開詳情（**4 步狀態時間線** 已確認→處理中→已寄出→已完成，「已寄出」步顯示追蹤號+追蹤 link + 商品明細 + 小計/運費/總計 + 送貨地址 + 再次購買 + 「查詢此訂單」細 link）。
  - **非快樂狀態視覺（✅ 拍板）**：已退款／已取消／付款失敗 → **唔出 4 步時間線**，改單行狀態 label（已退款/已取消 = muted brown、付款失敗 = `#b4452a`）+ 已退款單加「已退款 −$X」金額行；處理中/已寄出照 timeline。Label token 對照見 §22。
  - **再次購買 = WC 原生 order-again endpoint**：全部可購 line 以**現價**重新入車，唔可購（售罄/下架）項出 per-item notice；成張單冇 line 可購 → 藏個掣。demo 個單一 PDP link 只係 placeholder。
- **地址**：帳單 + 送貨地址卡 + 編輯 / 新增表單（對應 WC billing/shipping address）。
- **帳戶設定**：個人資料（名/電郵/電話）+ 變更密碼（對應 WC account details）。**無生日欄**（生日禮遇已取消）。
- ⚠️ 稿內數字全部係 placeholder → 由 WC / user data 取代。

---

## 10. 全站設計鐵則（轉 theme 時要守）
- **HIBI LAB 內容區文字最小 16px**（label / eyebrow / 註腳 / 按鈕 一律 ≥16px）。**例外**：共通 Scent.M chrome（nav/footer/menu）維持原樣；icon glyph 不受管；**及 `Landing.html` 現有 sub-16px 元素獲客戶豁免（拍板 2026-07-03）— 維持原樣，其餘 9 頁照守**。
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
- **係咩**：全站共用嘅 search overlay（command-palette 式）+ slide cart（側滑抽屜）。**一份 source**，每個店頁 `<script src="store-chrome.js"></script>` 載入,自動注入 markup + wire 返 nav 嘅搜尋掣同購物車 icon。**唔好逐頁 copy**。
- **觸發**：nav `#nav-search-btn` → 搜尋;`a[aria-label="購物車"]` → 側滑車(intercept click,`href` 作 fallback)。
- **Scroll-lock**：抽屜 / overlay 開啟時鎖背景 —— 依賴每頁 chrome 將 Lenis 實例 expose 做 `window.hbLenis`(`const lenis = window.hbLenis = new Lenis(...)`);`store-chrome.js` 用 `hbLenis.stop()/start()`（`overflow:hidden` 實際由 Lenis 嘅 `.lenis-stopped` CSS 提供）。**新頁必須照樣 expose,否則背景會 scroll-through。WP 側：即係 theme 嘅 `assets/js/theme.js` 要加一行 expose `window.hbLenis`（一行 diff）。**
- **搜尋資料**：`store-chrome.js` 內含 `PRODUCTS_JSON`(⚠ 兩份 static JSON 可能有 drift — 例如 stock 欄位;runtime 有 `if(!#plp-data)` guard 防重複,但唔好信「完全同步」嘅注釋);Shop 有 `#plp-data` 就用返,其餘頁自動注入。**Production：兩份都由 WooCommerce 產品資料取代 — overlay 行 §22 拍板嘅自訂 REST endpoint、直入 `?s=` 301 去 PLP（單一來源,見 §20.5/§22 搜尋契約）;static dataset 只係 demo。**
- **WP 對應**：`store-chrome.js` → theme JS(`wp_enqueue_script`);抽屜/overlay markup → 一個 `get_template_part('template-parts/store-chrome')`,喺 footer include 一次。購物車內容接 WooCommerce cart fragments(`woocommerce_add_to_cart_fragments`)即時更新;**drawer 嘅 qty +/− 同 移除 = 自訂 wc-ajax endpoints（§22 — fragments 只係 re-render 機制,唔包 mutation）**;drawer 空狀態見 §22;結帳掣 → `wc_get_checkout_url()`。
- **一致性守則**：nav utility cluster(搜尋 + 會員 + 購物車 icon,全部 ≥ 手機可見)+ `store-chrome.js` include **每個店頁都要有**,順序一致。

---

## 13. 新增頁面 + 購買旅程接線（skin,交接用）
- **新頁(全部 = WooCommerce 原生流程嘅品牌 skin;邏輯用原生,呢啲係樣式參考):**
  - `HIBI LAB Checkout.html` → `woocommerce/checkout/form-checkout.php` override(聯絡 / 送貨 / **送貨方式（ShipAny 送上門+自取點，§7）** / Stripe 付款 / 訂單摘要 + 優惠碼收埋式欄)。
  - `HIBI LAB Order Received.html` → `woocommerce/checkout/thankyou.php`(訂單完成頁)。**沿用 Scent.M `page-thanks.php` 編輯式版式**(serif-italic eyebrow + fluid-display 標題 + 白底 `<dl>` 詳情卡 + underline 連結);可直接 reuse thanks template + 訂單詳情卡,一如 workshop booking completion(`?booking=ID&token=`)。
  - `HIBI LAB Account Login.html` → `myaccount/form-login.php` + `form-lost-password.php`(登入 / 註冊 / 忘記密碼,tab 切換 = demo;實際 3 個原生 template)。
- **旅程接線(前端):** Landing 4 類別門 → `Shop.html?cat=<slug>`;Shop 讀 `?cat=` 自動套 dept filter(沿用現有 dept pill;demo slug = skincare/pet/sleep/home,**production slug 跟 top-level `product_cat` terms 動態出,唔 hardcode — §3/§21.21**);搜尋結果直接喺 overlay 顯示全部(唔再外跳);PDP「加入購物車」→ 彈 slide cart 確認;Cart / slide cart「去結帳」→ Checkout → 確認及付款 → Order Received。
- **WP 對應:** `?cat=` → `product_cat` archive 或預套 filter;結帳 / 訂單完成 / 登入全部係原生 endpoint,只做 template override + CSS skin,唔改邏輯 / payment。

---

## 14. Demo 硬資料 → WP 綁定對照（交接檢查表）
> 所有靜態頁上嘅數字 / 文字 / 相片都係 **demo placeholder**（靜態設計交付物本質），全部應由後端資料取代：
- 產品(名/價/相/容量/成分/功效) + 搜尋資料(`store-chrome.js` `PRODUCTS_JSON`) → **WooCommerce products / 產品查詢**。
- 購物車行項目 + nav 購物車數字「2」+ 小計/折扣/總計 → **WC session cart / cart totals**。
- 會員(Amanda、電郵、訂單 #HL-…、地址) → **登入用戶 / WC 訂單**。（等級／優惠券錢包／積分數據已隨 VIP 取消刪除，§5。）
- **Demo 每頁嘅 `<head>`（title/description/canonical/JSON-LD）全部係 throwaway** — production 由 theme 嘅 `inc/seo.php` SEO 層統一生成（per-page canonical、Product/BreadcrumbList schema、journey 頁 noindex），唔好照搬。
- 免運門檻、Checkout 摘要、Order Received 訂單編號/金額、運費 → **ACF options + WC order data + WC shipping zones 商家預設 per-method 費率（§7 實證 — 唔係 checkout 即時報價）**。（VIP 門檻/折扣已隨機制取消刪除。）
- Menu(About/ODM/Workshops/Journal/Testimonials/Contact)、Privacy/Terms 連結 → **現有 Scent.M 站頁面**(production 解析,非 HIBI 範圍)。
- Scent.M nav logo → `home_url('/')`（靜態暫指 `index.html`）。
- **WP-readiness**：共用 chrome 全站一致、`store-chrome.js`=partial、`?cat=` 已接;轉 theme 時 HTML→PHP template + Tailwind 由 `build-css.js` 編譯(唔用 CDN)。

---

## 16. WhatsApp 浮動掣＋支援渠道
- **WhatsApp 浮動掣（context-aware · 兩個號碼,WP 後台可入）**：Scent.M 頁 = B2B「Bespoke Inquiry」;HIBI LAB 店頁 = B2C「Customer Care」(客服 label 用英文,同 Scent.M chrome 一致;預填訊息維持廣東話)。**兩個 WhatsApp 號碼由客喺 wp-admin 自己入**(ACF/theme options：`scentm_opt('whatsapp_number')` + `whatsapp_text`;HIBI LAB 加平行 option `hibilab_whatsapp_number` + `_text`,**只喺有號碼先 render、唔 fallback 去錯號碼**(同 `footer.php` `if($wa)` 一致)),前端按頁面 context 出對應號碼 + 文案;綠色 WA 本體不變,只換 label / 預填 / 號碼。HIBI LAB demo 沿用 inert `href="#"` + `data-wa-pending`（唔 render 假號碼）;上線由客喺 wp-admin 填客服號碼先出現（同 Scent.M 嘅 hide-if-empty 行為一致）。
- **支援 email（2026-07-03 新增,§21.18）**：平行 option `hibilab_support_email` — Shipping 政策頁「退換流程／有疑問」以 mailto render,hide-if-empty;「查詢此訂單」link 嘅 fallback 渠道。**兩個支援渠道（WA 號碼＋support email）都係 §22 launch gate 硬項** — hide-if-empty 唔可以變成「店開咗但零支援渠道」。

---

## 15. PDP 內容區塊 = ACF Flexible Content（✅ 已拍板 2026-07-03 · 最終版 — merchant 自由 create + 拖拉排序,同 Journal/Workshop 一致）
> （早期文件曾有一版「固定 ACF field group」方案,客戶已裁定以本節 Flexible Content 為準,舊版已刪。）
PDP 下半部**一定要做成 ACF Flexible Content field**(建議 `pdp_blocks`):商家喺 wp-admin **自由新增 / 刪除 / 拖拉排序** block,同 `scentm-wp` Journal / Workshop 嘅 flexible-content **完全一樣 pattern**;`single-product.php` loop 每個 layout render。現靜態稿每個 section = 對應 block layout 嘅**視覺樣板(1:1)**。
**Block layout 目錄(= 現稿 section):**
- `rich_text` — 標題 + 正文(產品介紹)
- `spec_list` — 標籤/值對照(成分→功效逐項、規格)
- `steps` — 編號步驟(用法 01/02/03)
- `callout` — 提示框(安全使用須知,左 terracotta 邊)
- `stat_row` — 數字統計(為何純露 1% / 0.2–0.3% / 0.1%)
- `faq` — 問答 repeater
- `image` / `gallery` — 單圖 / 多圖
- `video` — 影片(使用示範)
每個 layout 欄位 + 樣式跟現稿 token(serif 標題 / ≥16px 正文 / `#ece0d5` 分隔 / terracotta accent)。安全須知 / 純露科普 / **保存期限（保存期限・開封後使用期・儲存方法,`spec_list` layout — 純露類產品標準購買疑慮,2026-07-03 journey audit 加入;內容由客戶上架時提供,launch checklist 有項）** 若全線通用可設 theme 預設 block,逐件可加自己版本 override。上半部(相片庫 / 標題 / 價 / 香味 variation / 加入購物車)= WooCommerce 固定 summary,唔入 flexible-content。

---

## 17. 登入狀態 → Cart / Checkout 顯示（✅ 2026-07-03 隨 VIP 取消大幅簡化 · guest 預設照舊）
- **Guest checkout 允許**（`Accounts & Privacy → Allow guest checkout`），設計稿 Cart / Checkout 預設 guest。
- **Guest 同 Member 嘅 Cart／Checkout 顯示完全一樣**（VIP 取消後無會員專屬行）：小計 + 運費（送貨方式於結帳計算，§7；免運門檻 admin option）+ 總計；coupon 欄可用（§6 規則）。**冇** tier 折扣行、**冇**積分行、**冇**「登入享折扣」一類會員提示（Cart 皇冠提示已刪）。
- **Checkout「已有帳戶？登入」= WC 原生 inline returning-customer 展開式表單**（`woocommerce_checkout_login_form`，用 `.co-field` tokens skin，喺 checkout 頁內展開，**唔係**跳去 Account Login 頁 — demo 個跳頁 link 只係 placeholder）。登入成功留喺 checkout，購物車不變。
- **其他入口嘅登入後返回路徑**：任何由店頁去 login 嘅 link 帶 `?redirect_to={當前 URL}`；theme hook `woocommerce_login_redirect` + registration redirect 尊重佢（fallback = my-account）。
- **Cart summary = 可編輯估算**（coupon + qty）;**Checkout summary = 唯讀 review**（line items 縮圖 + 最終數 + **收埋式優惠碼欄（§13/§21 裁定保留）**,無 qty 編輯,改數返 Cart）。cart / checkout 總計必須一致（共用 `WC()->cart`）。

---

## 18. 帳戶 auth = 單一 `/my-account/` route（session 切換 · WooCommerce 標準）
- 設計稿有兩個 state 檔:`HIBI LAB Account Login.html`（logged-out:登入 / 註冊 / 忘記密碼 / 重設連結已寄）+ `HIBI LAB Account.html`（logged-in dashboard）。
- **Production 唔係兩條獨立 public route** —— WooCommerce = 一個 `/my-account/` core page 按 session 自動切換:未登入 → login/register;已登入 → dashboard;`/my-account/lost-password/`;email 重設連結 → reset form。
- Theme override:`woocommerce/myaccount/form-login.php` / `form-lost-password.php` / `form-reset-password.php` / `dashboard.php`,**唔好將 static HTML 原封搬入 production**。
- **Login 頁 eyebrow「HIBI LAB」= link 去 `/hibi-lab/`**(2026-07-03 journey audit:Login 係唯一冇 breadcrumb 嘅店頁,eyebrow 做返回路徑;demo 已改 `<a>`,form-login.php override 要跟)。
- Demo flow loop（已通,非 orphan）:會員 icon → Account（假設已登入）→ 登出 → Account Login → 登入 submit → Account。兩份稿 = 同一 route 兩個 state;auth 邏輯 + email 全 WooCommerce 原生,theme 只 on-brand skin。

## 19. 售罄 product state（pattern spec · ✅ 2026-07-03 隨 VIP 取消簡化 — 商品淨返「有貨／售罄」兩態）
- **資料來源:** WooCommerce 原生庫存（售罄 = out of stock）。**預購／會員搶先機制已取消**（§5）— 唔做 backorder、唔做等級 gate。
- **售罄:** 產品卡 + PDP 圖上 `售罄` badge（深啡底淺字）· 圖 `opacity:.55` · 加入購物車掣 disabled 灰態「已售罄」。（客戶拍板 2026-07-03:**唔做「補貨通知」訂閱** — 售罄狀態只顯示灰態掣,唔加額外功能。）
- badge class `.stk-out`（深啡）,`position:absolute;top:12px;left:12px;font-size:16px;padding:5px 12px;border-radius:30px`。WP 由庫存條件 render,設計稿提供視覺 pattern。`.stk-pre`／「會員搶先預購」badge 已作廢。
- **搜尋 overlay 結果行同樣要出 售罄 tag**（重用 `.stk` token;§22 搜尋 endpoint payload 本身有 `stock` 欄,overlay 消費佢 — 免得撳個乾淨結果入到 PDP 先見到死灰掣）。

---

## 20. 前端狀態、a11y、data-source 補充（交接必讀）

### 20.1 結帳付款狀態（前端已呈現）
- **表單驗證** → 原生 `required` / `checkValidity` / `reportValidity`（卡號、到期、CVC、地址、條款 checkbox）。
- **處理中** → 全屏 `#pay-overlay`（role=dialog aria-live）+ spinner，防重複提交。
- **失敗 / 重試** → `#pay-error`（role=alert）紅色 banner；demo 用測試卡 `4000 0000 0000 0002` 觸發拒絕，客可改卡重試。
- **成功** → 跳 Order Received。
- **交俾 WP / Stripe（前端唔自造）:** 3DS/SCA 驗證 = Stripe hosted，唔喺本站設計;`pending`（銀行未 confirm）、`on-hold`、`failed` = WooCommerce order status,由 WC + Stripe gateway 處理,前端只顯示對應訂單狀態文字。**唔好自己寫 payment math。**

### 20.2 送貨方式呈現（✅ 2026-07-03 更新 — ShipAny Phase 1，可揀列表係預設）
- Checkout「送貨方式」= **radio 卡列表**：送上門／自取點（§7），每卡顯示**商家預設 per-method 費率**（§7 實證，對齊 ShipAny 價目 — 唔係即時報價；≥免運門檻 → 顯示 免費 + 劃線原價）；揀自取點 → 展開選點器（production = plugin 自家彈窗，§7）。
- WP theme loop `WC()->shipping` packages/rates render,唔寫死;方式/運費變動經 `update_order_review` 即時反映落 summary 運費行。
- 舊「單一方法 → 陳述行」規則只喺 ShipAny 停用嘅 fallback 情境先適用。

### 20.3 售罄狀態
- 見 §19。PLP demo 示範 售罄 badge;WP 由 WC 庫存條件 render。（會員搶先預購 badge 已作廢,§5。）

### 20.4 無障礙（a11y，已實作）
- Search overlay + slide cart + 手機篩選抽屜 = `role="dialog"` `aria-modal="true"` `aria-label` + focus-trap（Tab 循環）+ ESC 關閉 + 關閉後 return focus 返觸發掣;觸發掣有 `aria-haspopup`/`aria-expanded`/`aria-controls`。
- 付款 overlay = `role="dialog" aria-live`;錯誤 banner = `role="alert"`。
- WP 遷移保留呢啲屬性;新增互動元件沿用同一 pattern。

### 20.5 產品資料單一來源（重要）
- Demo 有兩份 product JSON:PLP 內嵌 `#plp-data` + `store-chrome.js` 內 `PRODUCTS_JSON`（俾非 PLP 頁嘅搜尋用;runtime 有 `if(!#plp-data)` guard 防重複注入,故無 runtime 重複,只係 static demo 源碼各一份）。
- **Production:** 兩者都由 **WooCommerce 產品資料** 取代（PLP query + overlay 自訂 REST endpoint,§22 搜尋契約;~~FacetWP index~~ 已被 §21.2 否決）→ 單一來源,唔會有兩份 JSON。

### 20.6 帳戶地址模型
- Account 地址 = **帳單 + 送貨兩組**（對應 WooCommerce core billing/shipping,已移除誤導性「新增地址」無限地址簿 UI）。若客要多地址簿 = 需額外 plugin / custom,現階段唔做。

---

### 20.7 「使用示範」影片 block 行為（B5）
- PDP / ACF `使用示範` block = 靜態封面圖 + 播放鈕 + 時長標。**行為規格:** 桌面 = 點擊開 **lightbox**（居中 modal + dim 背景 + ESC / 點背景關,沿用 store-chrome dialog a11y pattern:role=dialog/aria-modal/focus-trap）;手機 = 全寬 inline 展開播放。
- **來源:** 建議 self-host（MP4/WebM,`<video>` + poster）或 YouTube/Vimeo `<iframe>` privacy-enhanced;由 ACF 影片欄位（file 或 oEmbed URL）驅動,無片則整個 block 唔 render。時長標由影片 metadata 出,勿 hardcode（現稿「0:45」為 placeholder）。

---

### 20.8 售罄 PDP 條件狀態（B3 · WP 按 WC 庫存 render · ✅ 2026-07-03 VIP 鎖定變體已作廢）
- **變體缺貨（已示範）:** PDP 香味/容量 `<input disabled>` + `.box{opacity:.45;line-through}` + 「· 缺貨」標 + 「部分配方暫時缺貨」註（**只喺對應軸有缺貨組合先出**）;WC variation 無庫存時自動 disabled。
- **整件售罄:** gallery 左上 `售罄` badge（深啡 `#3B261D` 底淺字,同 PLP `.stk-out`）+ 主圖 `opacity:.6`;加入購物車掣 → disabled 灰態 `background:#cbb8a6;cursor:not-allowed`,文案「已售罄」。WC `!is_in_stock()` 觸發。（客戶拍板 2026-07-03:**唔加「補貨通知」訂閱 input** — 保持簡單,只有灰態掣。）
- ~~VIP 會員搶先鎖定變體~~ — **已作廢**（VIP 機制取消,§5）。

---

### 20.9 圖片最佳化（C6 · deploy build-step）
- 已刪 23 個未被任何頁引用嘅舊 asset（fp-img / promise-ic / promise-icon / hb-bag / hero-scene / promise-scene 等,root + export）。
- **未做壓縮（刻意）:** 14 張攝影 PNG（cat-*、prod-*、hero-product、promise-candle、by-scentm）每張 1.3–2.4MB。**唔喺 HTML 交付階段手轉**,因為部分有透明背景,canvas 硬轉 JPEG 會整爛透明底。**正確做法 = deploy build-step:** 用 Squoosh / imagemin / `cwebp` 轉 **WebP（有透明保留 alpha）每張 ≤300KB**,`<img>` 可加 `<picture>` WebP + PNG fallback;WordPress 版由媒體庫 + WebP plugin（如 Imagify / EWWW）自動處理。原圖已係高清母檔,壓縮喺上線 pipeline 做。

---

## 21. 決策記錄（2026-07-03 客戶拍板 — 與其他章節有出入時以本節為準）
1. **URL 結構（SEO 建議獲採納）**：landing = `/hibi-lab/`；PLP = `/hibi-lab/shop/`；product permalink base = `/hibi-lab/shop/%product%`；分類 archive = `/hibi-lab/shop/{cat}/`（render 同一 PLP template + 對應 dept pill 預選；`?cat=` deep-link canonical 指向對應 archive）。cart / checkout / my-account 沿用 WC 預設 slug（journey 頁 noindex、無 SEO 價值，§18 照舊；WPE cache exclusions 亦以預設 Woo 路徑最穩）。品牌內容 URL 全部歸一喺 `/hibi-lab/` cluster 下 — 對 SEO 最好，亦保留日後 spin-off 嘅 301 可遷移性。
2. **Filter 引擎 = 全 custom in-theme**（無 plugin、無年費）：沿用 theme 現有 journal AJAX partial + load-more + `scentmRevealScan` pattern；facet live counts 用「先攞符合現有 filter 嘅 product ID set → `wp_get_object_terms` 計數」（boutique 目錄規模零壓力）；價格 slider min/max 由 `wc_product_meta_lookup` 攞。如日後 SKU 過千先再評估 FacetWP。
3. **Checkout 優惠訊息 opt-in**：保留，**預設不剔**（PDPA 正路）；剔咗 → 寫入現有 `scentm_subscriber` 訂閱系統（同 Scent.M 聯絡表共用「Subscribers 訂閱」後台名單 + CSV export）+ order meta 留痕。**Label 只可以係 marketing**（「接收優惠及新品消息」）— 交易 email 一定發，唔可以出現喺 opt-out 選項度（2026-07-03 第二輪修正：demo 曾錯誤 pre-checked + 綑綁「訂單通知」字眼，已改）。
4. ~~**等級福利 = 做真**~~ — **✕ 已作廢（2026-07-03 第二輪）**：VIP／等級／生日禮遇機制全面取消，見 §5／§21.12。
5. **Footer「Shipping & Returns」連結 = 全站**（包括 Scent.M 頁 — 屬客戶批准嘅共用 chrome 變更）；footer「HIBI LAB →」指去 `/hibi-lab/`。
6. **送貨地區 = 4 個**（香港島／九龍／新界／離島，`woocommerce_states` 補 離島）。~~Phase 1 四區同一運費（$50、滿 $500 免運）~~ — **運費部分已作廢（2026-07-03 第二輪）**：ShipAny 提前 Phase 1、行商家預設 per-method 費率（實證見 §7／§21.13）。Account demo 嘅 3 區下拉以 4 區為準。
7. **真實回饋 = 客戶後台自己入**（ACF repeater：名＋內容；星星為固定視覺樣式）；未有內容前 Landing 該區 hide-if-empty。
8. **產品目錄由空白入起**（唔 seed demo 產品）；入口 link 維持 coming-soon，直至客戶入好首批產品＋gateway 驗證通過。（2026-07-03 第二輪補充：Scent.M 站現時 staging-only，入口層處理推遲到整合階段 — §0／§21.24。）
9. **唔加 cookie consent banner**（香港-only；PDPO 無此要求，/privacy/ 已披露；日後加 GA／廣告 pixel 先再評估）。
10. **Woo 交易 email = WP dev 設計**，跟 Scent.M 現有收據範本 pattern：品牌 wrapper + **後台可編輯範本**（option 儲存、placeholder、live preview、測試寄送）；訂單編號用 `HL-` 顯示格式。（此決定取代「frontend dev 交 email 設計」嘅要求。）
11. **Stripe webhook 隔離 = 上線硬閘**：共用一個 Stripe 帳戶不變（統一對數）；theme 嘅 workshop webhook handler 加 guard — 事件 metadata 冇 `workshop_id` → 直接 200 略過（網店事件唔會誤入 workshop 線）；Woo gateway 用**獨立 webhook endpoint + 獨立 signing secret**。

### §21 第二輪決策（2026-07-03 · journey audit 後客戶逐條拍板 — 同樣以本節為準）
12. **VIP／會員等級機制全面取消**：「唔做 VIP 機制」「連生日禮遇都唔要，只保留 coupon 機制」。刪：等級制、tier 折扣、生日禮遇全套、優惠券錢包、會員搶先預購、會員價 teaser、積分構想。留：WC 原生會員帳戶（註冊／登入／訂單／地址）、guest checkout、優惠碼機制。詳見 §5。
13. **ShipAny 提前 Phase 1**：送上門＋自取點；運費行 ShipAny 體系（實證修正：checkout 顯示商家預設 per-method 費率、對齊 ShipAny 價目 — 官方冇 checkout live-quote 功能，見 §7）；免運門檻機制保留、金額 admin 後台自訂（demo $500 只係示範值，設空/0=停用）；訂單狀態 4 步（已確認→處理中→已寄出→已完成），已寄出步出追蹤號＋link（theme 掛 `pr_shipping_shipany_label_created` 轉 `wc-shipped`）；寄出通知 email。詳見 §7（含官方文檔實證研究全記錄）。
14. **優惠碼 = 一次一張**：全部折扣碼 `individual_use`；免運類碼可與一張折扣碼並存；已套用狀態要有「移除／更改」affordance。詳見 §6。
15. **瑕疵退換期 = 7 日**（全部統一）：Shipping 頁「不適用」段補明「商品本身瑕疵或運送損壞：收貨後 7 天內聯絡我哋」；Scent.M `page-terms.php` §5 fallback 由 14 天改 7 天（如客已喺 ACF 儲過舊值，launch 前後台同步改 — checklist 有項）。
16. **Terms FPS／銀行轉帳句 = 成句刪走**（無業務線收 FPS；theme `page-terms.php` fallback 已改）。
17. **取消訂單政策 = 新增**（客戶指定要寫好）：Shipping 頁退換 section 加 —「訂單確認後如需取消或修改，請於出貨前儘快透過 WhatsApp 聯絡我哋。我哋會盡力配合，惟不保證能夠成功取消或修改；如訂單已進入處理或包裝程序，或需收取相關額外費用。訂單一經寄出，恕無法取消，可於收貨後按退換政策處理。」確認 email 結尾加一句「如需取消或修改訂單，請於出貨前儘快聯絡我哋。」
18. **支援渠道 = WhatsApp＋後台自訂 email**：政策頁支援渠道 = WA 浮動掣＋支援 email（新 ACF option `hibilab_support_email`，mailto，hide-if-empty）；**刪**「前往聯絡我們」指向（B2B contact form 唔做 B2C 支援路徑）。兩渠道均入 launch gate（§22）。
19. **404 = 按 URL 分流**：一個 `404.php`，`/hibi-lab/` 前綴（或 WC journey slug）→ HIBI 版；否則 Scent.M 版。見 §2 表。
20. **店內 menu 底部 link 改字改指向**：HIBI LAB 店頁嘅 fullscreen menu 底部「Explore Hibi Lab」→ **「HIBI LAB 全部商品」→ `/hibi-lab/shop/`**（demo：`HIBI LAB Shop.html`）；brochure 頁維持「Explore Hibi Lab」→ Landing。（客戶批准嘅 store-scoped chrome 變化，同 utility cluster／WA persona 先例一致。）
21. **分類入口動態化**：Landing 入口卡／Shop pills／橫幅由 top-level `product_cat` loop 出，內容 ACF term fields，現有 4 個做 seed。見 §3。
22. **Guest 售後閉環**：thankyou「查看訂單」條件 render（登入→my-account orders；guest→「建立帳戶以追蹤訂單」＝WC 原生 post-checkout account creation，email 預填＋連結訂單）；email 加 `{order_url}`（WC order-received URL 連 order key，guest-safe）；email 狀態句 guest 變體（唔講「會員中心」）。
23. **Wishlist／最近瀏覽 = 明確 deferred**（現目錄規模唔做；SKU 過 ~50 再評估）。
24. **Scent.M 整合推遲**：「先做好 HIBI LAB，我會再整合入 Scent.M；Scent.M 而家只係 staging 未 production」— 入口層（coming-soon 標示／第 4 nav 入口／首頁描述句）全部到整合階段先處理（§0／§22 flip checklist）。

---

## 22. 技術補遺（WP dev 拍板 2026-07-03 — 實作規範，補齊各章未定細節）
- **HPOS**：啟用 High-Performance Order Storage（現代預設；Orders 為 `woocommerce` 頂層選單嘅 submenu）。
- **Stripe plugin**：官方 **WooCommerce Stripe Gateway**（`woocommerce-gateway-stripe`）。Payment Element 用 appearance API 對齊 `.co-field` tokens —— **iframe 內部無法逐 pixel 對齊 demo 輸入框，屬明示豁免**。Cart / Checkout 頁一律轉 **classic shortcode**（block 版會繞過 §2 嘅 template override，一定要轉）。
- **Checkout 欄位對照**（`woocommerce_checkout_fields`）：電郵先行；單一「名字」→ `billing_first_name`（last_name 隱藏＋非必填）；地區＝`billing_state` 自訂 HK 四區（§21.6）；無 postcode；電話必填；billing 複製 shipping（單一地址組，§20.6 兩組地址只喺 Account 管理）。
- **Coupon 規則（2026-07-03 第二輪重寫 — 舊「tier coupon 並用」規則作廢）**：所有折扣碼 `individual_use`（一次一張）；免運類（FREESHIP）可與一張折扣碼並存；已套用碼嘅「移除／更改」skin WC 原生 remove-coupon link（§6）；無效碼唔影響已套用碼；重複套碼 → WC 原生拒絕 notice 經全域 notices skin 出。
- **PLP 分頁**：未篩選＝crawlable `/page/N/`（跟 workshops archive-loadmore pattern）；有 filter 狀態＝AJAX＋URL 參數（`?pa_scent=…`），filter 版 canonical 指返基礎 archive（唔入 index）。「顯示 X / Y 件」由 query `found_posts` 出。
- **排序對照**：精選推薦＝`menu_order asc`＋date desc fallback（客喺 Products 排序畫面拖）；價格低至高／高至低＝price asc/desc（meta lookup）；名稱 A–Z＝title asc（custom orderby）。
- **series ↔ catLabel**：series＝`product_cat` **子分類**（寵物護理 → 情緒／身體／日常）；卡 label 組合規則＝「父分類 · 子分類」，無子分類只出父分類；PDP breadcrumb 連去子分類 archive。
- **audLabel 單一來源**：卡面「適用」label＝ACF 文字欄位「適用對象顯示」（自由文案，例「幼貓幼犬適用」）；`pa_audience` attribute 只做 filter 軸。兩者用途唔同、分別維護。
- **運費字串單一來源（2026-07-03 更新）**：免運門檻（`hibilab_free_ship_threshold`，admin 自訂，空/0=停用）＝ **ACF option**；**六**個消費位 — PDP／Cart（nudge「再加購 $X 即享免運費」）／Checkout／Order Received／Shipping 政策頁／**側滑車 footer**（文案「滿 $X 免運 · 運費於結帳按送貨方式計算」＋低於門檻時同款 nudge） — 全部由 option 讀同源計算；門檻停用時六處免運文案自動隱藏。運費本身 = **商家預設 per-method 費率（§7 實證 — 唔係即時報價）**，唔再有「$50 flat」字串。⚠ 免運門檻要同**兩處**設定一致：WC 原生 free shipping（送上門）＋ ShipAny plugin「Locker/Store List Minimum Checkout Amount for Free Shipping」（自取點，v1.0.33）— health 提示要驗埋兩邊。
- ~~Coupon 錢包~~ — **已作廢**（VIP／錢包取消，§21.12）。
- **搜尋（2026-07-03 補匹配契約）**：overlay 數據＝自訂 REST endpoint（product query → JSON：name／catLabel／audLabel／price／img／url／stock）；**overlay 結果行要消費 `stock` 欄出 售罄 tag（§19）**；直入 `?s=` → 301 去 `/hibi-lab/shop/?s=…` 由 PLP render 結果（無獨立 search.php 設計）。**匹配欄位契約：overlay 同 PLP `?s=` 兩條路必須查同一組欄位 — 產品 title＋`product_cat` label＋`pa_香味` terms＋`pa_功效` terms** — 一個定義兩邊實作，唔可以各自為政（demo 曾經 overlay 唔查功效導致兩路結果分歧）。Overlay 零結果 → 熱門 term 顯示為 tappable chips（**撳＝喺 overlay 內即場重新搜尋** — 同 §13「搜尋結果唔外跳」ruling 一致）＋「睇全部商品」link 去 PLP。
- **PLP 空狀態三變體＋Cart 清空（2026-07-03 journey audit 落地，demo 已實作）**：#plp-empty 按狀態切換 — (a) 無 filter 無搜尋（空分類，§21.21 動態化下客加第 5 個空分類必然出現）→「呢個系列即將上架」＋「瀏覽全部商品」掣（切返「全部」pill）；(b) 有 filter →「未有符合的商品／試下放寬篩選條件」＋「清除全部篩選」；(c) 有搜尋字 →「搜尋「X」冇結果 — 清除搜尋或試下其他關鍵字」＋「清除搜尋」。clearAll() 喺空分類情境要一併 reset 返「全部」分類（否則個掣係 no-op）。**Cart 清空**：items 列換 cart-empty block 時，成個訂單摘要 aside 一齊藏（production 行 WC 原生 `cart-empty.php` 分支自然無 aside — 唔好照抄 demo 嘅 client-side 切換）。
- **側滑車 qty／移除接線（2026-07-03 新增 — §12 fragments 唔夠）**：drawer 嘅 qty ＋／−／移除 = **自訂 wc-ajax endpoints** 呼叫 `WC()->cart->set_quantity()`／`remove_cart_item()` 後回傳 refreshed fragments；stepper 唔可以加超過可購庫存。**Drawer 空狀態**：最後一件移除 → 「購物車暫時係空嘅」＋「繼續購物」（關 drawer），藏 查看購物車／去結帳／小計。
- **全域 WC notices skin（2026-07-03 新增）**：`woocommerce/notices/{error,notice,success}.php` overrides，用現有 token（error 三色組 `#fbeae4`/`#e3a58c`/`#8a3618`、成功 `#1f7a4d`）＋zh-HK 字串；覆蓋 session 過期／庫存不足移除／coupon 錯誤／order-again 通知等全部原生 notice（render 喺 Cart items 上方＋Checkout form 上方）。**Stripe 付款錯誤例外** — 繼續入 summary 嘅 `#pay-error` 槽（眼球位，demo 已示範）。
- **order-pay ／ order-failed ／ cancelled**：用 `#pay-error` 語彙 skin WC notices＋thankyou.php 失敗分支（沿用 Order Received 版式，紅 banner 取代綠 tick）；無需新設計稿。
- **Account 訂單狀態 label map（2026-07-03 新增）**：已確認／處理中／已寄出（timeline 步）＝正常 4 步；**已退款／已取消＝muted brown（brown/45）單行 label、付款失敗＝`#b4452a`** — 非快樂狀態唔出 timeline，改單行狀態＋（退款單）「已退款 −$X」行。同 email 變體 ④ 對齊。
- **3DS overlay 生命週期（2026-07-03 新增）**：`#pay-overlay` 只喺 `stripe.confirmPayment` in-flight 而且無可見 challenge 時顯示；3DS iframe／modal 出現 → 藏 overlay；錯誤／使用者放棄 → 藏 overlay＋錯誤入 `#pay-error`（decline demo 已示範同一 pattern）。
- **上線 e2e 測試（必行 gate · 2026-07-03 擴充）**：staging＋Stripe test mode → 落單（4242）→ 訂單／庫存／email 全鏈 → **ShipAny 全鏈測試：出單 → 印單（waybill）→ 追蹤 write-back（order meta＋internal note）→ `wc-shipped` 轉換＋寄出 email → 自取點選點彈窗（揀點＋地址 write-back）**（§7）→ **404 分流驗證（`/hibi-lab/xxx` 出 HIBI 版、其他 URL 出 Scent.M 版，§21.19）** → Dashboard 退款 → 確認 **workshop webhook 冇誤鳴**（guard 已喺 theme `18b9c76`）→ Woo webhook 正常收 → **checklist：ShipAny 帳戶開通＋API Token 已入＋portal 已增值物流費＋Courier Service Point Listing add-on 開通（HKD 100/月，出單月豁免）／`hibilab_whatsapp_number` 已入／`hibilab_support_email` 已入／免運門檻 option 同 WC free shipping＋ShipAny locker minimum 兩處一致／Terms 7 日文案（如 ACF 有舊儲值要後台同步）／PDP 保存期限 block 內容已入／`/hibi-lab/` landing＋shop 喺 flip 前保持 noindex（或 unpublished），flip＝入口 live＋noindex 移除同一 deploy** → 先至 flip coming-soon 入口（§0 四個，含 nav `.hibi-entry`；flip 時同步剷 theme 首頁 CTA 嘅 `target="_blank"` — theme 已預先剷）。
- **771px scoped 實作（§1 裁決嘅落地方式）**：771px media block 只喺 **store body class**（如 `body.hibi-store`）之下嘅 store-scoped stylesheet 生效；共通 chrome 維持 768。`body{overflow-x:clip}` 同樣只喺 store body class 落 —— theme 手機版嘅 `overflow-x:hidden` 會殺死 PLP sticky filter bar，**不可全局合併**。
- ~~積分（§17 修正）~~ — **已作廢**（VIP／積分構想擱置，§21.12；Cart／Checkout 已無任何會員行，§17）。
- **Woo 交易 email（§21.10 落地 · 2026-07-03 更新）**：品牌範本由 WP dev 設計（見 repo `HIBI LAB Email.html` 設計稿），跟 Scent.M 收據 pattern 做 **後台可編輯**（option 儲存＋placeholder＋live preview＋測試寄送）；訂單編號顯示 `HL-` 格式；new-order 通知收件人＝店主通知地址（非 admin_email）。**五款變體（同一 wrapper）**：①訂單確認（4 步狀態條第 1 步 active）②**寄出通知**（第 3 步 active＋追蹤號卡：`{tracking_no}` `{tracking_url}` `{carrier}`）③訂單完成（第 4 步）④退款通知（退款金額行，唔出狀態條）⑤店主新訂單通知（內部，加客人聯絡資料）。**Placeholders**：`{name} {order} {date} {items} {subtotal} {discount_rows} {shipping} {shipping_method} {total} {address} {tracking_no} {tracking_url} {carrier} {order_url} {status_note}`。`{order_url}`＝WC order-received URL 連 order key（guest-safe）；狀態句 guest 變體（guest 單唔講「會員中心」，改「透過此電郵內嘅連結查看訂單狀態」）；結尾段含取消政策句（§21.17）。**Welcome／密碼重設 email 用同一品牌 wrapper 做 WC template override skin**（唔另設計內容 — 避免 reset email 似 phishing）。
- **登入後 redirect（2026-07-03 新增）**：checkout 用 WC 原生 inline returning-customer form（§17，唔跳頁）；其他店頁登入 link 帶 `?redirect_to=`，theme hook `woocommerce_login_redirect`＋registration redirect 尊重（fallback＝my-account）。
- **「查詢此訂單」（2026-07-03 新增）**：Account 訂單詳情＋thankyou 各加一條細 link — `wa.me/{hibilab_whatsapp_number}` 預填「你好，我想查詢訂單 #HL-XXXX」；WA option 未設定 → 藏（mailto `hibilab_support_email` fallback）。
- **no-js 韌性（2026-07-03 新增，theme＋store 頁通用）**：head 加 2 行 `no-js`→`js` class swap；CSS 加 `html.no-js .ani-this{opacity:1;transform:none}`（hero 類 `opacity-0` 元素同理）— JS 失敗／關閉時內容照現形，JS 用戶零視覺差異。取代 per-page `!important` patch 嘅結構修法（theme `18b9c76` 後已落）。

---

*文件隨設計決定更新；以本文件（repo 內最新 commit）為單一真相源。已拍板決策総覽：PDP=Flexible Content（§15）、guest checkout 允許（§17）、Landing 16px 豁免＋771px store-scoped（§1/§10/§22）、coupon＝Cart 輸入＋Checkout 收埋式・一次一張（§6/§13/§17）、唔做補貨通知（§19/§20.8）、**VIP／等級／生日禮遇全面取消（§5/§21.12）**、**ShipAny Phase 1・4 步訂單狀態（§7/§21.13）**、404 URL 分流（§2/§21.19）、分類入口動態化（§3/§21.21）、§21 廿四項、§22 實作規範。*
