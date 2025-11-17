# Requirements Document

## Introduction

Cải thiện trải nghiệm người dùng (UX) cho HomeScreen trong ứng dụng pet adoption bằng cách thêm các tính năng UI/UX hiện đại như skeleton loading, pull-to-refresh, animations, và status indicators. Mục tiêu là làm cho giao diện mượt mà hơn, phản hồi nhanh hơn, và thân thiện hơn với người dùng.

## Glossary

- **HomeScreen**: Màn hình chính hiển thị danh sách pet cards có thể swipe
- **Pet Card**: Component hiển thị thông tin về một pet (ảnh, tên, tuổi, khoảng cách)
- **Skeleton Loading**: Placeholder animation hiển thị trong khi dữ liệu đang được tải
- **Pull-to-Refresh**: Tính năng cho phép người dùng kéo màn hình xuống để refresh dữ liệu
- **Haptic Feedback**: Rung nhẹ thiết bị khi người dùng tương tác
- **Status Badge**: Nhãn hiển thị trạng thái của pet (Online, New, etc.)

## Requirements

### Requirement 1

**User Story:** Là người dùng, tôi muốn thấy skeleton loading thay vì spinner khi đang tải danh sách pets, để trải nghiệm mượt mà và biết được layout sẽ như thế nào

#### Acceptance Criteria

1. WHEN HomeScreen đang tải dữ liệu pets lần đầu, THE HomeScreen SHALL hiển thị 3-5 skeleton pet cards với animation shimmer
2. WHEN dữ liệu pets được tải xong, THE HomeScreen SHALL thay thế skeleton cards bằng pet cards thật với fade-in animation
3. THE skeleton cards SHALL có cùng kích thước và layout như pet cards thật
4. THE skeleton loading animation SHALL có hiệu ứng shimmer từ trái sang phải với thời gian 1.5 giây

### Requirement 2

**User Story:** Là người dùng, tôi muốn kéo màn hình xuống để refresh danh sách pets, để có thể xem pets mới mà không cần reload app

#### Acceptance Criteria

1. WHEN người dùng kéo HomeScreen xuống từ đầu màn hình, THE HomeScreen SHALL hiển thị pull-to-refresh indicator
2. WHEN người dùng thả tay sau khi kéo đủ khoảng cách, THE HomeScreen SHALL gọi API để tải lại danh sách pets
3. WHILE đang refresh, THE HomeScreen SHALL hiển thị loading indicator ở đầu màn hình
4. WHEN refresh hoàn tất, THE HomeScreen SHALL ẩn loading indicator và hiển thị danh sách pets mới với animation

### Requirement 3

**User Story:** Là người dùng, tôi muốn thấy animations mượt mà khi swipe/like/pass pet cards, để trải nghiệm tương tác cảm thấy tự nhiên và responsive

#### Acceptance Criteria

1. WHEN người dùng swipe pet card sang trái, THE pet card SHALL có animation trượt ra ngoài màn hình với rotation nhẹ
2. WHEN người dùng swipe pet card sang phải, THE pet card SHALL có animation trượt ra ngoài màn hình với rotation nhẹ
3. WHEN người dùng nhấn nút Like/Pass, THE pet card SHALL có animation scale và fade out trước khi biến mất
4. WHEN animation hoàn tất, THE HomeScreen SHALL hiển thị pet card tiếp theo với fade-in animation
5. THE animations SHALL có thời gian từ 300-500ms để cảm thấy mượt mà

### Requirement 4

**User Story:** Là người dùng, tôi muốn cảm nhận haptic feedback khi tương tác với pet cards, để có phản hồi xúc giác khi thực hiện hành động

#### Acceptance Criteria

1. WHEN người dùng nhấn nút Like, THE HomeScreen SHALL kích hoạt haptic feedback với cường độ medium
2. WHEN người dùng nhấn nút Pass, THE HomeScreen SHALL kích hoạt haptic feedback với cường độ light
3. WHEN người dùng nhấn nút Super Like, THE HomeScreen SHALL kích hoạt haptic feedback với cường độ heavy
4. WHEN người dùng swipe card thành công, THE HomeScreen SHALL kích hoạt haptic feedback với cường độ light

### Requirement 5

**User Story:** Là người dùng, tôi muốn thấy status badges trên pet cards (Online, New, Distance), để biết thêm thông tin về pets một cách trực quan

#### Acceptance Criteria

1. WHEN một pet đang online, THE pet card SHALL hiển thị badge "Online" màu xanh lá ở góc trên bên phải
2. WHEN một pet là mới (được tạo trong vòng 7 ngày), THE pet card SHALL hiển thị badge "New" màu cam ở góc trên bên trái
3. THE pet card SHALL hiển thị distance indicator với icon location và khoảng cách tính bằng km
4. THE status badges SHALL có background semi-transparent và border radius để dễ nhìn trên ảnh

### Requirement 6

**User Story:** Là người dùng, tôi muốn thấy empty state đẹp mắt với animation khi hết pets, để biết rằng không còn pets nào và có hướng dẫn tiếp theo

#### Acceptance Criteria

1. WHEN danh sách pets trống, THE HomeScreen SHALL hiển thị empty state với illustration hoặc icon
2. THE empty state SHALL có tiêu đề và mô tả rõ ràng về tình trạng
3. THE empty state SHALL có nút "Refresh" hoặc "Adjust Filters" để người dùng có thể thực hiện hành động
4. THE empty state SHALL có fade-in animation khi xuất hiện
