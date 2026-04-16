type __VLS_Props = {
    roomId: string;
};
declare const _default: import("vue").DefineComponent<__VLS_Props, {}, {}, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    ready: (payload: {
        username: string;
        avatar: string;
        isGuest: boolean;
    }) => any;
}, string, import("vue").PublicProps, Readonly<__VLS_Props> & Readonly<{
    onReady?: ((payload: {
        username: string;
        avatar: string;
        isGuest: boolean;
    }) => any) | undefined;
}>, {}, {}, {}, {}, string, import("vue").ComponentProvideOptions, false, {}, any>;
export default _default;
