import { useSearchParams } from "react-router";

export function usePageParam(paramName = "page") {
  const [searchParam] = useSearchParams();
  const raw = searchParam.get(paramName);
  const page = raw ? Math.max(1, Number(raw) || 1) : 1;
  return { page, pageIndex: page - 1 };
}

export default usePageParam;
