import { ref, onMounted, onUnmounted } from 'vue';
import { useCloudinary } from '@/composables/useCloudinary';
import { useSocket } from '@/composables/useSocket';
import { ImagePlus, Search, X } from 'lucide-vue-next';
const API_BASE = 'http://localhost:3001';
const { uploadImage } = useCloudinary();
const { socket } = useSocket();
const fileInput = ref(null);
const isUploading = ref(false);
const uploadProgress = ref({ current: 0, total: 0 });
const error = ref(null);
const isDragging = ref(false);
let dragCounter = 0;
// Image search state
const searchQuery = ref('');
const searchResults = ref([]);
const isSearching = ref(false);
const selectedImage = ref(null);
const labelInput = ref('');
let debounceTimer = null;
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
// Image search functions
async function searchImages() {
    const q = searchQuery.value.trim();
    if (!q) {
        searchResults.value = [];
        return;
    }
    isSearching.value = true;
    error.value = null;
    try {
        const res = await fetch(`${API_BASE}/api/images/search?q=${encodeURIComponent(q)}`, {
            credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) {
            error.value = data.error || 'Search failed';
            searchResults.value = [];
            return;
        }
        searchResults.value = data;
    }
    catch (err) {
        console.error('[ImageSearch] Error:', err);
        error.value = 'Search failed';
        searchResults.value = [];
    }
    finally {
        isSearching.value = false;
    }
}
function onSearchInput() {
    if (debounceTimer)
        clearTimeout(debounceTimer);
    debounceTimer = setTimeout(searchImages, 500);
}
function onSearchKeydown(e) {
    if (e.key === 'Enter') {
        if (debounceTimer)
            clearTimeout(debounceTimer);
        searchImages();
    }
}
function selectImage(img) {
    selectedImage.value = img;
    labelInput.value = img.title.substring(0, 50);
}
function cancelSelection() {
    selectedImage.value = null;
    labelInput.value = '';
}
function confirmAddImage() {
    if (!selectedImage.value)
        return;
    if (socket.value?.connected) {
        socket.value.emit('item:create', {
            imageUrl: selectedImage.value.imageUrl,
            label: labelInput.value || selectedImage.value.title.substring(0, 50),
        });
    }
    selectedImage.value = null;
    labelInput.value = '';
}
onMounted(() => {
    document.addEventListener('paste', onPaste);
});
onUnmounted(() => {
    document.removeEventListener('paste', onPaste);
    if (debounceTimer)
        clearTimeout(debounceTimer);
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
    ...{ class: "transition-colors duration-200" },
    ...{ class: (__VLS_ctx.isDragging ? 'bg-primary/5' : '') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-4 pt-3 pb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative" },
});
const __VLS_0 = {}.Search;
/** @type {[typeof __VLS_components.Search, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.onSearchInput) },
    ...{ onKeydown: (__VLS_ctx.onSearchKeydown) },
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "Search images...",
    ...{ class: "w-full rounded-lg border border-white/10 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-primary/30" },
});
if (__VLS_ctx.isSearching) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-2 px-4 pb-2 sm:grid-cols-3 lg:grid-cols-4" },
    });
    for (const [i] of __VLS_getVForSourceType((8))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
            key: (i),
            ...{ class: "aspect-square animate-pulse rounded-lg bg-zinc-800" },
        });
    }
}
else if (__VLS_ctx.searchResults.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "px-4 pb-2" },
    });
    if (__VLS_ctx.selectedImage) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-zinc-900 p-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.selectedImage.thumbnail),
            alt: (__VLS_ctx.selectedImage.title),
            ...{ class: "h-10 w-10 rounded object-cover" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onKeydown: (__VLS_ctx.confirmAddImage) },
            value: (__VLS_ctx.labelInput),
            type: "text",
            placeholder: "Label",
            maxlength: "50",
            ...{ class: "flex-1 rounded border border-white/10 bg-zinc-800 px-2 py-1 text-sm text-white placeholder-zinc-500 outline-none focus:border-primary/30" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.confirmAddImage) },
            ...{ class: "rounded bg-primary px-3 py-1 text-sm font-semibold text-white transition-colors hover:bg-primary-hover" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelSelection) },
            ...{ class: "rounded p-1 text-zinc-400 transition-colors hover:text-white" },
        });
        const __VLS_4 = {}.X;
        /** @type {[typeof __VLS_components.X, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_6 = __VLS_5({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" },
    });
    for (const [img, idx] of __VLS_getVForSourceType((__VLS_ctx.searchResults))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.isSearching))
                        return;
                    if (!(__VLS_ctx.searchResults.length > 0))
                        return;
                    __VLS_ctx.selectImage(img);
                } },
            key: (idx),
            ...{ class: "group relative aspect-square overflow-hidden rounded-lg border transition-all duration-200" },
            ...{ class: (__VLS_ctx.selectedImage?.imageUrl === img.imageUrl
                    ? 'border-primary ring-2 ring-primary'
                    : 'border-white/5 hover:border-primary/30') },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (img.thumbnail),
            alt: (img.title),
            ...{ class: "h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "truncate text-xs text-white" },
        });
        (img.title);
    }
}
if (__VLS_ctx.searchQuery || __VLS_ctx.searchResults.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3 px-4 py-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-px flex-1 bg-white/10" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-xs text-zinc-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div)({
        ...{ class: "h-px flex-1 bg-white/10" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "px-4 pb-3" },
    ...{ class: (!__VLS_ctx.searchQuery && __VLS_ctx.searchResults.length === 0 ? 'pt-3' : '') },
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
    const __VLS_8 = {}.ImagePlus;
    /** @type {[typeof __VLS_components.ImagePlus, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ class: "h-5 w-5 text-zinc-500" },
    }));
    const __VLS_10 = __VLS_9({
        ...{ class: "h-5 w-5 text-zinc-500" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
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
        ...{ class: "block px-4 pb-2 text-center text-xs text-destructive" },
    });
    (__VLS_ctx.error);
}
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-3']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['left-3']} */ ;
/** @type {__VLS_StyleScopedClasses['top-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['-translate-y-1/2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-9']} */ ;
/** @type {__VLS_StyleScopedClasses['pr-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-pulse']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-900']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-10']} */ ;
/** @type {__VLS_StyleScopedClasses['w-10']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-zinc-800']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-primary/30']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-400']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['group']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['aspect-square']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:scale-105']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-x-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gradient-to-t']} */ ;
/** @type {__VLS_StyleScopedClasses['from-black/80']} */ ;
/** @type {__VLS_StyleScopedClasses['to-transparent']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-0']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-200']} */ ;
/** @type {__VLS_StyleScopedClasses['group-hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-px']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-zinc-500']} */ ;
/** @type {__VLS_StyleScopedClasses['h-px']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white/10']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-3']} */ ;
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
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ImagePlus: ImagePlus,
            Search: Search,
            X: X,
            fileInput: fileInput,
            isUploading: isUploading,
            uploadProgress: uploadProgress,
            error: error,
            isDragging: isDragging,
            searchQuery: searchQuery,
            searchResults: searchResults,
            isSearching: isSearching,
            selectedImage: selectedImage,
            labelInput: labelInput,
            triggerFileInput: triggerFileInput,
            handleFiles: handleFiles,
            onDragEnter: onDragEnter,
            onDragLeave: onDragLeave,
            onDrop: onDrop,
            onSearchInput: onSearchInput,
            onSearchKeydown: onSearchKeydown,
            selectImage: selectImage,
            cancelSelection: cancelSelection,
            confirmAddImage: confirmAddImage,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
