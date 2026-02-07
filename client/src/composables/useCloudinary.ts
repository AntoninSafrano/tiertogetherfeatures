const CLOUD_NAME = 'dnbnhjbyy'
const UPLOAD_PRESET = 'tiertogether_preset'
const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

export interface UploadResult {
  secure_url: string
  public_id: string
  original_filename: string
}

export function useCloudinary() {
  async function uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)

    const response = await fetch(UPLOAD_URL, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Upload failed (${response.status}): ${errorBody}`)
    }

    const data: UploadResult = await response.json()
    return data.secure_url
  }

  return { uploadImage }
}
