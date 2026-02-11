import { computed, ref, nextTick } from 'vue';
import draggable from 'vuedraggable';
import { useRoomStore } from '@/stores/room';
import TierItem from './TierItem.vue';
import { Trash2, ArrowUp, ArrowDown, Palette } from 'lucide-vue-next';
const props = defineProps();
const store = useRoomStore();
const row = computed(() => store.rows[props.rowIndex]);
const isDragDisabled = computed(() => store.isLocked && !store.isHost);
const items = computed({
    get: () => store.rows[props.rowIndex].items,
    set: (value) => {
        store.rows[props.rowIndex].items = value;
    },
});
// Editable label
const isEditing = ref(false);
const editLabel = ref('');
const labelInput = ref(null);
function startEditing() {
    editLabel.value = row.value.label;
    isEditing.value = true;
    nextTick(() => {
        labelInput.value?.focus();
        labelInput.value?.select();
    });
}
function finishEditing() {
    isEditing.value = false;
    const newLabel = editLabel.value.trim();
    if (newLabel && newLabel !== row.value.label) {
        store.updateRow({ rowId: row.value.id, label: newLabel });
    }
}
// Color picker
const showColorPicker = ref(false);
const colorInput = ref('');
function openColorPicker() {
    colorInput.value = row.value.color;
    showColorPicker.value = true;
}
function applyColor(e) {
    const target = e.target;
    store.updateRow({ rowId: row.value.id, color: target.value });
    showColorPicker.value = false;
}
// Delete confirmation
const showDeleteConfirm = ref(false);
function confirmDelete() {
    store.deleteRow({ rowId: row.value.id });
    showDeleteConfirm.value = false;
}
function onDragChange(evt) {
    if (evt.added) {
        store.handleDragAdded(evt.added.element.id, row.value.id, evt.added.newIndex);
    }
    if (evt.removed) {
        store.handleDragRemoved(evt.removed.element.id, row.value.id);
    }
    if (evt.moved) {
        store.emitMove({
            itemId: evt.moved.element.id,
            fromRowId: row.value.id,
            toRowId: row.value.id,
            toIndex: evt.moved.newIndex,
        });
    }
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "group/row flex border-b border-white/5 last:border-b-0 relative" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (__VLS_ctx.startEditing) },
    ...{ class: "flex w-24 shrink-0 items-center justify-center text-3xl font-extrabold select-none relative group/label cursor-pointer" },
    ...{ style: ({
            backgroundColor: __VLS_ctx.row.color,
            color: '#0a0a0c',
            boxShadow: `inset 0 0 32px ${__VLS_ctx.row.color}80, inset 0 0 12px ${__VLS_ctx.row.color}40`,
        }) },
});
if (__VLS_ctx.isEditing) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onBlur: (__VLS_ctx.finishEditing) },
        ...{ onKeydown: (__VLS_ctx.finishEditing) },
        ref: "labelInput",
        maxlength: "10",
        ...{ class: "w-16 bg-transparent text-center text-3xl font-extrabold text-[#0a0a0c] outline-none border-b-2 border-black/30" },
    });
    (__VLS_ctx.editLabel);
    /** @type {typeof __VLS_ctx.labelInput} */ ;
}
else {
    (__VLS_ctx.row.label);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "absolute -right-0 top-0 bottom-0 flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 z-10 translate-x-full px-1" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.reorderRow({ rowId: __VLS_ctx.row.id, direction: 'up' });
        } },
    ...{ class: "p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors" },
    title: "Move up",
});
const __VLS_0 = {}.ArrowUp;
/** @type {[typeof __VLS_components.ArrowUp, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "h-3.5 w-3.5" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-3.5 w-3.5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.openColorPicker) },
    ...{ class: "p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors" },
    title: "Change color",
});
const __VLS_4 = {}.Palette;
/** @type {[typeof __VLS_components.Palette, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "h-3.5 w-3.5" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "h-3.5 w-3.5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
if (__VLS_ctx.showColorPicker) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        ...{ onInput: (__VLS_ctx.applyColor) },
        ...{ onChange: (__VLS_ctx.applyColor) },
        type: "color",
        value: (__VLS_ctx.row.color),
        ...{ class: "absolute opacity-0 w-0 h-0" },
        ref: "colorPickerInput",
    });
    /** @type {typeof __VLS_ctx.colorPickerInput} */ ;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.store.reorderRow({ rowId: __VLS_ctx.row.id, direction: 'down' });
        } },
    ...{ class: "p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors" },
    title: "Move down",
});
const __VLS_8 = {}.ArrowDown;
/** @type {[typeof __VLS_components.ArrowDown, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ class: "h-3.5 w-3.5" },
}));
const __VLS_10 = __VLS_9({
    ...{ class: "h-3.5 w-3.5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showDeleteConfirm = true;
        } },
    ...{ class: "p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors" },
    title: "Delete row",
});
const __VLS_12 = {}.Trash2;
/** @type {[typeof __VLS_components.Trash2, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ class: "h-3.5 w-3.5" },
}));
const __VLS_14 = __VLS_13({
    ...{ class: "h-3.5 w-3.5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
const __VLS_16 = {}.draggable;
/** @type {[typeof __VLS_components.Draggable, typeof __VLS_components.draggable, typeof __VLS_components.Draggable, typeof __VLS_components.draggable, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.items),
    group: "tieritems",
    itemKey: "id",
    ghostClass: "ghost",
    chosenClass: "chosen",
    dragClass: "drag",
    animation: (200),
    disabled: (__VLS_ctx.isDragDisabled),
    ...{ class: "flex min-h-[100px] flex-1 flex-wrap items-start gap-2 bg-white/[0.02] p-3 transition-colors duration-200 group-hover/row:bg-white/[0.04]" },
}));
const __VLS_18 = __VLS_17({
    ...{ 'onChange': {} },
    modelValue: (__VLS_ctx.items),
    group: "tieritems",
    itemKey: "id",
    ghostClass: "ghost",
    chosenClass: "chosen",
    dragClass: "drag",
    animation: (200),
    disabled: (__VLS_ctx.isDragDisabled),
    ...{ class: "flex min-h-[100px] flex-1 flex-wrap items-start gap-2 bg-white/[0.02] p-3 transition-colors duration-200 group-hover/row:bg-white/[0.04]" },
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onChange: (__VLS_ctx.onDragChange)
};
__VLS_19.slots.default;
{
    const { item: __VLS_thisSlot } = __VLS_19.slots;
    const [{ element }] = __VLS_getSlotParams(__VLS_thisSlot);
    /** @type {[typeof TierItem, ]} */ ;
    // @ts-ignore
    const __VLS_24 = __VLS_asFunctionalComponent(TierItem, new TierItem({
        item: (element),
    }));
    const __VLS_25 = __VLS_24({
        item: (element),
    }, ...__VLS_functionalComponentArgsRest(__VLS_24));
}
var __VLS_19;
const __VLS_27 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_28 = __VLS_asFunctionalComponent(__VLS_27, new __VLS_27({
    to: "body",
}));
const __VLS_29 = __VLS_28({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_28));
__VLS_30.slots.default;
if (__VLS_ctx.showDeleteConfirm) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteConfirm))
                    return;
                __VLS_ctx.showDeleteConfirm = false;
            } },
        ...{ class: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl max-w-sm w-full mx-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-bold text-foreground mb-2" },
    });
    (__VLS_ctx.row.label);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-zinc-400 mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex gap-3 justify-end" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showDeleteConfirm))
                    return;
                __VLS_ctx.showDeleteConfirm = false;
            } },
        ...{ class: "px-4 py-2 rounded-lg text-sm text-zinc-400 hover:bg-white/5 transition-colors" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.confirmDelete) },
        ...{ class: "px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors" },
    });
}
var __VLS_30;
/** @type {__VLS_StyleScopedClasses['group/row']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/5']} */ ;
/** @type {__VLS_StyleScopedClasses['last:border-b-0']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['w-24']} */ ;
/** @type {__VLS_StyleScopedClasses['shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['select-none']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['group/label']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-extrabold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-[#0a0a0c]']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-black/30']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['-right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-0.5']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover/row:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['translate-x-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-zinc-300']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-zinc-300']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-0']} */ ;
/** @type {__VLS_StyleScopedClasses['h-0']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-zinc-300']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-500/20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-3.5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-[100px]']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/[0.02]']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover/row:bg-white/[0.04]']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black/60']} */ ;
/** @type {__VLS_StyleScopedClasses['backdrop-blur-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-white/5']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500/20']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-500/30']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            draggable: draggable,
            TierItem: TierItem,
            Trash2: Trash2,
            ArrowUp: ArrowUp,
            ArrowDown: ArrowDown,
            Palette: Palette,
            store: store,
            row: row,
            isDragDisabled: isDragDisabled,
            items: items,
            isEditing: isEditing,
            editLabel: editLabel,
            labelInput: labelInput,
            startEditing: startEditing,
            finishEditing: finishEditing,
            showColorPicker: showColorPicker,
            openColorPicker: openColorPicker,
            applyColor: applyColor,
            showDeleteConfirm: showDeleteConfirm,
            confirmDelete: confirmDelete,
            onDragChange: onDragChange,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
