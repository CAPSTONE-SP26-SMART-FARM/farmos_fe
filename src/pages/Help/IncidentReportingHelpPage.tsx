import { useEffect } from "react";

const SEVERITY = [
	{
		label: "Thấp",
		color: "#16A34A",
		bg: "#F0FDF4",
		desc: "Ảnh hưởng nhỏ, không cấp bách",
	},
	{
		label: "Trung bình",
		color: "#CA8A04",
		bg: "#FEF9C3",
		desc: "Cần xử lý sớm trong ngày",
	},
	{
		label: "Cao",
		color: "#EA580C",
		bg: "#FFF7ED",
		desc: "Ảnh hưởng lớn, cần xử lý ngay",
	},
	{
		label: "Nghiêm trọng",
		color: "#DC2626",
		bg: "#FEF2F2",
		desc: "Khẩn cấp, nguy hiểm trực tiếp",
	},
];

const STATUS_FLOW = [
	{ label: "Mở", color: "#2563EB", bg: "#EFF6FF", desc: "Sự cố vừa được tạo, chờ điều phối" },
	{ label: "Đã giao", color: "#7C3AED", bg: "#F5F3FF", desc: "Đã gán cho bác sĩ phụ trách" },
	{ label: "Đang xử lý", color: "#EA580C", bg: "#FFF7ED", desc: "Bác sĩ đang tư vấn / kê đơn" },
	{ label: "Đã giải quyết", color: "#16A34A", bg: "#F0FDF4", desc: "Hoàn tất, chờ bạn xác nhận" },
];

const CHECKLIST = [
	"Cây trồng / khu vực nào đang gặp vấn đề",
	"Triệu chứng quan sát được (lá vàng, đốm, sâu...)",
	"Thời điểm bắt đầu phát hiện",
	"Đã thử biện pháp gì chưa, kết quả ra sao",
];

