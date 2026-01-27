import { CheckCircle2, ArrowRight } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    step: "01",
    title: "Cài đặt cảm biến",
    description:
      "Lắp đặt các cảm biến IoT tại vườn trồng và chuồng trại. Dữ liệu được truyền về hệ thống qua MQTT.",
    highlights: [
      "Cảm biến đất, không khí, nước",
      "Camera giám sát",
      "Kết nối không dây",
    ],
    image:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2070&auto=format&fit=crop",
    color: "from-emerald-400 to-green-600",
  },
  {
    step: "02",
    title: "Giám sát real-time",
    description:
      "Theo dõi mọi chỉ số môi trường trên Dashboard. Nhận cảnh báo ngay khi có bất thường.",
    highlights: ["Dashboard trực quan", "Cảnh báo tức thì", "Dữ liệu lịch sử"],
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
    color: "from-cyan-400 to-blue-600",
  },
  {
    step: "03",
    title: "Ghi nhận & Báo cáo",
    description:
      "Nông dân ghi nhật ký hàng ngày. Hệ thống tự động tổng hợp báo cáo tuần/tháng cho quản lý.",
    highlights: ["Nhật ký hoạt động", "Báo cáo tự động", "Theo dõi chi phí"],
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop",
    color: "from-amber-400 to-orange-600",
  },
  {
    step: "04",
    title: "Tư vấn chuyên gia",
    description:
      "Khi phát hiện sự cố, gửi báo cáo kèm ảnh. Bác sĩ chẩn đoán và hướng dẫn điều trị trực tuyến.",
    highlights: ["Chẩn đoán từ xa", "Kê đơn online", "Theo dõi điều trị"],
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
    color: "from-violet-400 to-purple-600",
  },
];

function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section
      ref={containerRef}
      className="py-24 bg-gradient-to-b from-green-950 via-green-900 to-green-950 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">
              Quy trình đơn giản
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            4 bước để
            <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              nông trại thông minh
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-green-200/70 text-lg">
            Bắt đầu hành trình số hóa nông nghiệp chỉ trong vài phút
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-green-800 hidden lg:block">
            <motion.div
              className="w-full bg-gradient-to-b from-green-400 to-emerald-500"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {steps.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Image Card */}
                <div className="flex-1 w-full">
                  <motion.div
                    whileHover={{ scale: 1.02, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="relative group rounded-3xl overflow-hidden"
                  >
                    <div className="aspect-[4/3] relative">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-tr ${item.color} mix-blend-multiply opacity-60`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Step Badge on Image */}
                      <div className="absolute top-6 left-6">
                        <div
                          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}
                        >
                          <span className="text-2xl font-bold text-white">
                            {item.step}
                          </span>
                        </div>
                      </div>

                      {/* Title on Image */}
                      <div className="absolute bottom-6 left-6 right-6">
                        <h3 className="text-2xl lg:text-3xl font-bold text-white">
                          {item.title}
                        </h3>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Center Node */}
                <div className="relative hidden lg:flex flex-col items-center z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, type: "spring" }}
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg shadow-green-500/30`}
                  >
                    <span className="text-white font-bold">{item.step}</span>
                  </motion.div>
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      className="mt-4"
                    >
                      <ArrowRight className="w-5 h-5 text-green-400 rotate-90" />
                    </motion.div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 w-full">
                  <motion.div
                    whileHover={{ x: index % 2 === 1 ? -10 : 10 }}
                    className="bg-green-800/50 backdrop-blur-sm rounded-3xl p-8 border border-green-700/50 hover:border-green-500/30 transition-colors"
                  >
                    <p className="text-green-200 text-lg mb-6 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="space-y-3">
                      {item.highlights.map((highlight, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + idx * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`w-6 h-6 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}
                          >
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-green-200">{highlight}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
