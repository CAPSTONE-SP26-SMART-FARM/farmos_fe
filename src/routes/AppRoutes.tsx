import { Routes, Route } from "react-router";
import routes from "./routes";
import type { RouteChild, RouteConfig } from "./types";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { OwnerSubscriptionGuard } from "@/components/auth/OwnerSubscriptionGuard";
import NotFound from "@/components/layout/NotFound/NotFound";

const AppRoutes = () => {
	return (
		<Routes>
			{routes.map((route: RouteConfig, i: number) => {
				const Layout = route.layout;
				return (
					<Route key={i} element={<Layout />}>
						{route.children.map((item: RouteChild) => {
							const Component = item.component;
							return (
								<Route
									key={item.path}
									path={item.path}
									element={
										<ProtectedRoute
											isRestricted={route.isRestricted}
											allowedRoles={item?.allowedRoles}
										>
											{item.requiresActiveSubscription ? (
												<OwnerSubscriptionGuard>
													<Component />
												</OwnerSubscriptionGuard>
											) : (
												<Component />
											)}
										</ProtectedRoute>
									}
								/>
							);
						})}
					</Route>
				);
			})}
			<Route path="*" element={<NotFound />} />
		</Routes>
	);
};

export default AppRoutes;
