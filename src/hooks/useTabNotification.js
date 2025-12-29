import { useEffect, useRef } from 'react'

/**
 * Hook để thay đổi title của tab khi có thông báo mới
 * @param {number} unreadCount - Số thông báo chưa đọc
 * @param {string} defaultTitle - Title mặc định của trang
 */
export function useTabNotification(unreadCount = 0, defaultTitle = 'S-Net by CBKC') {
  const originalTitle = useRef(document.title)
  const intervalRef = useRef(null)
  const isTabVisible = useRef(true)

  useEffect(() => {
    // Lưu title gốc khi component mount
    if (!originalTitle.current) {
      originalTitle.current = defaultTitle
    }

    // Theo dõi khi user chuyển tab
    const handleVisibilityChange = () => {
      isTabVisible.current = !document.hidden
      
      // Nếu user quay lại tab, reset về title gốc
      if (isTabVisible.current && intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
        document.title = originalTitle.current
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      // Reset về title gốc khi component unmount
      document.title = originalTitle.current
    }
  }, [defaultTitle])

  useEffect(() => {
    // Clear interval cũ nếu có
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (unreadCount > 0 && !isTabVisible.current) {
      // Có thông báo và user không đang xem tab
      const notificationTitle = `(${unreadCount}) Thông báo mới!`
      
      // Tạo hiệu ứng nhấp nháy
      let showNotification = true
      intervalRef.current = setInterval(() => {
        document.title = showNotification 
          ? notificationTitle 
          : originalTitle.current
        showNotification = !showNotification
      }, 1500) // Đổi title mỗi 1.5 giây

    } else if (unreadCount > 0 && isTabVisible.current) {
      // Có thông báo nhưng user đang xem tab - chỉ hiển thị số
      document.title = `(${unreadCount}) ${originalTitle.current}`
      
    } else {
      // Không có thông báo hoặc đã đọc hết
      document.title = originalTitle.current
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [unreadCount])
}
