import { api } from "@/helpers/api"

export const uploadApi = {
  uploadMedia: async (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    
    const response = await api.post("/upload/media", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    
    return response.data
  },

  listMedia: async () => {
    const response = await api.get("/upload/media")
    return response.data
  },

  deleteMedia: async (publicId: string, resourceType: string = 'image') => {
    const response = await api.delete(`/upload/media?public_id=${encodeURIComponent(publicId)}&resource_type=${resourceType}`)
    return response.data
  }
}
