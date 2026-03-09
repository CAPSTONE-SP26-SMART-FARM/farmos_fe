import React from "react";

const RANGE = 2;

/**
Với range = 2 áp dụng cho khoảng cách đầu, cuối và xung quanh current_page
[1] 2 3 ... 19 20
1 [2] 3 4 ... 19 20 
1 2 [3] 4 5 ... 19 20
1 2 3 [4] 5 6 ... 19 20
1 2 3 4 [5] 6 7 ... 19 20
1 2 ... 4 5 [6] 8 9 ... 19 20
1 2 ...13 14 [15] 16 17 ... 19 20
1 2 ... 14 15 [16] 17 18 19 20
1 2 ... 15 16 [17] 18 19 20
1 2 ... 16 17 [18] 19 20
1 2 ... 17 18 [19] 20
1 2 ... 18 19 [20]

 * quy luật chung luôn hiển thị 2 page đầu và 2 page cuối 
 
 * tiếp theo là luôn hiển thị 2 page phía trước và 2 page phía sau của current page
 ví dụ:
  7 8 [9] 10 11
  9 10 [11] 12 13
 
  
    ----trường hợp đầu tiên-----
dấu ... hiển thị tương đương với dotAfter = true
[1] 2 3 ... 9 10 
1 [2] 3 4 ... 9 10
1 2 [3] 4 5 ... 9 10
1 2 3 [4] 5 6 ... 9 10
1 2 3 4 [5] 6 7 ... 9 10

1 2 3 4 5 [6] 7 8 9 10(loại vì vi phạm quy tắc rồi)

currentPage <= RANGE * 2 + 1
pageNumber > current + RANGE 
pageNumber <= totalPage - RANGE + 1 


     ----trường hợp số 2----
dấu ... hiển thị trước tương ứng với dotBefore = true, hiển thị sau thì tương ứng với dotAfter = false
1 2 ... 4 5 [6] 7 8  ... 19 20
1 2 ... 5 6 [7] 8 9 ... 19 20
1 2 ... 6 7 [8] 9 10 ... 19 20
1 2 ... 7 8 [9] 10 11 ... 19 20
1 2 ... 8 9 [10] 11 12 ... 19 20
1 2 ...13 14 [15] 16 17 ... 19 20

1 2 ...14 15 [16] 17 18 19 20(vi phạm quy tắc rồi)
để nhảy vô trường hơp này thì cần 
currentPage > RANGE * 2 + 1
currentPage < totalPage - RANGE * 2

    +quy tắc hiển thị dấu ... phía trước dotBefore = true
        pageNumber > RANGE &&
        pageNumber < currentPage - RANGE

    +quy tắc hiển thị dấu ... phía sau dotAfter = true
        pageNumber < totalPages - RANGE &&
        pageNumber > current + RANGE

    ---trường hợp cuối cùng 
1 2 ... 14 15 [16] 17 18 19 20
1 2 ... 15 16 [17] 18 19 20
1 2 ... 16 17 [18] 19 20
1 2 ... 17 18 [19] 20
1 2 ... 18 19 [20]

pageNumber < totalPage - RANGE &&
pageNumber < currentPage - RANGE
pageNumber > RANGE
 */

const usePaginateRange = (totalPages: number, currentPage: number) => {
	let dotBefore = false;
	let dotAfter = false;

	return Array.from({ length: totalPages }, (_, index) => {
		const pageNumber = index + 1;
		if (currentPage <= RANGE * 2 + 1) {
			if (pageNumber <= currentPage + RANGE) {
				return pageNumber;
			}

			if (pageNumber >= totalPages - RANGE + 1) {
				return pageNumber;
			}

			if (!dotAfter) {
				dotAfter = true;
				return "ellispsis-after";
			}
			return null;
		}

		if (currentPage > RANGE * 2 + 1 && currentPage < totalPages - RANGE * 2) {
			if (pageNumber <= RANGE) {
				return pageNumber;
			}

			if (pageNumber < currentPage - RANGE) {
				if (!dotBefore) {
					dotBefore = true;
					return "ellispsis-before";
				}
				return null;
			}

			if (
				pageNumber >= currentPage - RANGE &&
				pageNumber <= currentPage + RANGE
			) {
				return pageNumber;
			}

			if (
				pageNumber > currentPage + RANGE &&
				pageNumber <= totalPages - RANGE
			) {
				if (!dotAfter) {
					dotAfter = true;
					return "ellipsis-after";
				}
				return null;
			}

			if (pageNumber > totalPages - RANGE) {
				return pageNumber;
			}
		}

		if (currentPage >= totalPages - RANGE * 2) {
			if (pageNumber < RANGE) {
				return pageNumber;
			}

			if (pageNumber >= currentPage - 2) {
				return pageNumber;
			}

			if (!dotBefore) {
				dotBefore = true;
				return "ellipsis-before";
			}
			return null;
		}
	}).filter(Boolean);
};

export default usePaginateRange;
