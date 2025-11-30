import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "ResourceDetail">;

// Content cho từng loại resource
const resourceContent = {
  terms: {
    title: "Điều khoản dịch vụ",
    icon: "document-text",
    gradient: ["#FF6EA7", "#FF9BC0"],
    sections: [
      {
        title: "1. Chấp nhận điều khoản",
        content:
          "Bằng cách truy cập và sử dụng Pawnder, bạn chấp nhận và đồng ý bị ràng buộc bởi các điều khoản và quy định của thỏa thuận này. Nếu bạn không đồng ý tuân thủ các điều khoản trên, vui lòng không sử dụng dịch vụ này.",
      },
      {
        title: "2. Giấy phép sử dụng",
        content:
          "Bạn được cấp phép tạm thời sử dụng Pawnder chỉ cho mục đích cá nhân, phi thương mại. Đây là việc cấp giấy phép, không phải chuyển nhượng quyền sở hữu.",
      },
      {
        title: "3. Tài khoản người dùng",
        content:
          "Khi bạn tạo tài khoản với chúng tôi, bạn phải cung cấp thông tin chính xác, đầy đủ. Bạn chịu trách nhiệm bảo vệ mật khẩu và cho tất cả các hoạt động xảy ra dưới tài khoản của bạn.",
      },
      {
        title: "4. Hướng dẫn hồ sơ thú cưng",
        content:
          "Tất cả hồ sơ thú cưng phải chứa thông tin chính xác. Việc cung cấp thông tin sai về tuổi, giống hoặc tình trạng sức khỏe của thú cưng bị cấm. Ảnh phải là ảnh thú cưng thực tế của bạn.",
      },
      {
        title: "5. Sử dụng bị cấm",
        content:
          "Bạn không được sử dụng Pawnder cho bất kỳ mục đích bất hợp pháp hoặc trái phép nào. Bạn không được vi phạm bất kỳ luật pháp nào trong khu vực pháp lý của bạn khi sử dụng Dịch vụ.",
      },
      {
        title: "6. Chấm dứt",
        content:
          "Chúng tôi có thể chấm dứt hoặc đình chỉ tài khoản của bạn ngay lập tức, không cần thông báo trước hoặc trách nhiệm, vì bất kỳ lý do nào, bao gồm nhưng không giới hạn nếu bạn vi phạm Điều khoản.",
      },
    ],
  },
  privacy: {
    title: "Chính sách bảo mật",
    icon: "shield-checkmark",
    gradient: ["#9C27B0", "#BA68C8"],
    sections: [
      {
        title: "1. Thông tin chúng tôi thu thập",
        content:
          "Chúng tôi thu thập thông tin bạn cung cấp trực tiếp cho chúng tôi, bao gồm tên, địa chỉ email, số điện thoại và thông tin thú cưng của bạn (tên, giống, tuổi, ảnh, đặc điểm tính cách).",
      },
      {
        title: "2. Cách chúng tôi sử dụng thông tin của bạn",
        content:
          "Chúng tôi sử dụng thông tin để cung cấp, duy trì và cải thiện dịch vụ của chúng tôi, để giao tiếp với bạn và để kết nối bạn với các chủ thú cưng khác.",
      },
      {
        title: "3. Chia sẻ thông tin",
        content:
          "Chúng tôi không bán thông tin cá nhân của bạn. Chúng tôi có thể chia sẻ thông tin của bạn với người dùng khác cho mục đích kết nối và với các nhà cung cấp dịch vụ hỗ trợ chúng tôi vận hành nền tảng.",
      },
      {
        title: "4. Bảo mật dữ liệu",
        content:
          "Chúng tôi triển khai các biện pháp bảo mật phù hợp để bảo vệ thông tin cá nhân của bạn. Tuy nhiên, không có phương thức truyền tải nào qua Internet là 100% an toàn.",
      },
      {
        title: "5. Quyền của bạn",
        content:
          "Bạn có quyền truy cập, cập nhật hoặc xóa thông tin cá nhân của mình bất cứ lúc nào thông qua cài đặt tài khoản hoặc bằng cách liên hệ với chúng tôi.",
      },
      {
        title: "6. Cookies và theo dõi",
        content:
          "Chúng tôi sử dụng cookies và các công nghệ theo dõi tương tự để theo dõi hoạt động trên dịch vụ của chúng tôi và lưu trữ một số thông tin để cải thiện trải nghiệm người dùng.",
      },
    ],
  },
  community: {
    title: "Hướng dẫn cộng đồng",
    icon: "people",
    gradient: ["#FF9800", "#FFB74D"],
    sections: [
      {
        title: "1. Tôn trọng",
        content:
          "Đối xử với tất cả thành viên cộng đồng bằng sự tôn trọng và tử tế. Hành vi quấy rối, bắt nạt hoặc phân biệt đối xử sẽ không được dung thứ.",
      },
      {
        title: "2. Trung thực",
        content:
          "Hãy trung thực về bản thân và thú cưng của bạn. Việc cung cấp thông tin sai làm suy yếu niềm tin trong cộng đồng và có thể dẫn đến đình chỉ tài khoản.",
      },
      {
        title: "3. Nội dung phù hợp",
        content:
          "Tất cả ảnh và nội dung phải phù hợp và liên quan đến hẹn hò thú cưng. Không cho phép nội dung khiêu dâm, bạo lực hoặc xúc phạm.",
      },
      {
        title: "4. An toàn trước tiên",
        content:
          "Luôn ưu tiên an toàn khi sắp xếp các cuộc gặp gỡ. Gặp ở nơi công cộng, đủ ánh sáng và thông báo cho người bạn tin cậy về kế hoạch của bạn.",
      },
      {
        title: "5. Báo cáo vấn đề",
        content:
          "Nếu bạn gặp phải hành vi không phù hợp, hoạt động đáng ngờ hoặc lo ngại về an toàn, vui lòng báo cáo ngay lập tức qua ứng dụng của chúng tôi.",
      },
      {
        title: "6. Không sử dụng thương mại",
        content:
          "Pawnder chỉ dành cho mục đích cá nhân. Quảng cáo, bán sản phẩm hoặc quảng bá dịch vụ không được phép.",
      },
    ],
  },
  guide: {
    title: "Hướng dẫn người dùng",
    icon: "book",
    gradient: ["#4CAF50", "#81C784"],
    sections: [
      {
        title: "1. Bắt đầu",
        content:
          "Tạo tài khoản của bạn, thêm hồ sơ thú cưng với ảnh và thông tin, và bắt đầu khám phá các thú cưng khác trong khu vực của bạn.",
      },
      {
        title: "2. Tạo hồ sơ tuyệt vời",
        content:
          "Sử dụng ảnh rõ ràng, gần đây của thú cưng. Viết tiểu sử hấp dẫn làm nổi bật tính cách của thú cưng. Hãy trung thực về tuổi, giống và tính khí.",
      },
      {
        title: "3. Cách kết nối hoạt động",
        content:
          "Vuốt sang phải để thích một thú cưng, sang trái để bỏ qua. Khi cả hai người dùng đều thích nhau, đó là một kết nối! Sau đó bạn có thể bắt đầu trò chuyện và sắp xếp các buổi gặp gỡ.",
      },
      {
        title: "4. Sử dụng bộ lọc",
        content:
          "Đặt sở thích của bạn cho giống, độ tuổi và khoảng cách. Thành viên Premium được truy cập các bộ lọc nâng cao.",
      },
      {
        title: "5. Tin nhắn & Trò chuyện",
        content:
          "Sau khi kết nối, bạn có thể trò chuyện trong ứng dụng. Bạn cũng có thể sử dụng chat AI để nhận lời khuyên chăm sóc thú cưng và mẹo bất cứ lúc nào.",
      },
      {
        title: "6. Tính năng Premium",
        content:
          "Nâng cấp lên Premium để có lượt thích không giới hạn, xem ai đã thích bạn, bộ lọc nâng cao và hỗ trợ ưu tiên.",
      },
    ],
  },
  safety: {
    title: "Mẹo an toàn",
    icon: "bulb",
    gradient: ["#2196F3", "#64B5F6"],
    sections: [
      {
        title: "1. Xác minh hồ sơ",
        content:
          "Dành thời gian để xác minh tính xác thực của hồ sơ trước khi gặp. Tìm các hồ sơ đầy đủ với nhiều ảnh và thông tin chi tiết.",
      },
      {
        title: "2. Gặp gỡ công cộng",
        content:
          "Luôn gặp ở nơi công cộng, đủ ánh sáng cho những lần gặp đầu tiên. Công viên thú cưng hoặc quán cà phê thân thiện với thú cưng là địa điểm lý tưởng.",
      },
      {
        title: "3. Thông báo cho ai đó",
        content:
          "Thông báo cho bạn bè hoặc thành viên gia đình về kế hoạch gặp gỡ của bạn, bao gồm địa điểm, thời gian và người bạn đang gặp.",
      },
      {
        title: "4. Tin vào bản năng",
        content:
          "Nếu có điều gì đó cảm thấy không ổn, hãy tin vào linh cảm của bạn. Bạn không bao giờ bị bắt buộc phải tiếp tục cuộc trò chuyện hoặc cuộc gặp nếu bạn cảm thấy không thoải mái.",
      },
      {
        title: "5. Bảo vệ thông tin cá nhân",
        content:
          "Đừng chia sẻ thông tin nhạy cảm như địa chỉ nhà, chi tiết tài chính hoặc dữ liệu cá nhân khác quá sớm.",
      },
      {
        title: "6. An toàn cho thú cưng",
        content:
          "Đảm bảo cả hai thú cưng đều đã được tiêm phòng và khỏe mạnh trước khi sắp xếp các buổi gặp gỡ. Bắt đầu với các tương tác có giám sát ở lãnh thổ trung lập.",
      },
    ],
  },
  about: {
    title: "Về Pawnder",
    icon: "information-circle",
    gradient: ["#607D8B", "#90A4AE"],
    sections: [
      {
        title: "Sứ mệnh của chúng tôi",
        content:
          "Pawnder được tạo ra để giúp chủ sở hữu mèo kết nối và tìm bạn đồng hành hoàn hảo cho những người bạn lông xù của họ. Chúng tôi tin rằng mọi chú mèo đều xứng đáng có bạn đồng hành và tương tác xã hội.",
      },
      {
        title: "Câu chuyện của chúng tôi",
        content:
          "Được thành lập vào năm 2024, Pawnder bắt đầu như một ý tưởng đơn giản: điều gì sẽ xảy ra nếu chúng ta có thể giúp mèo kết bạn giống như chủ của chúng? Ngày nay, chúng tôi tự hào phục vụ hàng nghìn chủ sở hữu mèo trên toàn thế giới.",
      },
      {
        title: "Giá trị của chúng tôi",
        content:
          "An toàn, xác thực và cộng đồng là trọng tâm của mọi thứ chúng tôi làm. Chúng tôi cam kết tạo ra một môi trường tích cực, đáng tin cậy cho tất cả những người yêu mèo.",
      },
      {
        title: "Đội ngũ của chúng tôi",
        content:
          "Chúng tôi là một đội ngũ những người yêu mèo đam mê, nhà phát triển và nhà thiết kế làm việc cùng nhau để tạo ra trải nghiệm hẹn hò mèo tốt nhất có thể.",
      },
      {
        title: "Liên hệ với chúng tôi",
        content:
          "Có câu hỏi hoặc phản hồi? Chúng tôi rất muốn nghe từ bạn!\n\nEmail: support@pawnder.com\nĐiện thoại: +84 999 999 999\nĐịa chỉ: Hà Nội, Việt Nam",
      },
      {
        title: "Phiên bản",
        content:
          "Pawnder v1.0.0\n© 2024 Pawnder. Bảo lưu mọi quyền.\n\nĐược tạo với ❤️ cho mèo ở mọi nơi.",
      },
    ],
  },
};

const ResourceDetailScreen = ({ navigation, route }: Props) => {
  const { type } = route.params;
  const resource = resourceContent[type as keyof typeof resourceContent];

  if (!resource) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={resource.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton}>
            <Icon name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerContent}>
          <View style={styles.iconBox}>
            <Icon name={resource.icon} size={40} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>{resource.title}</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {resource.sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    alignItems: "center",
  },
  iconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 20,
    marginBottom: 16,
    ...shadows.small,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: colors.textMedium,
    lineHeight: 24,
  },
});

export default ResourceDetailScreen;

