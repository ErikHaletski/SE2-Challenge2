// Fuzzy matching + search-key resolution helpers extracted from search_erweitert.js
// Exposes a small API on window.SE2_FUZZY so the main search script can stay focused on UI.

(function (global) {
    "use strict";

    function normalizeText(input) {
        return String(input ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // diacritics
            .replace(/ß/g, "ss")
            .replace(/[^a-z0-9]+/g, " ")
            .trim()
            .replace(/\s+/g, " ");
    }

    function tokenize(norm) {
        if (!norm) return [];
        return norm.split(" ").filter(Boolean);
    }

    function levenshtein(a, b) {
        if (a === b) return 0;
        if (!a) return b.length;
        if (!b) return a.length;

        const aLen = a.length;
        const bLen = b.length;
        const v0 = new Array(bLen + 1);
        const v1 = new Array(bLen + 1);

        for (let i = 0; i <= bLen; i++) v0[i] = i;

        for (let i = 0; i < aLen; i++) {
            v1[0] = i + 1;
            const aChar = a.charCodeAt(i);

            for (let j = 0; j < bLen; j++) {
                const cost = aChar === b.charCodeAt(j) ? 0 : 1;
                v1[j + 1] = Math.min(
                    v1[j] + 1,
                    v0[j + 1] + 1,
                    v0[j] + cost
                );
            }

            for (let j = 0; j <= bLen; j++) v0[j] = v1[j];
        }

        return v0[bLen];
    }

    function tokenJaccard(aTokens, bTokens) {
        if (!aTokens.length || !bTokens.length) return 0;
        const aSet = new Set(aTokens);
        const bSet = new Set(bTokens);
        let inter = 0;
        for (const t of aSet) if (bSet.has(t)) inter++;
        const union = new Set([...aSet, ...bSet]).size;
        return union ? inter / union : 0;
    }

    function scoreCandidate(queryNorm, candNorm) {
        if (!candNorm) return 0;
        if (queryNorm === candNorm) return 1;

        const qTokens = tokenize(queryNorm);
        const cTokens = tokenize(candNorm);

        let substringScore = 0;
        if (queryNorm.length >= 3) {
            if (queryNorm.includes(candNorm)) substringScore = 0.97;
            else if (candNorm.includes(queryNorm)) substringScore = 0.93;
        }

        const tokenScore = tokenJaccard(qTokens, cTokens);

        let levScore = 0;
        const maxLen = Math.max(queryNorm.length, candNorm.length);
        if (maxLen) {
            const dist = levenshtein(queryNorm, candNorm);
            levScore = 1 - dist / maxLen;
        }

        const blended = (levScore * 0.88) + (tokenScore * 0.12);
        return Math.max(substringScore, tokenScore * 0.9, blended);
    }

    function bestMatches(queryNorm, candidates, limit = 3) {
        const scored = candidates
            .map(c => ({ ...c, score: scoreCandidate(queryNorm, c.norm) }))
            .sort((a, b) => b.score - a.score);
        return scored.slice(0, Math.min(limit, scored.length));
    }

    function uniqueLowerTrim(value) {
        return String(value ?? "").toLowerCase().trim();
    }

    function buildRelationIndex(products, relations) {
        const relSearchKeys = Array.from(
            new Set(
                (relations || [])
                    .map(r => uniqueLowerTrim(r?.searchProduct))
                    .filter(Boolean)
            )
        );

        const relCandidates = relSearchKeys.map(key => {
            const p = products?.[key];
            const title = p && p.title ? String(p.title) : "";
            const aliases = Array.isArray(p?.aliases) ? p.aliases.map(x => String(x)) : [];
            const tokens = new Set(
                tokenize(
                    normalizeText([key, title, ...aliases].filter(Boolean).join(" "))
                )
            );
            const norm = Array.from(tokens).join(" ");
            return { key, title, norm };
        });

        return { relSearchKeys, relCandidates };
    }

    function createSearchKeyResolver({ products = {}, relations = [] } = {}) {
        const { relSearchKeys, relCandidates } = buildRelationIndex(products, relations);

        function resolveKey(rawQuery) {
            const rawLower = uniqueLowerTrim(rawQuery);
            const qNorm = normalizeText(rawQuery);

            if (!qNorm) return { key: "", qNorm: "", match: null, suggestions: [] };

            // Exact key match
            if (relSearchKeys.includes(rawLower)) {
                return { key: rawLower, qNorm, match: { via: "exact", score: 1 }, suggestions: [] };
            }

            // Exact title match (normalized)
            for (const c of relCandidates) {
                if (c.title && normalizeText(c.title) === qNorm) {
                    return { key: c.key, qNorm, match: { via: "title", score: 1 }, suggestions: [] };
                }
            }

            if (qNorm.length < 2) {
                return { key: "", qNorm, match: null, suggestions: [] };
            }

            const best = bestMatches(qNorm, relCandidates, 1)[0];
            const threshold = qNorm.length <= 4 ? 0.82 : 0.72;

            const suggestions = bestMatches(qNorm, relCandidates, 3)
                .filter(x => x.score >= 0.45);

            if (!best || best.score < threshold) {
                return { key: "", qNorm, match: null, suggestions };
            }

            return {
                key: best.key,
                qNorm,
                match: { via: "fuzzy", score: best.score },
                suggestions
            };
        }

        // Detect multiple possible products from a multi-word query
        function resolveKeysMulti(rawQuery) {
            const norm = normalizeText(rawQuery);
            const parts = tokenize(norm);

            const keys = [];
            const allSuggestions = [];

            for (const part of parts) {
                const res = resolveKey(part);
                if (res.key && !keys.includes(res.key)) keys.push(res.key);
                if (res.suggestions && res.suggestions.length) {
                    for (const s of res.suggestions) allSuggestions.push(s);
                }
            }

            // Fallback: full query
            if (keys.length === 0) {
                const resFull = resolveKey(rawQuery);
                if (resFull.key) keys.push(resFull.key);
                if (resFull.suggestions && resFull.suggestions.length) {
                    for (const s of resFull.suggestions) allSuggestions.push(s);
                }
            }

            const byKey = new Map();
            for (const s of allSuggestions) {
                const prev = byKey.get(s.key);
                if (!prev || (s.score ?? 0) > (prev.score ?? 0)) byKey.set(s.key, s);
            }

            return {
                keys,
                suggestions: Array.from(byKey.values())
                    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                    .slice(0, 6)
            };
        }

        return {
            relSearchKeys,
            relCandidates,
            resolveKeysMulti
        };
    }

    global.SE2_FUZZY = {
        createSearchKeyResolver
    };
})(typeof globalThis !== "undefined" ? globalThis : window);