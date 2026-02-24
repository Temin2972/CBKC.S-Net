// Vietnamese messages and labels

export const AUTH_MESSAGES = {
  LOGIN_SUCCESS: 'Đăng nhập thành công!',
  LOGIN_ERROR: 'Email hoặc mật khẩu không đúng',
  REGISTER_SUCCESS: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.',
  PASSWORD_MISMATCH: 'Mật khẩu không khớp',
  PASSWORD_TOO_SHORT: 'Mật khẩu phải có ít nhất 6 ký tự',
  PASSWORD_CHANGE_SUCCESS: 'Đổi mật khẩu thành công!',
  PASSWORD_CHANGE_ERROR: 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.',
  CURRENT_PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu hiện tại',
  NEW_PASSWORD_REQUIRED: 'Vui lòng nhập mật khẩu mới',
  LOGGING_IN: 'Đang đăng nhập...',
  REGISTERING: 'Đang đăng ký...',
  LOADING: 'Đang tải...',
}

export const CHAT_MESSAGES = {
  NO_MESSAGES: 'Chưa có tin nhắn nào',
  START_CONVERSATION: 'Hãy bắt đầu cuộc trò chuyện!',
  LOADING_MESSAGES: 'Đang tải tin nhắn...',
  SEND_ERROR: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
  DELETE_CONFIRM: 'Bạn có chắc muốn xóa tin nhắn này?',
  DELETE_ERROR: 'Không thể xóa tin nhắn.',
  MESSAGE_SENT: 'Đã gửi',
  MESSAGE_READ: 'Đã xem',
}

export const COMMUNITY_MESSAGES = {
  IMAGE_TOO_LARGE: 'Kích thước ảnh không được vượt quá 5MB',
  POST_SUCCESS: 'Đăng bài thành công!',
  POST_ERROR: 'Không thể đăng bài. Vui lòng thử lại.',
  DELETE_CONFIRM: 'Bạn có chắc muốn xóa bài viết này?',
  COMMENT_PLACEHOLDER: 'Viết bình luận...',
  POST_PLACEHOLDER: 'Chia sẻ suy nghĩ của bạn...',
}

export const NAVIGATION_LABELS = {
  HOME: 'Trang chủ',
  CHAT: 'Tin nhắn',
  COMMUNITY: 'Cộng đồng',
  BOOKING: 'Đặt lịch',
  LOGOUT: 'Đăng xuất',
}

export const ROLE_LABELS = {
  student: 'Học sinh',
  counselor: 'Tư vấn viên',
  admin: 'Quản trị viên',
}

export const HOME_MESSAGES = {
  GREETING: (name) => `Xin chào, ${name}! 👋`,
  COUNSELOR_SUBTITLE: 'Sẵn sàng hỗ trợ học sinh hôm nay?',
  STUDENT_SUBTITLE: 'Bạn cần hỗ trợ gì hôm nay?',
  NEW_MESSAGES: (count) => `🔔 Bạn có ${count} tin nhắn chưa đọc!`,
  COUNSELOR_WAITING: 'Học sinh đang chờ phản hồi từ bạn',
  STUDENT_WAITING: 'Tư vấn viên đã trả lời bạn',
}

export const FORM_LABELS = {
  EMAIL: 'Email',
  PASSWORD: 'Mật khẩu',
  CONFIRM_PASSWORD: 'Xác nhận mật khẩu',
  FULL_NAME: 'Họ và tên',
  ACCOUNT_TYPE: 'Loại tài khoản',
  USERNAME: 'Tên đăng nhập',
}

export const BUTTON_LABELS = {
  LOGIN: 'Đăng nhập',
  REGISTER: 'Đăng ký',
  SUBMIT: 'Gửi',
  CANCEL: 'Hủy',
  DELETE: 'Xóa',
  SEND: 'Gửi',
}