export default function IncidentReportingHelpPage() {
	useEffect(() => {
		document.title = "Hướng dẫn báo cáo sự cố — FarmOS";
	}, []);

	return (
		<>
			<style>{`
				@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
				html, body, #root {
					margin: 0;
					padding: 0;
					background: #F3F4F6;
					-webkit-tap-highlight-color: transparent;
					overscroll-behavior: none;
				}
				body {
					font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
					color: #111827;
					-webkit-font-smoothing: antialiased;
				}
				* { box-sizing: border-box; }
			`}</style>

			<div style={styles.shell}>
				<div style={styles.container}>
					<div style={styles.header}>
						<h1 style={styles.headerTitle}>Hướng dẫn báo cáo sự cố</h1>
						<p style={styles.headerSub}>
							Mô tả chi tiết và chọn đúng mức độ để được hỗ trợ nhanh nhất.
						</p>
					</div>

					<Section
						iconBg='#EFF6FF'
						iconText='1'
						title='Khi nào nên báo cáo'
					>
						<p style={styles.body}>
							Bạn nên tạo sự cố ngay khi phát hiện bất thường ở vườn — kể cả khi
							chưa chắc chắn nguyên nhân. Bác sĩ sẽ tư vấn dựa trên mô tả và ảnh bạn cung cấp.
						</p>
						<ul style={styles.list}>
							<li style={styles.listItem}>Cây có dấu hiệu bệnh, sâu, héo úa bất thường</li>
							<li style={styles.listItem}>Cảm biến cảnh báo vượt ngưỡng kéo dài</li>
							<li style={styles.listItem}>Sự cố thiết bị, môi trường (nắng nóng, mưa lớn)</li>
						</ul>
					</Section>

					<Section
						iconBg='#EFF6FF'
						iconText='2'
						title='Mô tả chi tiết'
					>
						<p style={styles.body}>
							Càng nhiều thông tin, bác sĩ càng chẩn đoán chính xác. Hãy đảm bảo
							mô tả của bạn trả lời được những câu hỏi sau:
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
							{CHECKLIST.map((item, i) => (
								<div key={i} style={styles.checkRow}>
									<div style={styles.checkDot}>
										<svg width='10' height='10' viewBox='0 0 10 10' fill='none'>
											<path
												d='M1.5 5L4 7.5L8.5 2.5'
												stroke='#2463EB'
												strokeWidth='1.8'
												strokeLinecap='round'
												strokeLinejoin='round'
											/>
										</svg>
									</div>
									<span style={styles.checkText}>{item}</span>
								</div>
							))}
						</div>
					</Section>

					<Section
						iconBg='#EFF6FF'
						iconText='3'
						title='Chọn mức độ ưu tiên'
					>
						<p style={styles.body}>
							Mức độ quyết định thời gian phản hồi của bác sĩ. Hãy chọn đúng để
							ưu tiên đúng việc:
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
							{SEVERITY.map((s) => (
								<div key={s.label} style={styles.severityRow}>
									<div
										style={{
											...styles.severityChip,
											backgroundColor: s.bg,
											color: s.color,
										}}
									>
										{s.label}
									</div>
									<span style={styles.severityDesc}>{s.desc}</span>
								</div>
							))}
						</div>
					</Section>

					<Section
						iconBg='#EFF6FF'
						iconText='4'
						title='Đính kèm ảnh'
					>
						<p style={styles.body}>
							Ảnh thực tế giúp bác sĩ hiểu nhanh hơn cả nghìn lời văn. Nên chụp:
						</p>
						<ul style={styles.list}>
							<li style={styles.listItem}>Toàn cảnh khu vực bị ảnh hưởng</li>
							<li style={styles.listItem}>Cận cảnh triệu chứng (lá, thân, rễ)</li>
							<li style={styles.listItem}>Ảnh so sánh với cây khỏe bên cạnh (nếu có)</li>
						</ul>
					</Section>

					<Section
						iconBg='#EFF6FF'
						iconText='5'
						title='Theo dõi tiến độ'
					>
						<p style={styles.body}>
							Sau khi gửi, sự cố sẽ đi qua các trạng thái sau. Bạn nhận được
							thông báo ở mỗi bước:
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
							{STATUS_FLOW.map((s, i) => (
								<div key={s.label} style={styles.flowRow}>
									<div style={styles.flowIndex}>
										<span style={styles.flowIndexText}>{i + 1}</span>
									</div>
									<div style={{ flex: 1 }}>
										<div
											style={{
												...styles.statusBadge,
												backgroundColor: s.bg,
												color: s.color,
											}}
										>
											{s.label}
										</div>
										<p style={styles.flowDesc}>{s.desc}</p>
									</div>
								</div>
							))}
						</div>
					</Section>

					<div style={styles.tipCard}>
						<div style={styles.tipIcon}>
							<svg width='24' height='24' viewBox='0 0 24 24' fill='none'>
								<path
									d='M12 2v2m0 16v2M4 12H2m20 0h-2m-2.93-7.07l-1.42 1.42M6.34 17.66l-1.41 1.41m12.73 0l-1.41-1.41M6.34 6.34L4.93 4.93M16 12a4 4 0 11-8 0 4 4 0 018 0z'
									stroke='#2463EB'
									strokeWidth='1.8'
									strokeLinecap='round'
									strokeLinejoin='round'
								/>
							</svg>
						</div>
						<div style={{ flex: 1 }}>
							<h3 style={styles.tipTitle}>Mẹo nhỏ</h3>
							<p style={styles.tipDesc}>
								Khi bác sĩ kê đơn, bạn có thể chat trực tiếp trong sự cố để hỏi
								thêm trước khi mua thuốc. Đừng ngại đặt câu hỏi!
							</p>
						</div>
					</div>

					<div style={styles.footer}>
						<p style={styles.footerText}>FarmOS · Hỗ trợ nông dân</p>
					</div>
				</div>
			</div>
		</>
	);
}

function Section({
	iconBg,
	iconText,
	title,
	children,
}: {
	iconBg: string;
	iconText: string;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div style={styles.card}>
			<div style={styles.cardHeader}>
				<div style={{ ...styles.cardIcon, backgroundColor: iconBg }}>
					<span style={styles.cardIconText}>{iconText}</span>
				</div>
				<h2 style={styles.cardTitle}>{title}</h2>
			</div>
			<div>{children}</div>
		</div>
	);
}

