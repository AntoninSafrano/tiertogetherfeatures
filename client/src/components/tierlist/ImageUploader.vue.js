import { ref, onMounted, onUnmounted } from 'vue';
import { useCloudinary } from '@/composables/useCloudinary';
import { useSocket } from '@/composables/useSocket';
import { ImagePlus } from 'lucide-vue-next';
const { uploadImage } = useCloudinary();
const { socket } = useSocket();
const fileInput = ref(null);
const isUploading = ref(false);
const uploadProgress = ref({ current: 0, total: 0 });
const error = ref(null);
const isDragging = ref(false);
let dragCounter = 0;
function triggerFileInput() {
    fileInput.value?.click();
}
async function processFiles(files) {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length === 0)
        return;
    isUploading.value = true;
    error.value = null;
    uploadProgress.value = { current: 0, total: images.length };
    for (const file of images) {
        try {
            const imageUrl = await uploadImage(file);
            const label = file.name && file.name !== 'image.png'
                ? file.name.replace(/\.[^.]+$/, '').substring(0, 50)
                : `Pasted image ${uploadProgress.value.current + 1}`;
            if (socket.value?.connected) {
                socket.value.emit('item:create', { imageUrl, label });
            }
            uploadProgress.value.current++;
        }
        catch (err) {
            console.error(`[Upload] Failed for ${file.name}:`, err);
            error.value = `Failed to upload ${file.name}`;
            uploadProgress.value.current++;
        }
    }
    isUploading.value = false;
}
function handleFiles(event) {
    const input = event.target;
    const files = input.files;
    if (!files || files.length === 0)
        return;
    processFiles(Array.from(files));
    input.value = '';
}
function onDragEnter(e) {
    e.preventDefault();
    dragCounter++;
    isDragging.value = true;
}
function onDragLeave(e) {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
        isDragging.value = false;
        dragCounter = 0;
    }
}
function onDrop(e) {
    e.preventDefault();
    isDragging.value = false;
    dragCounter = 0;
    if (e.dataTransfer?.files) {
        processFiles(Array.from(e.dataTransfer.files));
    }
}
function onPaste(e) {
    if (!e.clipboardData?.files.length)
        return;
    processFiles(Array.from(e.clipboardData.files));
}
onMounted(() => {
    document.addEventListener('paste', onPaste);
});
onUnmounted(() => {
    document.removeEventListener('paste', onPaste);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onDragover: () => { } },
    ...{ onDragenter: (__VLS_ctx.onDragEnter) },
    ...{ onDragleave: (__VLS_ctx.onDragLeave) },
    ...{ onDrop: (__VLS_ctx.onDrop) },
    ...{ class: "px-4 py-3 transition-colors duration-200" },
    ...{ class: (__VLS_ctx.isDragging ? 'bg-primary/5' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onChange: (__VLS_ctx.handleFiles) },
    ref: "fileInput",
    type: "file",
    multiple: true,
    accept: "image/*",
    ...{ class: "hidden" },
});
/** @type {typeof __VLS_ctx.fileInput} */ ;
if (__VLS_ctx.isUploading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center gap-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-zinc-400" },
    });
    (__VLS_ctx.uploadProgress.current);
    (__VLS_ctx.uploadProgress.total);
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center gap-2" },
    });
    const __VLS_0 = {}.ImagePlus;
    /** @type {[typeof __VLS_components.ImagePlus, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "h-5 w-5 text-zinc-500" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "h-5 w-5 text-zinc-500" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-zinc-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.triggerFileInput) },
        ...{ class: "font-semibold text-primary transition-colors hover:text-primary-hover" },
    });
}
if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "mt-1 block text-center text-xs text-destructive" },
    });
    (__VLS_ctx.error);
}
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/20']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ImagePlus: ImagePlus,
            fileInput: fileInput,
            isUploading: isUploading,
            uploadProgress: uploadProgress,
            error: error,
            isDragging: isDragging,
            triggerFileInput: triggerFileInput,
            handleFiles: handleFiles,
            onDragEnter: onDragEnter,
            onDragLeave: onDragLeave,
            onDrop: onDrop,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
