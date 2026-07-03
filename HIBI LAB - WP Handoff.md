# HIBI LAB Store — WordPress / WooCommerce 交接文件

> 給接手嘅 WP dev。呢份係「點樣將 HTML 設計交付物 轉成 Scent.M bespoke theme 入面嘅 WooCommerce 店中店」嘅完整跟進指引。設計稿全部喺 repo 根目錄嘅 `HIBI LAB *.html`。

---

## 0. 定位（好緊要，先睇）
- **店中店（shop-in-shop）**：HIBI LAB 店係**套落現有 Scent.M bespoke theme 入面**，唔係另起新站、唔係將 Scent.M 改成純網店。
- **WooCommerce data-driven**：客淨係喺 wp-admin 入結構化 product data，前端 category / filter / 價 / 等級自動出，唔使逐件寫 code。
- **入口**：Scent.M 全螢幕選單「Explore Hibi Lab」（現時係 inert `data-coming-soon` stub）→ 上線改成真 link 即可。
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

## 2. 頁面清單（HTML 稿 → 對應 WC template · 完整 12 檔 inventory）
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
| `HIBI LAB 404.html` | `404.php`（⚠ WP 全站得一個 404 template — 同 Scent.M 現有 404 二揀一或按 URL 分流，client decision） | 404 |
| `HIBI LAB Tier Cards.html` | —（設計參考） | VIP 等級色階 spec（三卡完整 render） |
| `index.html` | —（= `HIBI LAB Landing.html` 嘅 byte-identical alias，方便 repo 直開） | alias |
| `scentm-home.html` | —（Scent.M 首頁 chrome 整合示範：Explore Hibi Lab 連結點樣駁去店；非 HIBI 頁面） | 整合參考 |

---

## 3. 產品 data model（客喺 wp-admin 入，唔使逐件寫 code）
- **分類** = `product_cat`（護膚品 / 寵物護理 / 助眠系列 / 家居香氛），hierarchical，客自己加減。
- **Filter 軸 = global product attributes**（一次過設定 term，之後每件剔）：`pa_功效` / `pa_適用對象`(人/貓/狗/居家) / `pa_香味`(swatch) / `pa_容量` / `pa_形態`(噴霧/按摩油/洗髮水/消炎水/精華/潔面/擴香)。→ filter facet + count **自動由 attribute 生成**，加新 term 客即場加。
- **容量 = variation attribute** → variable product → PLP 顯示「$X 起」、PDP size 揀掣、容量 filter。
- **Variation 模型（明確版）**：demo PDP 實際係**雙軸 variable product** — `pa_容量`（帶價）×`pa_香味`（配方）；production 用 two-attribute variable product，每個組合獨立庫存（缺貨組合 → 揀掣 disabled，見 §20.8）。
- **ACF field group（逐件產品，跟 workshops ACF pattern）**：產品介紹、整體功效（成分→功效逐項）、成分、用法、適用對象、規格（貨號等）。
- ⚠️ **紀律**：data 入落**結構化欄位**（剔 attribute term），唔好淨係打落產品名／描述 → filter 讀 attribute，唔 parse 個名。

---

## 4. Filter 引擎（三選一）
- **FacetWP（推薦）**：facet live count / swatch / range slider / AJAX 即有，CSS theme 到貼設計。慳返最重嗰嚿。
- **原生 widget**（免費）：Filter by Attribute / Price，work 但 page reload、樣基本。
- **全 custom in-theme**：`tax_query` + AJAX 自己寫（facet count 要自己整）。
- `HIBI LAB Shop.html` 示範咗目標 UI：checkbox facet + count + active chips + price 雙 handle slider + sort + 手機 filter drawer + 載入更多。Production 用 AJAX（FacetWP）或 URL 參數（`?pa_香味=薰衣草`，SEO-friendly、可分享）。

---

