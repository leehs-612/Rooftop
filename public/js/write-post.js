document.addEventListener('DOMContentLoaded', async () => {
    // Quill 에디터 초기화
    const quill = new Quill('#editor-container', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                ['link', 'image'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['clean']
            ]
        },
        placeholder: '내용을 작성해주세요...'
    });

    const writePostForm = document.getElementById('writePostForm');
    const postTitleInput = document.getElementById('postTitle');
    const postContentHiddenInput = document.getElementById('postContent');
    const postRoomSelect = document.getElementById('postRoom'); // 방 선택 select 요소

    // --- 방 목록을 드롭다운에 로드 ---
    async function loadRoomsIntoSelect() {
        try {
            const response = await fetch('/api/rooms');
            const rooms = await response.json();

            // 기본 옵션 추가
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '방을 선택해주세요';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            postRoomSelect.appendChild(defaultOption);

            rooms.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = room.name;
                postRoomSelect.appendChild(option);
            });
        } catch (error) {
            console.error('방 목록을 불러오는 중 오류 발생:', error);
            // 오류 발생 시 사용자에게 알림 또는 기본값 설정
            alert('방 목록을 불러올 수 없습니다. 다시 시도해주세요.');
        }
    }

    await loadRoomsIntoSelect(); // 페이지 로드 시 방 목록 불러오기

    if (writePostForm) {
        writePostForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            // Quill 에디터의 HTML 내용을 숨겨진 input에 넣기
            postContentHiddenInput.value = quill.root.innerHTML;

            const formData = new FormData(writePostForm);
            const data = Object.fromEntries(formData.entries());

            // 선택된 방이 있는지 확인
            if (!data.room) {
                alert('글을 작성할 방을 선택해주세요.');
                return;
            }

            try {
                const response = await fetch('/api/posts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    alert('게시글이 성공적으로 작성되었습니다!');
                    // 글 작성 후 해당 방으로 이동
                    window.location.href = `/room/${data.room}`;
                } else {
                    const errorData = await response.json();
                    alert(`게시글 작성 실패: ${errorData.message}`);
                }
            }
            catch (error) {
                console.error('게시글 작성 중 오류 발생:', error);
                alert('게시글 작성 중 오류가 발생했습니다.');
            }
        });
    }
});