export interface AuthUser {
    id: string;
    displayName: string;
    avatar: string;
    email: string;
}
export declare function useAuth(): {
    user: Readonly<import("vue").Ref<{
        readonly id: string;
        readonly displayName: string;
        readonly avatar: string;
        readonly email: string;
    } | null, {
        readonly id: string;
        readonly displayName: string;
        readonly avatar: string;
        readonly email: string;
    } | null>>;
    isLoading: Readonly<import("vue").Ref<boolean, boolean>>;
    isAuthenticated: Readonly<import("vue").Ref<boolean, boolean>>;
    fetchUser: () => Promise<void>;
    loginWithGoogle: () => void;
    logout: () => Promise<void>;
};
