# AI Atlas — Web tự học AI

Trang học AI bằng tiếng Việt, gồm 15 chủ đề và 45 bài học biên soạn. Mỗi bài đi theo mạch: khái niệm → cơ chế → quy trình của kỹ sư AI → ví dụ → thực hành có sản phẩm và tiêu chí tự kiểm.

## Tính năng

- Giao diện sáng xanh lá nhạt và vàng kem; có nút đổi sang giao diện tối.
- Lộ trình 5 chặng, 15 chủ đề, 45 bài; thuật ngữ chuyên ngành và phần quan trọng được đánh dấu.
- Tìm kiếm bài học; bài thực hành có prompt mẫu dùng được với nhiều model.
- Tiến độ và ghi chú lưu trong `localStorage`; có thể xuất/nhập JSON để sao lưu.
- Danh mục PDF và video gốc theo từng section. Website không chứa bản sao tài liệu khóa học hoặc video.

## Đưa lên GitHub Pages

1. Giải nén gói **AI-Atlas-GitHub-Pages.zip** và đưa các tệp `index.html`, `styles.css`, `app.js`, `course-data.js`, `engineering.js`, `glossary.js`, `resources.js`, `.nojekyll` vào **thư mục gốc** của repository. Giữ các tệp cùng cấp.
2. Vào repository → **Settings** → **Pages** → **Build and deployment**. Chọn **Deploy from a branch**, nhánh `main`, thư mục `/(root)`, rồi **Save**.
3. Đợi GitHub Pages hoàn tất triển khai và mở đường dẫn được GitHub hiển thị trong mục Pages.

Tài liệu chính thức: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

Trang tĩnh không cần `npm`, khóa API hoặc máy chủ. Có thể mở `index.html` trực tiếp để xem, nhưng nên dùng máy chủ tĩnh khi phát triển.

## Liên kết Google Drive riêng

Không đưa **ai-atlas-private-drive-links.json** hoặc gói tài liệu khóa học vào repository. GitHub Pages có thể truy cập công khai, kể cả khi kho mã nguồn của bạn là riêng tư tùy gói GitHub.

Trong web, mở một chủ đề → **Tài liệu gốc** → **Nhập tệp liên kết riêng** và chọn tệp JSON được giao riêng. Trang lưu danh mục liên kết trong trình duyệt của chính thiết bị đó. Sau khi nhập, các mục PDF và video sẽ mở trên Google Drive theo quyền truy cập hiện có. Bạn phải nhập lại khi dùng thiết bị hoặc trình duyệt khác; thao tác **Xuất tiến độ** không bao gồm liên kết Drive.

## Chỉnh sửa nội dung

- `course-data.js`: nội dung 45 bài học.
- `engineering.js`: quy trình 5 bước chuyên biệt cho từng chủ đề.
- `glossary.js`: thuật ngữ và định nghĩa.
- `resources.js`: tên tài liệu và bài giảng, không chứa URL riêng.
- `styles.css`: màu, kiểu chữ và bố cục.
- `app.js`: điều hướng, tìm kiếm, tiến độ và ghi chú.

Nội dung bài học là bản biên soạn để thực hành cá nhân. Hãy đối chiếu tài liệu gốc khi dùng công thức, số liệu hoặc tính năng sản phẩm có thể thay đổi.
