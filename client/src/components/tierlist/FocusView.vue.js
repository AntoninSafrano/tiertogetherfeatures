import { computed } from 'vue';
import draggable from 'vuedraggable';
import { useRoomStore } from '@/stores/room';
import { SkipForward, PartyPopper } from 'lucide-vue-next';
const store = useRoomStore();
const isDragDisabled = computed(() => store.isLocked && !store.isHost);
// Expose only the first pool item as a draggable list
const focusItems = computed({
    get: () => (store.pool.length > 0 ? [store.pool[0]] : []),
    set: (value) => {
        // When the item is dragged away, vuedraggable sets value to []
        // Remove first item from pool locally (server handles persistence via item:move)
        if (value.length === 0 && store.pool.length > 0) {
            store.pool.splice(0, 1);
        }
    },
});
const remainingCount = computed(() => Math.max(0, store.pool.length - 1));
const placeholderColors = [
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#f97316', '#eab308',
    '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];
function getPlaceholderColor(id) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return placeholderColors[Math.abs(hash) % placeholderColors.length];
}
function onDragChange(evt) {
    if (evt.removed) {
        store.handleDragRemoved(evt.removed.element.id, null);
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex flex-col items-center gap-6 py-4 sm:py-8" },
});
if (__VLS_ctx.store.pool.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-col items-center gap-3 py-12" },
    });
    const __VLS_0 = {}.PartyPopper;
    /** @type {[typeof __VLS_components.PartyPopper, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "h-16 w-16 text-primary" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-16 w-16 text-primary" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xl font-bold text-foreground" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-foreground-muted" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-medium text-foreground-muted" },
    });
    const __VLS_4 = {}.draggable;
    /** @type {[typeof __VLS_components.Draggable, typeof __VLS_components.draggable, typeof __VLS_components.Draggable, typeof __VLS_components.draggable, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ 'onChange': {} },
        modelValue: (__VLS_ctx.focusItems),
        group: ({ name: 'tieritems', pull: true, put: false }),
        itemKey: "id",
        ghostClass: "ghost",
        chosenClass: "chosen",
        dragClass: "drag",
        animation: (200),
        disabled: (__VLS_ctx.isDragDisabled),
        ...{ class: "flex items-center justify-center" },
    }));
    const __VLS_6 = __VLS_5({
        ...{ 'onChange': {} },
        modelValue: (__VLS_ctx.focusItems),
        group: ({ name: 'tieritems', pull: true, put: false }),
        itemKey: "id",
        ghostClass: "ghost",
        chosenClass: "chosen",
        dragClass: "drag",
        animation: (200),
        disabled: (__VLS_ctx.isDragDisabled),
        ...{ class: "flex items-center justify-center" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    let __VLS_8;
    let __VLS_9;
    let __VLS_10;
    const __VLS_11 = {
        onChange: (__VLS_ctx.onDragChange)
    };
    __VLS_7.slots.default;
    {
        const { item: __VLS_thisSlot } = __VLS_7.slots;
        const [{ element }] = __VLS_getSlotParams(__VLS_thisSlot);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "relative h-44 w-44 sm:h-56 sm:w-56 cursor-grab rounded-2xl border border-border-hover bg-surface shadow-2xl ring-0 ring-primary/30 transition-all duration-200 hover:scale-[1.03] hover:ring-2 active:cursor-grabbing md:h-64 md:w-64" },
        });
        if (element.imageUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                src: (element.imageUrl),
                alt: (element.label),
                ...{ class: "h-full w-full rounded-2xl object-contain" },
                draggable: "false",
            });
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex h-full w-full items-center justify-center rounded-2xl p-4" },
                ...{ style: ({
                        background: `linear-gradient(135deg, ${__VLS_ctx.getPlaceholderColor(element.id)}30, ${__VLS_ctx.getPlaceholderColor(element.id)}10)`,
                    }) },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-center text-2xl font-bold leading-tight text-foreground/90" },
            });
            (element.label);
        }
        if (element.imageUrl) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/80 to-transparent px-3 py-2.5" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "truncate text-center text-sm font-semibold text-white" },
            });
            (element.label);
        }
    }
    var __VLS_7;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-4" },
    });
    if (__VLS_ctx.store.isHost) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.store.pool.length === 0))
                        return;
                    if (!(__VLS_ctx.store.isHost))
                        return;
                    __VLS_ctx.store.skipCurrentItem();
                } },
            ...{ class: "flex items-center gap-2 rounded-lg border border-border-hover bg-surface-hover px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-active hover:text-foreground" },
        });
        const __VLS_12 = {}.SkipForward;
        /** @type {[typeof __VLS_components.SkipForward, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_14 = __VLS_13({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-xs text-foreground-subtle" },
    });
    (__VLS_ctx.remainingCount);
    (__VLS_ctx.remainingCount !== 1 ? 's' : '');
    (__VLS_ctx.remainingCount !== 1 ? 's' : '');
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['h-16']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-44']} */ ;
/** @type {__VLS_StyleScopedClasses['w-44']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:h-56']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:w-56']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-grab']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-0']} */ ;
/** @type {__VLS_StyleScopedClasses['ring-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:scale-[1.03]']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['active:cursor-grabbing']} */ ;
/** @type {__VLS_StyleScopedClasses['md:h-64']} */ ;
/** @type {__VLS_StyleScopedClasses['md:w-64']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['object-contain']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['leading-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground/90']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-b-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
/** @type {__VLS_StyleScopedClasses['from-black/80']} */ ;
/** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2.5']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-surface-active']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-subtle']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            draggable: draggable,
            SkipForward: SkipForward,
            PartyPopper: PartyPopper,
            store: store,
            isDragDisabled: isDragDisabled,
            focusItems: focusItems,
            remainingCount: remainingCount,
            getPlaceholderColor: getPlaceholderColor,
            onDragChange: onDragChange,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