## 5. VIP 會員等級（Phase 1 — 已拍板）
- **等級 by 近 12 個月消費（滾動）**：query **完成訂單 date-range（近 365 日）加總**，**唔用** lifetime `wc_get_customer_total_spent()`。**軟著陸**：跌最多跌一級。
- **門檻 / 福利存喺 ACF options page**（客自己改）。示範門檻：一般 $0 / 銀級 $2,000 / 金級 $5,000。
- **等級色階**（見 `HIBI LAB Tier Cards.html`，原則「由淺到深、越高越 luxe」，卡背景按目前等級自動切換）：
  - 一般 General：`linear-gradient(120deg,#efe6dd,#e4d6c5)` · 深啡字 `#3B261D` · accent `#A64B2A` · 進度 fill `#c98f6e→#A64B2A`
  - 銀級 Silver：`linear-gradient(120deg,#3B261D,#5a3d2c 60%,#7a4f33)` · 淺字 `#FDFBF9` · accent `#e8b896` · fill `#d8a98c→#e8b896`
  - 金級 Gold：`linear-gradient(120deg,#241611,#4a3320 48%,#9a733e)` + 右上柔光 `radial-gradient(120% 80% at 85% -10%,rgba(232,200,138,.28),transparent 60%)` · 淺字 · accent `#e8c88a` · fill `#d4a95e→#e8c88a`；最高級顯示「已達最高等級」代替升級進度。
- **三福利實作（全部 in-theme、無 plugin、無 payment 風險 — 折扣一律推返 native coupon）**（2026-07-03 追加：Gold 另有 免運＋生日雙倍 — 見 §21.4）：
  1. **全店折扣**：登入會員按等級 → 結帳**自動套原生 WC coupon**（`WC()->cart->apply_coupon()`）；稅/總額/退款全部 WC native engine 計。
  2. **生日禮遇**：收集生日（ACF user field，註冊/戶口填）+ **每日 WP-Cron** 當日自動發原生 coupon email。
  3. **優先預購**：產品標 ACF flag「會員搶先」+ 按等級開放購買 / 顯示 badge（純存取控制）。
- **前提**：① 收會員生日 ② 標搶先產品。
- 等級偵測係 **read-only**（唔掂 payment）→ 穩、無 payment-cycle bug。

### Phase 2（延後 · 客保留日後開）— 積分兌換 redeem
- 要開先加**積分 ledger plugin**（myCred / 官方 WooCommerce Points & Rewards）。
- 用 **adapter class `HibiLab_Points`** 隔開（得 `get_balance()` / `adjust()` 等 method，全部 plugin 呼叫收埋一個檔）；**只用 plugin 公開 API**、**收埋 plugin 原生 admin**（`remove_menu_page`）、**staging 先測**、**唔開 auto-update**。
- Ledger 建議喺**自己 wrap 嘅後台**出一個乾淨 read + 手動調整 view（客服要查/調餘額）。
- 等級（睇消費）同積分（另一個錢包）可並存。Account 卡個進度 slot 已預留。

---

## 6. 優惠券 Coupon
- 全部 **WC native**（% / 滿減 / 免運 / 首單）。自己 wrap admin 用 `WC_Coupon` API 建券。

---

## 7. 送貨 & 訂單狀態（ShipAny 延後）
- **運費 = WC 原生**：Shipping Zones + Methods（統一運費 + 滿 $500 免運）。訂單存 `get_shipping_total()`。
- **訂單狀態 = 只用原生**：已落單(created) / 處理中(processing) / 已完成(completed)。**冇「已出貨 / 已送達」**（原生冇，需 ShipAny）。訂單詳情時間線做 3 步。
- **ShipAny（Phase 2）**：server-side 整合，**客全程留喺本站，唔會 navigate 去 ShipAny**。作用：
  1. 結帳時提供即時多 carrier 運費 → 以**原生 WC 運送選項**顯示；
  2. 後台出貨 / 印單 / 揀 carrier；
  3. 回傳追蹤號 + 狀態 → 存 WC order meta → **訂單詳情 on-site 顯示**追蹤號 + checkpoint 時間線（已攬收→運送中→派送中→已送達）+ 可選外連 carrier link；令「已出貨 / 已送達」狀態變真（3 步時間線擴展返做完整追蹤，UI 唔使重畫）。
- **建議追蹤 UX = on-site**（premium）：客留喺本站睇時間線，data 由 ShipAny 存落 order，前端只 render；外連 carrier 頁做 secondary。

---

## 8. 登入 / 註冊 / 忘記密碼（原生 — 只 skin）
- 登入 / 註冊 / **忘記密碼（lost-password → email → reset）** / 重設密碼 / 登出 = **WooCommerce + WP 原生**（endpoint + email 全包）。**唔使寫 auth 邏輯。**
- 唯一工作 = **template override + CSS 套返品牌樣式**：`myaccount/form-login.php`、`form-lost-password.php`、`form-reset-password.php`。
- （✅ 四個 view — 登入／註冊／忘記密碼／重設密碼 — 已全數喺 `HIBI LAB Account Login.html`；demo 切換流程見 §18。）

