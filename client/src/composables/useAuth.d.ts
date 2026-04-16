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
    authError: Readonly<import("vue").Ref<string | null, string | null>>;
    isAuthenticated: import("vue").ComputedRef<boolean>;
    fetchUser: () => Promise<void>;
    loginWithGoogle: () => void;
    loginWithEmail: (email: string, password: string) => Promise<{
        success: boolean;
        needsVerification?: boolean;
    }>;
    signup: (email: string, password: string, displayName: string) => Promise<{
        success: boolean;
    }>;
    verifyEmail: (email: string, code: string) => Promise<{
        success: boolean;
    }>;
    resendVerification: (email: string) => Promise<{
        success: boolean;
    }>;
    forgotPassword: (email: string) => Promise<{
        success: boolean;
    }>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<{
        success: boolean;
    }>;
    logout: () => Promise<void>;
};
