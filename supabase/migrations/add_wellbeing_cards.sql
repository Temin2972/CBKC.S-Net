-- Create wellbeing_cards table for storing wellbeing message cards
CREATE TABLE IF NOT EXISTS wellbeing_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200),
  content TEXT NOT NULL,
  author VARCHAR(100),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create index for faster queries
CREATE INDEX idx_wellbeing_cards_active ON wellbeing_cards(is_active) WHERE is_active = true;
CREATE INDEX idx_wellbeing_cards_created_at ON wellbeing_cards(created_at DESC);

-- RLS policies
ALTER TABLE wellbeing_cards ENABLE ROW LEVEL SECURITY;

-- Everyone can read active cards
CREATE POLICY "Anyone can read active cards"
ON wellbeing_cards FOR SELECT
USING (is_active = true);

-- Counselors and admins can insert cards
CREATE POLICY "Counselors can create cards"
ON wellbeing_cards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('counselor', 'admin')
  )
);

-- Counselors can update their own cards, admins can update any
CREATE POLICY "Counselors can update own cards"
ON wellbeing_cards FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Only admins can delete cards
CREATE POLICY "Admins can delete cards"
ON wellbeing_cards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Insert some initial wellbeing cards
INSERT INTO wellbeing_cards (title, content, author, created_by) VALUES
('Mỗi ngày là một cơ hội mới', 'Bạn có biết không? Mỗi ngày là một cơ hội mới để bắt đầu lại. Dù hôm qua có thế nào, hôm nay bạn vẫn có quyền chọn cách mình muốn sống. Hãy nhớ rằng, việc chăm sóc sức khỏe tinh thần không phải là điều xa xỉ - đó là điều cần thiết. Khi bạn cảm thấy quá tải, hãy dừng lại một chút. Hít thở sâu. Nhắm mắt lại và hỏi bản thân: "Điều gì thực sự quan trọng với mình ngay bây giờ?" Đôi khi, câu trả lời đơn giản chỉ là: nghỉ ngơi.', 'S-Net', NULL),
('Điểm số không định nghĩa bạn', 'Áp lực học tập có thể khiến bạn cảm thấy như đang gánh cả thế giới trên vai. Nhưng hãy nhớ rằng, điểm số không định nghĩa giá trị của bạn. Bạn là một con người với rất nhiều phẩm chất tuyệt vời - sự tử tế, lòng trắc ẩn, khả năng yêu thương và được yêu thương. Những điều này không ai có thể đo đếm bằng điểm số. Hãy cố gắng hết mình, nhưng cũng hãy nhẹ nhàng với chính mình. Bạn đang làm tốt lắm rồi!', 'S-Net', NULL),
('Bạn không hề cô đơn', 'Cảm giác cô đơn là điều mà ai cũng từng trải qua. Nếu bạn đang cảm thấy như vậy, hãy biết rằng bạn không hề một mình. Có rất nhiều người quan tâm đến bạn - có thể là gia đình, bạn bè, thầy cô, hoặc ngay cả những người bạn chưa từng gặp. Đừng ngại ngần chia sẻ cảm xúc của mình. Đôi khi, chỉ cần nói ra những gì bạn đang cảm thấy cũng đủ làm cho mọi thứ nhẹ nhàng hơn rất nhiều.', 'S-Net', NULL),
('Thất bại chỉ là dấu phẩy', 'Thất bại không phải là dấu chấm hết - đó là dấu phẩy trong câu chuyện cuộc đời bạn. Mỗi lần vấp ngã đều dạy cho chúng ta điều gì đó quý giá. Thomas Edison đã thử nghiệm hàng nghìn lần trước khi phát minh ra bóng đèn. J.K. Rowling bị từ chối bởi 12 nhà xuất bản trước khi Harry Potter ra đời. Nếu bạn đang trải qua khó khăn, hãy nhớ: đây chỉ là một chương, không phải cả cuốn sách. Câu chuyện của bạn vẫn còn dài.', 'S-Net', NULL),
('Biết ơn mỗi ngày', 'Hãy dành vài phút mỗi ngày để biết ơn những điều nhỏ bé: một ly nước mát vào ngày nóng, nụ cười của ai đó dành cho bạn, hay đơn giản là việc bạn đang tồn tại và có cơ hội trải nghiệm cuộc sống này. Nghiên cứu khoa học đã chứng minh rằng thực hành biết ơn có thể cải thiện đáng kể sức khỏe tinh thần, giảm lo âu và trầm cảm. Hôm nay, bạn biết ơn điều gì?', 'S-Net', NULL);
