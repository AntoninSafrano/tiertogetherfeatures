import { onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoomStore } from '@/stores/room';
import { TierBoard } from '@/components/tierlist';
import { Badge } from '@/components/ui/badge';
import ChatPanel from '@/components/chat/ChatPanel.vue';
import RoomEntryGate from '@/components/room/RoomEntryGate.vue';
import CollaboratorsPanel from '@/components/room/CollaboratorsPanel.vue';
const route = useRoute();
const router = useRouter();
const store = useRoomStore();
const roomId = route.params.id;
const error = ref(null);
const isLoading = ref(false);
const isDemo = roomId === 'demo';
const gateResolved = ref(false);
onMounted(async () => {
    if (isDemo) {
        store.initDemo();
        gateResolved.value = true;
        return;
    }
    // If we already joined this room (e.g. after createRoom navigated here), skip gate
    if (store.currentRoom?.id === roomId) {
        gateResolved.value = true;
        return;
    }
});
onUnmounted(() => {
    if (!isDemo) {
        store.clearRoom();
    }
});
async function onGateReady(payload) {
    isLoading.value = true;
    error.value = null;
    store.username = payload.username;
    const res = await store.joinRoom(roomId, payload.username, payload.avatar, payload.isGuest);
    isLoading.value = false;
    if (res.success) {
        gateResolved.value = true;
    }
    else {
        error.value = res.error ?? 'Impossible de rejoindre la room';
        gateResolved.value = true; // Show error in main view
    }
}
function goHome() {
    store.clearRoom();
    router.push({ name: 'explore' });
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
if (!__VLS_ctx.isDemo && !__VLS_ctx.gateResolved) {
    /** @type {[typeof RoomEntryGate, ]} */ ;
    // @ts-ignore
    const __VLS_0 = __VLS_asFunctionalComponent(RoomEntryGate, new RoomEntryGate({
        ...{ 'onReady': {} },
        roomId: (__VLS_ctx.roomId),
    }));
    const __VLS_1 = __VLS_0({
        ...{ 'onReady': {} },
        roomId: (__VLS_ctx.roomId),
    }, ...__VLS_functionalComponentArgsRest(__VLS_0));
    let __VLS_3;
    let __VLS_4;
    let __VLS_5;
    const __VLS_6 = {
        onReady: (__VLS_ctx.onGateReady)
    };
    var __VLS_2;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex min-h-screen flex-col bg-background" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
        ...{ class: "flex items-center justify-between border-b border-border px-3 sm:px-6 py-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.goHome) },
        ...{ class: "text-xl font-bold text-foreground transition-colors hover:text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-primary" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center gap-3" },
    });
    const __VLS_7 = {}.Badge;
    /** @type {[typeof __VLS_components.Badge, typeof __VLS_components.Badge, ]} */ ;
    // @ts-ignore
    const __VLS_8 = __VLS_asFunctionalComponent(__VLS_7, new __VLS_7({
        variant: "outline",
        ...{ class: "font-mono" },
    }));
    const __VLS_9 = __VLS_8({
        variant: "outline",
        ...{ class: "font-mono" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    __VLS_10.slots.default;
    (__VLS_ctx.roomId);
    var __VLS_10;
    if (__VLS_ctx.isDemo) {
        const __VLS_11 = {}.Badge;
        /** @type {[typeof __VLS_components.Badge, typeof __VLS_components.Badge, ]} */ ;
        // @ts-ignore
        const __VLS_12 = __VLS_asFunctionalComponent(__VLS_11, new __VLS_11({
            variant: "secondary",
        }));
        const __VLS_13 = __VLS_12({
            variant: "secondary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_12));
        __VLS_14.slots.default;
        var __VLS_14;
    }
    else {
        const __VLS_15 = {}.Badge;
        /** @type {[typeof __VLS_components.Badge, typeof __VLS_components.Badge, ]} */ ;
        // @ts-ignore
        const __VLS_16 = __VLS_asFunctionalComponent(__VLS_15, new __VLS_15({
            variant: "secondary",
        }));
        const __VLS_17 = __VLS_16({
            variant: "secondary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_16));
        __VLS_18.slots.default;
        (__VLS_ctx.store.users.length);
        var __VLS_18;
    }
    if (__VLS_ctx.isLoading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
            ...{ class: "flex flex-1 items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-foreground-muted" },
        });
    }
    else if (__VLS_ctx.error) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
            ...{ class: "flex flex-1 flex-col items-center justify-center gap-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-destructive" },
        });
        (__VLS_ctx.error);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.goHome) },
            ...{ class: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
            ...{ class: "flex-1 p-3 sm:p-6" },
        });
        const __VLS_19 = {}.TierBoard;
        /** @type {[typeof __VLS_components.TierBoard, ]} */ ;
        // @ts-ignore
        const __VLS_20 = __VLS_asFunctionalComponent(__VLS_19, new __VLS_19({}));
        const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
    }
    if (!__VLS_ctx.isDemo && __VLS_ctx.gateResolved) {
        /** @type {[typeof CollaboratorsPanel, ]} */ ;
        // @ts-ignore
        const __VLS_23 = __VLS_asFunctionalComponent(CollaboratorsPanel, new CollaboratorsPanel({}));
        const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
    }
    if (!__VLS_ctx.isDemo) {
        /** @type {[typeof ChatPanel, ]} */ ;
        // @ts-ignore
        const __VLS_26 = __VLS_asFunctionalComponent(ChatPanel, new ChatPanel({}));
        const __VLS_27 = __VLS_26({}, ...__VLS_functionalComponentArgsRest(__VLS_26));
    }
}
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-background']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['font-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-foreground-muted']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-col']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-destructive']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-primary']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-primary-foreground']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-primary-hover']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['sm:p-6']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TierBoard: TierBoard,
            Badge: Badge,
            ChatPanel: ChatPanel,
            RoomEntryGate: RoomEntryGate,
            CollaboratorsPanel: CollaboratorsPanel,
            store: store,
            roomId: roomId,
            error: error,
            isLoading: isLoading,
            isDemo: isDemo,
            gateResolved: gateResolved,
            onGateReady: onGateReady,
            goHome: goHome,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
