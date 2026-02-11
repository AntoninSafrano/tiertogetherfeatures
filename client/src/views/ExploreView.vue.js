import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import NavBar from '@/components/NavBar.vue';
import { Search, Download, Clock, TrendingUp, Gamepad2, UtensilsCrossed, Tv, Music, Film, Dumbbell, MoreHorizontal } from 'lucide-vue-next';
const router = useRouter();
const { user, fetchUser } = useAuth();
const API_BASE = 'http://localhost:3001';
const tierlists = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const activeCategory = ref('All');
const activeSort = ref('downloads');
const activeTab = ref('explore');
const myLists = ref([]);
const categories = [
    { label: 'All', icon: MoreHorizontal },
    { label: 'Gaming', icon: Gamepad2 },
    { label: 'Food', icon: UtensilsCrossed },
    { label: 'Anime', icon: Tv },
    { label: 'Music', icon: Music },
    { label: 'Movies', icon: Film },
    { label: 'Sports', icon: Dumbbell },
    { label: 'Other', icon: MoreHorizontal },
];
const sortOptions = [
    { value: 'downloads', label: 'Most Downloaded', icon: Download },
    { value: 'recent', label: 'Recent', icon: Clock },
    { value: 'popular', label: 'Popular', icon: TrendingUp },
];
async function fetchTierlists() {
    isLoading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('sort', activeSort.value);
        if (activeCategory.value !== 'All')
            params.set('category', activeCategory.value);
        if (searchQuery.value)
            params.set('search', searchQuery.value);
        const res = await fetch(`${API_BASE}/api/tierlists/public?${params}`);
        const data = await res.json();
        tierlists.value = data.tierlists || [];
    }
    catch {
        tierlists.value = [];
    }
    finally {
        isLoading.value = false;
    }
}
async function fetchMyLists() {
    try {
        const res = await fetch(`${API_BASE}/api/tierlists/mine`, { credentials: 'include' });
        const data = await res.json();
        myLists.value = data.tierlists || [];
    }
    catch {
        myLists.value = [];
    }
}
async function cloneTierlist(id) {
    try {
        const res = await fetch(`${API_BASE}/api/tierlists/${id}/clone`, {
            method: 'POST',
            credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.roomId) {
            router.push({ name: 'room', params: { id: data.roomId } });
        }
    }
    catch (err) {
        console.error('Clone failed:', err);
    }
}
function getCoverImage(tierlist) {
    if (tierlist.coverImage)
        return tierlist.coverImage;
    for (const row of tierlist.rows) {
        for (const item of row.items) {
            if (item.imageUrl)
                return item.imageUrl;
        }
    }
    return '';
}
function getCategoryColor(cat) {
    const colors = {
        Gaming: 'bg-blue-500/20 text-blue-400',
        Food: 'bg-orange-500/20 text-orange-400',
        Anime: 'bg-pink-500/20 text-pink-400',
        Music: 'bg-green-500/20 text-green-400',
        Movies: 'bg-yellow-500/20 text-yellow-400',
        Sports: 'bg-red-500/20 text-red-400',
        Other: 'bg-zinc-500/20 text-zinc-400',
    };
    return colors[cat] || colors.Other;
}
let searchTimeout = null;
function onSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => fetchTierlists(), 300);
}
watch([activeCategory, activeSort], () => fetchTierlists());
onMounted(async () => {
    await fetchUser();
    fetchTierlists();
    if (user.value)
        fetchMyLists();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "min-h-screen bg-zinc-950" },
});
/** @type {[typeof NavBar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(NavBar, new NavBar({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "mx-auto max-w-6xl px-4 py-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-3xl font-extrabold tracking-tight text-foreground mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
    ...{ class: "text-zinc-400" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex gap-1 mb-6 border-b border-white/5 pb-px" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'explore';
        } },
    ...{ class: (['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', __VLS_ctx.activeTab === 'explore' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300']) },
});
if (__VLS_ctx.user) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.user))
                    return;
                __VLS_ctx.activeTab = 'mine';
                __VLS_ctx.fetchMyLists();
            } },
        ...{ class: (['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', __VLS_ctx.activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300']) },
    });
}
if (__VLS_ctx.activeTab === 'explore') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative mb-6" },
    });
    const __VLS_3 = {}.Search;
    /** @type {[typeof __VLS_components.Search, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" },
    }));
    const __VLS_5 = __VLS_4({
        ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (__VLS_ctx.onSearchInput) },
        value: (__VLS_ctx.searchQuery),
        type: "text",
        placeholder: "Search tier lists...",
        ...{ class: "w-full rounded-lg border border-white/5 bg-zinc-900 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-zinc-600 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-wrap gap-2 mb-6" },
    });
    for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'explore'))
                        return;
                    __VLS_ctx.activeCategory = cat.label;
                } },
            key: (cat.label),
            ...{ class: (['inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200', __VLS_ctx.activeCategory === cat.label ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300']) },
        });
        const __VLS_7 = ((cat.icon));
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
            ...{ class: "h-3.5 w-3.5" },
        }));
        const __VLS_9 = __VLS_8({
            ...{ class: "h-3.5 w-3.5" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
        (cat.label);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-2 mb-6" },
    });
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sortOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'explore'))
                        return;
                    __VLS_ctx.activeSort = s.value;
                } },
            key: (s.value),
            ...{ class: (['inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-colors', __VLS_ctx.activeSort === s.value ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300']) },
        });
        const __VLS_11 = ((s.icon));
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
            ...{ class: "h-3 w-3" },
        }));
        const __VLS_13 = __VLS_12({
            ...{ class: "h-3 w-3" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        (s.label);
    }
    if (__VLS_ctx.isLoading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
        });
        for (const [i] of __VLS_getVForSourceType((6))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (i),
                ...{ class: "animate-pulse rounded-xl border border-white/5 bg-zinc-900 p-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-32 rounded-lg bg-zinc-800 mb-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-4 w-3/4 rounded bg-zinc-800 mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-3 w-1/2 rounded bg-zinc-800" },
            });
        }
    }
    else if (__VLS_ctx.tierlists.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-16" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-zinc-500 text-lg" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-zinc-600 text-sm mt-1" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
        });
        for (const [tl] of __VLS_getVForSourceType((__VLS_ctx.tierlists))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'explore'))
                            return;
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(__VLS_ctx.tierlists.length === 0))
                            return;
                        __VLS_ctx.cloneTierlist(tl._id);
                    } },
                key: (tl._id),
                ...{ class: "group rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "h-36 bg-gradient-to-br from-primary/20 to-zinc-800 overflow-hidden" },
            });
            if (__VLS_ctx.getCoverImage(tl)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (__VLS_ctx.getCoverImage(tl)),
                    alt: (tl.title),
                    ...{ class: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "p-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-start justify-between gap-2 mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors" },
            });
            (tl.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium', __VLS_ctx.getCategoryColor(tl.category)]) },
            });
            (tl.category);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center justify-between text-xs text-zinc-500" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center gap-1" },
            });
            const __VLS_15 = {}.Download;
            /** @type {[typeof __VLS_components.Download, ]} */ ;
            // @ts-ignore
            const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
                ...{ class: "h-3 w-3" },
            }));
            const __VLS_17 = __VLS_16({
                ...{ class: "h-3 w-3" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_16));
            (tl.downloads || 0);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (new Date(tl.createdAt).toLocaleDateString());
        }
    }
}
if (__VLS_ctx.activeTab === 'mine') {
    if (__VLS_ctx.myLists.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-16" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-zinc-500 text-lg" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
        });
        for (const [tl] of __VLS_getVForSourceType((__VLS_ctx.myLists))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'mine'))
                            return;
                        if (!!(__VLS_ctx.myLists.length === 0))
                            return;
                        __VLS_ctx.router.push({ name: 'room', params: { id: tl.roomId } });
                    } },
                key: (tl._id),
                ...{ class: "rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "h-36 bg-gradient-to-br from-primary/20 to-zinc-800 overflow-hidden" },
            });
            if (__VLS_ctx.getCoverImage(tl)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (__VLS_ctx.getCoverImage(tl)),
                    alt: (tl.title),
                    ...{ class: "w-full h-full object-cover" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "p-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "font-bold text-foreground text-sm mb-1" },
            });
            (tl.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center justify-between text-xs text-zinc-500" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['rounded-full px-2 py-0.5 text-[10px] font-medium', __VLS_ctx.getCategoryColor(tl.category)]) },
            });
            (tl.category);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "flex items-center gap-1" },
            });
            const __VLS_19 = {}.Download;
            /** @type {[typeof __VLS_components.Download, ]} */ ;
            // @ts-ignore
            const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
                ...{ class: "h-3 w-3" },
            }));
            const __VLS_21 = __VLS_20({
                ...{ class: "h-3 w-3" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_20));
            (tl.downloads || 0);
        }
    }
}
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-950']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-6xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/5']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-px']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-10']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-zinc-600']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-primary/50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-32']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-36']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['to-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:scale-105']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-36']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['to-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NavBar: NavBar,
            Search: Search,
            Download: Download,
            router: router,
            user: user,
            tierlists: tierlists,
            isLoading: isLoading,
            searchQuery: searchQuery,
            activeCategory: activeCategory,
            activeSort: activeSort,
            activeTab: activeTab,
            myLists: myLists,
            categories: categories,
            sortOptions: sortOptions,
            fetchMyLists: fetchMyLists,
            cloneTierlist: cloneTierlist,
            getCoverImage: getCoverImage,
            getCategoryColor: getCategoryColor,
            onSearchInput: onSearchInput,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
