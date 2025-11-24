import PostCard from './PostCard'

export default function PostList({ posts, currentUser, onDelete }) {
  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <p className="text-gray-500 text-xl">Chưa có bài viết nào</p>
        <p className="text-gray-400 text-sm mt-2">Hãy là người đầu tiên chia sẻ!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUser={currentUser}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
