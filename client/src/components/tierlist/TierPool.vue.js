import { computed } from 'vue';
import draggable from 'vuedraggable';
import { useRoomStore } from '@/stores/room';
import TierItem from './TierItem.vue';
import { LayoutGrid } from 'lucide-vue-next';
const store = useRoomStore();
const isDragDisabled = computed(() => store.isLocked && !store.isHost);
const pool = computed({
    get: () => store.pool,
    set: (value) => {
        store.pool = value;
    },
});
function onDragChange(evt) {
    if (evt.added) {
        store.handleDragAdded(evt.added.element.id, null, evt.added.newIndex);
    }
    if (evt.removed) {
        store.handleDragRemoved(evt.removed.element.id, null);
    }
    if (evt.moved) {
        store.emitMove({
            itemId: evt.moved.element.id,
            fromRowId: null,
            toRowId: null,
            toIndex: evt.moved.newIndex,
        });
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-3 flex items-center gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-sm font-semibold text-foreground" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "rounded-full bg-surface-active px-2 py-0.5 text-xs font-medium text-foreground-muted" },
});
(__VLS_ctx.pool.length);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative" },
});
const __VLS_0 = {}.draggable;
/** @type {[typeof __VLS_components.Draggable, typeof __VLS_components.draggable, typeof __VLS_components.Draggable, typeof __VLS_components.draggable, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.pool),
    group: "tieritems",
    itemKey: "id",
    ghostClass: "ghost",
    chosenClass: "chosen",
    dragClass: "drag",
    animation: (200),
    disabled: (__VLS_ctx.isDragDisabled),
    ...{ class: "flex min-h-[100px] flex-wrap items-start gap-2" },
}));
const __VLS_2 = __VLS_1({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.pool),
    group: "tieritems",
    itemKey: "id",
    ghostClass: "ghost",
    chosenClass: "chosen",
    dragClass: "drag",
    animation: (200),
    disabled: (__VLS_ctx.isDragDisabled),
    ...{ class: "flex min-h-[100px] flex-wrap items-start gap-2" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onChange: (__VLS_ctx.onDragChange)
};
__VLS_3.slots.default;
{
    const { item: __VLS_thisSlot } = __VLS_3.slots;
    const [{ element }] = __VLS_getSlotParams(__VLS_thisSlot);
    /** @type {[typeof TierItem, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(TierItem, new TierItem({
        item: (element),
    }));
    const __VLS_9 = __VLS_8({
        item: (element),
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
}
var __VLS_3;
if (__VLS_ctx.pool.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2" },
    });
    const __VLS_11 = {}.LayoutGrid;
    /** @type {[typeof __VLS_components.LayoutGrid, ]} */ ;
    // @ts-ignore
    const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
        ...{ class: "h-8 w-8 text-foreground-subtle" },
    }));
    const __VLS_13 = __VLS_12({
        ...{ class: "h-8 w-8 text-foreground-subtle" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_12));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-foreground-subtle" },
    });
}
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface-active']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-[100px]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pointer-events-none']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-subtle']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-subtle']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            draggable: draggable,
            TierItem: TierItem,
            LayoutGrid: LayoutGrid,
            isDragDisabled: isDragDisabled,
            pool: pool,
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
