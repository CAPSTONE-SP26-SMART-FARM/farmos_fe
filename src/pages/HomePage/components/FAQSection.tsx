import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router";
import { MessageCircle, HelpCircle, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

const faqs = [
  {
    question: "FarmOS có hỗ trợ những loại cảm biến nào?",
    answer:
      "FarmOS hỗ trợ hầu hết các loại cảm biến IoT phổ biến trên thị trường: cảm biến nhiệt độ, độ ẩm đất, độ ẩm không khí, ánh sáng, pH đất, EC đất, mực nước, CO2, và nhiều loại khác. Chúng tôi cũng hỗ trợ tích hợp camera giám sát và thiết bị điều khiển từ xa.",
    category: "Kỹ thuật",
  },
  {
    question: "Mất bao lâu để thiết lập hệ thống?",
    answer:
      "Việc thiết lập tài khoản và kết nối cảm biến cơ bản chỉ mất khoảng 15-30 phút. Đối với hệ thống lớn hơn, đội ngũ kỹ thuật của chúng tôi sẽ hỗ trợ cài đặt và cấu hình trong vòng 1-3 ngày làm việc.",
    category: "Bắt đầu",
  },
  {
    question: "Dữ liệu của tôi có được bảo mật không?",
    answer:
      "Chắc chắn! FarmOS sử dụng mã hóa end-to-end cho toàn bộ dữ liệu. Dữ liệu được lưu trữ trên server với tiêu chuẩn bảo mật ISO 27001. Chúng tôi không chia sẻ dữ liệu của bạn với bất kỳ bên thứ ba nào mà không có sự đồng ý.",
    category: "Bảo mật",
  },
  {
    question: "FarmOS có hoạt động offline không?",
    answer:
      "Có, ứng dụng mobile của FarmOS có khả năng hoạt động offline. Dữ liệu sẽ được lưu trữ cục bộ và tự động đồng bộ khi có kết nối internet trở lại. Các cảm biến cũng có bộ nhớ đệm để lưu dữ liệu trong trường hợp mất kết nối.",
    category: "Kỹ thuật",
  },
  {
    question: "Làm thế nào để được tư vấn từ chuyên gia?",
    answer:
      "Với gói Professional trở lên, bạn có thể đặt lịch tư vấn trực tiếp với các bác sĩ thú y và chuyên gia nông nghiệp qua hệ thống. Chuyên gia sẽ xem xét dữ liệu từ cảm biến của bạn và đưa ra khuyến nghị cụ thể.",
    category: "Dịch vụ",
  },
  {
    question: "Có thể hủy gói dịch vụ bất cứ lúc nào không?",
    answer:
      "Có, bạn có thể hủy hoặc thay đổi gói dịch vụ bất cứ lúc nào mà không mất phí. Dữ liệu của bạn sẽ được lưu trữ trong 30 ngày sau khi hủy để bạn có thể xuất hoặc backup.",
    category: "Thanh toán",
  },
  {
    question: "FarmOS có hỗ trợ tiếng Việt không?",
    answer:
      "Có! FarmOS được phát triển bởi đội ngũ Việt Nam nên giao diện và hỗ trợ khách hàng hoàn toàn bằng tiếng Việt. Chúng tôi cũng đang mở rộng hỗ trợ thêm các ngôn ngữ khác.",
    category: "Tổng quát",
  },
  {
    question: "Có API để tích hợp với hệ thống khác không?",
    answer:
      "Với gói Enterprise, chúng tôi cung cấp REST API đầy đủ để tích hợp FarmOS với các hệ thống ERP, CRM, hoặc phần mềm quản lý của bạn. Documentation chi tiết sẽ được cung cấp cùng với technical support.",
    category: "Kỹ thuật",
  },
];

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Trò chuyện trực tiếp",
    action: "Chat ngay",
    gradient: "from-green-500 to-emerald-600",
  },
  {
    icon: Mail,
    title: "Email",
    description: "support@farmos.vn",
    action: "Gửi email",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    icon: Phone,
    title: "Hotline",
    description: "1900-xxxx",
    action: "Gọi ngay",
    gradient: "from-violet-500 to-purple-600",
  },
];

function FAQSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-green-950 via-green-900 to-green-950 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
          >
            <HelpCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-400 text-sm font-medium">
              Hỗ trợ 24/7
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Câu hỏi
            <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              thường gặp
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-slate-400 text-lg">
            Tìm câu trả lời nhanh cho những thắc mắc phổ biến về FarmOS
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FAQ Accordion */}
          <div className="lg:col-span-2">
            <Accordion
              type="single"
              collapsible
              className="space-y-4"
            >
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AccordionItem
                    value={`item-${index}`}
                    className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 px-6 hover:border-green-500/30 transition-colors group"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-green-400 hover:no-underline py-6 cursor-pointer group-hover:text-green-400 transition-colors">
                      <div className="flex items-start gap-4 pr-4">
                        <span className="text-xs font-medium text-green-400/70 bg-green-500/10 px-2 py-1 rounded-md shrink-0">
                          {faq.category}
                        </span>
                        <span className="font-medium">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-400 pb-6 leading-relaxed pl-0 lg:pl-20">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>

          {/* Contact Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-1"
          >
            <div className="sticky top-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-2">
                Vẫn còn thắc mắc?
              </h3>
              <p className="text-slate-400 text-sm mb-8">
                Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn
              </p>

              <div className="space-y-4">
                {contactOptions.map((option, index) => {
                  const Icon = option.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 cursor-pointer transition-all"
                    >
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium">
                          {option.title}
                        </h4>
                        <p className="text-slate-500 text-sm">
                          {option.description}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-6 rounded-2xl font-semibold hover:shadow-lg hover:shadow-green-500/30 transition-all"
                >
                  <Link
                    to="/contact"
                    className="flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Liên hệ hỗ trợ
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
