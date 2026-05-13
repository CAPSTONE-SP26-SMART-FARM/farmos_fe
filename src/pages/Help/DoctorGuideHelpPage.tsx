import { useEffect } from "react";

const FLOW_STEPS = [
	{
		title: "Nhận sự cố",
		desc: "Khi nông dân tạo sự cố, hệ thống điều phối sẽ gán cho bác sĩ phù hợp. Bạn nhận thông báo và xem trong tab Sự cố.",
	},
	{
		title: "Trao đổi với nông dân",
		desc: "Dùng chat trong từng sự cố để hỏi thêm triệu chứng, yêu cầu ảnh, hoặc tư vấn ban đầu trước khi kê đơn.",
	},
	{
		title: "Kê đơn thuốc",
		desc: "Chọn thuốc có sẵn trong kho hệ thống hoặc thêm thuốc tự nhập. Mỗi đơn cần liều lượng, cách dùng rõ ràng.",
	},
	{
		title: "Hoàn tất & đánh giá",
		desc: "Sau khi nông dân xác nhận khỏi, sự cố chuyển trạng thái 'Đã giải quyết'. Bạn được chấm điểm DQS dựa trên chất lượng đơn thuốc.",
	},
];

const DQS_TIPS = [
	"Kê đơn đầy đủ thông tin: liều lượng, tần suất, cách pha",
	"Chọn thuốc từ kho hệ thống thay vì free-text khi có thể",
	"Phản hồi nhanh trong chat — thời gian phản hồi tính vào điểm",
	"Theo dõi đến khi nông dân xác nhận khỏi, không bỏ giữa chừng",
];

const WALLET_FLOW = [
	{
		label: "Tiền hoa hồng vào ví",
		desc: "Mỗi sự cố đã giải quyết sinh hoa hồng theo rule hệ thống. Tiền tự động cộng vào số dư ví.",
	},
	{
		label: "Tạo yêu cầu rút",
		desc: "Vào Ví → Rút tiền, chọn tài khoản ngân hàng đã thêm và nhập số tiền.",
	},
	{
		label: "Admin duyệt",
		desc: "Yêu cầu chuyển sang trạng thái 'Đang xử lý'. Admin sẽ kiểm tra và chuyển khoản.",
	},
	{
		label: "Hoàn tất",
		desc: "Sau khi nhận tiền, yêu cầu chuyển 'Đã hoàn tất'. Nếu bị từ chối, tiền được hoàn lại ví.",
	},
];

export default function DoctorGuideHelpPage() {
	useEffect(() => {
		document.title = "Hướng dẫn bác sĩ — FarmOS";
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
						<h1 style={styles.headerTitle}>Hướng dẫn bác sĩ FarmOS</h1>
						<p style={styles.headerSub}>
							Tìm hiểu cách nhận, xử lý sự cố và quản lý thu nhập trên FarmOS.
						</p>
					</div>

					<Section iconBg='#EFF6FF' iconText='1' title='Quy trình xử lý sự cố'>
						<p style={styles.body}>
							Mỗi sự cố từ nông dân đi qua 4 bước. Bạn cần theo sát đến hết để
							nhận đủ hoa hồng và giữ điểm DQS cao.
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
							{FLOW_STEPS.map((s, i) => (
								<div key={s.title} style={styles.flowRow}>
									<div style={styles.flowIndex}>
										<span style={styles.flowIndexText}>{i + 1}</span>
									</div>
									<div style={{ flex: 1 }}>
										<h3 style={styles.flowTitle}>{s.title}</h3>
										<p style={styles.flowDesc}>{s.desc}</p>
									</div>
								</div>
							))}
						</div>
					</Section>

					<Section iconBg='#EFF6FF' iconText='2' title='Cách giữ điểm DQS cao'>
						<p style={styles.body}>
							DQS (Doctor Quality Score) phản ánh chất lượng đơn thuốc và mức
							độ chăm sóc khách hàng của bạn. Điểm cao = ưu tiên gán sự cố mới.
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
							{DQS_TIPS.map((tip, i) => (
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
									<span style={styles.checkText}>{tip}</span>
								</div>
							))}
						</div>
					</Section>

					<Section iconBg='#EFF6FF' iconText='3' title='Hoa hồng & rút tiền'>
						<p style={styles.body}>
							Thu nhập của bạn đến từ hoa hồng mỗi sự cố giải quyết thành công.
							Quy trình rút tiền:
						</p>
						<div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
							{WALLET_FLOW.map((s, i) => (
								<div key={s.label} style={styles.walletRow}>
									<div style={styles.walletIndex}>
										<span style={styles.walletIndexText}>{i + 1}</span>
									</div>
									<div style={{ flex: 1 }}>
										<h3 style={styles.walletTitle}>{s.label}</h3>
										<p style={styles.walletDesc}>{s.desc}</p>
									</div>
								</div>
							))}
						</div>
					</Section>

					<Section iconBg='#EFF6FF' iconText='4' title='Hồ sơ & tài khoản ngân hàng'>
						<p style={styles.body}>
							Trước khi rút tiền, bạn cần:
						</p>
						<ul style={styles.list}>
							<li style={styles.listItem}>Hồ sơ bác sĩ được admin duyệt (xanh)</li>
							<li style={styles.listItem}>Ít nhất 1 tài khoản ngân hàng đã xác minh</li>
							<li style={styles.listItem}>Số dư ví đủ cho yêu cầu rút</li>
						</ul>
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
								Bật thông báo để không bỏ lỡ sự cố mới — phản hồi nhanh trong
								15 phút đầu thường nhận đánh giá cao nhất từ nông dân.
							</p>
						</div>
					</div>

					<div style={styles.footer}>
						<p style={styles.footerText}>FarmOS · Hỗ trợ bác sĩ</p>
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
	flowRow: {
		display: "flex",
		alignItems: "flex-start",
		gap: 12,
	},
	flowIndex: {
		width: 28,
		height: 28,
		borderRadius: 14,
		background: "#EFF6FF",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		marginTop: 2,
	},
	flowIndexText: {
		fontSize: 13,
		fontWeight: 600,
		color: "#2463EB",
	},
	flowTitle: {
		fontSize: 14,
		lineHeight: "20px",
		fontWeight: 600,
		color: "#111827",
		margin: 0,
		marginBottom: 2,
	},
	flowDesc: {
		fontSize: 13,
		lineHeight: "20px",
		color: "#4B5563",
		margin: 0,
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
	walletRow: {
		display: "flex",
		alignItems: "flex-start",
		gap: 12,
	},
	walletIndex: {
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
	walletIndexText: {
		fontSize: 12,
		fontWeight: 600,
		color: "#2463EB",
	},
	walletTitle: {
		fontSize: 14,
		lineHeight: "20px",
		fontWeight: 600,
		color: "#111827",
		margin: 0,
		marginBottom: 2,
	},
	walletDesc: {
		fontSize: 13,
		lineHeight: "20px",
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
