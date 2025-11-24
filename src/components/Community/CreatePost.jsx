import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import DOMPurify from 'dompurify'

export default function CreatePost({ currentUser, onPostCreated }) {
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5000000) {
      alert('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(file)
      setImagePreview(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !image) return

    setUploading(true)
    let imageUrl = null

    if (image) {
      const fileExt = image.name.split('.').pop()
      const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, image)

      if (!uploadError) {
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    const sanitizedContent = DOMPurify.sanitize(content)

    const { error } = await supabase
      .from('posts')
      .insert({
        author_id: currentUser.id,
        content: sanitizedContent,
        image_url: imageUrl
      })

    if (!error) {
      setContent('')
      removeImage()
      onPostCreated?.()
    }

    setUploading(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Chia sẻ câu chuyện của bạn..."
          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows="4"
        />

        {imagePreview && (
          <div className="mt-3 relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full max-h-64 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-4">
          <label className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer">
            <Upload size={18} />
            <span className="text-sm">Thêm ảnh</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={uploading || (!content.trim() && !image)}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
          >
            {uploading ? 'Đang đăng...' : 'Đăng bài'}
          </button>
        </div>
      </form>
    </div>
  )
}
