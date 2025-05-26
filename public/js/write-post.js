document.addEventListener('DOMContentLoaded', async () => {
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
    const postRoomSelect = document.getElementById('postRoom');

    async function loadRoomsIntoSelect() {
        try {
            const response = await fetch('/api/rooms');
            const rooms = await response.json();

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
            alert('방 목록을 불러올 수 없습니다. 다시 시도해주세요.');
        }
    }

    await loadRoomsIntoSelect();

    if (writePostForm) {
        writePostForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            postContentHiddenInput.value = quill.root.innerHTML;

            const formData = new FormData(writePostForm);
            const data = Object.fromEntries(formData.entries());

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