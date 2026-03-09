import { useSearchParams } from "react-router";

const useQueryParams = () => {
	const [searchParam] = useSearchParams();
	return Object.fromEntries([...searchParam]);
};

export default useQueryParams;
