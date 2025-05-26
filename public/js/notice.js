document.addEventListener('DOMContentLoaded', () => {
    const noticesList = document.getElementById('noticesList');
    const noNoticesMessage = document.getElementById('noNoticesMessage');

    // 공지사항 목록을 가져와서 표시하는 함수
    async function fetchNotices() {
        try {
            const response = await fetch('/api/notices'); // 서버의 API 엔드포인트 호출
            const notices = await response.json();

            noticesList.innerHTML = ''; // 기존 목록 초기화

            if (notices.length > 0) {
                noNoticesMessage.style.display = 'none'; // 메시지 숨기기
                notices.forEach(notice => {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <h4>${notice.title}</h4>
                        <p>${notice.content}</p>
                    `;
                    noticesList.appendChild(listItem);
                });
            } else {
                noNoticesMessage.style.display = 'block'; // 메시지 보이기
            }
        } catch (error) {
            console.error('공지사항을 가져오는 중 오류 발생:', error);
            noticesList.innerHTML = '<p>공지사항을 불러올 수 없습니다.</p>';
        }
    }

    // 페이지 로드 시 공지사항 불러오기
    fetchNotices();
});