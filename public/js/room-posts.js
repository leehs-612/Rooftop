document.addEventListener('DOMContentLoaded', async () => {
    const roomTitleElement = document.getElementById('roomTitle');
    const postsList = document.getElementById('postsList');
    const noPostsMessage = document.getElementById('noPostsMessage');

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

    // 게시글 목록을 가져와서 표시하는 함수
    async function fetchPosts() {
        try {
            const response = await fetch(`/api/posts/${roomName}`);
            const posts = await response.json();

            // --- 디버깅을 위한 console.log (추가) ---
            console.log('--- room-posts.js: 서버로부터 받은 게시글 데이터 ---');
            console.log(posts); // 여기에서 post.id가 무엇인지 확인 (숫자여야 함)
            if(posts.length > 0) {
                console.log('첫 번째 게시글 ID:', posts[0].id);
            }
            console.log('----------------------------------------------------');
            // --- 디버깅 console.log 끝 ---

            postsList.innerHTML = ''; // 기존 목록 초기화

            if (posts.length > 0) {
                noPostsMessage.style.display = 'none'; // 메시지 숨기기
                posts.forEach(post => {
                    const listItem = document.createElement('li');
                    // post.id는 이미 숫자로 된 ID 값입니다.
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