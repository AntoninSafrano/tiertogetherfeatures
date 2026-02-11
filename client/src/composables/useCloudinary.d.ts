export interface UploadResult {
    secure_url: string;
    public_id: string;
    original_filename: string;
}
export declare function useCloudinary(): {
    uploadImage: (file: File) => Promise<string>;
};
