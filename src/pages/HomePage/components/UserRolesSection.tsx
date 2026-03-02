import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ClipboardList,
  ShieldCheck,
  Leaf,
  Stethoscope,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const roles = [
  {
    icon: Building2,
    title: "Owner",
    subtitle: "Chủ đầu tư",
    description:
      "Theo dõi tổng quan KPIs, báo cáo tài chính, phê duyệt ngân sách và giám sát từ xa qua camera.",
    features: [
      "Dashboard tổng quan",
      "Báo cáo tài chính",
      "Quản lý nông trại",
      "Phê duyệt chi phí",
    ],
    gradient: "from-amber-500 to-orange-600",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop",
  },
  {
    icon: ClipboardList,
    title: "Manager",
    subtitle: "Quản lý",
    description:
      "Lập kế hoạch sản xuất, quản lý nhân sự, điều phối hoạt động và tạo báo cáo định kỳ.",
    features: [
      "Quản lý mùa vụ",
      "Phân công công việc",
      "Báo cáo định kỳ",
      "Quản lý chi phí",
    ],
    gradient: "from-blue-500 to-indigo-600",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1974&auto=format&fit=crop",
  },
  {
    icon: ShieldCheck,
    title: "Admin",
    subtitle: "Quản trị nền tảng",
    description:
      "Quản lý gói subscription, duyệt Doctor, cấu hình template IoT và theo dõi hiệu suất xử lý ticket.",
    features: [
      "Package Management",
      "Doctor Approval",
      "IoT Templates",
      "Ticket Analytics",
    ],
    gradient: "from-slate-500 to-gray-700",
    image:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
  },
  {
    icon: Leaf,
    title: "Farmer",
    subtitle: "Nông dân trồng trọt",
    description:
      "Giám sát cảm biến vườn trồng, ghi nhật ký chăm sóc, báo cáo bệnh cây và theo dõi giai đoạn sinh trưởng.",
    features: [
      "Sensor Dashboard",
      "Nhật ký hoạt động",
      "Báo cáo bệnh",
      "Ghi nhận thu hoạch",
    ],
    gradient: "from-green-500 to-emerald-600",
    image:
      "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2071&auto=format&fit=crop",
  },
  {
    icon: Stethoscope,
    title: "Doctor",
    subtitle: "Chuyên gia / Bác sĩ",
    description:
      "Tiếp nhận báo cáo bệnh, chẩn đoán từ xa, kê đơn điều trị và quản lý cẩm nang kiến thức.",
    features: [
      "Chẩn đoán bệnh",
      "Kê đơn thuốc",
      "Lên lịch khám",
      "Quản lý Knowledge Base",
    ],
    gradient: "from-violet-500 to-purple-600",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop",
  },
];

function UserRolesSection() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <section className="py-24 bg-gradient-to-b from-green-50 to-green-100 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-200 rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-700 text-sm font-medium">
              Đa dạng vai trò
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-900 mb-6">
            Thiết kế cho
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              mọi người dùng
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-green-800 text-lg">
            Giao diện và tính năng tùy biến phù hợp với từng vị trí trong nông
            trại
          </p>
        </motion.div>

        {/* Interactive Tabs + Content */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Role Tabs */}
          <div className="space-y-4">
            {roles.map((role, index) => {
              const Icon = role.icon;
              const isActive = activeIndex === index;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveIndex(index)}
                  className={`group relative p-5 rounded-2xl cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "bg-white shadow-xl shadow-green-500/10 border-2 border-green-500"
                      : "bg-white/50 hover:bg-white border-2 border-transparent hover:border-green-300"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${role.gradient} flex items-center justify-center shadow-lg transition-transform duration-300 ${
                        isActive ? "scale-110" : "group-hover:scale-105"
                      }`}
                    >
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-green-900">
                          {role.title}
                        </h3>
                        <span className="text-sm text-green-600">
                          {role.subtitle}
                        </span>
                      </div>
                      <p
                        className={`text-sm mt-1 transition-all duration-300 ${
                          isActive
                            ? "text-green-700 max-h-20 opacity-100"
                            : "text-green-600 max-h-0 opacity-0 overflow-hidden"
                        }`}
                      >
                        {role.description}
                      </p>
                    </div>
                    <ArrowRight
                      className={`w-5 h-5 transition-all duration-300 ${
                        isActive
                          ? "text-green-500 translate-x-0 opacity-100"
                          : "text-green-500 -translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                      }`}
                    />
                  </div>

                  {/* Features - Show when active */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isActive ? "auto" : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-green-200">
                      {role.features.map((feature, idx) => (
                        <Badge
                          key={idx}
                          className={`bg-gradient-to-r ${role.gradient} text-white border-0 text-xs`}
                        >
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Preview Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="sticky top-8"
          >
            <div className="relative">
              {/* Main Image Card */}
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="relative rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="aspect-[4/3]">
                  <img
                    src={roles[activeIndex].image}
                    alt={roles[activeIndex].title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 bg-gradient-to-t ${roles[activeIndex].gradient} mix-blend-multiply opacity-40`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${roles[activeIndex].gradient} flex items-center justify-center`}
                      >
                        {(() => {
                          const Icon = roles[activeIndex].icon;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">
                          {roles[activeIndex].title}
                        </h3>
                        <p className="text-white/70">
                          {roles[activeIndex].subtitle}
                        </p>
                      </div>
                    </div>
                    <p className="text-white/90 text-lg">
                      {roles[activeIndex].description}
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute -right-4 top-8 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {roles[activeIndex].features.length}
                  </div>
                  <div className="text-xs text-green-600">Tính năng</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default UserRolesSection;