---

## 9. 會員中心面板（`HIBI LAB Account.html`，對應 my-account endpoints）
- **會員概覽**：VIP 等級卡（等級 + 近 12 個月消費 + 保級進度 + 福利）+ 統計（累積訂單 / 可用券 / 累積消費）+ 最近訂單。
- **訂單記錄**：可展開詳情（原生 3 步狀態時間線 + 商品明細 + 小計/運費/總計 + 送貨地址 + 再次購買）。
- **會員等級**：等級階梯（門檻 + 福利 + 保級進度）。
- **優惠券**：持有券卡。
- **地址**：帳單 + 送貨地址卡 + 編輯 / 新增表單（對應 WC billing/shipping address）。
- **帳戶設定**：個人資料（名/電郵/電話）+ 變更密碼（對應 WC account details）。
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
- **搜尋資料**：`store-chrome.js` 內含 `PRODUCTS_JSON`(⚠ 兩份 static JSON 可能有 drift — 例如 stock 欄位;runtime 有 `if(!#plp-data)` guard 防重複,但唔好信「完全同步」嘅注釋);Shop 有 `#plp-data` 就用返,其餘頁自動注入。**Production：兩份都由 WooCommerce 產品資料 / 原生 `?s=` 搜尋 endpoint 取代（單一來源,見 §20.5）;static dataset 只係 demo。**
- **WP 對應**：`store-chrome.js` → theme JS(`wp_enqueue_script`);抽屜/overlay markup → 一個 `get_template_part('template-parts/store-chrome')`,喺 footer include 一次。購物車內容接 WooCommerce cart fragments(`woocommerce_add_to_cart_fragments`)即時更新;結帳掣 → `wc_get_checkout_url()`。
- **一致性守則**：nav utility cluster(搜尋 + 會員 + 購物車 icon,全部 ≥ 手機可見)+ `store-chrome.js` include **每個店頁都要有**,順序一致。

---

## 13. 新增頁面 + 購買旅程接線（skin,交接用）
- **新頁(全部 = WooCommerce 原生流程嘅品牌 skin;邏輯用原生,呢啲係樣式參考):**
  - `HIBI LAB Checkout.html` → `woocommerce/checkout/form-checkout.php` override(聯絡 / 送貨 / 送貨方式 / Stripe 付款 / 訂單摘要 + 優惠碼 + VIP 折扣)。
  - `HIBI LAB Order Received.html` → `woocommerce/checkout/thankyou.php`(訂單完成頁)。**沿用 Scent.M `page-thanks.php` 編輯式版式**(serif-italic eyebrow + fluid-display 標題 + 白底 `<dl>` 詳情卡 + underline 連結);可直接 reuse thanks template + 訂單詳情卡,一如 workshop booking completion(`?booking=ID&token=`)。
  - `HIBI LAB Account Login.html` → `myaccount/form-login.php` + `form-lost-password.php`(登入 / 註冊 / 忘記密碼,tab 切換 = demo;實際 3 個原生 template)。
- **旅程接線(前端):** Landing 4 類別門 → `Shop.html?cat=<slug>`;Shop 讀 `?cat=` 自動套 dept filter(沿用現有 dept pill,`?cat` slug = skincare/pet/sleep/home,對應 `product_cat`);搜尋結果直接喺 overlay 顯示全部(唔再外跳);PDP「加入購物車」→ 彈 slide cart 確認;Cart / slide cart「去結帳」→ Checkout → 確認及付款 → Order Received。
- **WP 對應:** `?cat=` → `product_cat` archive 或預套 filter;結帳 / 訂單完成 / 登入全部係原生 endpoint,只做 template override + CSS skin,唔改邏輯 / payment。

---

