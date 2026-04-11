import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Zap, Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useState } from "react";

const plans = [
  {
    name: "Cơ bản",
    description: "Cho nông trại nhỏ",
    price: "Miễn phí",
    period: "",
    icon: Sparkles,
    features: [
      "1 nông trại",
      "5 cảm biến",
      "Dashboard cơ bản",
      "Báo cáo hàng tuần",
      "Hỗ trợ qua email",
    ],
    cta: "Bắt đầu miễn phí",
    popular: false,
    gradient: "from-amber-600 to-amber-800",
    iconGradient: "from-amber-400 to-amber-600",
  },
  {
    name: "Chuyên nghiệp",
    description: "Cho nông trại vừa",
    price: "2.990.000",
    period: "/tháng",
    icon: Zap,
    features: [
      "3 nông trại",
      "50 cảm biến",
      "Dashboard nâng cao",
      "Tư vấn chuyên gia",
      "Cảnh báo SMS/Push",
      "Báo cáo tài chính",
      "Hỗ trợ ưu tiên",
    ],
    cta: "Dùng thử 14 ngày",
    popular: true,
    gradient: "from-green-500 to-emerald-600",
    iconGradient: "from-green-400 to-emerald-500",
  },
  {
    name: "Doanh nghiệp",
    description: "Cho tập đoàn lớn",
    price: "Liên hệ",
    period: "",
    icon: Building2,
    features: [
      "Không giới hạn nông trại",
      "Không giới hạn cảm biến",
      "Tích hợp API",
      "Đội ngũ chuyên gia riêng",
      "Phát triển tùy chỉnh",
      "SLA 99.9%",
      "Tùy chọn triển khai tại chỗ",
    ],
    cta: "Liên hệ tư vấn",
    popular: false,
    gradient: "from-violet-500 to-purple-600",
    iconGradient: "from-violet-400 to-purple-500",
  },
];

function PricingSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-24 bg-linear-to-b from-green-50 to-green-100 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
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
              Giá cả minh bạch
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-900 mb-6">
            Gói dịch vụ phù hợp
            <span className="block bg-linear-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              mọi quy mô
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-green-800 text-lg">
            Bắt đầu miễn phí, nâng cấp khi cần. Không phí ẩn, hủy bất cứ lúc
            nào.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredIndex === index;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`relative group ${
                  plan.popular ? "md:-mt-8 md:mb-8" : ""
                }`}
              >
                {/* Glow Effect for Popular */}
                {plan.popular && (
                  <div className="absolute -inset-0.5 bg-linear-to-r from-green-500 to-emerald-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition-opacity" />
                )}

                {/* Card */}
                <div
                  className={`relative h-full rounded-3xl p-8 transition-all duration-300 ${
                    plan.popular
                      ? "bg-linear-to-br from-green-900 to-green-800 border-0"
                      : "bg-white border-2 border-green-200 hover:border-green-300"
                  } ${isHovered ? "transform -translate-y-2" : ""}`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-4 left-1/2 -translate-x-1/2"
                    >
                      <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white border-0 px-4 py-1 text-sm shadow-lg">
                        🔥 Phổ biến nhất
                      </Badge>
                    </motion.div>
                  )}

                  {/* Icon */}
                  <div className="mb-6">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-linear-to-br ${plan.iconGradient} flex items-center justify-center shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Plan Info */}
                  <div className="mb-6">
                    <h3
                      className={`text-2xl font-bold mb-1 ${
                        plan.popular ? "text-white" : "text-green-900"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <p
                      className={`text-sm ${
                        plan.popular ? "text-green-200" : "text-green-700"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl lg:text-5xl font-bold ${
                          plan.popular ? "text-white" : "text-green-900"
                        }`}
                      >
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span
                          className={`text-lg ${
                            plan.popular ? "text-green-200" : "text-green-600"
                          }`}
                        >
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="flex items-center gap-3"
                      >
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            plan.popular ? "bg-green-500/20" : "bg-green-100"
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${
                              plan.popular ? "text-green-400" : "text-green-600"
                            }`}
                          />
                        </div>
                        <span
                          className={`text-sm ${
                            plan.popular ? "text-green-100" : "text-green-700"
                          }`}
                        >
                          {feature}
                        </span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    asChild
                    className={`w-full py-6 rounded-2xl font-semibold text-base transition-all duration-300 group/btn ${
                      plan.popular
                        ? "bg-linear-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg hover:shadow-green-500/30 hover:scale-[1.02]"
                        : "bg-green-800 text-white hover:bg-green-700"
                    }`}
                  >
                    <Link
                      to="/register"
                      className="flex items-center justify-center gap-2"
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-green-700 text-sm">
            ✨ Không cần thẻ tín dụng • 🔒 Bảo mật dữ liệu • 🚀 Hỗ trợ 24/7
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default PricingSection;
