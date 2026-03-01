// ==UserScript==
// @name         Cwall主题增强
// @namespace    https://github.com/ImAurDev/SomeThemeToSaveMyEyes
// @version      2026-03-01
// @description  Cwall主题增强
// @author       ImAur
// @match        https://c4.cwall.xyz/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_xmlhttpRequest
// @connect      c4.cwall.xyz
// @run-at       document-end
// ==/UserScript==

(function () {
    "use strict";

    const isIframe = window.self !== window.top;
    const SCRIPT_ID = "cwall-theme-enhanced-" + (isIframe ? "iframe" : "main");

    if (window[SCRIPT_ID]) return;
    window[SCRIPT_ID] = true;

    const alertQueue = [];
    let alertShowing = false;

    function showAlertDialog(message, type = "error") {
        const colors = {
            error: {
                bg: "var(--danger, #d20f39)",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>',
            },
            success: {
                bg: "var(--success, #40a02b)",
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-icon lucide-circle-check"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
            },
            info: {
                bg: "var(--accent, #1e66f5)",
                icon: 'ℹ<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-info-icon lucide-info"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
            },
        };
        const cfg = colors[type] || colors.error;

        const div = document.createElement("div");
        div.innerHTML = `
            <div class="custom-alert-overlay" style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.4);
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
                animation: fadeIn 0.2s ease;
            ">
                <div style="
                    background: var(--bg-primary, #eff1f5);
                    padding: 24px;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    max-width: 400px;
                    width: 90%;
                    text-align: center;
                    animation: scaleIn 0.2s ease;
                    border: 1px solid var(--glass-border);
                ">
                    <div style="font-size: 48px; margin-bottom: 12px;">${cfg.icon}</div>
                    <div style="
                        color: var(--text-primary);
                        font-size: 16px;
                        line-height: 1.5;
                        margin-bottom: 20px;
                        word-break: break-word;
                    ">${escapeHtml(message)}</div>
                    <button onclick="this.closest('.custom-alert-overlay').remove(); window.__alertCallback__ && window.__alertCallback__()" style="
                        background: ${cfg.bg};
                        color: white;
                        border: none;
                        padding: 10px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 500;
                        transition: opacity 0.2s;
                    " onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">确定</button>
                </div>
            </div>
        `;

        if (!document.getElementById("custom-alert-styles")) {
            const style = document.createElement("style");
            style.id = "custom-alert-styles";
            style.textContent = `
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(div);

        div.querySelector(".custom-alert-overlay").addEventListener("click", (e) => {
            if (e.target === e.currentTarget) {
                e.target.remove();
                window.__alertCallback__ && window.__alertCallback__();
            }
        });
    }

    const originalAlert = window.alert;
    window.alert = function (message) {
        showAlertDialog(message, "error");
    };

    function checkStylusTheme() {
        if (isIframe) return true;

        const testEl = document.createElement("div");
        testEl.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
        document.body.appendChild(testEl);

        const computed = getComputedStyle(testEl);
        const hasCustomTheme = computed.getPropertyValue("--bg-primary") !== "";

        testEl.remove();

        const contentItem = document.querySelector(".content-item");
        if (contentItem) {
            const bg = getComputedStyle(contentItem).backgroundColor;
            if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent" || bg === "rgb(255, 255, 255)") {
                return false;
            }
        }

        return hasCustomTheme;
    }

    function showStylusWarning() {
        if (GM_getValue("stylus_warning_dismissed", false)) return;

        const div = document.createElement("div");
        div.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--bg-secondary, #e6e9ef);
                color: var(--text-primary, #4c4f69);
                padding: 16px 20px;
                border-radius: 12px;
                border: 1px solid var(--glass-border, rgba(255,255,255,0.5));
                box-shadow: 0 8px 32px rgba(0,0,0,0.1);
                z-index: 999999;
                max-width: 320px;
                font-family: system-ui, sans-serif;
                backdrop-filter: blur(10px);
            ">
                <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 20px;"></span>
                    <span>建议安装 BetterCwall 主题</span>
                </div>
                <div style="font-size: 14px; line-height: 1.5; opacity: 0.9; margin-bottom: 12px;">
                    检测到当前未安装 BetterCwall 主题，使用效果可能不佳。<br>
                    <a href="https://userstyles.world/style/26854" target="_blank" style="
                        color: var(--accent, #1e66f5);
                        text-decoration: none;
                        font-weight: 500;
                    ">点击安装主题</a>
                </div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button id="stylus-dismiss" style="
                        padding: 6px 12px;
                        border: none;
                        background: transparent;
                        color: var(--text-secondary, #5c5f77);
                        cursor: pointer;
                        border-radius: 6px;
                        font-size: 13px;
                    ">不再提示</button>
                    <button id="stylus-ok" style="
                        padding: 6px 12px;
                        border: none;
                        background: var(--accent, #1e66f5);
                        color: white;
                        cursor: pointer;
                        border-radius: 6px;
                        font-size: 13px;
                    ">知道了</button>
                </div>
            </div>
        `;

        document.body.appendChild(div);

        div.querySelector("#stylus-dismiss").onclick = () => {
            GM_setValue("stylus_warning_dismissed", true);
            div.remove();
        };

        div.querySelector("#stylus-ok").onclick = () => {
            div.remove();
        };

        setTimeout(() => {
            if (div.parentNode) div.remove();
        }, 5000);
    }

    function removeOriginalFavoritesCard() {
        const cards = document.querySelectorAll(".topics-card");
        cards.forEach((card) => {
            const title = card.querySelector(".section-title");
            if (title && title.textContent.includes("我的收藏")) {
                card.remove();
            }
        });

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList?.contains("topics-card")) {
                        const title = node.querySelector(".section-title");
                        if (title && title.textContent.includes("我的收藏")) {
                            node.remove();
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    function fetchFavorites(callback) {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://c4.cwall.xyz/ww/load_mytopics.php?page=1",
            headers: {
                Accept: "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            onload: function (response) {
                try {
                    const data = JSON.parse(response.responseText);
                    if (data.success && Array.isArray(data.data)) {
                        callback(null, data.data);
                    } else {
                        callback(new Error("非法请求"), null);
                    }
                } catch (err) {
                    callback(err, null);
                }
            },
            onerror: (err) => callback(err, null),
        });
    }

    function addToFavoritesAPI(aid, callback) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://c4.cwall.xyz/ww/collect_topic.php",
            data: `article_id=${aid}&type=article`,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest",
            },
            onload: (res) => {
                try {
                    const data = JSON.parse(res.responseText);
                    if (data.success) {
                        callback(null, data);
                    } else {
                        callback(new Error(data.error || "收藏失败"), data);
                    }
                } catch (err) {
                    callback(err, null);
                }
            },
            onerror: (err) => callback(err, null),
        });
    }

    let favoritesCache = [];
    let favoritesIdSet = new Set();

    function refreshFavoritesCache(callback) {
        fetchFavorites((err, list) => {
            if (!err && list) {
                favoritesCache = list;
                favoritesIdSet = new Set(list.map((f) => String(f.id)));
                updateAllButtonsState();
                if (callback) callback(null, list);
            } else {
                if (callback) callback(err, null);
            }
        });
    }

    function isFavorited(aid) {
        return favoritesIdSet.has(String(aid));
    }

    function updateAllButtonsState() {
        document.querySelectorAll(".content-item").forEach((item) => {
            const aid = item.dataset.aid;
            if (!aid) return;

            const btn = item.querySelector(".custom-fav-btn");
            if (btn) {
                const favorited = isFavorited(aid);
                updateButtonState(btn, favorited, item);
            }
        });
    }

    function updateButtonState(btn, favorited, item) {
        if (favorited) {
            btn.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg> 已收藏';
            btn.classList.add("favorited", "disabled");
            btn.style.cssText = `
                border: none;
                background: var(--accent-soft, rgba(30,102,245,0.15)) !important;
                cursor: not-allowed !important;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                color: var(--accent, #1e66f5) !important;
                opacity: 0.8;
                pointer-events: none;
            `;
            btn.title = "已在收藏列表中";
            btn.onclick = null;
        } else {
            btn.innerHTML =
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg> 收藏';
            btn.classList.remove("favorited", "disabled");
            btn.style.cssText = `
                border: none;
                background: transparent !important;
                cursor: pointer !important;
                padding: 6px 12px;
                border-radius: 6px;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                gap: 4px;
                transition: all 0.2s ease;
                color: var(--text-secondary, #5c5f77) !important;
            `;
            btn.title = "点击收藏";

            btn.onmouseenter = () => {
                btn.style.color = "var(--accent, #1e66f5)";
                btn.style.background = "var(--accent-soft, rgba(30,102,245,0.1)) !important";
            };

            btn.onmouseleave = () => {
                btn.style.color = "var(--text-secondary, #5c5f77)";
                btn.style.background = "transparent !important";
            };

            btn.onclick = (e) => {
                e.stopPropagation();
                handleFavoriteClick(item, btn);
            };
        }
    }

    function handleFavoriteClick(item, btn) {
        const aid = item.dataset.aid;
        if (!aid || isFavorited(aid)) return;

        btn.innerHTML = "收藏中...";
        btn.style.pointerEvents = "none";
        btn.style.opacity = "0.7";

        addToFavoritesAPI(aid, (err, data) => {
            if (err) {
                updateButtonState(btn, false, item);

                if (data && data.error) {
                    alert(data.error);
                } else {
                    alert(err.message || "收藏失败，请稍后重试");
                }
                return;
            }

            refreshFavoritesCache(() => {
                GM_notification({
                    title: "收藏成功",
                    text: "已添加到我的收藏",
                    timeout: 1500,
                });
                updateFavButtonBadge();
            });
        });
    }

    function addFavoriteButton(item) {
        if (item.querySelector(".custom-fav-btn")) return;

        const actionBtns = item.querySelector(".action-btns");
        if (!actionBtns) return;

        const btn = document.createElement("button");
        btn.className = "action-btn custom-fav-btn";

        const aid = item.dataset.aid;
        const isFav = isFavorited(aid);

        updateButtonState(btn, isFav, item);

        actionBtns.insertBefore(btn, actionBtns.firstChild);
    }

    function blockOriginalContextMenu() {
        document.addEventListener(
            "contextmenu",
            function (e) {
                const item = e.target.closest(".content-item");
                if (item) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    return false;
                }
            },
            true,
        );

        document.addEventListener(
            "mousedown",
            function (e) {
                if (e.button === 2) {
                    const item = e.target.closest(".content-item");
                    if (item) {
                        e.stopImmediatePropagation();
                    }
                }
            },
            true,
        );
    }

    function showFavoritesManager() {
        const modal = createModal(
            "我的收藏",
            '<div style="padding: 40px; text-align: center; color: var(--text-secondary);"><div class="loading-spinner" style="width: 40px; height: 40px; border: 3px solid var(--glass-border); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>加载中...</div>',
        );
        document.body.appendChild(modal);

        const style = document.createElement("style");
        style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
        modal.appendChild(style);

        fetchFavorites((err, list) => {
            if (err) {
                modal.querySelector(".modal-body").innerHTML = `
                    <div style="padding: 40px; text-align: center; color: var(--danger, #d20f39);">
                        <div style="font-size: 48px; margin-bottom: 16px;"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-alert-icon lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg></div>
                        加载失败<br>
                        <small style="color: var(--text-tertiary);">${err.message}</small>
                    </div>
                `;
                return;
            }

            favoritesCache = list;
            favoritesIdSet = new Set(list.map((f) => String(f.id)));

            if (list.length === 0) {
                modal.querySelector(".modal-body").innerHTML = `
                    <div style="padding: 60px 40px; text-align: center; color: var(--text-secondary);">
                        <div style="font-size: 16px; margin-bottom: 8px;">暂无收藏</div>
                        <div style="font-size: 13px; color: var(--text-tertiary);">点击帖子上的 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg> 按钮添加收藏</div>
                    </div>
                `;
                return;
            }

            const html = list
                .map(
                    (item) => `
                <div class="fav-item" data-id="${escapeHtml(item.id)}" style="
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.1));
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                " onmouseenter="this.style.background='var(--accent-soft, rgba(30,102,245,0.05))'"
                   onmouseleave="this.style.background='transparent'"
                   onclick="window.open('/ww/detail.php?id=${item.id}', '_blank')">
                    <div style="flex: 1; min-width: 0;">
                        <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 4px;
                                    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${escapeHtml(item.content)}
                        </div>
                        <div style="font-size: 13px; color: var(--text-secondary); display: flex; gap: 8px; align-items: center;">
                            <span style="display: flex; align-items: center; gap: 4px;">
                                ${escapeHtml(item.author)}
                            </span>
                        </div>
                    </div>
                </div>
            `,
                )
                .join("");

            modal.querySelector(".modal-body").innerHTML = html;
            modal.querySelector(".modal-title").textContent = `我的收藏 (${list.length})`;
        });
    }

    function createModal(title, bodyHtml) {
        const div = document.createElement("div");
        div.innerHTML = `
            <div class="fav-modal" style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                backdrop-filter: blur(4px);
                animation: fadeIn 0.2s ease;
            ">
                <div style="
                    background: var(--bg-primary, #eff1f5);
                    width: 90%;
                    max-width: 600px;
                    max-height: 80vh;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    animation: slideUp 0.3s ease;
                ">
                    <div style="
                        padding: 20px 24px;
                        border-bottom: 1px solid var(--glass-border, rgba(255,255,255,0.1));
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        background: var(--bg-secondary, #e6e9ef);
                    ">
                        <span class="modal-title" style="font-weight: 600; color: var(--text-primary); font-size: 18px;">${title}</span>
                        <button onclick="this.closest('.fav-modal').remove()" style="
                            background: none;
                            border: none;
                            font-size: 24px;
                            cursor: pointer;
                            color: var(--text-secondary);
                            width: 32px;
                            height: 32px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 8px;
                            transition: all 0.2s;
                        " onmouseenter="this.style.background='var(--bg-tertiary)'" onmouseleave="this.style.background='transparent'">×</button>
                    </div>
                    <div class="modal-body" style="
                        max-height: 60vh;
                        overflow-y: auto;
                        background: var(--bg-primary, #eff1f5);
                    ">
                        ${bodyHtml}
                    </div>
                </div>
            </div>
        `;

        const animStyle = document.createElement("style");
        animStyle.textContent = `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `;
        div.appendChild(animStyle);

        div.querySelector(".fav-modal").addEventListener("click", (e) => {
            if (e.target === e.currentTarget) e.currentTarget.remove();
        });

        return div.firstElementChild;
    }

    function escapeHtml(text) {
        if (!text) return "";
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    let favButtonInstance = null;

    function updateFavButtonBadge() {
        if (!favButtonInstance) return;
        const count = favoritesCache.length;
        const existingBadge = favButtonInstance.querySelector(".badge");
        if (count > 0) {
            const badgeHtml = `<span class="badge" style="
                position: absolute;
                top: -2px;
                right: -2px;
                background: var(--danger, #d20f39);
                color: white;
                font-size: 11px;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
                font-weight: 600;
                border: 2px solid var(--bg-primary, #eff1f5);
            ">${count > 99 ? "99+" : count}</span>`;

            if (existingBadge) {
                existingBadge.outerHTML = badgeHtml;
            } else {
                favButtonInstance.insertAdjacentHTML("beforeend", badgeHtml);
            }
        } else if (existingBadge) {
            existingBadge.remove();
        }
    }

    function addFavManagerButton() {
        if (isIframe) return;

        const style = document.createElement("style");
        style.textContent = `
            .fav-manager-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background: var(--accent, #1e66f5);
                color: white;
                border: none;
                cursor: pointer;
                box-shadow: 0 4px 16px rgba(30, 102, 245, 0.4);
                font-size: 24px;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                backdrop-filter: blur(10px);
            }
            .fav-manager-btn:hover {
                transform: scale(1.1) rotate(8deg);
                box-shadow: 0 6px 20px rgba(30, 102, 245, 0.5);
            }
            .fav-manager-btn:active {
                transform: scale(0.95);
            }
        `;
        document.head.appendChild(style);

        const btn = document.createElement("button");
        btn.className = "fav-manager-btn";
        btn.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star-icon lucide-star"><path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/></svg>';
        btn.title = "管理收藏";
        btn.onclick = showFavoritesManager;

        document.body.appendChild(btn);
        favButtonInstance = btn;

        refreshFavoritesCache(() => {
            updateFavButtonBadge();
        });
    }

    function processItem(item) {
        if (!item.dataset.aid) return;

        if (item.querySelector(".custom-fav-btn")) return;

        addFavoriteButton(item);
    }

    function init() {
        if (!isIframe && !checkStylusTheme()) {
            showStylusWarning();
        }

        removeOriginalFavoritesCard();

        refreshFavoritesCache(() => {
            document.querySelectorAll(".content-item").forEach(processItem);
        });

        const observer = new MutationObserver((mutations) => {
            for (const m of mutations) {
                for (const node of m.addedNodes) {
                    if (node.nodeType === 1) {
                        if (node.classList?.contains("content-item")) {
                            processItem(node);
                        } else if (node.querySelectorAll) {
                            node.querySelectorAll(".content-item").forEach(processItem);
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        if (!isIframe) {
            setTimeout(addFavManagerButton, 500);
        }
    }

    blockOriginalContextMenu();

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