## 14. Demo 硬資料 → WP 綁定對照（交接檢查表）
> 所有靜態頁上嘅數字 / 文字 / 相片都係 **demo placeholder**（靜態設計交付物本質），全部應由後端資料取代：
- 產品(名/價/相/容量/成分/功效) + 搜尋資料(`store-chrome.js` `PRODUCTS_JSON`) → **WooCommerce products / 產品查詢**。
- 購物車行項目 + nav 購物車數字「2」+ 小計/折扣/總計 → **WC session cart / cart totals**。
- 會員(Amanda、電郵、等級、近12月消費 $3,820、累積 $8,640、訂單 #HL-…、優惠券、地址) → **登入用戶 / WC 訂單 / ACF**。（積分 = Phase 2,demo 無積分數據。）
- **Demo 每頁嘅 `<head>`（title/description/canonical/JSON-LD）全部係 throwaway** — production 由 theme 嘅 `inc/seo.php` SEO 層統一生成（per-page canonical、Product/BreadcrumbList schema、journey 頁 noindex），唔好照搬。
- VIP 門檻 & 折扣 %、Checkout 摘要、Order Received 訂單編號/金額 → **ACF options + WC order data**。
- Menu(About/ODM/Workshops/Journal/Testimonials/Contact)、Privacy/Terms 連結 → **現有 Scent.M 站頁面**(production 解析,非 HIBI 範圍)。
- Scent.M nav logo → `home_url('/')`（靜態暫指 `index.html`）。
- **WP-readiness**：共用 chrome 全站一致、`store-chrome.js`=partial、`?cat=` 已接;轉 theme 時 HTML→PHP template + Tailwind 由 `build-css.js` 編譯(唔用 CDN)。

---

- **WhatsApp 浮動掣（context-aware · 兩個號碼,WP 後台可入）**：Scent.M 頁 = B2B「Bespoke Inquiry」;HIBI LAB 店頁 = B2C「Customer Care」(客服 label 用英文,同 Scent.M chrome 一致;預填訊息維持廣東話)。**兩個 WhatsApp 號碼由客喺 wp-admin 自己入**(ACF/theme options：`scentm_opt('whatsapp_number')` + `whatsapp_text`;HIBI LAB 加平行 option `hibilab_whatsapp_number` + `_text`,**只喺有號碼先 render、唔 fallback 去錯號碼**(同 `footer.php` `if($wa)` 一致)),前端按頁面 context 出對應號碼 + 文案;綠色 WA 本體不變,只換 label / 預填 / 號碼。HIBI LAB demo 沿用 inert `href="#"` + `data-wa-pending`（唔 render 假號碼）;上線由客喺 wp-admin 填客服號碼先出現（同 Scent.M 嘅 hide-if-empty 行為一致）。

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
每個 layout 欄位 + 樣式跟現稿 token(serif 標題 / ≥16px 正文 / `#ece0d5` 分隔 / terracotta accent)。安全須知 / 純露科普 若全線通用可設 theme 預設 block,逐件可加自己版本 override。上半部(相片庫 / 標題 / 價 / 香味 variation / 加入購物車)= WooCommerce 固定 summary,唔入 flexible-content。

---

## 17. 登入狀態 → Cart / Checkout 條件顯示（guest vs member · 已決定 = guest 預設）
WooCommerce 慣例:member 定價 / 積分 / tier 折扣**只喺登入會員先 render**;guest（陌生人）零登入可買（`Accounts & Privacy → Allow guest checkout`）。設計稿 Cart / Checkout **預設 guest**:
- **Guest（預設顯示）:** 小計 + 運費（≥$500 免運,order-total 門檻,非會員專屬）+ 總計;coupon 欄可用（WC coupon 非會員限定）;**唔顯示** tier 折扣 / 積分;顯示「登入即享銀級 9 折 ＋ 積分回贈」提示（連 Account Login）。Checkout 聯絡資料加「已有帳戶？登入」（WC returning-customer）。
- **Member（登入後,WP 條件 render）:** Cart JS `IS_MEMBER` flag（現 `false`）轉 `true`,並填 `MEMBER_TIER`（`general`/`silver`/`gold`）→ 折扣率由 `TIERS` table derive（一般 0% / 銀級 9折=10% / 金級 85折=15%,**唔可 hardcode**）,tier 折扣行 label 同 `−$` 自動出 + 積分行,收起 guest 提示。Checkout 同理加返折扣行 + 積分行。折扣**只顯示一行**（唔好 chip + 行重複）。
- **Guest 提示 copy 鐵則:** 唔可 promise 特定 tier 折扣（新客/一般會員 = 0 折扣,銀級要 $2,000）→ 用中性「登入 / 註冊 · 賺積分、生日禮遇,消費升級享專屬折扣」,連 Login（含登入＋註冊）。
- **Cart summary = 可編輯估算**（coupon + qty）;**Checkout summary = 唯讀 review**（line items 縮圖 + 最終數,無 coupon 欄、無 qty 編輯,改數返 Cart）。cart / checkout 總計必須一致（共用 `WC()->cart`）。

---

## 18. 帳戶 auth = 單一 `/my-account/` route（session 切換 · WooCommerce 標準）
- 設計稿有兩個 state 檔:`HIBI LAB Account Login.html`（logged-out:登入 / 註冊 / 忘記密碼 / 重設連結已寄）+ `HIBI LAB Account.html`（logged-in dashboard）。
- **Production 唔係兩條獨立 public route** —— WooCommerce = 一個 `/my-account/` core page 按 session 自動切換:未登入 → login/register;已登入 → dashboard;`/my-account/lost-password/`;email 重設連結 → reset form。
- Theme override:`woocommerce/myaccount/form-login.php` / `form-lost-password.php` / `form-reset-password.php` / `dashboard.php`,**唔好將 static HTML 原封搬入 production**。
- Demo flow loop（已通,非 orphan）:會員 icon → Account（假設已登入）→ 登出 → Account Login → 登入 submit → Account。兩份稿 = 同一 route 兩個 state;auth 邏輯 + email 全 WooCommerce 原生,theme 只 on-brand skin。

## 19. 售罄 / 預購 product state（pattern spec）
- **資料來源:** WooCommerce 原生庫存（售罄 = out of stock / on backorder）+ ACF flag `會員搶先`（優先預購,見 §5）。
- **售罄:** 產品卡 + PDP 圖上 `售罄` badge（深啡底淺字,右上角）· 圖 `opacity:.55` · 加入購物車掣 disabled 灰態「已售罄」。（客戶拍板 2026-07-03:**唔做「補貨通知」訂閱** — 售罄狀態只顯示灰態掣,唔加額外功能。）
- **預購 / 會員搶先:** `會員搶先預購` badge（terracotta）· 掣文案「立即預購」/ 非會員顯示「登入解鎖搶先預購」（按等級 access,§5）。
- badge class 建議 `.stk`（`.stk-out` 深啡 / `.stk-pre` terracotta）,`position:absolute;top:12px;left:12px;font-size:16px;padding:5px 12px;border-radius:30px`。WP 由庫存 / ACF 條件 render,設計稿提供視覺 pattern。

---

## 20. 前端狀態、a11y、data-source 補充（交接必讀）

### 20.1 結帳付款狀態（前端已呈現）
- **表單驗證** → 原生 `required` / `checkValidity` / `reportValidity`（卡號、到期、CVC、地址、條款 checkbox）。
- **處理中** → 全屏 `#pay-overlay`（role=dialog aria-live）+ spinner，防重複提交。
- **失敗 / 重試** → `#pay-error`（role=alert）紅色 banner；demo 用測試卡 `4000 0000 0000 0002` 觸發拒絕，客可改卡重試。
- **成功** → 跳 Order Received。
- **交俾 WP / Stripe（前端唔自造）:** 3DS/SCA 驗證 = Stripe hosted，唔喺本站設計;`pending`（銀行未 confirm）、`on-hold`、`failed` = WooCommerce order status,由 WC + Stripe gateway 處理,前端只顯示對應訂單狀態文字。**唔好自己寫 payment math。**

### 20.2 送貨方式呈現（conditional，勿硬做單行）
- 規則 = **適用送貨方法只有 1 個 → 陳述行（唔俾揀）;多過 1 個 → 可揀列表**。
- 今 demo 訂單 ≥$500 → 只有「標準送貨・免費」一個結果 → 陳述行。
- ShipAny（Phase 2）feed 多 carrier 即時運費 → WooCommerce shipping methods 自然變返可揀列表（真有速度/價分別）。WP theme loop `WC()->shipping` methods 即可,唔使寫死。

### 20.3 售罄 / 預購狀態
- 見 §19。PLP demo 已示範 2 種 badge（售罄深啡 / 會員搶先預購 terracotta）。WP 由 WC 庫存 + ACF `會員搶先` flag 條件 render。

### 20.4 無障礙（a11y，已實作）
- Search overlay + slide cart + 手機篩選抽屜 = `role="dialog"` `aria-modal="true"` `aria-label` + focus-trap（Tab 循環）+ ESC 關閉 + 關閉後 return focus 返觸發掣;觸發掣有 `aria-haspopup`/`aria-expanded`/`aria-controls`。
- 付款 overlay = `role="dialog" aria-live`;錯誤 banner = `role="alert"`。
- WP 遷移保留呢啲屬性;新增互動元件沿用同一 pattern。

### 20.5 產品資料單一來源（重要）
- Demo 有兩份 product JSON:PLP 內嵌 `#plp-data` + `store-chrome.js` 內 `PRODUCTS_JSON`（俾非 PLP 頁嘅搜尋用;runtime 有 `if(!#plp-data)` guard 防重複注入,故無 runtime 重複,只係 static demo 源碼各一份）。
- **Production:** 兩者都由 **WooCommerce 產品資料** 取代（PLP query + 搜尋 `?s=&post_type=product` 或 FacetWP index）→ 單一來源,唔會有兩份 JSON。

### 20.6 帳戶地址模型
- Account 地址 = **帳單 + 送貨兩組**（對應 WooCommerce core billing/shipping,已移除誤導性「新增地址」無限地址簿 UI）。若客要多地址簿 = 需額外 plugin / custom,現階段唔做。

---

### 20.7 「使用示範」影片 block 行為（B5）
- PDP / ACF `使用示範` block = 靜態封面圖 + 播放鈕 + 時長標。**行為規格:** 桌面 = 點擊開 **lightbox**（居中 modal + dim 背景 + ESC / 點背景關,沿用 store-chrome dialog a11y pattern:role=dialog/aria-modal/focus-trap）;手機 = 全寬 inline 展開播放。
- **來源:** 建議 self-host（MP4/WebM,`<video>` + poster）或 YouTube/Vimeo `<iframe>` privacy-enhanced;由 ACF 影片欄位（file 或 oEmbed URL）驅動,無片則整個 block 唔 render。時長標由影片 metadata 出,勿 hardcode（現稿「0:45」為 placeholder）。

---

### 20.8 售罄 PDP + VIP 搶先鎖定 CTA（B3 · 條件狀態，WP 按 WC 庫存 / ACF render）
- **變體缺貨（已示範）:** PDP 香味/容量 `<input disabled>` + `.box{opacity:.45;line-through}` + 「· 缺貨」標 + 「部分配方暫時缺貨」註;WC variation 無庫存時自動 disabled。
- **整件售罄:** gallery 左上 `售罄` badge（深啡 `#3B261D` 底淺字,同 PLP `.stk-out`）+ 主圖 `opacity:.6`;加入購物車掣 → disabled 灰態 `background:#cbb8a6;cursor:not-allowed`,文案「已售罄」。WC `!is_in_stock()` 觸發。（客戶拍板 2026-07-03:**唔加「補貨通知」訂閱 input** — 保持簡單,只有灰態掣。）
- **VIP 會員搶先鎖定（非會員 / 等級不足睇到）:** 加入購物車掣換成鎖定態 `background:transparent;border:1px solid #A64B2A;color:#A64B2A`,文案「🔒 會員搶先・登入解鎖」→ 連 Account Login;上方 `會員搶先預購` terracotta badge。達標會員 → 正常購買掣。由 ACF `會員搶先` flag + 會員等級 gate（§5）。

---

### 20.9 圖片最佳化（C6 · deploy build-step）
- 已刪 23 個未被任何頁引用嘅舊 asset（fp-img / promise-ic / promise-icon / hb-bag / hero-scene / promise-scene 等,root + export）。
- **未做壓縮（刻意）:** 14 張攝影 PNG（cat-*、prod-*、hero-product、promise-candle、by-scentm）每張 1.3–2.4MB。**唔喺 HTML 交付階段手轉**,因為部分有透明背景,canvas 硬轉 JPEG 會整爛透明底。**正確做法 = deploy build-step:** 用 Squoosh / imagemin / `cwebp` 轉 **WebP（有透明保留 alpha）每張 ≤300KB**,`<img>` 可加 `<picture>` WebP + PNG fallback;WordPress 版由媒體庫 + WebP plugin（如 Imagify / EWWW）自動處理。原圖已係高清母檔,壓縮喺上線 pipeline 做。

---

## 21. 決策記錄（2026-07-03 客戶拍板 — 與其他章節有出入時以本節為準）
1. **URL 結構（SEO 建議獲採納）**：landing = `/hibi-lab/`；PLP = `/hibi-lab/shop/`；product permalink base = `/hibi-lab/shop/%product%`；分類 archive = `/hibi-lab/shop/{cat}/`（render 同一 PLP template + 對應 dept pill 預選；`?cat=` deep-link canonical 指向對應 archive）。cart / checkout / my-account 沿用 WC 預設 slug（journey 頁 noindex、無 SEO 價值，§18 照舊；WPE cache exclusions 亦以預設 Woo 路徑最穩）。品牌內容 URL 全部歸一喺 `/hibi-lab/` cluster 下 — 對 SEO 最好，亦保留日後 spin-off 嘅 301 可遷移性。
2. **Filter 引擎 = 全 custom in-theme**（無 plugin、無年費）：沿用 theme 現有 journal AJAX partial + load-more + `scentmRevealScan` pattern；facet live counts 用「先攞符合現有 filter 嘅 product ID set → `wp_get_object_terms` 計數」（boutique 目錄規模零壓力）；價格 slider min/max 由 `wc_product_meta_lookup` 攞。如日後 SKU 過千先再評估 FacetWP。
3. **Checkout 優惠訊息 opt-in**：保留，**預設不剔**（PDPA 正路）；剔咗 → 寫入現有 `scentm_subscriber` 訂閱系統（同 Scent.M 聯絡表共用「Subscribers 訂閱」後台名單 + CSV export）+ order meta 留痕。
4. **等級福利 = 做真**：§5 三福利之上，Gold 追加 **免運**（tier coupon 開 native `free_shipping` flag）+ **生日雙倍禮遇**（生日 coupon 對 Gold 發雙倍面值）— 全部 native coupon 機制，無新系統；門檻/福利文案照舊 ACF options 客戶可改。
5. **Footer「Shipping & Returns」連結 = 全站**（包括 Scent.M 頁 — 屬客戶批准嘅共用 chrome 變更）；footer「HIBI LAB →」指去 `/hibi-lab/`。
6. **送貨地區 = 4 個**（香港島／九龍／新界／離島，`woocommerce_states` 補 離島）：Phase 1 四區同一運費（$50、滿 $500 免運）；ShipAny（Phase 2）接入後 離島 可獨立費率。Account demo 嘅 3 區下拉以 4 區為準。
7. **真實回饋 = 客戶後台自己入**（ACF repeater：名＋內容；星星為固定視覺樣式）；未有內容前 Landing 該區 hide-if-empty。
8. **產品目錄由空白入起**（唔 seed demo 產品）；三個入口 link 維持 coming-soon，直至客戶入好首批產品＋gateway 驗證通過。
9. **唔加 cookie consent banner**（香港-only；PDPO 無此要求，/privacy/ 已披露；日後加 GA／廣告 pixel 先再評估）。
10. **Woo 交易 email = WP dev 設計**，跟 Scent.M 現有收據範本 pattern：品牌 wrapper + **後台可編輯範本**（option 儲存、placeholder、live preview、測試寄送）；訂單編號用 `HL-` 顯示格式。（此決定取代「frontend dev 交 email 設計」嘅要求。）
11. **Stripe webhook 隔離 = 上線硬閘**：共用一個 Stripe 帳戶不變（統一對數）；theme 嘅 workshop webhook handler 加 guard — 事件 metadata 冇 `workshop_id` → 直接 200 略過（網店事件唔會誤入 workshop 線）；Woo gateway 用**獨立 webhook endpoint + 獨立 signing secret**。

---

## 22. 技術補遺（WP dev 拍板 2026-07-03 — 實作規範，補齊各章未定細節）
- **HPOS**：啟用 High-Performance Order Storage（現代預設；Orders 為 `woocommerce` 頂層選單嘅 submenu）。
- **Stripe plugin**：官方 **WooCommerce Stripe Gateway**（`woocommerce-gateway-stripe`）。Payment Element 用 appearance API 對齊 `.co-field` tokens —— **iframe 內部無法逐 pixel 對齊 demo 輸入框，屬明示豁免**。Cart / Checkout 頁一律轉 **classic shortcode**（block 版會繞過 §2 嘅 template override，一定要轉）。
- **Checkout 欄位對照**（`woocommerce_checkout_fields`）：電郵先行；單一「名字」→ `billing_first_name`（last_name 隱藏＋非必填）；地區＝`billing_state` 自訂 HK 四區（§21.6）；無 postcode；電話必填；billing 複製 shipping（單一地址組，§20.6 兩組地址只喺 Account 管理）。
- **Coupon 疊加規則**：tier 自動 coupon＝非 `individual_use`（可同 1 張手動碼並用）；手動碼＝`individual_use`；生日 coupon＝`individual_use`＋email restriction＋30 日有效；免運類（FREESHIP／Gold 免運 flag）可與折扣並存。
- **PLP 分頁**：未篩選＝crawlable `/page/N/`（跟 workshops archive-loadmore pattern）；有 filter 狀態＝AJAX＋URL 參數（`?pa_scent=…`），filter 版 canonical 指返基礎 archive（唔入 index）。「顯示 X / Y 件」由 query `found_posts` 出。
- **排序對照**：精選推薦＝`menu_order asc`＋date desc fallback（客喺 Products 排序畫面拖）；價格低至高／高至低＝price asc/desc（meta lookup）；名稱 A–Z＝title asc（custom orderby）。
- **series ↔ catLabel**：series＝`product_cat` **子分類**（寵物護理 → 情緒／身體／日常）；卡 label 組合規則＝「父分類 · 子分類」，無子分類只出父分類；PDP breadcrumb 連去子分類 archive。
- **audLabel 單一來源**：卡面「適用」label＝ACF 文字欄位「適用對象顯示」（自由文案，例「幼貓幼犬適用」）；`pa_audience` attribute 只做 filter 軸。兩者用途唔同、分別維護。
- **運費字串單一來源**：免運門檻（$500）＋「1–3 個工作天」＝ **ACF options 兩個欄位**；PDP／Cart／Checkout／Order Received／Shipping 五處全部由 option 讀，Cart「再加購 $X」nudge 同源計算。⚠ WC Shipping Zone 實際門檻要同 option 一致（可加 health 提示）。
- **Coupon 錢包**：發券時寫 user-meta index；Account 錢包讀 index → `WC_Coupon` 驗有效；「可用優惠券」stat＝index 內未過期未用數目。
- **搜尋**：overlay 數據＝自訂 REST endpoint（product query → JSON：name／catLabel／audLabel／price／img／url／stock）；直入 `?s=` → 301 去 `/hibi-lab/shop/?s=…` 由 PLP render 結果（無獨立 search.php 設計）。
- **order-pay ／ order-failed ／ cancelled**：用 `#pay-error` 語彙 skin WC notices＋thankyou.php 失敗分支（沿用 Order Received 版式，紅 banner 取代綠 tick）；無需新設計稿。
- **生日禮遇防刷**：生日一經設定唔可自改（改動經客服）；生日 coupon＝individual_use＋email-restricted＋**每會員每年一張**（user-meta 年度 flag）；WC 註冊表加 honeypot。
- **上線 e2e 測試（必行 gate）**：staging＋Stripe test mode → 落單（4242）→ 訂單／庫存／email 全鏈 → Dashboard 退款 → 確認 **workshop webhook 冇誤鳴**（guard 已喺 theme `18b9c76`）→ Woo webhook 正常收 → 先至 flip 三個 coming-soon 入口。
- **771px scoped 實作（§1 裁決嘅落地方式）**：771px media block 只喺 **store body class**（如 `body.hibi-store`）之下嘅 store-scoped stylesheet 生效；共通 chrome 維持 768。`body{overflow-x:clip}` 同樣只喺 store body class 落 —— theme 手機版嘅 `overflow-x:hidden` 會殺死 PLP sticky filter bar，**不可全局合併**。
- **積分（§17 修正）**：積分＝Phase 2 —— Phase 1 **唔 render 積分行、guest 提示唔提「賺積分」**（用「生日禮遇＋消費升級享專屬折扣」，demo checkout 現行 copy 已合規）；§17 內「積分行／賺積分」字眼 Phase 2 先生效。
- **Woo 交易 email（§21.10 落地）**：品牌範本由 WP dev 設計（見 repo `HIBI LAB Email.html` 設計稿），跟 Scent.M 收據 pattern 做 **後台可編輯**（option 儲存＋placeholder＋live preview＋測試寄送）；訂單編號顯示 `HL-` 格式；new-order 通知收件人＝店主通知地址（非 admin_email）。

---

*文件隨設計決定更新；以本文件（repo 內最新 commit）為單一真相源。已拍板決策総覽：PDP=Flexible Content（§15）、guest checkout 允許（§17）、Landing 16px 豁免＋771px store-scoped（§1/§10/§22）、coupon＝Cart 輸入＋Checkout 收埋式（§13/§17）、唔做補貨通知（§19/§20.8）、§21 十一項、§22 實作規範。*
