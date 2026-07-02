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

---

## 2. 頁面清單（HTML 稿 → 對應 WC template）
| 設計稿 | 對應 template | 類型 |
|---|---|---|
| `HIBI LAB Landing.html` | 自訂 page template | 品牌 landing |
| `HIBI LAB Shop.html` | `archive-product.php` + `content-product.php` 卡 + filter | PLP（★ filter 重點） |
| `HIBI LAB Product.html` | `single-product.php` | PDP |
| `HIBI LAB Cart.html` | `cart/cart.php` override | 購物車 |
| `HIBI LAB Account.html` | `myaccount/*` override | 會員中心 |
| `HIBI LAB Shipping.html` | 靜態 page | 送貨 & 退換政策 |
| `HIBI LAB Tier Cards.html` | —（設計參考） | VIP 等級色階 spec |

---

## 3. 產品 data model（客喺 wp-admin 入，唔使逐件寫 code）
- **分類** = `product_cat`（護膚品 / 寵物護理 / 助眠系列 / 家居香氛），hierarchical，客自己加減。
- **Filter 軸 = global product attributes**（一次過設定 term，之後每件剔）：`pa_功效` / `pa_適用對象`(人/貓/狗/居家) / `pa_香味`(swatch) / `pa_容量` / `pa_形態`(噴霧/按摩油/洗髮水/消炎水/精華/潔面/擴香)。→ filter facet + count **自動由 attribute 生成**，加新 term 客即場加。
- **容量 = variation attribute** → variable product → PLP 顯示「$X 起」、PDP size 揀掣、容量 filter。
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
- **三福利實作（全部 in-theme、無 plugin、無 payment 風險 — 折扣一律推返 native coupon）**：
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
- （呢幾個 on-brand 畫面設計稿未做；要嘅話可補，但功能上原生已 work。）

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
- **HIBI LAB 內容區文字最小 16px**（label / eyebrow / 註腳 / 按鈕 一律 ≥16px）。**例外**：共通 Scent.M chrome（nav/footer/menu）維持原樣；icon glyph 不受管。
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
- **Scroll-lock**：抽屜 / overlay 開啟時鎖背景 —— 依賴每頁 chrome 將 Lenis 實例 expose 做 `window.hbLenis`(`const lenis = window.hbLenis = new Lenis(...)`);`store-chrome.js` 用 `hbLenis.stop()/start()` + `overflow:hidden`。**新頁必須照樣 expose,否則背景會 scroll-through。**
- **搜尋資料**：`store-chrome.js` 內含 `PRODUCTS_JSON`(= PLP `#plp-data` 同一份);Shop 有 `#plp-data` 就用返,其餘頁自動注入。**Production：改由 WooCommerce 產品資料 / 原生 `?s=` 搜尋 endpoint 供;呢個 static dataset 只係 demo。**
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
- 會員(Amanda、電郵、等級、近12月消費 $3,820、累積 $8,640、積分、訂單 #HL-…、優惠券、地址) → **登入用戶 / WC 訂單 / ACF / 積分 plugin**。
- VIP 門檻 & 折扣 %、Checkout 摘要、Order Received 訂單編號/金額 → **ACF options + WC order data**。
- Menu(About/ODM/Workshops/Journal/Testimonials/Contact)、Privacy/Terms 連結 → **現有 Scent.M 站頁面**(production 解析,非 HIBI 範圍)。
- Scent.M nav logo → `home_url('/')`（靜態暫指 `index.html`）。
- **WP-readiness**：共用 chrome 全站一致、`store-chrome.js`=partial、`?cat=` 已接;轉 theme 時 HTML→PHP template + Tailwind 由 `build-css.js` 編譯(唔用 CDN)。

---

- **WhatsApp 浮動掣（context-aware · 兩個號碼,WP 後台可入）**：Scent.M 頁 = B2B「Bespoke Inquiry」;HIBI LAB 店頁 = B2C「Customer Care」(客服 label 用英文,同 Scent.M chrome 一致;預填訊息維持廣東話)。**兩個 WhatsApp 號碼由客喺 wp-admin 自己入**(ACF/theme options：`scentm_opt('whatsapp_number')` + `whatsapp_text`;HIBI LAB 加平行 option `hibilab_whatsapp_number` + `_text`,**只喺有號碼先 render、唔 fallback 去錯號碼**(同 `footer.php` `if($wa)` 一致)),前端按頁面 context 出對應號碼 + 文案;綠色 WA 本體不變,只換 label / 預填 / 號碼。HIBI LAB 現用 placeholder `852-0000-0000`,**待客提供客服號碼**。

---

## 15. PDP 內容區塊 → 資料來源（交接：固定 ACF field group,非 flexible-content）
現行 PDP 下半部係**固定版式**(唔係 merchant 自由組合 / 新增 block；早期試過 flexible-content,後 revert 返固定 D5 版式)。逐個 section 對應:
- 香味 variation / 價 / 會員價 / 積分 → **WooCommerce variable product**(`pa_香味`)+ VIP。
- 整體功效(成分→功效逐項)→ **ACF repeater**(逐件產品)。
- 成分 / 用法 → **ACF**(逐件產品,textarea / repeater)。
- 安全使用須知 → **theme-level block**(全線寵物共用,入一次 · ACF options),非逐件。
- 為何純露(科普)→ **品牌 theme block**(ACF options,共用)。
- FAQ → **ACF repeater**(逐件產品)。
- 同系列推薦 → **WooCommerce related products**。
⚠️ 若日後想俾 merchant **自由砌 block**(純文字 / 表格 / FAQ / 圖 / 片,似 Journal/Workshop 嘅 flexible-content)→ 要改用 **ACF Flexible Content** field + PDP template loop render(現設計未係,係固定 section)。

---

## 15. PDP 內容區塊 = ACF Flexible Content（merchant 自由 create + 拖拉排序,同 Journal/Workshop 一致）
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

*文件隨設計決定更新；如與 `CLAUDE.md` 有出入，以最新討論為準。*