const styles: Record<string, React.CSSProperties> = {
	shell: {
		minHeight: "100vh",
		background: "#F3F4F6",
		paddingTop: "env(safe-area-inset-top)",
		paddingBottom: "env(safe-area-inset-bottom)",
	},
	container: {
		maxWidth: 480,
		margin: "0 auto",
		padding: "16px 16px 32px",
	},
	header: {
		marginTop: 8,
		marginBottom: 20,
	},
	headerTitle: {
		fontSize: 24,
		lineHeight: "32px",
		fontWeight: 600,
		color: "#111827",
		margin: 0,
		marginBottom: 6,
	},
	headerSub: {
		fontSize: 14,
		lineHeight: "20px",
		color: "#6B7280",
		margin: 0,
	},
	card: {
		background: "#FFFFFF",
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
	},
	cardHeader: {
		display: "flex",
		alignItems: "center",
		gap: 12,
		marginBottom: 12,
	},
	cardIcon: {
		width: 36,
		height: 36,
		borderRadius: 10,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	cardIconText: {
		fontSize: 15,
		fontWeight: 600,
		color: "#2463EB",
	},
	cardTitle: {
		fontSize: 16,
		lineHeight: "24px",
		fontWeight: 600,
		color: "#111827",
		margin: 0,
	},
	body: {
		fontSize: 14,
		lineHeight: "22px",
		color: "#4B5563",
		margin: 0,
	},
	list: {
		margin: "10px 0 0",
		paddingLeft: 20,
	},
	listItem: {
		fontSize: 14,
		lineHeight: "22px",
		color: "#4B5563",
		marginBottom: 4,
	},
	checkRow: {
		display: "flex",
		alignItems: "flex-start",
		gap: 10,
	},
	checkDot: {
		width: 20,
		height: 20,
		borderRadius: 6,
		background: "#EFF6FF",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		marginTop: 1,
	},
	checkText: {
		fontSize: 14,
		lineHeight: "20px",
		color: "#374151",
	},
	severityRow: {
		display: "flex",
		alignItems: "center",
		gap: 12,
	},
	severityChip: {
		fontSize: 12,
		lineHeight: "16px",
		fontWeight: 500,
		padding: "4px 10px",
		borderRadius: 8,
		minWidth: 90,
		textAlign: "center",
		flexShrink: 0,
	},
	severityDesc: {
		fontSize: 13,
		lineHeight: "18px",
		color: "#4B5563",
	},
	flowRow: {
		display: "flex",
		alignItems: "flex-start",
		gap: 12,
	},
	flowIndex: {
		width: 24,
		height: 24,
		borderRadius: 12,
		background: "#EFF6FF",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		marginTop: 2,
	},
	flowIndexText: {
		fontSize: 12,
		fontWeight: 600,
		color: "#2463EB",
	},
	statusBadge: {
		display: "inline-block",
		fontSize: 12,
		lineHeight: "16px",
		fontWeight: 500,
		padding: "4px 10px",
		borderRadius: 8,
		marginBottom: 4,
	},
	flowDesc: {
		fontSize: 13,
		lineHeight: "18px",
		color: "#6B7280",
		margin: 0,
	},
	tipCard: {
		background: "#FFFFFF",
		borderRadius: 16,
		padding: "14px 14px 14px 18px",
		display: "flex",
		alignItems: "center",
		gap: 14,
		marginBottom: 12,
		boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
	},
	tipIcon: {
		width: 44,
		height: 44,
		borderRadius: 10,
		background: "#EFF6FF",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	tipTitle: {
		fontSize: 15,
		fontWeight: 600,
		color: "#1F2937",
		margin: 0,
		marginBottom: 2,
	},
	tipDesc: {
		fontSize: 12,
		lineHeight: "16px",
		color: "#6B7280",
		margin: 0,
	},
	footer: {
		marginTop: 16,
		textAlign: "center",
	},
	footerText: {
		fontSize: 12,
		color: "#9CA3AF",
		margin: 0,
	},
};
