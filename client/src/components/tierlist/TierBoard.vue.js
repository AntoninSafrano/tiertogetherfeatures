import { useRoomStore } from '@/stores/room';
import TierRow from './TierRow.vue';
import TierPool from './TierPool.vue';
import TierToolbar from './TierToolbar.vue';
import ImageUploader from './ImageUploader.vue';
import FocusView from './FocusView.vue';
import { Plus } from 'lucide-vue-next';
const store = useRoomStore();
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mx-auto w-full max-w-5xl space-y-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-center text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground" },
});
(__VLS_ctx.store.title);
/** @type {[typeof TierToolbar, ]} */ ;
// @ts-ignore
const __VLS_0 = __VLS_asFunctionalComponent(TierToolbar, new TierToolbar({}));
const __VLS_1 = __VLS_0({}, ...__VLS_functionalComponentArgsRest(__VLS_0));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "tier-rows-container",
    ...{ class: "overflow-hidden rounded-xl border border-border-hover shadow-2xl" },
});
for (const [row, index] of __VLS_getVForSourceType((__VLS_ctx.store.rows))) {
    /** @type {[typeof TierRow, ]} */ ;
    // @ts-ignore
    const __VLS_3 = __VLS_asFunctionalComponent(TierRow, new TierRow({
        key: (row.id),
        rowIndex: (index),
    }));
    const __VLS_4 = __VLS_3({
        key: (row.id),
        rowIndex: (index),
    }, ...__VLS_functionalComponentArgsRest(__VLS_3));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.addRow();
        } },
    ...{ class: "w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-hover py-2 text-sm text-foreground-muted hover:text-primary hover:border-primary/30 transition-all duration-300" },
});
const __VLS_6 = {}.Plus;
/** @type {[typeof __VLS_components.Plus, ]} */ ;
// @ts-ignore
const __VLS_7 = __VLS_asFunctionalComponent(__VLS_6, new __VLS_6({
    ...{ class: "h-4 w-4" },
}));
const __VLS_8 = __VLS_7({
    ...{ class: "h-4 w-4" },
}, ...__VLS_functionalComponentArgsRest(__VLS_7));
const __VLS_10 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_11 = __VLS_asFunctionalComponent(__VLS_10, new __VLS_10({
    name: "fade",
    mode: "out-in",
}));
const __VLS_12 = __VLS_11({
    name: "fade",
    mode: "out-in",
}, ...__VLS_functionalComponentArgsRest(__VLS_11));
__VLS_13.slots.default;
if (__VLS_ctx.store.isFocusMode) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: "focus",
        ...{ class: "rounded-xl border border-border-hover bg-surface/20" },
    });
    /** @type {[typeof FocusView, ]} */ ;
    // @ts-ignore
    const __VLS_14 = __VLS_asFunctionalComponent(FocusView, new FocusView({}));
    const __VLS_15 = __VLS_14({}, ...__VLS_functionalComponentArgsRest(__VLS_14));
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: "pool",
        ...{ class: "overflow-hidden rounded-xl border border-border-hover bg-surface/20" },
    });
    /** @type {[typeof ImageUploader, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(ImageUploader, new ImageUploader({}));
    const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "border-t border-border" },
    });
    /** @type {[typeof TierPool, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(TierPool, new TierPool({}));
    const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
}
var __VLS_13;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-5xl']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['tracking-tight']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface/20']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-surface/20']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TierRow: TierRow,
            TierPool: TierPool,
            TierToolbar: TierToolbar,
            ImageUploader: ImageUploader,
            FocusView: FocusView,
            Plus: Plus,
            store: store,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
