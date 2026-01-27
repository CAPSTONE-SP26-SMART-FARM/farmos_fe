import {
  Activity,
  BarChart3,
  Bell,
  Cloud,
  Leaf,
  Shield,
  Smartphone,
  Stethoscope,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const features = [
  {
    icon: Activity,
    title: "Giám sát IoT Real-time",
    description:
      "Theo dõi nhiệt độ, độ ẩm, NH3, CO2 và các chỉ số môi trường 24/7 với cảm biến thông minh.",
    gradient: "from-emerald-500 to-teal-600",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=1932&auto=format&fit=crop",
    stats: "50+ loại cảm biến",
  },
  {
    icon: Bell,
    title: "Cảnh báo tức thì",
    description:
      "Nhận thông báo ngay khi có bất thường: môi trường vượt ngưỡng, thiết bị lỗi.",
    gradient: "from-amber-500 to-orange-600",
    image:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1974&auto=format&fit=crop",
    stats: "< 5 giây phản hồi",
  },
  {
    icon: Stethoscope,
    title: "Tư vấn chuyên gia",
    description:
      "Kết nối trực tiếp với bác sĩ thú y, chuyên gia nông nghiệp để chẩn đoán kịp thời.",
    gradient: "from-violet-500 to-purple-600",
    image:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=2070&auto=format&fit=crop",
    stats: "100+ chuyên gia",
  },
  {
    icon: BarChart3,
    title: "Báo cáo & Phân tích",
    description:
      "Dashboard trực quan với KPIs, báo cáo tài chính, ROI theo từng mùa vụ.",
    gradient: "from-blue-500 to-indigo-600",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop",
    stats: "20+ loại báo cáo",
  },
  {
    icon: Cloud,
    title: "Dự báo thời tiết",
    description:
      "Tích hợp OpenWeatherMap cung cấp dự báo chính xác để lên kế hoạch canh tác.",
    gradient: "from-sky-500 to-cyan-600",
    image:
      "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?q=80&w=1965&auto=format&fit=crop",
    stats: "Độ chính xác 95%",
  },
  {
    icon: Leaf,
    title: "Quản lý mùa vụ",
    description:
      "Theo dõi giai đoạn sinh trưởng, lịch chăm sóc cho cây trồng và vật nuôi.",
    gradient: "from-green-500 to-emerald-600",
    image:
      "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=2070&auto=format&fit=crop",
    stats: "Quản lý 365 ngày",
  },
  {
    icon: Smartphone,
    title: "Nhật ký hoạt động",
    description:
      "Ghi chép công việc hàng ngày: tưới tiêu, bón phân, cho ăn, kiểm tra sức khỏe.",
    gradient: "from-rose-500 to-pink-600",
    image:
      "https://images.unsplash.com/photo-1512314889357-e157c22f938d?q=80&w=2071&auto=format&fit=crop",
    stats: "Đồng bộ đa thiết bị",
  },
  {
    icon: Shield,
    title: "Quản lý tiêm phòng",
    description:
      "Lập lịch, theo dõi và nhắc nhở tiêm phòng định kỳ cho đàn vật nuôi.",
    gradient: "from-indigo-500 to-violet-600",
    image:
      "https://images.unsplash.com/photo-1584744982491-665216d95f8b?q=80&w=2070&auto=format&fit=crop",
    stats: "Nhắc nhở tự động",
  },
];

function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-green-950 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(34, 197, 94, 0.15) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full"
        >
          <div className="w-full h-full bg-gradient-conic from-green-500/20 via-transparent to-emerald-500/20 blur-3xl" />
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-medium">
              Tính năng mạnh mẽ
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Mọi thứ bạn cần
            <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              trong một nền tảng
            </span>
          </h2>

          <p className="max-w-2xl mx-auto text-green-200/70 text-lg">
            8 tính năng cốt lõi giúp bạn quản lý nông trại hiệu quả hơn 200%
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredIndex === index;
            const isLarge = index === 0 || index === 3;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`group relative rounded-3xl overflow-hidden cursor-pointer ${
                  isLarge ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ${
                      isHovered ? "scale-110" : "scale-100"
                    }`}
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${feature.gradient} mix-blend-multiply opacity-80`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                </div>

                {/* Content */}
                <div
                  className={`relative h-full flex flex-col justify-between ${
                    isLarge ? "p-8 min-h-[400px]" : "p-6 min-h-[240px]"
                  }`}
                >
                  {/* Top */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`${
                        isLarge ? "w-16 h-16" : "w-12 h-12"
                      } rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20`}
                    >
                      <Icon
                        className={`${
                          isLarge ? "w-8 h-8" : "w-6 h-6"
                        } text-white`}
                      />
                    </div>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{
                        opacity: isHovered ? 1 : 0,
                        x: isHovered ? 0 : 10,
                      }}
                      className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                    >
                      <ArrowUpRight className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>

                  {/* Bottom */}
                  <div>
                    <div className="mb-2">
                      <span className="text-xs font-medium text-white/60 bg-white/10 px-2 py-1 rounded-full">
                        {feature.stats}
                      </span>
                    </div>
                    <h3
                      className={`${
                        isLarge ? "text-2xl" : "text-lg"
                      } font-bold text-white mb-2`}
                    >
                      {feature.title}
                    </h3>
                    <p
                      className={`text-white/70 ${
                        isLarge ? "text-base" : "text-sm"
                      } leading-relaxed line-clamp-2`}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div
                  className={`absolute inset-0 rounded-3xl border-2 transition-colors duration-300 ${
                    isHovered ? "border-white/30" : "border-transparent"
                  }`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
