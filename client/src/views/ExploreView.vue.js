import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import NavBar from '@/components/NavBar.vue';
import { Search, Download, Clock, TrendingUp, Gamepad2, UtensilsCrossed, Tv, Music, Film, Dumbbell, MoreHorizontal, Star, History } from 'lucide-vue-next';
import { API_BASE } from '@/config';
const router = useRouter();
const { user, fetchUser } = useAuth();
const featuredIds = ref(new Set());
const tierlists = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');
const activeCategory = ref('All');
const activeSort = ref('downloads');
const activeTab = ref('explore');
const myLists = ref([]);
const localRooms = ref([]);
function loadLocalRooms() {
    localRooms.value = JSON.parse(localStorage.getItem('tt-my-rooms') || '[]');
}
const categories = [
    { label: 'Tout', icon: MoreHorizontal, value: 'All' },
    { label: 'Jeux vidéo', icon: Gamepad2, value: 'Gaming' },
    { label: 'Cuisine', icon: UtensilsCrossed, value: 'Food' },
    { label: 'Anime', icon: Tv, value: 'Anime' },
    { label: 'Musique', icon: Music, value: 'Music' },
    { label: 'Films', icon: Film, value: 'Movies' },
    { label: 'Sport', icon: Dumbbell, value: 'Sports' },
    { label: 'Autre', icon: MoreHorizontal, value: 'Other' },
];
const sortOptions = [
    { value: 'downloads', label: 'Plus téléchargés', icon: Download },
    { value: 'recent', label: 'Récents', icon: Clock },
    { value: 'popular', label: 'Populaires', icon: TrendingUp },
];
async function fetchTierlists() {
    isLoading.value = true;
    try {
        const params = new URLSearchParams();
        params.set('sort', activeSort.value);
        if (activeCategory.value !== 'All') {
            params.set('category', activeCategory.value);
        }
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
async function fetchFeatured() {
    try {
        const res = await fetch(`${API_BASE}/api/tierlists/featured`);
        const data = await res.json();
        featuredIds.value = new Set((data.tierlists || []).map((t) => t._id));
    }
    catch {
        featuredIds.value = new Set();
    }
}
function viewTierlist(id) {
    router.push({ name: 'tierlist-view', params: { id } });
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
        Other: 'bg-foreground-subtle/20 text-foreground-muted',
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
    fetchFeatured();
    fetchTierlists();
    loadLocalRooms();
    if (user.value)
        fetchMyLists();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "min-h-screen bg-background" },
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
    ...{ class: "text-foreground-muted" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex gap-1 mb-6 border-b border-border pb-px" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'explore';
        } },
    ...{ class: (['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', __VLS_ctx.activeTab === 'explore' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeTab = 'mine';
            __VLS_ctx.loadLocalRooms();
            if (__VLS_ctx.user)
                __VLS_ctx.fetchMyLists();
        } },
    ...{ class: (['px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', __VLS_ctx.activeTab === 'mine' ? 'border-primary text-primary' : 'border-transparent text-foreground-muted hover:text-foreground']) },
});
if (__VLS_ctx.activeTab === 'explore') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "relative mb-5" },
    });
    const __VLS_3 = {}.Search;
    /** @type {[typeof __VLS_components.Search, ]} */ ;
    // @ts-ignore
    const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
        ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" },
    }));
    const __VLS_5 = __VLS_4({
        ...{ class: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_4));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (__VLS_ctx.onSearchInput) },
        value: (__VLS_ctx.searchQuery),
        type: "text",
        placeholder: "Rechercher des tier lists...",
        ...{ class: "w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground-subtle focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-wrap items-center gap-2 mb-6" },
    });
    for (const [cat] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'explore'))
                        return;
                    __VLS_ctx.activeCategory = cat.value;
                } },
            key: (cat.value),
            ...{ class: (['inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200', __VLS_ctx.activeCategory === cat.value ? 'bg-primary/20 text-primary ring-1 ring-primary/30' : 'bg-surface text-foreground-muted hover:bg-surface-hover hover:text-foreground']) },
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
        ...{ class: "ml-auto flex gap-1" },
    });
    for (const [s] of __VLS_getVForSourceType((__VLS_ctx.sortOptions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.activeTab === 'explore'))
                        return;
                    __VLS_ctx.activeSort = s.value;
                } },
            key: (s.value),
            ...{ class: (['inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs transition-colors', __VLS_ctx.activeSort === s.value ? 'bg-surface-active text-foreground' : 'text-foreground-muted hover:text-foreground']) },
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
            ...{ class: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" },
        });
        for (const [i] of __VLS_getVForSourceType((8))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (i),
                ...{ class: "animate-pulse rounded-lg border border-border bg-surface overflow-hidden" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-24 bg-surface-hover" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "p-3 space-y-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-3.5 w-3/4 rounded bg-surface-hover" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
                ...{ class: "h-3 w-1/2 rounded bg-surface-hover" },
            });
        }
    }
    else if (__VLS_ctx.tierlists.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-16" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-foreground-muted text-lg" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-foreground-subtle text-sm mt-1" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4" },
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
                        __VLS_ctx.viewTierlist(tl._id);
                    } },
                key: (tl._id),
                ...{ class: "group relative rounded-lg border bg-surface overflow-hidden shadow-lg transition-all duration-300 cursor-pointer" },
                ...{ class: (__VLS_ctx.featuredIds.has(tl._id) ? 'border-yellow-500/20 hover:border-yellow-500/40' : 'border-border-hover hover:border-primary/30') },
            });
            if (__VLS_ctx.featuredIds.has(tl._id)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "absolute top-1.5 left-1.5 z-10 flex items-center gap-1 rounded-full bg-yellow-500/90 px-2 py-0.5" },
                });
                const __VLS_15 = {}.Star;
                /** @type {[typeof __VLS_components.Star, ]} */ ;
                // @ts-ignore
                const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
                    ...{ class: "h-2.5 w-2.5 text-black" },
                }));
                const __VLS_17 = __VLS_16({
                    ...{ class: "h-2.5 w-2.5 text-black" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_16));
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "text-[9px] font-bold text-black" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "h-24 bg-gradient-to-br from-primary/20 to-surface-hover overflow-hidden" },
            });
            if (__VLS_ctx.getCoverImage(tl)) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (__VLS_ctx.getCoverImage(tl)),
                    alt: (tl.title),
                    ...{ class: "w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" },
                });
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "p-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-start justify-between gap-1 mb-1.5" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "font-bold text-foreground text-xs line-clamp-1 group-hover:text-primary transition-colors" },
            });
            (tl.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: (['shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium', __VLS_ctx.getCategoryColor(tl.category)]) },
            });
            (tl.category);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center justify-between text-[10px] text-foreground-muted" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center gap-1" },
            });
            const __VLS_19 = {}.Download;
            /** @type {[typeof __VLS_components.Download, ]} */ ;
            // @ts-ignore
            const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
                ...{ class: "h-2.5 w-2.5" },
            }));
            const __VLS_21 = __VLS_20({
                ...{ class: "h-2.5 w-2.5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_20));
            (tl.downloads || 0);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (new Date(tl.createdAt).toLocaleDateString());
        }
    }
}
if (__VLS_ctx.activeTab === 'mine') {
    if (__VLS_ctx.localRooms.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-8" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2 mb-4" },
        });
        const __VLS_23 = {}.History;
        /** @type {[typeof __VLS_components.History, ]} */ ;
        // @ts-ignore
        const __VLS_24 = __VLS_asFunctionalComponent(__VLS_23, new __VLS_23({
            ...{ class: "h-5 w-5 text-foreground-muted" },
        }));
        const __VLS_25 = __VLS_24({
            ...{ class: "h-5 w-5 text-foreground-muted" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_24));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: "text-lg font-bold text-foreground" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" },
        });
        for (const [room] of __VLS_getVForSourceType((__VLS_ctx.localRooms))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ onClick: (...[$event]) => {
                        if (!(__VLS_ctx.activeTab === 'mine'))
                            return;
                        if (!(__VLS_ctx.localRooms.length > 0))
                            return;
                        __VLS_ctx.router.push({ name: 'room', params: { id: room.roomId } });
                    } },
                key: (room.roomId),
                ...{ class: "group rounded-xl border border-border-hover bg-surface p-4 hover:border-primary/30 transition-all duration-300 cursor-pointer" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex items-center justify-between mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
                ...{ class: "font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors" },
            });
            (room.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-[10px] font-mono text-foreground-subtle bg-surface-hover rounded px-1.5 py-0.5" },
            });
            (room.roomId);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-xs text-foreground-muted" },
            });
            (new Date(room.createdAt).toLocaleDateString());
        }
    }
    if (__VLS_ctx.user) {
        if (__VLS_ctx.myLists.length > 0) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
                ...{ class: "text-lg font-bold text-foreground mb-4" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" },
            });
            for (const [tl] of __VLS_getVForSourceType((__VLS_ctx.myLists))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ onClick: (...[$event]) => {
                            if (!(__VLS_ctx.activeTab === 'mine'))
                                return;
                            if (!(__VLS_ctx.user))
                                return;
                            if (!(__VLS_ctx.myLists.length > 0))
                                return;
                            __VLS_ctx.router.push({ name: 'room', params: { id: tl.roomId } });
                        } },
                    key: (tl._id),
                    ...{ class: "rounded-xl border border-border-hover bg-surface overflow-hidden shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ class: "h-36 bg-gradient-to-br from-primary/20 to-surface-hover overflow-hidden" },
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
                    ...{ class: "flex items-center justify-between text-xs text-foreground-muted" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: (['rounded-full px-2 py-0.5 text-[10px] font-medium', __VLS_ctx.getCategoryColor(tl.category)]) },
                });
                (tl.category);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "flex items-center gap-1" },
                });
                const __VLS_27 = {}.Download;
                /** @type {[typeof __VLS_components.Download, ]} */ ;
                // @ts-ignore
                const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
                    ...{ class: "h-3 w-3" },
                }));
                const __VLS_29 = __VLS_28({
                    ...{ class: "h-3 w-3" },
                }, ...__VLS_functionalComponentArgsRest(__VLS_28));
                (tl.downloads || 0);
            }
        }
    }
    if (__VLS_ctx.localRooms.length === 0 && __VLS_ctx.myLists.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-16" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-foreground-muted text-lg" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-foreground-subtle text-sm mt-1" },
        });
    }
}
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-px']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-5']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-10']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder:text-foreground-subtle']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-primary/50']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['h-24']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3/4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-subtle']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['left-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-yellow-500/90']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-black']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[9px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-black']} */ ;
/** @type {__VLS_StyleScopedClasses['h-24']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['to-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:scale-105']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['line-clamp-1']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[10px]']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-subtle']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-36']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-br']} */ ;
/** @type {__VLS_StyleScopedClasses['from-primary/20']} */ ;
/** @type {__VLS_StyleScopedClasses['to-surface-hover']} */ ;
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
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-subtle']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NavBar: NavBar,
            Search: Search,
            Download: Download,
            Star: Star,
            History: History,
            router: router,
            user: user,
            featuredIds: featuredIds,
            tierlists: tierlists,
            isLoading: isLoading,
            searchQuery: searchQuery,
            activeCategory: activeCategory,
            activeSort: activeSort,
            activeTab: activeTab,
            myLists: myLists,
            localRooms: localRooms,
            loadLocalRooms: loadLocalRooms,
            categories: categories,
            sortOptions: sortOptions,
            fetchMyLists: fetchMyLists,
            viewTierlist: viewTierlist,
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
