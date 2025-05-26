document.addEventListener('DOMContentLoaded', async () => {
    const roomTitleElement = document.getElementById('roomTitle');
    const postsList = document.getElementById('postsList');
    const noPostsMessage = document.getElementById('noPostsMessage');
    // const currentRoomTab = document.getElementById('currentRoomTab'); // 이 부분은 이제 필요 없습니다.

    // URL에서 방 이름(ID) 추출 (예: /room/free -> roomName = 'free')
    const pathSegments = window.location.pathname.split('/');
    const roomName = pathSegments[pathSegments.length - 1]; // 배열의 마지막 요소가 방 이름 ID

    if (!roomName) {
        roomTitleElement.textContent = '잘못된 접근';
        noPostsMessage.textContent = '방 이름을 찾을 수 없습니다.';
        noPostsMessage.style.display = 'block';
        return;
    }

    // 서버에서 방 목록을 가져와서 해당 방의 이름을 찾음 (UI 표시용)
    async function getRoomDisplayName(roomId) {
        try {
            const response = await fetch('/api/rooms'); // 서버의 방 목록 API 호출
            const rooms = await response.json();
            const room = rooms.find(r => r.id === roomId);
            return room ? room.name : '알 수 없는 방'; // 방 이름을 찾으면 반환, 없으면 기본값
        } catch (error) {
            console.error('방 이름 가져오기 실패:', error);
            return '알 수 없는 방';
        }
    }

    // 방 제목 업데이트
    const displayName = await getRoomDisplayName(roomName);
    roomTitleElement.textContent = displayName;
    // currentRoomTab.innerHTML = `<a href="/room/${roomName}">${displayName}</a>`; // 헤더 탭 업데이트는 이제 HTML에서 직접 할 것

    // 게시글 목록을 가져와서 표시하는 함수
    async function fetchPosts() {
        try {
            // 특정 방의 게시글 API 호출
            const response = await fetch(`/api/posts/${roomName}`);
            const posts = await response.json();

            postsList.innerHTML = ''; // 기존 목록 초기화

            if (posts.length > 0) {
                noPostsMessage.style.display = 'none'; // 메시지 숨기기
                posts.forEach(post => {
                    const listItem = document.createElement('li');
                    // 게시글 제목 클릭 시 상세 페이지로 이동
                    listItem.innerHTML = `<h4><a href="/post/${post.id}">${post.title}</a></h4><p class="post-author">작성자: ${post.author || '익명'}</p>`;
                    postsList.appendChild(listItem);
                });
            } else {
                noPostsMessage.style.display = 'block'; // 메시지 보이기
            }
        } catch (error) {
            console.error('게시글을 가져오는 중 오류 발생:', error);
            postsList.innerHTML = '<p>게시글을 불러올 수 없습니다.</p>';
        }
    }

    fetchPosts(); // 페이지 로드 시 게시글 불러오기
});