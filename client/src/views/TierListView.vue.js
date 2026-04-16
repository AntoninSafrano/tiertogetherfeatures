import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '@/components/NavBar.vue';
import TierRow from '@/components/tierlist/TierRow.vue';
import TierItem from '@/components/tierlist/TierItem.vue';
import { useRoomStore } from '@/stores/room';
import { ArrowLeft, Download, Calendar, LayoutGrid, Copy, Settings2 } from 'lucide-vue-next';
import { API_BASE } from '@/config';
const route = useRoute();
const router = useRouter();
const roomStore = useRoomStore();
const tierlist = ref(null);
const isLoading = ref(true);
const error = ref('');
const isCloning = ref(false);
const activeRowMenu = ref(null);
function toggleRowMenu(rowId) {
    activeRowMenu.value = activeRowMenu.value === rowId ? null : rowId;
}
function deleteRow(index) {
    if (!tierlist.value)
        return;
    const row = tierlist.value.rows[index];
    tierlist.value.pool.push(...row.items);
    tierlist.value.rows.splice(index, 1);
    activeRowMenu.value = null;
}
function changeRowColor(index, color) {
    if (!tierlist.value)
        return;
    tierlist.value.rows[index].color = color;
}
const totalItems = computed(() => {
    if (!tierlist.value)
        return 0;
    const rowItems = tierlist.value.rows.reduce((sum, r) => sum + r.items.length, 0);
    return rowItems + tierlist.value.pool.length;
});
async function fetchTierList() {
    isLoading.value = true;
    error.value = '';
    try {
        const res = await fetch(`${API_BASE}/api/tierlists/${route.params.id}`);
        if (!res.ok) {
            error.value = 'Tier list introuvable';
            return;
        }
        const data = await res.json();
        tierlist.value = data.tierlist;
    }
    catch {
        error.value = 'Impossible de charger la tier list';
    }
    finally {
        isLoading.value = false;
    }
}
async function cloneAndUse() {
    if (!tierlist.value || isCloning.value)
        return;
    isCloning.value = true;
    try {
        const res = await fetch(`${API_BASE}/api/tierlists/${tierlist.value._id}/clone`, {
            method: 'POST',
            credentials: 'include',
        });
        const data = await res.json();
        if (data.success && data.roomId) {
            roomStore.saveRoomToHistory(data.roomId, tierlist.value.title);
            router.push({ name: 'room', params: { id: data.roomId } });
        }
    }
    catch (err) {
        console.error('Clone failed:', err);
    }
    finally {
        isCloning.value = false;
    }
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
onMounted(() => {
    fetchTierList();
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
    ...{ class: "mx-auto max-w-4xl px-4 py-8" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.router.push({ name: 'explore' });
        } },
    ...{ class: "inline-flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors mb-6" },
});
const __VLS_3 = {}.ArrowLeft;
/** @type {[typeof __VLS_components.ArrowLeft, ]} */ ;
// @ts-ignore
const __VLS_4 = __VLS_asFunctionalComponent(__VLS_3, new __VLS_3({
    ...{ class: "h-4 w-4" },
}));
const __VLS_5 = __VLS_4({
    ...{ class: "h-4 w-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_4));
if (__VLS_ctx.isLoading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-8 w-2/3 rounded bg-surface-hover animate-pulse" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-4 w-1/3 rounded bg-surface-hover animate-pulse" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-1 mt-6" },
    });
    for (const [i] of __VLS_getVForSourceType((5))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "h-[100px] rounded bg-surface-hover/50 animate-pulse" },
        });
    }
}
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-16" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-foreground-muted text-lg" },
    });
    (__VLS_ctx.error);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.isLoading))
                    return;
                if (!(__VLS_ctx.error))
                    return;
                __VLS_ctx.router.push({ name: 'explore' });
            } },
        ...{ class: "mt-4 rounded-lg bg-surface-hover border border-border-hover px-4 py-2 text-sm text-foreground hover:bg-surface-active transition-colors" },
    });
}
else if (__VLS_ctx.tierlist) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "text-xl sm:text-2xl font-extrabold tracking-tight text-foreground mb-3" },
    });
    (__VLS_ctx.tierlist.title);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-wrap items-center gap-3 text-sm text-foreground-muted" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: (['rounded-full px-2.5 py-0.5 text-xs font-medium', __VLS_ctx.getCategoryColor(__VLS_ctx.tierlist.category)]) },
    });
    (__VLS_ctx.tierlist.category);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "inline-flex items-center gap-1" },
    });
    const __VLS_7 = {}.Download;
    /** @type {[typeof __VLS_components.Download, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_9 = __VLS_8({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    (__VLS_ctx.tierlist.downloads || 0);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "inline-flex items-center gap-1" },
    });
    const __VLS_11 = {}.LayoutGrid;
    /** @type {[typeof __VLS_components.LayoutGrid, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_13 = __VLS_12({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    (__VLS_ctx.totalItems);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "inline-flex items-center gap-1" },
    });
    const __VLS_15 = {}.Calendar;
    /** @type {[typeof __VLS_components.Calendar, ]} */ ;
    // @ts-ignore
    const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
        ...{ class: "h-3.5 w-3.5" },
    }));
    const __VLS_17 = __VLS_16({
        ...{ class: "h-3.5 w-3.5" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_16));
    (new Date(__VLS_ctx.tierlist.createdAt).toLocaleDateString());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cloneAndUse) },
        ...{ class: "inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed" },
        disabled: (__VLS_ctx.isCloning),
    });
    const __VLS_19 = {}.Copy;
    /** @type {[typeof __VLS_components.Copy, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({
        ...{ class: "h-4 w-4" },
    }));
    const __VLS_21 = __VLS_20({
        ...{ class: "h-4 w-4" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    (__VLS_ctx.isCloning ? 'Création...' : 'Utiliser comme modèle');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-xl border border-border-hover bg-surface overflow-visible shadow-2xl" },
    });
    for (const [row, index] of __VLS_getVForSourceType((__VLS_ctx.tierlist.rows))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (row.id),
            ...{ class: "group/preview relative" },
        });
        /** @type {[typeof TierRow, ]} */ ;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent(TierRow, new TierRow({
            rowIndex: (index),
            readonly: (true),
            row: (row),
        }));
        const __VLS_24 = __VLS_23({
            rowIndex: (index),
            readonly: (true),
            row: (row),
        }, ...__VLS_functionalComponentArgsRest(__VLS_23));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isLoading))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.tierlist))
                        return;
                    __VLS_ctx.toggleRowMenu(row.id);
                } },
            ...{ class: "absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-surface-hover/80 p-1.5 text-foreground-muted opacity-0 transition-all hover:bg-surface-active hover:text-foreground group-hover/preview:opacity-100" },
        });
        const __VLS_26 = {}.Settings2;
        /** @type {[typeof __VLS_components.Settings2, ]} */ ;
        // @ts-ignore
        const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_28 = __VLS_27({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_27));
        if (__VLS_ctx.activeRowMenu === row.id) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute right-10 top-1/2 -translate-y-1/2 z-50 rounded-lg border border-border-hover bg-surface-hover p-3 shadow-xl" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex flex-col gap-2 min-w-[140px]" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "flex items-center gap-2 text-sm text-foreground cursor-pointer" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (...[$event]) => {
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.tierlist))
                            return;
                        if (!(__VLS_ctx.activeRowMenu === row.id))
                            return;
                        __VLS_ctx.changeRowColor(index, $event.target.value);
                    } },
                type: "color",
                value: (row.color),
                ...{ class: "h-6 w-6 cursor-pointer rounded border-0 bg-transparent" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.isLoading))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.tierlist))
                            return;
                        if (!(__VLS_ctx.activeRowMenu === row.id))
                            return;
                        __VLS_ctx.deleteRow(index);
                    } },
                ...{ class: "rounded-md bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors text-left" },
            });
        }
    }
    if (__VLS_ctx.tierlist.pool.length > 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: "text-sm font-semibold text-foreground-muted mb-3" },
        });
        (__VLS_ctx.tierlist.pool.length);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "rounded-xl border border-border-hover bg-surface p-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex flex-wrap gap-2" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.tierlist.pool))) {
            /** @type {[typeof TierItem, ]} */ ;
            // @ts-ignore
            const __VLS_30 = __VLS_asFunctionalComponent(TierItem, new TierItem({
                key: (item.id),
                item: (item),
            }));
            const __VLS_31 = __VLS_30({
                key: (item.id),
                item: (item),
            }, ...__VLS_functionalComponentArgsRest(__VLS_30));
        }
    }
}
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-2/3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-1/3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['h-[100px]']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover/50']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-surface-active']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['px-5']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-primary/25']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary/90']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['disabled:cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-visible']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['group/preview']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover/80']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-surface-active']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover/preview:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['right-10']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-[140px]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500/10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-500/20']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-left']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NavBar: NavBar,
            TierRow: TierRow,
            TierItem: TierItem,
            ArrowLeft: ArrowLeft,
            Download: Download,
            Calendar: Calendar,
            LayoutGrid: LayoutGrid,
            Copy: Copy,
            Settings2: Settings2,
            router: router,
            tierlist: tierlist,
            isLoading: isLoading,
            error: error,
            isCloning: isCloning,
            activeRowMenu: activeRowMenu,
            toggleRowMenu: toggleRowMenu,
            deleteRow: deleteRow,
            changeRowColor: changeRowColor,
            totalItems: totalItems,
            cloneAndUse: cloneAndUse,
            getCategoryColor: getCategoryColor,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
